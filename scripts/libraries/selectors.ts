// get function selectors from ABI

import { Contract } from 'ethers';

export enum FacetCutAction {
  Add,
  Replace,
  Remove,
}

export function getSelectors(contract: Contract): string[] {
  const selectors: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
  contract.interface.forEachFunction((f) => selectors.push(f.selector));

  return selectors;
}

export function getSelectorsFacet(contract: Contract): string[] {
  return getSelectors(contract);
}

export function getSelectorNames(contract: Contract, contractName: string) {
  const selectors = getSelectors(contract);

  selectors.forEach((sel) => {
    console.log('Contract Name: ', contractName);
    console.log(sel);
  });
}
