# Inventory Contracts
This is a EIP-2535 diamond implementation but also will have the stand-alone contract for the inventory.

1. NodeJs >= 18 (use nvm pls)
2. Fill the .env file with the correct values(see .env.example)
3. Install dependencies
```shell
npm install
```
4. `npm run compile`
5. `npm run deployDiamond:localhost`

To deploy the current diamond to the zkSync testnet network, run the following command:(failing)
This command will run the script of 

 **/deploy/zk/deployDiamond.ts** 
```shell
npm run deployDiamond:ZkSync
```

## Commands
1. This command will setup a hardhat node for you, could be used for testing as Ganache
```shell
 npm run localChain
```

2. This command will run a diamond deployment for Mantle on:
```shell
npm run deployDiamond:mantle
```

3. This command will run a diamond deployment for Polygon mumbai on:
```shell
npm run deployDiamond:mumbai
```

Check the rest of the scripts in the package.json file


