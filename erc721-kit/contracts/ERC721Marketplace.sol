// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./RoyaltyEngine.sol";

/**
 * @title ERC721Marketplace
 * @dev Decentralized marketplace for ERC721 tokens with royalty support
 */
contract ERC721Marketplace is IERC721Receiver, ReentrancyGuard, Ownable, Pausable {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        uint256 createdAt;
        uint256 expiresAt;
        bool active;
    }

    struct Offer {
        address buyer;
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        uint256 createdAt;
        uint256 expiresAt;
        bool active;
    }

    // State variables
    mapping(bytes32 => Listing) public listings;
    mapping(bytes32 => Offer) public offers;
    mapping(address => mapping(uint256 => bytes32)) public tokenToListingId;
    mapping(address => bytes32[]) public userListings;
    mapping(address => bytes32[]) public userOffers;
    mapping(address => bool) public whitelistedContracts;
    
    RoyaltyEngine public royaltyEngine;
    
    uint256 public marketplaceFeePercentage = 250; // 2.5%
    uint256 public constant MAX_FEE_PERCENTAGE = 1000; // 10%
    address public feeRecipient;
    
    uint256 public totalListings;
    uint256 public totalSales;
    uint256 public totalVolume;

    // Events
    event ItemListed(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );
    
    event ItemSold(
        bytes32 indexed listingId,
        address indexed buyer,
        address indexed seller,
        address nftContract,
        uint256 tokenId,
        uint256 price
    );
    
    event ListingCancelled(bytes32 indexed listingId);
    event ListingUpdated(bytes32 indexed listingId, uint256 newPrice);
    
    event OfferCreated(
        bytes32 indexed offerId,
        address indexed buyer,
        address indexed nftContract,
        uint256 tokenId,
        uint256 amount
    );
    
    event OfferAccepted(
        bytes32 indexed offerId,
        address indexed seller,
        address indexed buyer,
        uint256 amount
    );
    
    event OfferCancelled(bytes32 indexed offerId);

    constructor(address _feeRecipient, address _royaltyEngine) {
        feeRecipient = _feeRecipient;
        royaltyEngine = RoyaltyEngine(_royaltyEngine);
    }

    modifier onlyWhitelistedContract(address nftContract) {
        require(whitelistedContracts[nftContract], "Contract not whitelisted");
        _;
    }

    modifier validListing(bytes32 listingId) {
        require(listings[listingId].active, "Listing not active");
        require(listings[listingId].expiresAt > block.timestamp, "Listing expired");
        _;
    }

    modifier validOffer(bytes32 offerId) {
        require(offers[offerId].active, "Offer not active");
        require(offers[offerId].expiresAt > block.timestamp, "Offer expired");
        _;
    }

    /**
     * @dev List an NFT for sale
     */
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 duration
    ) external nonReentrant whenNotPaused onlyWhitelistedContract(nftContract) {
        require(price > 0, "Price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || 
            nft.getApproved(tokenId) == address(this),
            "Contract not approved"
        );

        bytes32 listingId = keccak256(abi.encodePacked(nftContract, tokenId, block.timestamp));
        require(!listings[listingId].active, "Already listed");

        // Cancel existing listing if any
        bytes32 existingListingId = tokenToListingId[nftContract][tokenId];
        if (existingListingId != 0 && listings[existingListingId].active) {
            _cancelListing(existingListingId);
        }

        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration,
            active: true
        });

        tokenToListingId[nftContract][tokenId] = listingId;
        userListings[msg.sender].push(listingId);
        totalListings++;

        emit ItemListed(listingId, msg.sender, nftContract, tokenId, price);
    }

    /**
     * @dev Buy a listed NFT
     */
    function buyItem(bytes32 listingId) external payable nonReentrant whenNotPaused validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own item");

        // Verify seller still owns the NFT
        IERC721 nft = IERC721(listing.nftContract);
        require(nft.ownerOf(listing.tokenId) == listing.seller, "Seller no longer owns NFT");

        listing.active = false;
        delete tokenToListingId[listing.nftContract][listing.tokenId];

        // Calculate fees and royalties
        (address royaltyRecipient, uint256 royaltyAmount) = royaltyEngine.getRoyalty(
            listing.nftContract,
            listing.tokenId,
            listing.price
        );

        uint256 marketplaceFee = (listing.price * marketplaceFeePercentage) / 10000;
        uint256 sellerAmount = listing.price - marketplaceFee - royaltyAmount;

        // Transfer NFT to buyer
        nft.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);

        // Transfer payments
        payable(listing.seller).transfer(sellerAmount);
        if (marketplaceFee > 0) {
            payable(feeRecipient).transfer(marketplaceFee);
        }
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            payable(royaltyRecipient).transfer(royaltyAmount);
        }

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        totalSales++;
        totalVolume += listing.price;

        emit ItemSold(listingId, msg.sender, listing.seller, listing.nftContract, listing.tokenId, listing.price);
    }

    /**
     * @dev Cancel a listing
     */
    function cancelListing(bytes32 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender || msg.sender == owner(), "Not authorized");
        require(listing.active, "Listing not active");
        
        _cancelListing(listingId);
    }

    function _cancelListing(bytes32 listingId) internal {
        Listing storage listing = listings[listingId];
        listing.active = false;
        delete tokenToListingId[listing.nftContract][listing.tokenId];
        
        emit ListingCancelled(listingId);
    }

    /**
     * @dev Update listing price
     */
    function updateListing(bytes32 listingId, uint256 newPrice) external validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not listing owner");
        require(newPrice > 0, "Price must be greater than 0");
        
        listing.price = newPrice;
        emit ListingUpdated(listingId, newPrice);
    }

    /**
     * @dev Create an offer for an NFT
     */
    function createOffer(
        address nftContract,
        uint256 tokenId,
        uint256 duration
    ) external payable nonReentrant whenNotPaused onlyWhitelistedContract(nftContract) {
        require(msg.value > 0, "Offer must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        bytes32 offerId = keccak256(abi.encodePacked(msg.sender, nftContract, tokenId, block.timestamp));
        
        offers[offerId] = Offer({
            buyer: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: msg.value,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration,
            active: true
        });

        userOffers[msg.sender].push(offerId);

        emit OfferCreated(offerId, msg.sender, nftContract, tokenId, msg.value);
    }

    /**
     * @dev Accept an offer
     */
    function acceptOffer(bytes32 offerId) external nonReentrant whenNotPaused validOffer(offerId) {
        Offer storage offer = offers[offerId];
        
        IERC721 nft = IERC721(offer.nftContract);
        require(nft.ownerOf(offer.tokenId) == msg.sender, "Not token owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || 
            nft.getApproved(offer.tokenId) == address(this),
            "Contract not approved"
        );

        offer.active = false;

        // Calculate fees and royalties
        (address royaltyRecipient, uint256 royaltyAmount) = royaltyEngine.getRoyalty(
            offer.nftContract,
            offer.tokenId,
            offer.amount
        );

        uint256 marketplaceFee = (offer.amount * marketplaceFeePercentage) / 10000;
        uint256 sellerAmount = offer.amount - marketplaceFee - royaltyAmount;

        // Transfer NFT to buyer
        nft.safeTransferFrom(msg.sender, offer.buyer, offer.tokenId);

        // Transfer payments
        payable(msg.sender).transfer(sellerAmount);
        if (marketplaceFee > 0) {
            payable(feeRecipient).transfer(marketplaceFee);
        }
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            payable(royaltyRecipient).transfer(royaltyAmount);
        }

        // Cancel any existing listing
        bytes32 existingListingId = tokenToListingId[offer.nftContract][offer.tokenId];
        if (existingListingId != 0 && listings[existingListingId].active) {
            _cancelListing(existingListingId);
        }

        totalSales++;
        totalVolume += offer.amount;

        emit OfferAccepted(offerId, msg.sender, offer.buyer, offer.amount);
    }

    /**
     * @dev Cancel an offer
     */
    function cancelOffer(bytes32 offerId) external validOffer(offerId) {
        Offer storage offer = offers[offerId];
        require(offer.buyer == msg.sender || msg.sender == owner(), "Not authorized");
        
        offer.active = false;
        payable(offer.buyer).transfer(offer.amount);
        
        emit OfferCancelled(offerId);
    }

    /**
     * @dev Whitelist NFT contract
     */
    function setContractWhitelist(address nftContract, bool whitelisted) external onlyOwner {
        whitelistedContracts[nftContract] = whitelisted;
    }

    /**
     * @dev Update marketplace fee
     */
    function setMarketplaceFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= MAX_FEE_PERCENTAGE, "Fee too high");
        marketplaceFeePercentage = newFeePercentage;
    }

    /**
     * @dev Update fee recipient
     */
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
    }

    /**
     * @dev Update royalty engine
     */
    function setRoyaltyEngine(address newRoyaltyEngine) external onlyOwner {
        require(newRoyaltyEngine != address(0), "Invalid address");
        royaltyEngine = RoyaltyEngine(newRoyaltyEngine);
    }

    /**
     * @dev Get user's listings
     */
    function getUserListings(address user) external view returns (bytes32[] memory) {
        return userListings[user];
    }

    /**
     * @dev Get user's offers
     */
    function getUserOffers(address user) external view returns (bytes32[] memory) {
        return userOffers[user];
    }

    /**
     * @dev Get listing details
     */
    function getListing(bytes32 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @dev Get offer details
     */
    function getOffer(bytes32 offerId) external view returns (Offer memory) {
        return offers[offerId];
    }

    /**
     * @dev Handle NFT transfers
     */
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (only owner, only when paused)
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        payable(owner()).transfer(address(this).balance);
    }
}
