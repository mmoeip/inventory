// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Test, console2 } from "../lib/forge-std/src/Test.sol";
import { IInventory } from "../contracts/interfaces/IInventory.sol";
import { Inventory } from "../contracts/Inventory.sol";
import { MockERC721 } from "../contracts/mocks/MockErc721.sol";

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract InventoryTests is Test {
    IInventory public inventory;
    IERC721 public nftCharacters;

    address owner = address(0x1);
    address admin = address(0x2);

    function setUp() public virtual {
        nftCharacters = new MockERC721();
        inventory = new Inventory(owner, address(nftCharacters));
    }

    function test_deployment() public {
        assertEq(inventory.subject(), address(nftCharacters));
    }

    function test_create_slot_persistent() public {
        uint256 intiialNumSlots = inventory.numSlots();

        string memory slotURI = "https://example.com/new_slot_uri.json";

        vm.prank(owner);
        uint256 slotID = inventory.createSlot(true, slotURI);

        assertEq(inventory.numSlots(), intiialNumSlots + 1);

        assertTrue(inventory.slotIsPersistent(slotID));
        assertEq(inventory.getSlotURI(slotID), slotURI);
    }
}
