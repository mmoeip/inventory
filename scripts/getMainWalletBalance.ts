import { formatUnits } from 'ethers';
import { ethers } from 'hardhat';

async function main() {
  const [account] = await ethers.getSigners();
  const address = account.address;
  const balance = await ethers.provider.getBalance(address);

  console.log('Main account address: ', address);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  console.log('Main account formatted ETH: ', formatUnits(balance, 'ether'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
