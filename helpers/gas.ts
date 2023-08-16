import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/dist/types';
import { ethers } from 'hardhat';

export const estimateZkGasFee = async (artifact: ZkSyncArtifact, deployer: Deployer) => {
  // Estimate contract deployment fee
  const deploymentFee = await deployer.estimateDeployFee(artifact, []);

  const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
  console.log(`The deployment is estimated to cost ${parsedFee} ETH`);
  return deploymentFee;
};
