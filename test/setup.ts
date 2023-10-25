import { deployDiamond } from '@scripts/diamond-migrations/001_deployDiamond';
import { deployExtraContractsAndFacets } from '@scripts/diamond-migrations/002_deployExtraFacets';
import { log } from '@helpers/logger';
import { ethers } from 'hardhat';

import { InventoryFacet, MockERC721, MockERC1155 } from '../typechain-types';

export const SLOT_ID = 0;

export const SLOT_ID_2 = 1;

export const AVATAR_TOKEN_ID = 0;

export const JACKET_ITEM_ID = 15;

export const EYES_ITEM_ID = 22;

export async function setup({ useInventory = true, useAvatar = true, useItems = true, useCrafting = false }) {
  try {
    log('Setting up the test environment');
    const [mainAccount] = await ethers.getSigners();
    // 1. Deploy the diamond and facets
    log('Deploying the diamond and diamond facets');
    const diamondAddress = await deployDiamond();

    const extraContracts = await deployExtraContractsAndFacets({ diamondAddressParam: diamondAddress, useInventory, useCrafting, useAvatar, useItems });

    let inventoryFacet: InventoryFacet;
    let avatar: MockERC721;
    let items: MockERC1155;
    //  TODO: @kellan / @zoomling crafting contract here
    // let craftingFacet: any;

    if (useAvatar) {
      // 2. mint avatar for the tester
      avatar = (await ethers.getContractAt('MockERC721', extraContracts?.avatarAddress as string)) as MockERC721;
      log('Minting avatar for the tester');
      const avatarTrx = await avatar.mint(mainAccount.address, 0);
      await avatarTrx.wait();
      log('Avatar minted', avatarTrx.hash);
    }

    if (useItems) {
      items = (await ethers.getContractAt('MockERC1155', extraContracts?.itemsAddress as string)) as MockERC1155;

      // 3. mint some items for the tester
      log('Minting items for the tester');
      const jacketTrx = await items.mint(mainAccount.address, JACKET_ITEM_ID, 1, ethers.utils.toUtf8Bytes(''));
      await jacketTrx.wait();
      log('Materials minted', jacketTrx.hash);

      const eyesTrx = await items.mint(mainAccount.address, EYES_ITEM_ID, 2, ethers.utils.toUtf8Bytes(''));
      await eyesTrx.wait();
    }

    if (useInventory) {
      inventoryFacet = (await ethers.getContractAt('InventoryFacet', diamondAddress)) as InventoryFacet;
      // 4. init inventory
      log('Init inventory');
      const initTrx = await inventoryFacet.init(mainAccount.address, extraContracts?.avatarAddress as string);
      await initTrx.wait();
      log('Inventory initialized', initTrx.hash);

      // 5. create slots

      const createSlotTrx = await inventoryFacet.createSlot(false, 'slot:/uri/1.png');
      await createSlotTrx.wait();

      const createSlotTrx2 = await inventoryFacet.createSlot(false, 'slot:/uri/2.png');
      await createSlotTrx2.wait();

      // 6. mark slot as equippable in the inventory
      log('Mark slot as equippable in the inventory');
      const markTrx = await inventoryFacet.markItemAsEquippableInSlot(SLOT_ID, 1155, extraContracts?.itemsAddress as string, JACKET_ITEM_ID, 1);
      await markTrx.wait();
      log('Slot marked as equippable', markTrx.hash);

      log('Mark slot as equippable in the inventory');
      const markTrx2 = await inventoryFacet.markItemAsEquippableInSlot(SLOT_ID_2, 1155, extraContracts?.itemsAddress as string, EYES_ITEM_ID, 2);
      await markTrx2.wait();
      log('Slot 2 marked as equippable', markTrx.hash);
    }

    // @ts-ignore
    return { diamondAddress, owner: mainAccount.address, avatar, items, inventoryFacet };
  } catch (error) {
    console.error(error);
  }
}
