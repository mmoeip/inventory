import { FacetCutAction, getSelectorsFacet } from '@scripts/libraries/selectors';
import { log } from '@helpers/logger';
import { ethers } from 'hardhat';

import { DiamondCutFacet } from '../../typechain-types';

export async function deployInventoryFacet({ diamondAddressParam = ''}) {
  try {
    if (!diamondAddressParam) throw new Error('DIAMOND_ADDRESS not set');
    const diamondAddress = diamondAddressParam || process.env.DIAMOND_ADDRESS;

    let inventoryFacet;
    let craftingFacet;
    const cut = [];

    const InventoryFacetFactory = await ethers.getContractFactory('InventoryFacet');
    inventoryFacet = await InventoryFacetFactory.deploy();
    await inventoryFacet.deployed();
    cut.push({
      action: FacetCutAction.Add,
      facetAddress: inventoryFacet.address,
      functionSelectors: getSelectorsFacet(inventoryFacet),
    });
    log('InventoryFacet deployed to:', inventoryFacet.address);

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
    };
  } catch (error) {
    console.error(error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployInventoryFacet({
    diamondAddressParam: process.env.DIAMOND_ADDRESS,
  })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
