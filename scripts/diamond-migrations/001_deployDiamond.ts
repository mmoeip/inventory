/* eslint-disable @typescript-eslint/no-unsafe-call */
import { FacetCutAction, getSelectors } from '@scripts/libraries/selectors';
import { log } from '@helpers/logger';
import { Contract, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
export async function deployDiamond() {
  // Get owner by private key
  const accounts = await ethers.getSigners();
  const contractOwner = accounts[0];

  log('Contract Owner: ', contractOwner.address);
  // deploy DiamondCutFacet
  const DiamondCutFacetFactory: ContractFactory = await ethers.getContractFactory('DiamondCutFacet');
  log('DiamondCutFacet deploying...');
  const diamondCutFacet = await DiamondCutFacetFactory.deploy();
  await diamondCutFacet.waitForDeployment();
  log('DiamondCutFacet deployed:', await diamondCutFacet.getAddress());
  // // Verify DiamondCutFacet
  // await verifyContract({
  //   contractAddress: diamondCutFacet.address,
  //   signer: contractOwner,
  //   txHash: diamondCutFacet.deployTransaction.hash,
  // });
  // // deploy Diamond
  log('Diamond deploying...');

  const Diamond: ContractFactory = await ethers.getContractFactory('Diamond');
  const diamond = await Diamond.deploy(contractOwner.address, await diamondCutFacet.getAddress());
  await diamond.waitForDeployment();
  log('Diamond deployed:', await diamond.getAddress());
  // await verifyContract({
  //   contractAddress: diamond.address,
  //   signer: contractOwner,
  //   constructorArguments: [contractOwner.address, diamondCutFacet.address],
  //   txHash: diamond.deployTransaction.hash,
  // });
  // deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
  // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
  log('DiamondInit deploying...');
  const DiamondInit: ContractFactory = await ethers.getContractFactory('DiamondInit');
  const diamondInit = await DiamondInit.deploy();
  await diamondInit.waitForDeployment();
  log('DiamondInit deployed:', diamondInit.getAddress());
  // await verifyContract({
  //   contractAddress: diamondInit.address,
  //   signer: contractOwner,
  //   txHash: diamondInit.deployTransaction.hash,
  // });

  // deploy facets
  log('Deploying facets');
  const FacetNames = ['DiamondLoupeFacet', 'OwnershipFacet'];
  const cut = [];
  for (const FacetName of FacetNames) {
    const Facet: ContractFactory = await ethers.getContractFactory(FacetName);
    const facet = await Facet.deploy();
    await facet.waitForDeployment();
    log(`${FacetName} deployed: ${await facet.getAddress()}`);
    cut.push({
      facetAddress: await facet.getAddress(),
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    });
  }

  // upgrade diamond with facets
  log('Diamond Cut:', cut);
  const diamondCut: Contract = await ethers.getContractAt('IDiamondCut', await diamond.getAddress());
  // call to init function
  const functionCall = diamondInit.interface.encodeFunctionData('init');
  const tx = await diamondCut.diamondCut(cut, await diamondInit.getAddress(), functionCall);
  log('Diamond cut tx: ', tx.hash);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  log('Completed diamond cut');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return diamond.getAddress();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
