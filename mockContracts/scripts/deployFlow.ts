const { ethers } = require("hardhat");
const { verifyContract } = require("./verify/contract");
const chalk = require("chalk");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    chalk.cyan("Deploying contracts with the account:"),
    chalk.yellow(deployer.address)
  );

  const tokenDetails = [
    { name: "Wrapped Ether", symbol: "WETH" },
    { name: "FVIX", symbol: "FVIX" },
    { name: "Ankr Flow", symbol: "ankrFLOW" },
  ];

  const PUNCHSWAP_ROUTER_ADDRESS = "0xeD53235cC3E9d2d464E9c408B95948836648870B";
  const MINT_AMOUNT = ethers.parseUnits("1000000", 18); // 1 Million tokens

  const deployedTokens = [];

  for (const token of tokenDetails) {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const deployedToken = await MockERC20.deploy(token.name, token.symbol);
    await deployedToken.waitForDeployment();
    const tokenAddress = await deployedToken.getAddress();
    console.log(
      chalk.green(`${token.symbol} token deployed to:`),
      chalk.blue(tokenAddress)
    );

    await verifyContract(tokenAddress, [token.name, token.symbol]);

    // Mint tokens
    await deployedToken.mint(deployer.address, MINT_AMOUNT);
    console.log(
      chalk.magenta(
        `Minted ${ethers.formatUnits(MINT_AMOUNT, 18)} ${token.symbol} to ${
          deployer.address
        }`
      )
    );

    const router = await ethers.getContractAt(
      "IUniswapV2Router02",
      PUNCHSWAP_ROUTER_ADDRESS
    );

    // Approve router to spend tokens
    await deployedToken.approve(PUNCHSWAP_ROUTER_ADDRESS, MINT_AMOUNT);
    console.log(
      chalk.cyan(`Approved PunchSwap router to spend ${token.symbol}`)
    );

    // Add liquidity
    // For this example, we'll add half of the minted tokens and 0.1 native token
    const tokenAmount = ethers.parseUnits("1", 18);
    const nativeAmount = ethers.parseEther("0.001");

    await router.addLiquidityETH(
      tokenAddress,
      tokenAmount,
      0, // amountTokenMin
      0, // amountETHMin
      deployer.address,
      Math.floor(Date.now() / 1000) + 60 * 10, // 10-minute deadline
      { value: nativeAmount }
    );

    console.log(
      chalk.yellow(`Created liquidity pool for ${token.symbol} on PunchSwap`)
    );

    deployedTokens.push(deployedToken);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
