// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MockNFT
 * @dev Example ERC721 contract with minting, royalties, and marketplace integration
 */
contract MockNFT is ERC721, ERC721URIStorage, ERC721Burnable, Ownable, Pausable, IERC2981, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    
    // Royalty info
    struct RoyaltyInfo {
        address recipient;
        uint96 royaltyFraction; // In basis points (1% = 100)
    }
    
    // Default royalty info
    RoyaltyInfo private _defaultRoyaltyInfo;
    
    // Token-specific royalty info
    mapping(uint256 => RoyaltyInfo) private _tokenRoyaltyInfo;
    
    // Minting settings
    uint256 public maxSupply = 10000;
    uint256 public mintPrice = 0.01 ether;
    uint256 public maxMintPerTx = 10;
    bool public publicMintEnabled = true;
    
    // Marketplace whitelist
    mapping(address => bool) public whitelistedMarketplaces;
    
    // Events
    event DefaultRoyaltySet(address indexed recipient, uint96 royaltyFraction);
    event TokenRoyaltySet(uint256 indexed tokenId, address indexed recipient, uint96 royaltyFraction);
    event MarketplaceWhitelisted(address indexed marketplace, bool whitelisted);
    event MintPriceUpdated(uint256 newPrice);
    event MaxSupplyUpdated(uint256 newMaxSupply);

    constructor(
        string memory name,
        string memory symbol,
        address defaultRoyaltyRecipient,
        uint96 defaultRoyaltyFraction
    ) ERC721(name, symbol) {
        _setDefaultRoyalty(defaultRoyaltyRecipient, defaultRoyaltyFraction);
        
        // Start token IDs at 1
        _tokenIdCounter.increment();
    }

    /**
     * @dev Public minting function
     */
    function mint(address to, string memory uri) public payable nonReentrant whenNotPaused {
        require(publicMintEnabled, "Public minting is disabled");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIdCounter.current() <= maxSupply, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Refund excess payment
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
    }

    /**
     * @dev Batch minting function
     */
    function batchMint(
        address to, 
        string[] memory uris
    ) public payable nonReentrant whenNotPaused {
        require(publicMintEnabled, "Public minting is disabled");
        require(uris.length > 0 && uris.length <= maxMintPerTx, "Invalid batch size");
        require(msg.value >= mintPrice * uris.length, "Insufficient payment");
        require(_tokenIdCounter.current() + uris.length - 1 <= maxSupply, "Max supply exceeded");
        
        uint256 totalCost = mintPrice * uris.length;
        
        for (uint256 i = 0; i < uris.length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uris[i]);
        }
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }

    /**
     * @dev Owner mint function (free)
     */
    function ownerMint(address to, string memory uri) public onlyOwner {
        require(_tokenIdCounter.current() <= maxSupply, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /**
     * @dev Batch owner mint function
     */
    function ownerBatchMint(
        address[] memory recipients,
        string[] memory uris
    ) public onlyOwner {
        require(recipients.length == uris.length, "Array length mismatch");
        require(_tokenIdCounter.current() + recipients.length - 1 <= maxSupply, "Max supply exceeded");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, uris[i]);
        }
    }

    /**
     * @dev Set default royalty for all tokens
     */
    function setDefaultRoyalty(address recipient, uint96 royaltyFraction) public onlyOwner {
        _setDefaultRoyalty(recipient, royaltyFraction);
    }

    /**
     * @dev Set royalty for specific token
     */
    function setTokenRoyalty(uint256 tokenId, address recipient, uint96 royaltyFraction) public {
        require(_exists(tokenId), "Token does not exist");
        require(
            msg.sender == owner() || msg.sender == ownerOf(tokenId),
            "Not authorized to set royalty"
        );
        _setTokenRoyalty(tokenId, recipient, royaltyFraction);
    }

    /**
     * @dev Internal function to set default royalty
     */
    function _setDefaultRoyalty(address recipient, uint96 royaltyFraction) internal {
        require(royaltyFraction <= 1000, "Royalty too high"); // Max 10%
        require(recipient != address(0), "Invalid recipient");
        
        _defaultRoyaltyInfo = RoyaltyInfo(recipient, royaltyFraction);
        emit DefaultRoyaltySet(recipient, royaltyFraction);
    }

    /**
     * @dev Internal function to set token royalty
     */
    function _setTokenRoyalty(uint256 tokenId, address recipient, uint96 royaltyFraction) internal {
        require(royaltyFraction <= 1000, "Royalty too high"); // Max 10%
        require(recipient != address(0), "Invalid recipient");
        
        _tokenRoyaltyInfo[tokenId] = RoyaltyInfo(recipient, royaltyFraction);
        emit TokenRoyaltySet(tokenId, recipient, royaltyFraction);
    }

    /**
     * @dev Get royalty info for a token (EIP-2981)
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice) public view override returns (address, uint256) {
        RoyaltyInfo memory royalty = _tokenRoyaltyInfo[tokenId];
        
        if (royalty.recipient == address(0)) {
            royalty = _defaultRoyaltyInfo;
        }
        
        uint256 royaltyAmount = (salePrice * royalty.royaltyFraction) / 10000;
        return (royalty.recipient, royaltyAmount);
    }

    /**
     * @dev Whitelist marketplace for easier approvals
     */
    function setMarketplaceWhitelist(address marketplace, bool whitelisted) public onlyOwner {
        whitelistedMarketplaces[marketplace] = whitelisted;
        emit MarketplaceWhitelisted(marketplace, whitelisted);
    }

    /**
     * @dev Override approval to allow whitelisted marketplaces
     */
    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        // Allow whitelisted marketplaces
        if (whitelistedMarketplaces[operator]) {
            return true;
        }
        return super.isApprovedForAll(owner, operator);
    }

    /**
     * @dev Set mint price
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    /**
     * @dev Set max supply
     */
    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(newMaxSupply >= _tokenIdCounter.current() - 1, "Cannot reduce below current supply");
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    /**
     * @dev Set max mint per transaction
     */
    function setMaxMintPerTx(uint256 newMaxMintPerTx) public onlyOwner {
        maxMintPerTx = newMaxMintPerTx;
    }

    /**
     * @dev Toggle public minting
     */
    function setPublicMintEnabled(bool enabled) public onlyOwner {
        publicMintEnabled = enabled;
    }

    /**
     * @dev Get total supply
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }

    /**
     * @dev Get tokens owned by address
     */
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokens = new uint256[](tokenCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i < _tokenIdCounter.current(); i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                tokens[index] = i;
                index++;
            }
        }
        
        return tokens;
    }

    /**
     * @dev Get token info
     */
    function getTokenInfo(uint256 tokenId) public view returns (
        address owner,
        string memory uri,
        address royaltyRecipient,
        uint256 royaltyAmount
    ) {
        require(_exists(tokenId), "Token does not exist");
        
        owner = ownerOf(tokenId);
        uri = tokenURI(tokenId);
        (royaltyRecipient, royaltyAmount) = royaltyInfo(tokenId, 10000); // Royalty for 1 ETH
    }

    /**
     * @dev Withdraw contract balance
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Emergency withdraw
     */
    function emergencyWithdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Pause contract
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        // Reset royalty info for burned token
        delete _tokenRoyaltyInfo[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Hook that is called before any token transfer
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
