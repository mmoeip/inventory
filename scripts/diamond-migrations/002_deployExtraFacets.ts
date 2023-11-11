/* eslint-disable @typescript-eslint/no-unsafe-call */
import { log } from '@helpers/logger';
import { FacetCutAction, getSelectorsFacet } from '@scripts/libraries/selectors';
import { ethers } from 'hardhat';

export async function deployExtraContractsAndFacets({ diamondAddressParam = '', useInventory = true, useCrafting = false, useAvatar = true, useItems = true }) {
  try {
    if (!diamondAddressParam) throw new Error('DIAMOND_ADDRESS not set');
    const diamondAddress = diamondAddressParam || process.env.DIAMOND_ADDRESS;

    const cut = [];
    let avatarAddress;
    let itemsAddress;
    let inventoryAddress;
    let craftingAddress;

    if (useAvatar) {
      // Deploy the Avatar and Items contracts
      const avatar = await ethers.deployContract('MockERC721');
      await avatar.waitForDeployment();
      await avatar.setApprovalForAll(diamondAddress, true);
      avatarAddress = await avatar.getAddress();
      log('AvatarFacet deployed to:', avatarAddress);
    }

    if (useItems) {
      const items = await ethers.deployContract('ItemsFactory');
      if (!items) throw new Error('ItemsFactory not deployed');
      await items.waitForDeployment();
      await items.setApprovalForAll(diamondAddress, true);
      itemsAddress = await items.getAddress();
      log('ItemsFacet deployed to:', itemsAddress);
    }

    if (useInventory) {
      const inventoryFacet = await ethers.deployContract('InventoryFacet');
      await inventoryFacet.waitForDeployment();
      inventoryAddress = await inventoryFacet.getAddress();
      cut.push({
        action: FacetCutAction.Add,
        facetAddress: inventoryAddress,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        functionSelectors: getSelectorsFacet(inventoryFacet),
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      log('InventoryFacet deployed to:', await inventoryAddress);
    }

    if (useCrafting) {
      const craftingFacet = await ethers.deployContract('CraftingFacet');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await craftingFacet.waitForDeployment();
      craftingAddress = await craftingFacet.getAddress();
      cut.push({
        action: FacetCutAction.Add,
        facetAddress: craftingAddress,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        functionSelectors: getSelectorsFacet(craftingFacet),
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      log('CraftingFacet deployed to:', craftingAddress);
    }

    // Get the DiamondCut facet instance
    const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress as string);

    log('Diamond Cut:', cut);

    if (cut.length) {
      // Construct the transaction object
      const transaction = {
        to: await diamondCutFacet.getAddress(),
        data: diamondCutFacet.interface.encodeFunctionData('diamondCut', [cut, ethers.ZeroAddress, '0x']),
      };
      const result = await ethers.provider.call(transaction);

      // Add the facets to the diamond

      log('Facets added to the Diamond', result);
    }

    return {
      inventoryAddress,
      craftingAddress,
      avatarAddress,
      itemsAddress,
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
