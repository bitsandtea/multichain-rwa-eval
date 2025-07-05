const { ethers } = require("hardhat");
import { base, ethSepolia } from "../constants";

async function main() {
  console.log("🔍 Testing Cross-Chain Risk Score Updates...\n");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Create separate providers for each network using Infura endpoints
  const baseProvider = new ethers.providers.JsonRpcProvider(
    `https://base-sepolia.infura.io/v3/${process.env.INFURA_KEY}`
  );
  const ethSepoliaProvider = new ethers.providers.JsonRpcProvider(
    `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`
  );

  // Create signers for each network
  const baseSigner = new ethers.Wallet(process.env.PRIVATE_KEY!, baseProvider);
  const ethSepoliaSigner = new ethers.Wallet(
    process.env.PRIVATE_KEY!,
    ethSepoliaProvider
  );

  // Get contract instances on separate networks
  const baseContract = await ethers.getContractAt(
    "RWAToken",
    base.rwaToken,
    baseSigner
  );
  const ethContract = await ethers.getContractAt(
    "RWAToken",
    ethSepolia.rwaToken,
    ethSepoliaSigner
  );

  // Check initial risk scores
  console.log("📊 BEFORE UPDATE:");
  const baseDataBefore = await baseContract.getRWAData();
  const ethDataBefore = await ethContract.getRWAData();

  console.log(`Base Sepolia Risk Score: ${baseDataBefore.riskScore}`);
  console.log(`Ethereum Sepolia Risk Score: ${ethDataBefore.riskScore}`);
  console.log("");

  // Update risk score on Base Sepolia (only Base can initiate updates)
  const newRiskScore = 85;
  console.log(`🚀 Updating risk score to ${newRiskScore} on Base Sepolia...`);

  // Estimate fee for the update
  const estimatedFee = await baseContract.estimateUpdateFee();
  console.log(`Estimated fee: ${ethers.utils.formatEther(estimatedFee)} ETH`);

  // Check contract balance
  const contractBalance = await baseContract.getContractBalance();
  console.log(
    `Contract balance: ${ethers.utils.formatEther(contractBalance)} ETH`
  );

  if (contractBalance.lt(estimatedFee)) {
    console.log("⚠️  Contract needs funding for cross-chain messaging");
    console.log(
      "Please fund the contract first using the fund-contract.js script"
    );
    return;
  }

  // Update risk score
  const updateTx = await baseContract.updateRiskScore(newRiskScore);
  console.log(`Update transaction: ${updateTx.hash}`);
  await updateTx.wait();
  console.log("✅ Risk score updated on Base Sepolia\n");

  // Wait for cross-chain message propagation
  console.log("⏳ Waiting 30 seconds for cross-chain message propagation...");
  await new Promise((resolve) => setTimeout(resolve, 30000));

  // Check risk scores after update
  console.log("📊 AFTER UPDATE:");
  const baseDataAfter = await baseContract.getRWAData();
  const ethDataAfter = await ethContract.getRWAData();

  console.log(`Base Sepolia Risk Score: ${baseDataAfter.riskScore}`);
  console.log(`Ethereum Sepolia Risk Score: ${ethDataAfter.riskScore}`);
  console.log("");

  // Verify the update worked
  if (baseDataAfter.riskScore.toString() === newRiskScore.toString()) {
    console.log("✅ Base Sepolia risk score updated successfully");
  } else {
    console.log("❌ Base Sepolia risk score update failed");
  }

  if (ethDataAfter.riskScore.toString() === newRiskScore.toString()) {
    console.log("✅ Ethereum Sepolia risk score updated via LayerZero");
  } else {
    console.log(
      "❌ Ethereum Sepolia risk score not updated - LayerZero message may still be processing"
    );
    console.log("💡 Try running this script again in a few minutes");
  }

  console.log("\n🎉 Cross-chain risk score test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
