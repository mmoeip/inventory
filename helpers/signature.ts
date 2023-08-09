import { ethers, Signer } from 'ethers';

export async function generateSignature({ walletAddress, signer }: { walletAddress: string; signer: Signer }) {
  const nonce = Math.floor(1000000 * Math.random());

  let message = ethers.utils.solidityPack(['address', 'uint256'], [walletAddress, nonce]);
  message = ethers.utils.solidityKeccak256(['bytes'], [message]);
  const signature = await signer.signMessage(ethers.utils.arrayify(message));

  return {
    nonce,
    signature,
  };
}
