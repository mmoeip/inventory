export interface IFacetDeployedInfo {
  address?: string;
  tx_hash?: string;
  funcSelectors?: string[];
  verified?: boolean;
  version?: number;
}
export type FacetDeployedInfo = Record<string, IFacetDeployedInfo>;

export interface INetworkDeployInfo {
  DiamondAddress: string;
  DeployerAddress: string;
  FacetDeployedInfo: FacetDeployedInfo;
}

export const deployments: { [key: string]: INetworkDeployInfo } = {};
