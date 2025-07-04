async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    chalk.cyan("Performing swaps with account:"),
    chalk.yellow(deployer.address)
  );

  // Router and token addresses from deployment
  const UNISWAP_V2_ROUTER_ADDRESS =
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  // Token addresses from README.md
  const LINK_ADDRESS = "0x91d7730e698cAe7514f319873a14061C8a5eF655";
  const UNI_ADDRESS = "0xd5502a94A7F87AA364053b6f3f842E609B5ea9Ed";
  const AAVE_ADDRESS = "0xE0B37A5c467acBDD113B543b6e154D77FC6092d";

  // Get router contract
  const router = await ethers.getContractAt(
    "IUniswapV2Router02",
    UNISWAP_V2_ROUTER_ADDRESS
  );

  // Get token contracts
  const linkToken = await ethers.getContractAt("MockERC20", LINK_ADDRESS);
  const uniToken = await ethers.getContractAt("MockERC20", UNI_ADDRESS);

  // Example 1: Swap LINK for UNI
  console.log(chalk.blue("\n=== Swapping LINK for UNI ==="));

  const swapAmount = ethers.parseUnits("100", 18); // 100 LINK
  const minAmountOut = ethers.parseUnits("50", 18); // Minimum 50 UNI expected

  // Path: LINK -> WETH -> UNI
  const path = [LINK_ADDRESS, await router.WETH(), UNI_ADDRESS];

  // Approve router to spend LINK
  await linkToken.approve(UNISWAP_V2_ROUTER_ADDRESS, swapAmount);
  console.log(chalk.cyan("Approved router to spend LINK"));

  // Get expected output amount
  const amounts = await router.getAmountsOut(swapAmount, path);
  console.log(
    chalk.yellow(`Expected UNI output: ${ethers.formatUnits(amounts[2], 18)}`)
  );

  // Perform the swap
  const tx = await router.swapExactTokensForTokens(
    swapAmount,
    minAmountOut,
    path,
    deployer.address,
    Math.floor(Date.now() / 1000) + 60 * 20, // 20 minute deadline
    { gasLimit: 300000 }
  );

  await tx.wait();
  console.log(chalk.green("Swap completed!"));

  // Check balances
  const linkBalance = await linkToken.balanceOf(deployer.address);
  const uniBalance = await uniToken.balanceOf(deployer.address);
  console.log(
    chalk.magenta(`LINK balance: ${ethers.formatUnits(linkBalance, 18)}`)
  );
  console.log(
    chalk.magenta(`UNI balance: ${ethers.formatUnits(uniBalance, 18)}`)
  );

  // Example 2: Swap ETH for AAVE
  console.log(chalk.blue("\n=== Swapping ETH for AAVE ==="));

  const ethAmount = ethers.parseEther("0.01"); // 0.01 ETH
  const minAaveOut = ethers.parseUnits("10", 18); // Minimum 10 AAVE expected

  // Path: WETH -> AAVE
  const ethToAavePath = [await router.WETH(), AAVE_ADDRESS];

  // Get expected output
  const ethAmounts = await router.getAmountsOut(ethAmount, ethToAavePath);
  console.log(
    chalk.yellow(
      `Expected AAVE output: ${ethers.formatUnits(ethAmounts[1], 18)}`
    )
  );

  // Perform ETH to token swap
  const ethTx = await router.swapExactETHForTokens(
    minAaveOut,
    ethToAavePath,
    deployer.address,
    Math.floor(Date.now() / 1000) + 60 * 20,
    { value: ethAmount, gasLimit: 300000 }
  );

  await ethTx.wait();
  console.log(chalk.green("ETH to AAVE swap completed!"));

  // Check AAVE balance
  const aaveToken = await ethers.getContractAt("MockERC20", AAVE_ADDRESS);
  const aaveBalance = await aaveToken.balanceOf(deployer.address);
  console.log(
    chalk.magenta(`AAVE balance: ${ethers.formatUnits(aaveBalance, 18)}`)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
