import { ChainId } from '../constants';
import debug from 'debug';

const logger: debug.Debugger = debug('Summon:log');
logger.enabled = true;

export const log = logger;

export const logDeployAddress = (chainId: number, address: string) => {
  switch (chainId) {
    case ChainId.Ganache: {
      log('✅ Success! Local Contract address: ', address);
      break;
    }
    case ChainId.PolygonMumbai: {
      log(`✅ Success! https://mumbai.polygonscan.com/address/${address}`);
      break;
    }
    case ChainId.Polygon: {
      log(`✅ Success! https://polygonscan.com/address/${address}`);
      break;
    }
    case ChainId.Mantle: {
      log('✅ Success! https://explorer.testnet.mantle.xyz/address/' + address);
      break;
    }
    case ChainId.MantleWadsley: {
      log('✅ Success! https://explorer.testnet.mantle.xyz/address/' + address);
      break;
    }
    default: {
      return new Error('Chain Id provided do not supported.');
    }
  }
};
