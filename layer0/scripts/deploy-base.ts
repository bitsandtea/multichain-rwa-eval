// import {verify} from "./verify/contract";

import { BASE_SEPOLIA_ENDPOINT } from "../constants";
import { verifyContract as verify } from "./verify/contract";

const { ethers, network } = require("hardhat");

(async () => {
  async function main() {
    const contractName = "RWAToken";

    const endpointV2Address = BASE_SEPOLIA_ENDPOINT; // Base Sepolia
    const owner = (await ethers.getSigners())[0].address;

    const args = [
      "RWAToken", // name
      "RWA", // symbol
      "Real World Asset Token", // description
      "123 Main St", // physicalAddressValue
      1000000, // valuationValue
      100, // squareMetersValue
      10, // riskScoreValue
      10, // locationScoreValue
      owner, // riskScoreUpdaterAddress
      endpointV2Address, // endpoint
      owner, // owner
    ];

    const rwaToken = await ethers.deployContract(contractName, args);

    await rwaToken.waitForDeployment();

    console.log(`${contractName} deployed to ${rwaToken.target}`);

    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("Verifying contract...");
      await verify(rwaToken.target, args);
      console.log("Contract verified");
    }
  }

  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
})();
