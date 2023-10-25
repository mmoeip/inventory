// SPDX-License-Identifier: MIT

/**
 * Authors: Omar Garcia<ogarciarevett>
 * GitHub: https://github.com/lootledger/inventory
 */

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./interfaces/IInventory.sol";


contract Inventory is ERC721Holder, ERC1155Holder, ReentrancyGuard, AccessControl, IInventory {

    uint256 constant ERC20_ITEM_TYPE = 20;
    uint256 constant ERC721_ITEM_TYPE = 721;
    uint256 constant ERC1155_ITEM_TYPE = 1155;

    bytes32 public constant INVENTORY_ADMIN = keccak256("INVENTORY_ADMIN");

    address public contractERC721Address;
    uint256 public numSlots;

    // SlotId => slot, useful to get the rest of the slot data.
    mapping(uint256 => LibInventory.Slot) private slotData;

    // Slot => item type => item address => item token ID => maximum equippable
    // For ERC20 and ERC721 tokens, item token ID is assumed to be 0. No data will be stored under positive
    // item token IDs.
    //
    // NOTE: It is possible for the same contract to implement multiple of these ERCs (e.g. ERC20 and ERC721),
    // so this data structure actually makes sense.
    mapping(uint256 => mapping(uint256 => mapping(address => mapping(uint256 => uint256)))) private slotEligibleItems;
    // Subject contract address => subject token ID => slot => EquippedItem
    // Item type and Pool ID on EquippedItem have the same constraints as they do elsewhere (e.g. in SlotEligibleItems).
    //
    // NOTE: We have added the subject contract address as the first mapping key as a defense against
    // future modifications which may allow administrators to modify the subject contract address.
    // If such a modification were made, it could make it possible for a bad actor administrator
    // to change the address of the subject token to the address to an ERC721 contract they control
    // and drain all items from every subject token's inventory.
    // If this contract is deployed as a Diamond proxy, the owner of the Diamond can pretty much
    // do whatever they want in any case, but adding the subject contract address as a key protects
    // users of non-Diamond deployments even under small variants of the current implementation.
    // It also offers *some* protection to users of Diamond deployments of the Inventory.
    // ERC721 Contract Address =>
    // subjectTokenId =>
    // slotId =>
    // EquippedItem struct
    mapping(address => mapping(uint256 => mapping(uint256 => LibInventory.EquippedItem))) private equippedItems;


    modifier requireValidItemType(uint256 itemType) {
        require(
            itemType == ERC20_ITEM_TYPE || itemType == ERC721_ITEM_TYPE || itemType == ERC1155_ITEM_TYPE,
            "Inventory.requireValidItemType: Invalid item type"
        );
        _;
    }

    constructor(address adminAddress, address erc721ContractAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, adminAddress);
        emit AdministratorDesignated(adminAddress);
        emit ContractAddressDesignated(erc721ContractAddress);
    }

    function subject() external view returns (address) {
        return contractERC721Address;
    }

    function createSlot(bool isPersistent, string memory slotURI) external onlyRole(INVENTORY_ADMIN) returns (uint256) {
        numSlots += 1;
        uint256 newSlot = numSlots;
        slotData[newSlot] = LibInventory.Slot({ SlotURI: slotURI, SlotIsPersistent: isPersistent, SlotId: newSlot });
        emit SlotCreated(_msgSender(), newSlot);
        return newSlot;
    }

    function setSlotURI(string memory newSlotURI, uint256 slotId) external onlyRole(INVENTORY_ADMIN) {
        LibInventory.Slot storage slot = slotData[slotId];
        slot.SlotURI = newSlotURI;
        slotData[slotId] = slot;
        emit NewSlotURI(slotId);
    }

    function setSlotPersistent(uint256 slotId, bool isPersistent) external onlyRole(INVENTORY_ADMIN) {
        LibInventory.Slot storage slot = slotData[slotId];
        slot.SlotIsPersistent = isPersistent;
        slotData[slotId] = slot;
    }

    function slotIsPersistent(uint256 slotId) external view override returns (bool) {
        return slotData[slotId].SlotIsPersistent;
    }

    function markItemAsEquippableInSlot(
        uint256 slot,
        uint256 itemType,
        address itemAddress,
        uint256 itemTokenId,
        uint256 maxAmount
    ) external onlyRole(INVENTORY_ADMIN) requireValidItemType(itemType) {

        require(
            itemType == ERC1155_ITEM_TYPE || itemTokenId == 0,
            "Inventory.markItemAsEquippableInSlot: Token ID can only be non-zero for items from ERC1155 contracts"
        );
        require(
            itemType != ERC721_ITEM_TYPE || maxAmount <= 1,
            "Inventory.markItemAsEquippableInSlot: maxAmount should be at most 1 for items from ERC721 contracts"
        );

        slotEligibleItems[slot][itemType][itemAddress][itemTokenId] = maxAmount;

        emit ItemMarkedAsEquippableInSlot(slot, itemType, itemAddress, itemTokenId, maxAmount);
    }

    function _unequip(uint256 subjectTokenId, uint256 slot, bool unequipAll, uint256 amount) public nonReentrant {
        require(!unequipAll || amount == 0, "Inventory._unequip: Set amount to 0 if you are unequipping all instances of the item in that slot");

        require(
            unequipAll || amount > 0,
            "Inventory._unequip: Since you are not unequipping all instances of the item in that slot, you must specify how many instances you want to unequip"
        );

        require(slotData[slot].SlotIsPersistent, "Inventory._unequip: That slot is not persistent");

        LibInventory.EquippedItem storage existingItem = equippedItems[contractERC721Address][subjectTokenId][slot];

        if (unequipAll) {
            amount = existingItem.Amount;
        }

        require(amount <= existingItem.Amount, "Inventory._unequip: Attempting to unequip too many items from the slot");

        if (existingItem.ItemType == 20) {
            IERC20 erc20Contract = IERC20(existingItem.ItemAddress);
            bool transferSuccess = erc20Contract.transfer(_msgSender(), amount);
            require(transferSuccess, "Inventory._unequip: Error unequipping ERC20 item - transfer was unsuccessful");
        } else if (existingItem.ItemType == 721 && amount > 0) {
            IERC721 erc721Contract = IERC721(existingItem.ItemAddress);
            erc721Contract.safeTransferFrom(address(this), _msgSender(), existingItem.ItemTokenId);
        } else if (existingItem.ItemType == 1155) {
            IERC1155 erc1155Contract = IERC1155(existingItem.ItemAddress);
            erc1155Contract.safeTransferFrom(address(this), _msgSender(), existingItem.ItemTokenId, amount, "");
        }

        emit ItemUnequipped(subjectTokenId, slot, existingItem.ItemType, existingItem.ItemAddress, existingItem.ItemTokenId, amount, _msgSender());

        existingItem.Amount -= amount;
        if (existingItem.Amount == 0) {
            delete equippedItems[contractERC721Address][subjectTokenId][slot];
        }
    }

    function equip(
        uint256 subjectTokenId,
        uint256 slot,
        uint256 itemType,
        address itemAddress,
        uint256 itemTokenId,
        uint256 amount
    ) public requireValidItemType(itemType) nonReentrant {
        require(
            itemType == ERC721_ITEM_TYPE || itemType == ERC1155_ITEM_TYPE || itemTokenId == 0,
            "Inventory.equip: itemTokenId can only be non-zero for ERC721 or ERC1155 items"
        );

        require(
            itemType == ERC20_ITEM_TYPE || itemType == ERC1155_ITEM_TYPE || amount == 1,
            "Inventory.equip: amount can be other value than 1 only for ERC20 and ERC1155 items"
        );

        IERC721 subjectContract = IERC721(contractERC721Address);

        require(_msgSender() == subjectContract.ownerOf(subjectTokenId), "Inventory.equip: Message sender is not owner of subject token");

        if (equippedItems[contractERC721Address][subjectTokenId][slot].ItemType != 0) {
            _unequip(subjectTokenId, slot, true, 0);
        }

        require(
            slotEligibleItems[slot][itemType][itemAddress][itemType == 1155 ? itemTokenId : 0] >= amount,
            "Inventory.equip: You can not equip those many instances of that item into the given slot"
        );

        if (itemType == ERC20_ITEM_TYPE) {
            IERC20 erc20Contract = IERC20(itemAddress);
            bool erc20TransferSuccess = erc20Contract.transferFrom(_msgSender(), address(this), amount);
            require(erc20TransferSuccess, "Inventory.equip: Error equipping ERC20 item - transfer was unsuccessful");
        } else if (itemType == ERC721_ITEM_TYPE) {
            IERC721 erc721Contract = IERC721(itemAddress);
            require(_msgSender() == erc721Contract.ownerOf(itemTokenId), "Inventory.equip: Message sender cannot equip an item that they do not own");
            erc721Contract.safeTransferFrom(_msgSender(), address(this), itemTokenId);
        } else if (itemType == ERC1155_ITEM_TYPE) {
            IERC1155 erc1155Contract = IERC1155(itemAddress);
            require(erc1155Contract.balanceOf(_msgSender(), itemTokenId) >= amount, "Inventory.equip: Message sender does not own enough of that item to equip");
            erc1155Contract.safeTransferFrom(_msgSender(), address(this), itemTokenId, amount, "");
        }

        emit ItemEquipped(subjectTokenId, slot, itemType, itemAddress, itemTokenId, amount, _msgSender());

        equippedItems[contractERC721Address][subjectTokenId][slot] = LibInventory.EquippedItem({
            ItemType: itemType,
            ItemAddress: itemAddress,
            ItemTokenId: itemTokenId,
            Amount: amount
        });
    }

    function getAllEquippedItems(uint256 subjectTokenId) external view returns (LibInventory.EquippedItem[] memory onChainEquippedItems) {
        LibInventory.EquippedItem[] memory items = new LibInventory.EquippedItem[](numSlots);

        uint256 counter = 0;

        for (uint256 i = 0; i < numSlots; i++) {
            LibInventory.EquippedItem memory equippedItemBlock = equippedItems[contractERC721Address][subjectTokenId][i];
            if (equippedItemBlock.ItemType != 0 || equippedItemBlock.ItemAddress != address(0) || equippedItemBlock.Amount != 0) {
                items[counter] = equippedItemBlock;
                counter++;
            }
        }

        LibInventory.EquippedItem[] memory fixedEquippedItems = new LibInventory.EquippedItem[](counter);

        for (uint256 i = 0; i < counter; i++) {
            fixedEquippedItems[i] = items[i];
        }

        return fixedEquippedItems;
    }

    function equipBatch(uint256 subjectTokenId, uint256[] memory slots, LibInventory.EquippedItem[] memory items) external nonReentrant {
        require(items.length > 0, "Inventory.batchEquip: Must equip at least one item");
        require(slots.length == items.length, "Inventory.batchEquip: Must provide a slot for each item");

        for (uint256 i = 0; i < items.length; i++) {
            equip(subjectTokenId, slots[i], items[i].ItemType, items[i].ItemAddress, items[i].ItemTokenId, items[i].Amount);
        }
    }

    function getSlotById(uint256 slotId) external view returns (LibInventory.Slot memory slot) {
        return slotData[slotId];
    }

    function getEquippedItem(uint256 subjectTokenId, uint256 slot) external view returns (LibInventory.EquippedItem memory equippedItem) {
        return equippedItems[contractERC721Address][subjectTokenId][slot];
    }

    function getSlotURI(uint256 slotId) external view returns (string memory) {
        return slotData[slotId].SlotURI;
    }

    function maxAmountOfItemInSlot(
        uint256 slot,
        uint256 itemType,
        address itemAddress,
        uint256 itemTokenId
    ) external view returns (uint256) {
        return slotEligibleItems[slot][itemType][itemAddress][itemTokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl, ERC1155Receiver) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
