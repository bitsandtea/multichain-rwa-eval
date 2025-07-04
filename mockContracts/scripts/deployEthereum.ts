import { verifyContract } from "./verify/contract";
const { ethers } = require("hardhat");
const chalk = require("chalk");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    chalk.cyan("Deploying contracts with the account:"),
    chalk.yellow(deployer.address)
  );

  const tokenDetails = [
    { name: "ChainLink", symbol: "LINK" },
    { name: "Uniswap", symbol: "UNI" },
    { name: "Aave", symbol: "AAVE" },
  ];

  const UNISWAP_V2_ROUTER_ADDRESS =
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const MINT_AMOUNT = ethers.parseUnits("1000000", 18); // 1 Million tokens

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
      UNISWAP_V2_ROUTER_ADDRESS
    );

    await deployedToken.approve(UNISWAP_V2_ROUTER_ADDRESS, MINT_AMOUNT);
    console.log(
      chalk.cyan(`Approved Uniswap V2 router to spend ${token.symbol}`)
    );

    const tokenAmount = ethers.parseUnits("1", 18);
    const ethAmount = ethers.parseEther("0.001");

    await router.addLiquidityETH(
      tokenAddress,
      tokenAmount,
      0,
      0,
      deployer.address,
      Math.floor(Date.now() / 1000) + 60 * 10,
      { value: ethAmount }
    );

    console.log(
      chalk.yellow(`Created liquidity pool for ${token.symbol} on Uniswap V2`)
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
