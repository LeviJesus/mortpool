//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyNFT
 * @notice NFT representing real-world property ownership
 * @dev Each NFT represents a property that can be fractionalized for mortgage financing
 */
contract PropertyNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    struct Property {
        string propertyAddress;
        uint256 valueUSD; // Property value in USD (scaled by 1e18)
        uint256 totalShares; // Total fractional shares (e.g., 1000)
        string imageURI;
        string description;
        bool isListed; // Available for mortgage
        uint256 listedTimestamp;
    }
    
    // tokenId => Property details
    mapping(uint256 => Property) public properties;
    
    // Events
    event PropertyMinted(
        uint256 indexed tokenId,
        string propertyAddress,
        uint256 valueUSD,
        uint256 totalShares
    );
    
    event PropertyListed(uint256 indexed tokenId, uint256 timestamp);
    event PropertyUnlisted(uint256 indexed tokenId);
    
    constructor() ERC721("MortgageProperty", "MPROP") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }
    
    /**
     * @notice Mint a new property NFT
     * @param to Address to mint the NFT to (typically the MortgageManager contract)
     * @param propertyAddress Physical address of the property
     * @param valueUSD Property value in USD (scaled by 1e18)
     * @param totalShares Number of fractional shares for ownership tracking
     * @param imageURI IPFS or URL for property image
     * @param description Property description
     */
    function mintProperty(
        address to,
        string memory propertyAddress,
        uint256 valueUSD,
        uint256 totalShares,
        string memory imageURI,
        string memory description
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        
        properties[tokenId] = Property({
            propertyAddress: propertyAddress,
            valueUSD: valueUSD,
            totalShares: totalShares,
            imageURI: imageURI,
            description: description,
            isListed: false,
            listedTimestamp: 0
        });
        
        emit PropertyMinted(tokenId, propertyAddress, valueUSD, totalShares);
        
        return tokenId;
    }
    
    /**
     * @notice List property as available for mortgage
     */
    function listProperty(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Property does not exist");
        properties[tokenId].isListed = true;
        properties[tokenId].listedTimestamp = block.timestamp;
        emit PropertyListed(tokenId, block.timestamp);
    }
    
    /**
     * @notice Unlist property from mortgage availability
     */
    function unlistProperty(uint256 tokenId) external onlyOwner {
        properties[tokenId].isListed = false;
        emit PropertyUnlisted(tokenId);
    }
    
    /**
     * @notice Get property details
     */
    function getProperty(uint256 tokenId) external view returns (Property memory) {
        require(_ownerOf(tokenId) != address(0), "Property does not exist");
        return properties[tokenId];
    }
    
    /**
     * @notice Get total number of properties minted
     */
    function totalProperties() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @notice Override tokenURI to return property metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Property does not exist");
        return properties[tokenId].imageURI;
    }
}
