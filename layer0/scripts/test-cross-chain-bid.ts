const { ethers } = require("hardhat");
import { base, ethSepolia } from "../constants";

async function main() {
  console.log("💰 Testing Cross-Chain Bid Updates...\n");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Create separate providers for each network
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

  // Check initial bid values
  console.log("📊 BEFORE BID:");
  const baseBidsBefore = await baseContract.getLastBidInfo();
  const ethBidsBefore = await ethContract.getLastBidInfo();

  console.log(
    `Base Sepolia Last Bid: ${ethers.utils.formatEther(baseBidsBefore[0])} ETH`
  );
  console.log(
    `Ethereum Sepolia Last Bid: ${ethers.utils.formatEther(
      ethBidsBefore[0]
    )} ETH`
  );
  console.log("");

  // Place bid on Ethereum Sepolia
  const bidAmount = ethers.utils.parseEther("0.001"); // 0.001 ETH bid
  console.log(
    `🚀 Placing bid of ${ethers.utils.formatEther(
      bidAmount
    )} ETH on Ethereum Sepolia...`
  );

  // Estimate fee for the bid
  const estimatedFee = await ethContract.estimateBidFee();
  console.log(
    `Estimated cross-chain fee: ${ethers.utils.formatEther(estimatedFee)} ETH`
  );

  // Check contract balance
  const contractBalance = await ethContract.getContractBalance();
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

  // Place the bid
  const bidTx = await ethContract.bid({
    value: bidAmount,
    gasLimit: 1_000_000,
  });
  console.log(`Bid transaction: ${bidTx.hash}`);
  await bidTx.wait();
  console.log("✅ Bid placed on Ethereum Sepolia\n");

  // Wait for cross-chain message propagation
  console.log("⏳ Waiting 2 minutes for cross-chain message propagation...");
  await new Promise((resolve) => setTimeout(resolve, 120000)); // 2 minutes

  // Check bid values after update
  console.log("📊 AFTER BID:");
  const baseBidsAfter = await baseContract.getLastBidInfo();
  const ethBidsAfter = await ethContract.getLastBidInfo();

  console.log(
    `Base Sepolia Last Bid: ${ethers.utils.formatEther(baseBidsAfter[0])} ETH`
  );
  console.log(
    `Ethereum Sepolia Last Bid: ${ethers.utils.formatEther(
      ethBidsAfter[0]
    )} ETH`
  );
  console.log("");

  // Verify the update worked
  if (ethBidsAfter[0].toString() === bidAmount.toString()) {
    console.log("✅ Ethereum Sepolia bid placed successfully");
  } else {
    console.log("❌ Ethereum Sepolia bid failed");
  }

  if (baseBidsAfter[0].toString() === bidAmount.toString()) {
    console.log("✅ Base Sepolia bid updated via LayerZero");
  } else {
    console.log(
      "❌ Base Sepolia bid not updated - LayerZero message may still be processing"
    );
    console.log("💡 Try running this script again in a few minutes");
  }

  console.log("\n🎉 Cross-chain bid test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
