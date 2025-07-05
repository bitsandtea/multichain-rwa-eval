import { POLYGON_AMOY_ENDPOINT } from "../constants";
import { verifyContract as verify } from "./verify/contract";

(async () => {
  const { ethers, network } = require("hardhat");

  async function main() {
    const contractName = "RWATokenDST";

    const endpointV2Address = POLYGON_AMOY_ENDPOINT; // Polygon Amoy
    const owner = (await ethers.getSigners())[0].address;

    const args = [
      "RWATokenDST", // name
      "RWADST", // symbol
      "Real World Asset Token Destination", // description
      "456 Main St", // physicalAddressValue
      2000000, // valuationValue
      200, // squareMetersValue
      20, // riskScoreValue
      20, // locationScoreValue
      owner, // riskScoreUpdaterAddress
      endpointV2Address, // endpoint
      owner, // owner
    ];

    const rwaTokenDst = await ethers.deployContract(contractName, args);

    await rwaTokenDst.waitForDeployment();

    console.log(`${contractName} deployed to ${rwaTokenDst.target}`);

    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("Verifying contract...");
      await verify(rwaTokenDst.target, args);
      console.log("Contract verified");
    }
  }

  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
})();
