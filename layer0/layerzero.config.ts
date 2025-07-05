import { EndpointId } from "@layerzerolabs/lz-definitions";
import { generateConnectionsConfig } from "@layerzerolabs/metadata-tools";
import { OmniPointHardhat } from "@layerzerolabs/toolbox-hardhat";

const baseContract: OmniPointHardhat = {
  eid: EndpointId.BASESEP_V2_TESTNET,
  contractName: "RWAToken",
};

const amoyContract: OmniPointHardhat = {
  eid: EndpointId.AMOY_V2_TESTNET,
  contractName: "RWAToken",
};

const ethSepoliaContract: OmniPointHardhat = {
  eid: EndpointId.SEPOLIA_V2_TESTNET,
  contractName: "RWAToken",
};

export default async function () {
  const connections = await generateConnectionsConfig([
    // Base <-> Amoy
    [baseContract, amoyContract, [["LayerZero Labs"], []], [1, 1], [[], []]],
    // Base <-> Ethereum Sepolia
    [
      baseContract,
      ethSepoliaContract,
      [["LayerZero Labs"], []],
      [1, 1],
      [[], []],
    ],
    // Amoy <-> Ethereum Sepolia
    [
      amoyContract,
      ethSepoliaContract,
      [["LayerZero Labs"], []],
      [1, 1],
      [[], []],
    ],
  ]);

  return {
    contracts: [
      { contract: baseContract },
      { contract: amoyContract },
      { contract: ethSepoliaContract },
    ],
    connections,
  };
}
