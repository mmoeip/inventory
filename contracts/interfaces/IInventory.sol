// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../libraries/LibInventory.sol";

interface IInventory {
  event AdministratorDesignated(address indexed adminAddress);

  event ContractAddressDesignated(address indexed contractAddress);

  event SlotCreated(address indexed creator, uint256 indexed slot, bool unequippable, uint256 indexed slotType);

  event NewSlotTypeAdded(address indexed creator, uint256 indexed slotType, string slotTypeName);

  event ItemMarkedAsEquippableInSlot(uint256 indexed slot, uint256 indexed itemType, address indexed itemAddress, uint256 itemPoolId, uint256 maxAmount);

  event BackpackAdded(address indexed creator, uint256 indexed toSubjectTokenId, uint256 indexed slotQuantity);

  event NewSlotURI(uint256 indexed slotId);

  event SlotTypeAdded(address indexed creator, uint256 indexed slotId, uint256 indexed slotType);

  event ItemEquipped(
    uint256 indexed subjectTokenId,
    uint256 indexed slot,
    uint256 itemType,
    address indexed itemAddress,
    uint256 itemTokenId,
    uint256 amount,
    address equippedBy
  );

  event ItemUnequipped(
    uint256 indexed subjectTokenId,
    uint256 indexed slot,
    uint256 itemType,
    address indexed itemAddress,
    uint256 itemTokenId,
    uint256 amount,
    address unequippedBy
  );

  function init(address adminAddress, address subjectAddress) external;

  function adminInfo() external view returns (address);

  function subject() external view returns (address);

  function createSlot(bool unequippable, uint256 slotType, string memory slotURI) external returns (uint256);

  function numSlots() external view returns (uint256);

  function markItemAsEquippableInSlot(uint256 slot, uint256 itemType, address itemAddress, uint256 itemPoolId, uint256 maxAmount) external;

  function equip(uint256 subjectTokenId, uint256 slot, uint256 itemType, address itemAddress, uint256 itemTokenId, uint256 amount) external;

  function getSlotById(uint256 slotId) external view returns (LibInventory.Slot memory slots);

  function createSlotType(uint256 slotType, string memory slotTypeName) external;

  function assignSlotType(uint256 slot, uint256 slotType) external;

  function getSlotType(uint256 slotType) external view returns (string memory slotTypeName);

  function setSlotUnequippable(bool unquippable, uint256 slotId) external;

  function getAllEquippedItems(uint256 subjectTokenId) external view returns (LibInventory.EquippedItem[] memory equippedItems);

  function equipBatch(uint256 subjectTokenId, uint256[] memory slots, LibInventory.EquippedItem[] memory items) external;
}
