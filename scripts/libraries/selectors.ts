// get function selectors from ABI

import { Contract } from 'ethers';

export enum FacetCutAction {
  Add,
  Replace,
  Remove,
}

export function getSelectors(contract: Contract): string[] {
  const signatures = Object.keys(contract.interface.functions);
  const selectors: string[] = signatures.reduce((acc: string[], val: string) => {
    if (val !== 'init(bytes)') {
      acc.push(contract.interface.getSighash(val));
    }
    return acc;
  }, []);

  return selectors;
}

export function getSelectorsFacet(contract: Contract) {
  const signatures = Object.keys(contract.interface.functions);
  // log function names and signatures
  const selectors = signatures.reduce((acc, val) => {
    if (val !== 'init(bytes)' && val !== 'supportsInterface(bytes4)') {
      // @ts-ignore
      acc.push(contract.interface.getSighash(val));
    }
    return acc;
  }, []);

  return selectors;
}

export function getSelectorNames(contract: Contract, contractName: string) {
  const signatures = Object.keys(contract.interface.functions);

  signatures.forEach((sig) => {
    console.log('Contract Name: ', contractName);
    console.log(sig, contract.interface.getSighash(sig));
  });
}
