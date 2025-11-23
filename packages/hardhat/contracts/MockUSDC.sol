// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing and demo purposes
 * @dev Allows anyone to mint/burn for hackathon demo. Production would use real USDC via Circle API.
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        // Mint initial supply to deployer for seeding the pool
        _mint(msg.sender, 1000000 * 10**decimals()); // 1M USDC
    }

    /**
     * @notice Mint USDC tokens to any address
     * @dev Public function for demo/testing. Production would be restricted.
     * @param to Address to receive minted tokens
     * @param amount Amount to mint (in USDC, with 6 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Burn USDC tokens from caller
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice USDC uses 6 decimals instead of 18
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Convenience function to mint common amounts
     */
    function faucet() external {
        _mint(msg.sender, 10000 * 10**decimals()); // 10,000 USDC
    }
}
