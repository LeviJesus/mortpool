//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./PropertyNFT.sol";
import "./MortgagePool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MortgageManager
 * @notice Core contract managing mortgage lifecycle: applications, payments, defaults
 * @dev Coordinates between PropertyNFT and MortgagePool
 */
contract MortgageManager is Ownable, ReentrancyGuard {
    
    PropertyNFT public propertyNFT;
    MortgagePool public mortgagePool;
    
    // Mortgage terms
    struct Mortgage {
        uint256 propertyId;
        address borrower;
        uint256 propertyValue;
        uint256 downPayment;
        uint256 loanAmount;
        uint256 interestRateBPS; // Annual interest rate in basis points (500 = 5%)
        uint256 durationMonths;
        uint256 monthlyPayment;
        uint256 startTimestamp;
        uint256 lastPaymentTimestamp;
        uint256 totalPaid;
        uint256 ownershipSharesBPS; // Ownership in basis points (5000 = 50%)
        uint256 paymentsCount;
        MortgageStatus status;
    }
    
    enum MortgageStatus {
        None,
        Applied,
        Active,
        PaidOff,
        Defaulted,
        Foreclosed
    }
    
    // State
    mapping(uint256 => Mortgage) public mortgages; // propertyId => Mortgage
    mapping(address => uint256[]) public borrowerMortgages; // borrower => propertyIds
    uint256 public totalActiveMortgages;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_MONTH = 30 days;
    uint256 public constant LATE_FEE_BPS = 500; // 5% late fee
    uint256 public constant GRACE_PERIOD = 15 days;
    uint256 public constant DEFAULT_PERIOD = 90 days;
    
    // Default interest rate: 5% APR
    uint256 public defaultInterestRateBPS = 500;
    
    // Events
    event MortgageApplied(
        uint256 indexed propertyId,
        address indexed borrower,
        uint256 loanAmount,
        uint256 downPayment
    );
    
    event MortgageActivated(uint256 indexed propertyId, address indexed borrower);
    
    event PaymentReceived(
        uint256 indexed propertyId,
        address indexed borrower,
        uint256 amount,
        uint256 newOwnershipBPS
    );
    
    event MortgageCompleted(uint256 indexed propertyId, address indexed borrower);
    
    event MortgageDefaulted(uint256 indexed propertyId, address indexed borrower);
    
    event PropertyForeclosed(uint256 indexed propertyId, address indexed borrower);
    
    constructor(address _propertyNFT, address payable _mortgagePool) Ownable(msg.sender) {
        propertyNFT = PropertyNFT(_propertyNFT);
        mortgagePool = MortgagePool(_mortgagePool);
    }
    
    /**
     * @notice Apply for a mortgage on a listed property
     * @param propertyId The property NFT ID
     * @param durationMonths Loan duration (e.g., 360 months = 30 years)
     */
    function applyForMortgage(
        uint256 propertyId,
        uint256 durationMonths
    ) external payable nonReentrant {
        // Validate property
        PropertyNFT.Property memory property = propertyNFT.getProperty(propertyId);
        require(property.isListed, "Property not listed");
        require(mortgages[propertyId].status == MortgageStatus.None, "Property already mortgaged");
        
        // Validate down payment (minimum 10%)
        uint256 minDownPayment = (property.valueUSD * 1000) / BASIS_POINTS; // 10%
        require(msg.value >= minDownPayment, "Insufficient down payment (min 10%)");
        
        // Calculate loan terms
        uint256 loanAmount = property.valueUSD - msg.value;
        uint256 monthlyPayment = calculateMonthlyPayment(
            loanAmount,
            defaultInterestRateBPS,
            durationMonths
        );
        
        // Check pool has liquidity
        require(
            mortgagePool.availableLiquidity() >= loanAmount,
            "Insufficient pool liquidity"
        );
        
        // Initial ownership based on down payment
        uint256 initialOwnershipBPS = (msg.value * BASIS_POINTS) / property.valueUSD;
        
        // Create mortgage
        mortgages[propertyId] = Mortgage({
            propertyId: propertyId,
            borrower: msg.sender,
            propertyValue: property.valueUSD,
            downPayment: msg.value,
            loanAmount: loanAmount,
            interestRateBPS: defaultInterestRateBPS,
            durationMonths: durationMonths,
            monthlyPayment: monthlyPayment,
            startTimestamp: block.timestamp,
            lastPaymentTimestamp: block.timestamp,
            totalPaid: msg.value,
            ownershipSharesBPS: initialOwnershipBPS,
            paymentsCount: 0,
            status: MortgageStatus.Applied
        });
        
        borrowerMortgages[msg.sender].push(propertyId);
        
        emit MortgageApplied(propertyId, msg.sender, loanAmount, msg.value);
        
        // Auto-activate mortgage and fund
        _activateMortgage(propertyId);
    }
    
    /**
     * @notice Internal function to activate and fund mortgage
     */
    function _activateMortgage(uint256 propertyId) internal {
        Mortgage storage mortgage = mortgages[propertyId];
        require(mortgage.status == MortgageStatus.Applied, "Invalid status");
        
        // Update status
        mortgage.status = MortgageStatus.Active;
        totalActiveMortgages++;
        
        // Fund mortgage from pool (sends ETH to borrower)
        mortgagePool.fundMortgage(mortgage.borrower, mortgage.loanAmount);
        
        // Transfer property NFT to borrower (with mortgage lien)
        propertyNFT.transferFrom(address(this), mortgage.borrower, propertyId);
        
        // Unlist property
        propertyNFT.unlistProperty(propertyId);
        
        emit MortgageActivated(propertyId, mortgage.borrower);
    }
    
    /**
     * @notice Make a monthly mortgage payment
     * @param propertyId Property ID for the mortgage
     */
    function makePayment(uint256 propertyId) external payable nonReentrant {
        Mortgage storage mortgage = mortgages[propertyId];
        require(mortgage.status == MortgageStatus.Active, "Mortgage not active");
        require(msg.sender == mortgage.borrower, "Not the borrower");
        
        uint256 expectedPayment = mortgage.monthlyPayment;
        
        // Check if payment is late
        uint256 timeSinceLastPayment = block.timestamp - mortgage.lastPaymentTimestamp;
        if (timeSinceLastPayment > SECONDS_PER_MONTH + GRACE_PERIOD) {
            // Add late fee
            uint256 lateFee = (expectedPayment * LATE_FEE_BPS) / BASIS_POINTS;
            expectedPayment += lateFee;
        }
        
        require(msg.value >= expectedPayment, "Insufficient payment");
        
        // Calculate principal and interest portions
        uint256 remainingBalance = mortgage.loanAmount - (mortgage.totalPaid - mortgage.downPayment);
        uint256 monthlyInterestRate = mortgage.interestRateBPS / 12;
        uint256 interestPayment = (remainingBalance * monthlyInterestRate) / BASIS_POINTS;
        uint256 principalPayment = expectedPayment - interestPayment;
        
        // Update mortgage state
        mortgage.totalPaid += msg.value;
        mortgage.lastPaymentTimestamp = block.timestamp;
        mortgage.paymentsCount++;
        
        // Update ownership percentage
        mortgage.ownershipSharesBPS = (mortgage.totalPaid * BASIS_POINTS) / mortgage.propertyValue;
        if (mortgage.ownershipSharesBPS > BASIS_POINTS) {
            mortgage.ownershipSharesBPS = BASIS_POINTS;
        }
        
        // Send payment to pool
        mortgagePool.receiveMortgagePayment{value: msg.value}(principalPayment, interestPayment);
        
        emit PaymentReceived(propertyId, msg.sender, msg.value, mortgage.ownershipSharesBPS);
        
        // Check if mortgage is paid off
        if (mortgage.ownershipSharesBPS >= BASIS_POINTS || 
            mortgage.paymentsCount >= mortgage.durationMonths) {
            _completeMortgage(propertyId);
        }
    }
    
    /**
     * @notice Complete a fully paid mortgage
     */
    function _completeMortgage(uint256 propertyId) internal {
        Mortgage storage mortgage = mortgages[propertyId];
        
        mortgage.status = MortgageStatus.PaidOff;
        mortgage.ownershipSharesBPS = BASIS_POINTS; // 100% ownership
        totalActiveMortgages--;
        
        // Property NFT already belongs to borrower, now with full ownership
        
        emit MortgageCompleted(propertyId, mortgage.borrower);
    }
    
    /**
     * @notice Check for defaulted mortgages (callable by anyone)
     * @param propertyId Property to check
     */
    function checkDefault(uint256 propertyId) external {
        Mortgage storage mortgage = mortgages[propertyId];
        require(mortgage.status == MortgageStatus.Active, "Mortgage not active");
        
        uint256 timeSinceLastPayment = block.timestamp - mortgage.lastPaymentTimestamp;
        
        if (timeSinceLastPayment > DEFAULT_PERIOD) {
            _handleDefault(propertyId);
        }
    }
    
    /**
     * @notice Handle mortgage default
     */
    function _handleDefault(uint256 propertyId) internal {
        Mortgage storage mortgage = mortgages[propertyId];
        
        mortgage.status = MortgageStatus.Defaulted;
        totalActiveMortgages--;
        
        // Calculate remaining balance
        uint256 paidAmount = mortgage.totalPaid - mortgage.downPayment;
        uint256 remainingBalance = mortgage.loanAmount - paidAmount;
        
        // Use insurance pool to cover partial loss
        if (remainingBalance > 0) {
            uint256 insuranceCoverage = remainingBalance / 2; // Insurance covers 50%
            if (insuranceCoverage <= mortgagePool.insuranceReserve()) {
                mortgagePool.coverDefault(insuranceCoverage);
            }
        }
        
        emit MortgageDefaulted(propertyId, mortgage.borrower);
        
        // Initiate foreclosure
        _foreclose(propertyId);
    }
    
    /**
     * @notice Foreclose on defaulted property
     */
    function _foreclose(uint256 propertyId) internal {
        Mortgage storage mortgage = mortgages[propertyId];
        
        mortgage.status = MortgageStatus.Foreclosed;
        
        // Transfer property back to contract for resale
        propertyNFT.transferFrom(mortgage.borrower, address(this), propertyId);
        
        // Re-list property at discounted price
        propertyNFT.listProperty(propertyId);
        
        emit PropertyForeclosed(propertyId, mortgage.borrower);
    }
    
    /**
     * @notice Calculate monthly payment using amortization formula
     * @dev Simplified calculation for hackathon
     */
    function calculateMonthlyPayment(
        uint256 principal,
        uint256 annualRateBPS,
        uint256 months
    ) public pure returns (uint256) {
        if (months == 0) return 0;
        
        // Monthly interest rate in basis points
        uint256 monthlyRateBPS = annualRateBPS / 12;
        
        // Simplified amortization: P * r * (1+r)^n / ((1+r)^n - 1)
        // For demo, using simplified calculation
        uint256 totalInterest = (principal * annualRateBPS * months) / (BASIS_POINTS * 12);
        uint256 totalPayment = principal + totalInterest;
        
        return totalPayment / months;
    }
    
    /**
     * @notice Get mortgage details
     */
    function getMortgage(uint256 propertyId) external view returns (Mortgage memory) {
        return mortgages[propertyId];
    }
    
    /**
     * @notice Get borrower's ownership percentage
     */
    function getOwnershipPercentage(uint256 propertyId) external view returns (uint256) {
        return mortgages[propertyId].ownershipSharesBPS / 100; // Return as percentage (0-100)
    }
    
    /**
     * @notice Get all mortgages for a borrower
     */
    function getBorrowerMortgages(address borrower) external view returns (uint256[] memory) {
        return borrowerMortgages[borrower];
    }
    
    /**
     * @notice Check if payment is overdue
     */
    function isPaymentOverdue(uint256 propertyId) external view returns (bool) {
        Mortgage memory mortgage = mortgages[propertyId];
        if (mortgage.status != MortgageStatus.Active) return false;
        
        uint256 timeSinceLastPayment = block.timestamp - mortgage.lastPaymentTimestamp;
        return timeSinceLastPayment > SECONDS_PER_MONTH;
    }
    
    /**
     * @notice Set default interest rate (owner only)
     */
    function setDefaultInterestRate(uint256 rateBPS) external onlyOwner {
        require(rateBPS <= 2000, "Rate too high (max 20%)");
        defaultInterestRateBPS = rateBPS;
    }
    
    // Receive function to accept property NFTs
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
