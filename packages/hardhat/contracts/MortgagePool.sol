//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MortgagePool
 * @notice Liquidity pool where providers deposit funds to finance mortgages
 * @dev Simplified version using ETH instead of stablecoins for hackathon demo
 */
contract MortgagePool is Ownable, ReentrancyGuard {
    
    // Pool state
    uint256 public totalLiquidity; // Total ETH in pool
    uint256 public totalShares; // Total LP shares issued
    uint256 public insuranceReserve; // 2% of deposits for insurance
    uint256 public activeMortgages; // Total ETH locked in active mortgages
    uint256 public totalInterestEarned; // Cumulative interest earned
    
    // LP tracking
    mapping(address => uint256) public lpShares; // LP address => shares
    mapping(address => uint256) public lpDepositTimestamp; // For calculating yield
    
    // Constants
    uint256 public constant INSURANCE_RATE = 200; // 2% in basis points (200/10000)
    uint256 public constant BASIS_POINTS = 10000;
    
    // Authorized contracts (MortgageManager can borrow from pool)
    mapping(address => bool) public authorizedBorrowers;
    
    // Events
    event LiquidityDeposited(address indexed provider, uint256 amount, uint256 shares);
    event LiquidityWithdrawn(address indexed provider, uint256 amount, uint256 shares);
    event MortgageFunded(address indexed borrower, uint256 amount);
    event MortgageRepayment(uint256 principal, uint256 interest);
    event InsurancePayout(address indexed borrower, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Deposit ETH to become a liquidity provider
     * @dev Receives ETH and mints proportional shares
     */
    function depositLiquidity() external payable nonReentrant {
        require(msg.value > 0, "Must deposit ETH");
        
        uint256 shares;
        if (totalShares == 0) {
            // First deposit: 1:1 ratio
            shares = msg.value;
        } else {
            // Subsequent deposits: proportional to pool size
            // shares = (deposit * totalShares) / totalLiquidity
            shares = (msg.value * totalShares) / totalLiquidity;
        }
        
        // Calculate insurance reserve (2% of deposit)
        uint256 insuranceAmount = (msg.value * INSURANCE_RATE) / BASIS_POINTS;
        insuranceReserve += insuranceAmount;
        
        // Update state
        lpShares[msg.sender] += shares;
        totalShares += shares;
        totalLiquidity += msg.value;
        lpDepositTimestamp[msg.sender] = block.timestamp;
        
        emit LiquidityDeposited(msg.sender, msg.value, shares);
    }
    
    /**
     * @notice Withdraw liquidity from the pool
     * @param shares Number of shares to redeem
     */
    function withdrawLiquidity(uint256 shares) external nonReentrant {
        require(lpShares[msg.sender] >= shares, "Insufficient shares");
        require(shares > 0, "Must withdraw > 0 shares");
        
        // Calculate ETH amount: (shares * totalLiquidity) / totalShares
        uint256 ethAmount = (shares * totalLiquidity) / totalShares;
        
        // Ensure pool has enough liquid ETH (not locked in mortgages)
        uint256 available = totalLiquidity - activeMortgages;
        require(ethAmount <= available, "Insufficient liquidity (funds locked in mortgages)");
        
        // Update state
        lpShares[msg.sender] -= shares;
        totalShares -= shares;
        totalLiquidity -= ethAmount;
        
        // Transfer ETH
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        emit LiquidityWithdrawn(msg.sender, ethAmount, shares);
    }
    
    /**
     * @notice Fund a mortgage (only callable by authorized MortgageManager)
     * @param borrower Address receiving the funds
     * @param amount ETH amount to lend
     */
    function fundMortgage(address borrower, uint256 amount) external nonReentrant {
        require(authorizedBorrowers[msg.sender], "Not authorized");
        require(amount <= totalLiquidity - activeMortgages, "Insufficient liquidity");
        
        activeMortgages += amount;
        
        (bool success, ) = borrower.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit MortgageFunded(borrower, amount);
    }
    
    /**
     * @notice Process mortgage payment (principal + interest)
     * @param principal Principal portion of payment
     * @param interest Interest portion of payment
     */
    function receiveMortgagePayment(uint256 principal, uint256 interest) external payable nonReentrant {
        require(authorizedBorrowers[msg.sender], "Not authorized");
        require(msg.value == principal + interest, "Payment amount mismatch");
        
        // Principal reduces active mortgages
        activeMortgages -= principal;
        
        // Interest increases pool value for LPs
        totalLiquidity += msg.value;
        totalInterestEarned += interest;
        
        emit MortgageRepayment(principal, interest);
    }
    
    /**
     * @notice Use insurance reserve to cover defaulted mortgage
     * @param amount Amount to cover from insurance
     */
    function coverDefault(uint256 amount) external nonReentrant {
        require(authorizedBorrowers[msg.sender], "Not authorized");
        require(amount <= insuranceReserve, "Insufficient insurance reserve");
        
        insuranceReserve -= amount;
        activeMortgages -= amount; // Reduce active mortgages
        
        emit InsurancePayout(msg.sender, amount);
    }
    
    /**
     * @notice Get LP share value in ETH
     * @param provider LP address
     */
    function getShareValue(address provider) external view returns (uint256) {
        if (lpShares[provider] == 0 || totalShares == 0) return 0;
        return (lpShares[provider] * totalLiquidity) / totalShares;
    }
    
    /**
     * @notice Calculate estimated APY for LPs
     * @dev Simplified calculation for demo
     */
    function estimatedAPY() external view returns (uint256) {
        if (totalLiquidity == 0) return 0;
        // Return basis points (e.g., 350 = 3.5%)
        // This would be calculated from historical interest in production
        return 350; // 3.5% APY
    }
    
    /**
     * @notice Authorize a contract to borrow from pool (only owner)
     * @param borrower Address to authorize (typically MortgageManager)
     */
    function authorizeBorrower(address borrower) external onlyOwner {
        authorizedBorrowers[borrower] = true;
    }
    
    /**
     * @notice Revoke borrowing authorization
     */
    function revokeBorrower(address borrower) external onlyOwner {
        authorizedBorrowers[borrower] = false;
    }
    
    /**
     * @notice Get available liquidity for new mortgages
     */
    function availableLiquidity() external view returns (uint256) {
        return totalLiquidity - activeMortgages;
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}
