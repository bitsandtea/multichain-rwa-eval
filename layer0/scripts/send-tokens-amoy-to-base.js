const { ethers } = require("hardhat");
const { amoy, base } = require("../constants");

async function main() {
  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address);

  // Contract addresses (you'll need to update these after deployment)
  const AMOY_TOKEN_ADDRESS = "0x..."; // Replace with deployed Amoy token address
  const BASE_TOKEN_ADDRESS = "0x..."; // Replace with deployed Base token address

  // Get the RWAToken contract on Amoy
  const RWAToken = await ethers.getContractFactory("RWAToken");
  const amoyToken = RWAToken.attach(AMOY_TOKEN_ADDRESS).connect(signer);

  // Amount to send (100 tokens with 18 decimals)
  const amountToSend = ethers.parseUnits("100", 18);
  console.log(
    `Sending ${ethers.formatUnits(amountToSend, 18)} tokens from Amoy to Base`
  );

  // Destination chain EID (Base Sepolia)
  const destinationEid = base.eid;

  // Recipient address (same address on destination chain)
  const recipient = signer.address;

  // Optional: You can include additional data (empty bytes for simple transfer)
  const options = "0x";

  // Optional: You can specify a refund address (use signer address)
  const refundAddress = signer.address;

  // Optional: You can specify a ZRO payment address (use zero address for native token payment)
  const zroPaymentAddress = ethers.ZeroAddress;

  try {
    // First, let's check the quote for the cross-chain transfer
    console.log("Getting quote for cross-chain transfer...");
    const quote = await amoyToken.quote(
      destinationEid,
      amountToSend,
      options,
      false
    );
    console.log("Messaging fee:", ethers.formatEther(quote.nativeFee), "ETH");
    console.log(
      "LZToken fee:",
      ethers.formatEther(quote.lzTokenFee),
      "LZToken"
    );

    // Check if user has enough tokens
    const balance = await amoyToken.balanceOf(signer.address);
    console.log(
      "Current balance on Amoy:",
      ethers.formatUnits(balance, 18),
      "tokens"
    );

    if (balance < amountToSend) {
      throw new Error("Insufficient token balance");
    }

    // Send tokens cross-chain
    console.log("Sending tokens...");
    const tx = await amoyToken.send(
      destinationEid,
      recipient,
      amountToSend,
      amountToSend, // minAmount (same as amount for exact transfer)
      options,
      refundAddress,
      zroPaymentAddress,
      { value: quote.nativeFee }
    );

    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Wait a bit for the cross-chain message to be processed
    console.log("Waiting for cross-chain message to be processed...");
    console.log(
      "This may take a few minutes. You can check the destination chain after the message is delivered."
    );
  } catch (error) {
    console.error("Error sending tokens:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
