import { log } from '@helpers/logger';
import { Signer } from 'ethers';
import { run } from 'hardhat';

export const verifyContract = async ({
  contractAddress,
  constructorArguments = [],
  confirmations = 10,
  signer,
  txHash,
}: {
  contractAddress: string;
  constructorArguments?: any[];
  confirmations?: number;
  signer: Signer;
  txHash: string;
}) => {
  try {
    log('Waiting for contract to be mined...');
    await signer.provider?.waitForTransaction(txHash, confirmations);
    log('Contract mined');
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: constructorArguments,
    });
    log('contract verified');
    return;
  } catch (error) {
    const { message } = error as Error;
    if (message?.includes('Already Verified')) {
      log('contract already Verified');
      return;
    } else {
      log('contract verification failed');
      log(error);
      return;
    }
  }
};
