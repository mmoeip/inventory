// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;
import "../libraries/LibReentrancyGuard.sol";

abstract contract DiamondReentrancyGuard {
  modifier diamondNonReentrant() {
    LibReentrancyGuard.ReentrancyGuardStorage storage rgs = LibReentrancyGuard.reentrancyGuardStorage();
    require(!rgs._entered, "LibReentrancyGuard: reentrant call!");
    rgs._entered = true;
    _;
    rgs._entered = false;
  }
}
