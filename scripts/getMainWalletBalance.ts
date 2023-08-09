import { ethers } from 'hardhat';
import { formatUnits } from 'ethers/lib/utils';

async function main() {
  const [account] = await ethers.getSigners();
  const address = account.address;
  const balance = await account.getBalance();

  console.log('Main account address: ', address);
  console.log('Main account formatted ETH: ', formatUnits(balance, 'ether'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
