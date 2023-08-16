import { log } from '@helpers/logger';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

export const deployZkArtifact = async (deployer: Deployer, contractName: string, contractArgs?: any[]) => {
  const artifact = await deployer.loadArtifact(contractName);
  // Estimate contract deployment fee
  // await estimateZkGasFee(artifact, deployer);
  const contract = await deployer.deploy(artifact, contractArgs || []);
  await contract.deployed();
  // Show the contract info.
  log(`${artifact.contractName} was deployed to ${contract.address}`);
  return { contract, artifact };
};
