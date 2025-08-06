// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ERC721Escrow
 * @dev Secure escrow contract for ERC721 tokens with dispute resolution
 */
contract ERC721Escrow is IERC721Receiver, ReentrancyGuard, Ownable, Pausable {
    struct EscrowTransaction {
        address seller;
        address buyer;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        uint256 createdAt;
        uint256 deadline;
        EscrowStatus status;
        bool sellerApproved;
        bool buyerApproved;
    }

    enum EscrowStatus {
        Active,
        Completed,
        Cancelled,
        Disputed
    }

    // State variables
    mapping(uint256 => EscrowTransaction) public escrowTransactions;
    mapping(address => bool) public whitelistedContracts;
    mapping(address => uint256[]) public userEscrows;
    
    uint256 public nextEscrowId = 1;
    uint256 public escrowFeePercentage = 250; // 2.5%
    uint256 public constant MAX_FEE_PERCENTAGE = 1000; // 10%
    uint256 public disputeWindow = 7 days;
    
    address public feeRecipient;
    address public disputeResolver;

    // Events
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed seller,
        address indexed buyer,
        address nftContract,
        uint256 tokenId,
        uint256 price
    );
    
    event EscrowCompleted(uint256 indexed escrowId);
    event EscrowCancelled(uint256 indexed escrowId);
    event EscrowDisputed(uint256 indexed escrowId);
    event DisputeResolved(uint256 indexed escrowId, bool favorBuyer);
    event FeeUpdated(uint256 newFeePercentage);
    event ContractWhitelisted(address indexed nftContract, bool whitelisted);

    constructor(address _feeRecipient, address _disputeResolver) {
        feeRecipient = _feeRecipient;
        disputeResolver = _disputeResolver;
    }

    modifier onlyDisputeResolver() {
        require(msg.sender == disputeResolver, "Only dispute resolver");
        _;
    }

    modifier validEscrow(uint256 escrowId) {
        require(escrowId > 0 && escrowId < nextEscrowId, "Invalid escrow ID");
        _;
    }

    /**
     * @dev Create a new escrow transaction
     */
    function createEscrow(
        address buyer,
        address nftContract,
        uint256 tokenId,
        uint256 deadline
    ) external payable nonReentrant whenNotPaused {
        require(buyer != address(0), "Invalid buyer address");
        require(buyer != msg.sender, "Buyer cannot be seller");
        require(whitelistedContracts[nftContract], "Contract not whitelisted");
        require(msg.value > 0, "Price must be greater than 0");
        require(deadline > block.timestamp, "Invalid deadline");

        // Verify seller owns the NFT
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Seller doesn't own NFT");
        require(nft.isApprovedForAll(msg.sender, address(this)) || 
                nft.getApproved(tokenId) == address(this), "Contract not approved");

        uint256 escrowId = nextEscrowId++;
        
        escrowTransactions[escrowId] = EscrowTransaction({
            seller: msg.sender,
            buyer: buyer,
            nftContract: nftContract,
            tokenId: tokenId,
            price: msg.value,
            createdAt: block.timestamp,
            deadline: deadline,
            status: EscrowStatus.Active,
            sellerApproved: false,
            buyerApproved: false
        });

        userEscrows[msg.sender].push(escrowId);
        userEscrows[buyer].push(escrowId);

        // Transfer NFT to escrow
        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        emit EscrowCreated(escrowId, msg.sender, buyer, nftContract, tokenId, msg.value);
    }

    /**
     * @dev Approve escrow completion
     */
    function approveEscrow(uint256 escrowId) external validEscrow(escrowId) {
        EscrowTransaction storage escrow = escrowTransactions[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(msg.sender == escrow.seller || msg.sender == escrow.buyer, "Not authorized");

        if (msg.sender == escrow.seller) {
            escrow.sellerApproved = true;
        } else {
            escrow.buyerApproved = true;
        }

        // Complete escrow if both parties approved
        if (escrow.sellerApproved && escrow.buyerApproved) {
            _completeEscrow(escrowId);
        }
    }

    /**
     * @dev Complete escrow transaction
     */
    function _completeEscrow(uint256 escrowId) internal {
        EscrowTransaction storage escrow = escrowTransactions[escrowId];
        escrow.status = EscrowStatus.Completed;

        // Calculate fee and transfer amounts
        uint256 fee = (escrow.price * escrowFeePercentage) / 10000;
        uint256 sellerAmount = escrow.price - fee;

        // Transfer NFT to buyer
        IERC721(escrow.nftContract).safeTransferFrom(address(this), escrow.buyer, escrow.tokenId);

        // Transfer payment to seller and fee to recipient
        payable(escrow.seller).transfer(sellerAmount);
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
        }

        emit EscrowCompleted(escrowId);
    }

    /**
     * @dev Cancel escrow (only before deadline or if disputed)
     */
    function cancelEscrow(uint256 escrowId) external validEscrow(escrowId) {
        EscrowTransaction storage escrow = escrowTransactions[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(
            msg.sender == escrow.seller || 
            msg.sender == escrow.buyer || 
            block.timestamp > escrow.deadline,
            "Not authorized to cancel"
        );

        escrow.status = EscrowStatus.Cancelled;

        // Return NFT to seller and ETH to buyer
        IERC721(escrow.nftContract).safeTransferFrom(address(this), escrow.seller, escrow.tokenId);
        payable(escrow.buyer).transfer(escrow.price);

        emit EscrowCancelled(escrowId);
    }

    /**
     * @dev Initiate dispute
     */
    function initiateDispute(uint256 escrowId) external validEscrow(escrowId) {
        EscrowTransaction storage escrow = escrowTransactions[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(msg.sender == escrow.seller || msg.sender == escrow.buyer, "Not authorized");
        require(block.timestamp <= escrow.deadline + disputeWindow, "Dispute window closed");

        escrow.status = EscrowStatus.Disputed;
        emit EscrowDisputed(escrowId);
    }

    /**
     * @dev Resolve dispute (only dispute resolver)
     */
    function resolveDispute(uint256 escrowId, bool favorBuyer) external onlyDisputeResolver validEscrow(escrowId) {
        EscrowTransaction storage escrow = escrowTransactions[escrowId];
        require(escrow.status == EscrowStatus.Disputed, "Escrow not disputed");

        if (favorBuyer) {
            // Buyer wins - complete the transaction
            _completeEscrow(escrowId);
        } else {
            // Seller wins - cancel the transaction
            escrow.status = EscrowStatus.Cancelled;
            IERC721(escrow.nftContract).safeTransferFrom(address(this), escrow.seller, escrow.tokenId);
            payable(escrow.buyer).transfer(escrow.price);
        }

        emit DisputeResolved(escrowId, favorBuyer);
    }

    /**
     * @dev Whitelist NFT contract
     */
    function setContractWhitelist(address nftContract, bool whitelisted) external onlyOwner {
        whitelistedContracts[nftContract] = whitelisted;
        emit ContractWhitelisted(nftContract, whitelisted);
    }

    /**
     * @dev Update escrow fee percentage
     */
    function setEscrowFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= MAX_FEE_PERCENTAGE, "Fee too high");
        escrowFeePercentage = newFeePercentage;
        emit FeeUpdated(newFeePercentage);
    }

    /**
     * @dev Update fee recipient
     */
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
    }

    /**
     * @dev Update dispute resolver
     */
    function setDisputeResolver(address newDisputeResolver) external onlyOwner {
        require(newDisputeResolver != address(0), "Invalid address");
        disputeResolver = newDisputeResolver;
    }

    /**
     * @dev Get user's escrow IDs
     */
    function getUserEscrows(address user) external view returns (uint256[] memory) {
        return userEscrows[user];
    }

    /**
     * @dev Get escrow details
     */
    function getEscrow(uint256 escrowId) external view returns (EscrowTransaction memory) {
        return escrowTransactions[escrowId];
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
