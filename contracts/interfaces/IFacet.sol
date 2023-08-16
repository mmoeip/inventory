// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IFacet {
    event AdministratorDesignated(address indexed adminAddress);

    event ContractAddressDesignated(address indexed contractAddress);
}
