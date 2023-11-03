// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "../lib/forge-std/src/Test.sol";
import {IInventory} from "../contracts/interfaces/IInventory.sol";
import {IDiamondCut} from "../contracts/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../contracts/interfaces/IDiamondLoupe.sol";
import {Inventory} from "../contracts/Inventory.sol";
import {Diamond} from "../contracts/Diamond.sol";
import {DiamondCutFacet} from "../contracts/facets/DiamondCutFacet.sol";
import {OwnershipFacet} from "../contracts/facets/OwnershipFacet.sol";
import {DiamondLoupeFacet} from "../contracts/facets/DiamondLoupeFacet.sol";
import {InventoryFacet} from "../contracts/facets/InventoryFacet.sol";
import {MockERC721} from "../contracts/mocks/MockErc721.sol";

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract InventoryTests is Test {
    IInventory public inventory;
    IERC721 public nftCharacters;

    address owner = makeAddr("owner");
    address admin = makeAddr("admin");

    function setUp() public virtual {
        nftCharacters = new MockERC721();
        inventory = new Inventory(owner, address(nftCharacters));
    }

    function test_deployment() public virtual {
        assertEq(inventory.subject(), address(nftCharacters));
    }

    function test_create_slot_persistent() public {
        uint256 initialNumSlots = inventory.numSlots();

        string memory slotURI = "https://example.com/new_slot_uri_persistent.json";

        vm.prank(owner);
        uint256 slotID = inventory.createSlot(true, slotURI);

        assertEq(inventory.numSlots(), initialNumSlots + 1);

        assertTrue(inventory.slotIsPersistent(slotID));
        assertEq(inventory.getSlotURI(slotID), slotURI);
    }

    function test_create_slot_impersistent() public {
        uint256 initialNumSlots = inventory.numSlots();

        string memory slotURI = "https://example.com/new_slot_uri_impersistent.json";

        vm.prank(owner);
        uint256 slotID = inventory.createSlot(false, slotURI);

        assertEq(inventory.numSlots(), initialNumSlots + 1);

        assertFalse(inventory.slotIsPersistent(slotID));
        assertEq(inventory.getSlotURI(slotID), slotURI);
    }
}

contract InventoryDiamondTests is InventoryTests {
    DiamondCutFacet public diamondCutFacet;
    address public diamond;
    OwnershipFacet public ownershipFacet;
    DiamondLoupeFacet public diamondLoupeFacet;
    InventoryFacet public inventoryFacet;

    function setUp() public override {
        nftCharacters = new MockERC721();
        diamondCutFacet = new DiamondCutFacet();
        Diamond diamondContract = new Diamond(owner, address(diamondCutFacet));
        diamond = address(diamondContract);
        ownershipFacet = new OwnershipFacet();
        diamondLoupeFacet = new DiamondLoupeFacet();
        inventoryFacet = new InventoryFacet();

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](3);

        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = OwnershipFacet.owner.selector;
        selectors[1] = OwnershipFacet.transferOwnership.selector;
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(ownershipFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        selectors = new bytes4[](5);
        selectors[0] = DiamondLoupeFacet.facets.selector;
        selectors[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        selectors[2] = DiamondLoupeFacet.facetAddresses.selector;
        selectors[3] = DiamondLoupeFacet.facetAddress.selector;
        selectors[4] = DiamondLoupeFacet.supportsInterface.selector;
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        selectors = new bytes4[](13);
        selectors[0] = InventoryFacet.subject.selector;
        selectors[1] = InventoryFacet.createSlot.selector;
        selectors[2] = InventoryFacet.numSlots.selector;
        selectors[3] = InventoryFacet.getSlotById.selector;
        selectors[4] = InventoryFacet.getSlotURI.selector;
        selectors[5] = InventoryFacet.slotIsPersistent.selector;
        selectors[6] = InventoryFacet.setSlotURI.selector;
        selectors[7] = InventoryFacet.setSlotPersistent.selector;
        selectors[8] = InventoryFacet.markItemAsEquippableInSlot.selector;
        selectors[9] = InventoryFacet.maxAmountOfItemInSlot.selector;
        selectors[10] = InventoryFacet.equip.selector;
        selectors[11] = InventoryFacet.getEquippedItem.selector;
        selectors[12] = InventoryFacet.getAllEquippedItems.selector;
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: address(inventoryFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        bytes memory initCallData = abi.encodeWithSelector(InventoryFacet.init.selector, owner, address(nftCharacters));

        vm.prank(owner);
        IDiamondCut(diamond).diamondCut(cuts, address(inventoryFacet), initCallData);

        inventory = IInventory(diamond);
    }

    function test_deployment() public override {
        address[] memory facetAddresses = IDiamondLoupe(diamond).facetAddresses();
        assertEq(facetAddresses.length, 4);
        assertEq(facetAddresses[0], address(diamondCutFacet));
        assertEq(facetAddresses[1], address(ownershipFacet));
        assertEq(facetAddresses[2], address(diamondLoupeFacet));
        assertEq(facetAddresses[3], address(inventoryFacet));

        assertEq(inventory.subject(), address(nftCharacters));
    }
}
