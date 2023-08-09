import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AVATAR_TOKEN_ID, EYES_ITEM_ID, JACKET_ITEM_ID, setup, SLOT_ID, SLOT_ID_2 } from '@tests/setup';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { InventoryFacet, MockERC1155 } from '../typechain-types';

describe('InventoryFacet', function () {
  let facet: InventoryFacet;
  let itemsContract: MockERC1155;
  // @ts-ignore-next-line
  let ownerAccount: SignerWithAddress;
  beforeEach(async function () {
    this.timeout(0);
    // @ts-ignore-next-line
    // eslint-disable-next-line mocha/no-nested-tests
    const { inventoryFacet, items } = await setup({ useInventory: true });
    const [adminAccount] = await ethers.getSigners();
    facet = inventoryFacet;
    itemsContract = items;
    ownerAccount = adminAccount;
  });

  describe('adminInfo', () => {
    it('adminInfo - The owner account should be the admin of the InventoryFacet', async () => {
      const result = await facet.adminInfo();
      expect(result).to.equal(ownerAccount.address);
    });
  });

  describe('equip', () => {
    it('equip - Equip erc1155 equippable items in the slot 1 must works', async () => {
      const equipTrx = await facet.equip(AVATAR_TOKEN_ID, SLOT_ID, 1155, itemsContract.address, JACKET_ITEM_ID, 1);
      await equipTrx.wait();

      const equippedItems = await facet.getAllEquippedItems(AVATAR_TOKEN_ID);
      expect(equippedItems.length).to.eq(1);
    });
  });

  describe('equipBatch', () => {
    it('equipBatch - Equip erc1155 equippable items in the slot 1 and 2 must works', async () => {
      const batchTrx = await facet.equipBatch(
        AVATAR_TOKEN_ID,
        [SLOT_ID, SLOT_ID_2],
        [
          {
            ItemType: 1155,
            ItemAddress: itemsContract.address,
            ItemTokenId: JACKET_ITEM_ID,
            Amount: 1,
          },
          {
            ItemType: 1155,
            ItemAddress: itemsContract.address,
            ItemTokenId: EYES_ITEM_ID,
            Amount: 2,
          },
        ]
      );
      await batchTrx.wait();
      const equippedItems = await facet.getAllEquippedItems(AVATAR_TOKEN_ID);
      expect(equippedItems.length).to.eq(2);
    });
  });
});
