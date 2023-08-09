import { deployDiamond } from '@scripts/diamond-migrations/001_deployDiamond';
import { deployInventoryFacet } from '@scripts/diamond-migrations/002_deployInventoryFacet';
import { log } from '@helpers/logger';
import { ethers } from 'hardhat';

import { InventoryFacet, MockERC1155, MockERC721 } from "../typechain-types";

// Ids
export const JACKET_SLOT_TYPE = 123;
export const EYES_SLOT_TYPE = 123;
export const SLOT_ID = 0;

export const SLOT_ID_2 = 1;

export const AVATAR_TOKEN_ID = 0;

export const JACKET_ITEM_ID = 15;

export const EYES_ITEM_ID = 22;

export async function setup({ useInventory = true) {
  try {
    log('Setting up the test environment');
    const [mainAccount] = await ethers.getSigners();
    // 1. Deploy the diamond and facets
    log('Deploying the diamond and diamond facets');
    const diamondAddress = await deployDiamond();

    await deployInventoryFacet({ diamondAddressParam: diamondAddress });

    let inventoryFacet: InventoryFacet;
    let items: MockERC1155;
    let avatar: MockERC721;

    // 2. Deploy mockerc721 as avatar
    log('Deploying mockerc721 as avatar');
    const MockERC721 = await ethers.getContractFactory('MockERC721');
    const mockERC721 = await MockERC721.deploy('MockERC721', 'MockERC721');
    await mockERC721.deployed();
    log('MockERC721 deployed to:', mockERC721.address);
    avatar = mockERC721;

    // 3. deploy erc1155 for items
    log('Deploying mockerc1155 as items');
    const MockERC1155 = await ethers.getContractFactory('MockERC1155');
    const mockERC1155 = await MockERC1155.deploy('MockERC1155', 'MockERC1155');
    await mockERC1155.deployed();
    log('MockERC1155 deployed to:', mockERC1155.address);
    items = mockERC1155;


    inventoryFacet = (await ethers.getContractAt('InventoryFacet', diamondAddress)) as InventoryFacet;

    // 4. init inventory
    log('Init inventory');
    const initTrx = await inventoryFacet.init(mainAccount.address, mockERC721.address as string);
    await initTrx.wait();
    log('Inventory initialized', initTrx.hash);

    // 5. create, assign slot type and create slot
    log('Create, assign slot type and create slot');
    const createSlotTypeTrx = await inventoryFacet.createSlotType(JACKET_SLOT_TYPE, 'TEST_SLOT_TYPE');
    await createSlotTypeTrx.wait();
    log('Slot type created', createSlotTypeTrx.hash);

    const createSlotTypeTrx2 = await inventoryFacet.createSlotType(EYES_SLOT_TYPE, 'TEST_SLOT_TYPE');
    await createSlotTypeTrx2.wait();
    log('Slot type 2 created', createSlotTypeTrx2.hash);

    const createSlotTrx = await inventoryFacet.createSlot(false, JACKET_SLOT_TYPE, 'slot:/uri/1.png');
    await createSlotTrx.wait();

    const createSlotTrx2 = await inventoryFacet.createSlot(false, EYES_SLOT_TYPE, 'slot:/uri/2.png');
    await createSlotTrx2.wait();

    const assignSlotTrx = await inventoryFacet.assignSlotType(SLOT_ID, JACKET_SLOT_TYPE);
    await assignSlotTrx.wait();

    const assignSlotTrx2 = await inventoryFacet.assignSlotType(SLOT_ID_2, EYES_SLOT_TYPE);
    await assignSlotTrx2.wait();

    // 6. mark slot as equippable in the inventory
    log('Mark slot as equippable in the inventory');
    const markTrx = await inventoryFacet.markItemAsEquippableInSlot(SLOT_ID, 1155, items.address as string, JACKET_ITEM_ID, 1);
    await markTrx.wait();
    log('Slot marked as equippable', markTrx.hash);

    log('Mark slot as equippable in the inventory');
    const markTrx2 = await inventoryFacet.markItemAsEquippableInSlot(SLOT_ID_2, 1155, items.address as string, EYES_ITEM_ID, 2);
    await markTrx2.wait();
    log('Slot 2 marked as equippable', markTrx.hash);

    // @ts-ignore
    return { diamondAddress, owner: mainAccount.address, avatar, items, inventoryFacet, votesFacet };
  } catch (error) {
    console.error(error);
  }
}
