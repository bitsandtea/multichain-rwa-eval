const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const CONTRACT_ADDRESS = "0xe2cA39d90e0094E5910dA006c168a785B3aEa02C";
  const FUND_AMOUNT = ethers.utils.parseEther("0.001");

  console.log("Funding contract for cross-chain messaging...");
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log("Amount to send:", ethers.utils.formatEther(FUND_AMOUNT), "ETH");
  console.log("From address:", deployer.address);

  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("Deployer balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.lt(FUND_AMOUNT)) {
    console.log("❌ Insufficient balance");
    return;
  }

  // Send ETH to the contract
  const tx = await deployer.sendTransaction({
    to: CONTRACT_ADDRESS,
    value: FUND_AMOUNT,
    gasLimit: 21000,
  });

  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);

  // Check contract balance
  const contractBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  console.log(
    "Contract balance:",
    ethers.utils.formatEther(contractBalance),
    "ETH"
  );

  console.log("✅ Contract funded successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
