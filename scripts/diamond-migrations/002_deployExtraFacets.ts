import { FacetCutAction, getSelectorsFacet } from '@scripts/libraries/selectors';
import { log } from '@helpers/logger';
import { ethers } from 'hardhat';

import { DiamondCutFacet } from '../../typechain-types';

export async function deployExtraContractsAndFacets({ diamondAddressParam = '', useInventory = true, useCrafting = false, useAvatar = true, useItems = true }) {
  try {
    if (!diamondAddressParam) throw new Error('DIAMOND_ADDRESS not set');
    const diamondAddress = diamondAddressParam || process.env.DIAMOND_ADDRESS;

    let inventoryFacet;
    let craftingFacet;
    let avatar;
    let items;
    const cut = [];

    if (useAvatar) {
      // Deploy the Avatar and Items contracts
      const AvatarFactory = await ethers.getContractFactory('MockERC721');
      avatar = await AvatarFactory.deploy();
      await avatar.deployed();
      await avatar.setApprovalForAll(diamondAddress, true);
      log('AvatarFacet deployed to:', avatar.address);
    }

    if (useItems) {
      const ItemsFactory = await ethers.getContractFactory('MockERC1155');
      items = await ItemsFactory.deploy();
      await items.deployed();
      await items.setApprovalForAll(diamondAddress, true);
      log('ItemsFacet deployed to:', items.address);
    }

    if (useInventory) {
      const InventoryFacetFactory = await ethers.getContractFactory('InventoryFacet');
      inventoryFacet = await InventoryFacetFactory.deploy();
      await inventoryFacet.deployed();
      cut.push({
        action: FacetCutAction.Add,
        facetAddress: inventoryFacet.address,
        functionSelectors: getSelectorsFacet(inventoryFacet),
      });
      log('InventoryFacet deployed to:', inventoryFacet.address);
    }

    if (useCrafting) {
      const CraftingFacetFactory = await ethers.getContractFactory('CraftingFacet');
      craftingFacet = await CraftingFacetFactory.deploy();
      await craftingFacet.deployed();
      cut.push({
        action: FacetCutAction.Add,
        facetAddress: craftingFacet.address,
        functionSelectors: getSelectorsFacet(craftingFacet),
      });
      log('CraftingFacet deployed to:', craftingFacet.address);
    }

    // Get the DiamondCut facet instance
    const diamondCutFacet = (await ethers.getContractAt('DiamondCutFacet', diamondAddress as string)) as DiamondCutFacet;

    log('Diamond Cut:', cut);

    if (cut.length) {
      // Add the facets to the diamond
      const tx = await diamondCutFacet.diamondCut(cut, ethers.constants.AddressZero, '0x');
      await tx.wait();
      log('Facets added to the Diamond');
    }

    return {
      inventoryAddress: inventoryFacet?.address,
      craftingAddress: craftingFacet?.address,
      avatarAddress: avatar?.address,
      itemsAddress: items?.address,
    };
  } catch (error) {
    console.error(error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployExtraContractsAndFacets({
    useInventory: true,
    useCrafting: false,
    useAvatar: true,
    useItems: true,
    diamondAddressParam: process.env.DIAMOND_ADDRESS,
  })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
