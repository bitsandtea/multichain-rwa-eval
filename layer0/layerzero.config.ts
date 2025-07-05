import { EndpointId } from "@layerzerolabs/lz-definitions";
import { ExecutorOptionType } from "@layerzerolabs/lz-v2-utilities";
import {
  TwoWayConfig,
  generateConnectionsConfig,
} from "@layerzerolabs/metadata-tools";
import {
  OAppEnforcedOption,
  OmniPointHardhat,
} from "@layerzerolabs/toolbox-hardhat";

const baseContract: OmniPointHardhat = {
  eid: EndpointId.BASESEP_V2_TESTNET,
  contractName: "RWAToken",
};

const amoyContract: OmniPointHardhat = {
  eid: EndpointId.AMOY_V2_TESTNET,
  contractName: "RWATokenDST",
};

const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
  {
    msgType: 1,
    optionType: ExecutorOptionType.LZ_RECEIVE,
    gas: 80000,
    value: 0,
  },
];

const pathways: TwoWayConfig[] = [
  [
    baseContract,
    amoyContract,
    [["LayerZero Labs"], []],
    [1, 1],
    [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
  ],
];

export default async function () {
  const connections = await generateConnectionsConfig(pathways);
  return {
    contracts: [
      {
        contract: baseContract,
        config: {
          setPeer: [[amoyContract.eid, amoyContract.contractName]],
        },
      },
      {
        contract: amoyContract,
        config: {
          setPeer: [[baseContract.eid, baseContract.contractName]],
        },
      },
    ],
    connections,
  };
}
