// import {verify} from "./verify/contract";

const { ethers, network } = require("hardhat");
import { base, propertyData } from "../constants";
import { verifyContract } from "./verify/contract";

async function main() {
  console.log(`Deploying RWAToken to ${network.name}`);

  const signers = await ethers.getSigners();
  const owner = signers[0].address;

  const args = [
    "RWAToken",
    "RWA",
    "Real World Asset backed Token",
    propertyData.address,
    propertyData.valuation_usd,
    propertyData.size_sqm,
    propertyData.default_risk_score,
    propertyData.location_score,
    owner,
    ethers.utils.getAddress(base.endpoint),
    owner, // This is the delegate address
  ];
  console.log("args are:", args);

  const rwaToken = await ethers.getContractFactory("RWAToken");
  const deployedToken = await rwaToken.deploy(...args);
  await deployedToken.deployed();

  console.log(`RWAToken deployed to: ${deployedToken.address}`);

  console.log("Setting peers...");

  // Set peers for both Polygon Amoy and Ethereum Sepolia
  const amoyEndpointId = 40267; // Polygon Amoy
  const ethEndpointId = 40161; // Ethereum Sepolia

  // Note: Replace these addresses with actual deployed contract addresses
  const amoyContractAddress = "0x0000000000000000000000000000000000000000"; // Replace with deployed Amoy address
  const ethContractAddress = "0x0000000000000000000000000000000000000000"; // Replace with deployed Ethereum address

  if (amoyContractAddress !== "0x0000000000000000000000000000000000000000") {
    await deployedToken.setPeer(
      amoyEndpointId,
      ethers.utils.zeroPadValue(
        ethers.utils.getAddress(amoyContractAddress),
        32
      )
    );
    console.log("Polygon Amoy peer set.");
  }

  if (ethContractAddress !== "0x0000000000000000000000000000000000000000") {
    await deployedToken.setPeer(
      ethEndpointId,
      ethers.utils.zeroPadValue(ethers.utils.getAddress(ethContractAddress), 32)
    );
    console.log("Ethereum Sepolia peer set.");
  }

  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Verifying contract...");
    await verifyContract(deployedToken.address, args);
    console.log("Contract verified");
  }

  // Fund the contract with 0.001 ETH for cross-chain messaging fees
  console.log("Funding contract with 0.001 ETH for messaging fees...");
  const fundingAmount = ethers.utils.parseEther("0.001");

  const fundingTx = await signers[0].sendTransaction({
    to: deployedToken.address,
    value: fundingAmount,
  });

  await fundingTx.wait();
  console.log(
    `Contract funded with ${ethers.utils.formatEther(fundingAmount)} ETH`
  );
  console.log(`Funding transaction: ${fundingTx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
