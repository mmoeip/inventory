import { deployDiamond } from '@scripts/diamond-migrations/001_deployDiamond';
import { assert } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

describe('Diamond Deploy', function () {
  let diamondAddress;
  let diamondLoupeFacet: Contract;
  const addresses = [];

  beforeEach(async function () {
    diamondAddress = await deployDiamond();
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress);
  });

  it('should have three facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
    }
    assert.equal(addresses.length, 3);
  });
});
