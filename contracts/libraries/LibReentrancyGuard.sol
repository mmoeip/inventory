// SPDX-License-Identifier: MIT

/**
 * Authors: Omar Garcia <omar@game7.io>
 * GitHub: https://github.com/ogarciarevett
 */

pragma solidity ^0.8.17;

import { IDiamondCut } from "../interfaces/IDiamondCut.sol";

library LibReentrancyGuard {
  bytes32 constant REENTRANCY_GUARD_STORAGE_POSITION = keccak256("summon.eth.storage.reentrancy");

  struct ReentrancyGuardStorage {
    bool _entered;
  }

  function reentrancyGuardStorage() internal pure returns (ReentrancyGuardStorage storage ds) {
    bytes32 position = REENTRANCY_GUARD_STORAGE_POSITION;
    assembly {
      ds.slot := position
    }
  }
}
