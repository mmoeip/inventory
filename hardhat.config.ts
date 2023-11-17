import * as dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';

import '@nomicfoundation/hardhat-foundry';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@nomicfoundation/hardhat-ethers';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'hardhat-gas-reporter';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@nomicfoundation/hardhat-verify';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@typechain/hardhat';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'tsconfig-paths/register';
import { ChainId } from './constants';

dotenv.config();

const { PRIVATE_KEY, ETHERSCAN_API_KEY, POLYGONSCAN_API_KEY, REPORT_GAS, INFURA_API_KEY } = process.env;

let accounts: string[] = [];
const privateKey: string | undefined = PRIVATE_KEY;
if (privateKey) {
  accounts = [privateKey];
}

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      blockGasLimit: 3_00_000_000,
    },
    localhost: {
      accounts: ['f470b4f4ac7426698835491ed91d1c645b1cf98d28c9ea842a967357d7825ccd', '395f4d273038b880e28576ff757339440f5fb9e4a4e54d781d38aecf6102e2a8'],
      url: 'http://127.0.0.1:7545/',
      chainId: ChainId.Ganache,
      timeout: 6000000,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`, // The Ethereum Web3 RPC URL (optional).
    },
    mantle: {
      url: `${process.env.MANTLE_PROVIDER_URL}`,
      accounts,
      chainId: ChainId.Mantle,
    },
    polygon: {
      url: `${process.env.POLYGON_PROVIDER_URL}`,
      accounts,
      chainId: ChainId.Polygon,
    },
    polygonMumbai: {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts,
      chainId: ChainId.PolygonMumbai,
    },
    mantleWadsley: {
      url: 'https://rpc.testnet.mantle.xyz/',
      accounts,
      chainId: ChainId.MantleWadsley,
    },
  },
  gasReporter: {
    enabled: REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: {
      polygonMumbai: POLYGONSCAN_API_KEY || '',
      polygon: POLYGONSCAN_API_KEY || '',
      goerli: ETHERSCAN_API_KEY || '',
      zkSyncTestnet: ETHERSCAN_API_KEY || '',
    },
  },
};

export default config;
