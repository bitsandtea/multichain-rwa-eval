// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IUniswapV2Router02.sol";
import "./mockERC20.sol";

contract SwapExample {
    IUniswapV2Router02 public immutable router;
    
    constructor(address _router) {
        router = IUniswapV2Router02(_router);
    }
    
    /**
     * @dev Swap exact amount of token A for token B
     * @param tokenA Address of token to swap from
     * @param tokenB Address of token to swap to
     * @param amountIn Amount of token A to swap
     * @param amountOutMin Minimum amount of token B to receive
     * @param deadline Transaction deadline
     */
    function swapExactTokensForTokens(
        address tokenA,
        address tokenB,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // Create path: tokenA -> WETH -> tokenB
        address[] memory path = new address[](3);
        path[0] = tokenA;
        path[1] = router.WETH();
        path[2] = tokenB;
        
        // Transfer tokens from user to this contract
        MockERC20(tokenA).transferFrom(msg.sender, address(this), amountIn);
        
        // Approve router to spend tokens
        MockERC20(tokenA).approve(address(router), amountIn);
        
        // Perform the swap
        amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender, // Send tokens directly to user
            deadline
        );
    }
    
    /**
     * @dev Swap exact amount of ETH for tokens
     * @param token Address of token to receive
     * @param amountOutMin Minimum amount of tokens to receive
     * @param deadline Transaction deadline
     */
    function swapExactETHForTokens(
        address token,
        uint256 amountOutMin,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        // Create path: WETH -> token
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = token;
        
        // Perform the swap
        amounts = router.swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            msg.sender,
            deadline
        );
    }
    
    /**
     * @dev Swap exact amount of tokens for ETH
     * @param token Address of token to swap
     * @param amountIn Amount of tokens to swap
     * @param amountOutMin Minimum amount of ETH to receive
     * @param deadline Transaction deadline
     */
    function swapExactTokensForETH(
        address token,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // Create path: token -> WETH
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = router.WETH();
        
        // Transfer tokens from user to this contract
        MockERC20(token).transferFrom(msg.sender, address(this), amountIn);
        
        // Approve router to spend tokens
        MockERC20(token).approve(address(router), amountIn);
        
        // Perform the swap
        amounts = router.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            deadline
        );
    }
    
    /**
     * @dev Get expected output amount for a swap
     * @param amountIn Amount of input tokens
     * @param path Array of token addresses representing the swap path
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] memory path
    ) external view returns (uint256[] memory amounts) {
        return router.getAmountsOut(amountIn, path);
    }
    
    /**
     * @dev Emergency function to withdraw stuck tokens
     */
    function emergencyWithdraw(address token) external {
        uint256 balance = MockERC20(token).balanceOf(address(this));
        if (balance > 0) {
            MockERC20(token).transfer(msg.sender, balance);
        }
    }
    
    /**
     * @dev Emergency function to withdraw stuck ETH
     */
    function emergencyWithdrawETH() external {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(msg.sender).transfer(balance);
        }
    }
} 