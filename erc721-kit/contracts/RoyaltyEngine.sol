// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

/**
 * @title RoyaltyEngine
 * @dev Manages royalty payments for NFT sales with EIP-2981 support
 */
contract RoyaltyEngine is Ownable {
    using ERC165Checker for address;

    struct RoyaltyInfo {
        address recipient;
        uint256 percentage; // Basis points (1% = 100)
    }

    // Contract-level royalties
    mapping(address => RoyaltyInfo) public contractRoyalties;
    
    // Token-specific royalties (overrides contract-level)
    mapping(address => mapping(uint256 => RoyaltyInfo)) public tokenRoyalties;
    
    // Default royalty for contracts without specific settings
    RoyaltyInfo public defaultRoyalty;
    
    uint256 public constant MAX_ROYALTY_PERCENTAGE = 1000; // 10%
    
    // Events
    event DefaultRoyaltyUpdated(address recipient, uint256 percentage);
    event ContractRoyaltyUpdated(address indexed nftContract, address recipient, uint256 percentage);
    event TokenRoyaltyUpdated(address indexed nftContract, uint256 indexed tokenId, address recipient, uint256 percentage);

    constructor() {
        // Set default royalty to 0%
        defaultRoyalty = RoyaltyInfo(address(0), 0);
    }

    /**
     * @dev Set default royalty for all contracts
     */
    function setDefaultRoyalty(address recipient, uint256 percentage) external onlyOwner {
        require(percentage <= MAX_ROYALTY_PERCENTAGE, "Royalty too high");
        if (percentage > 0) {
            require(recipient != address(0), "Invalid recipient");
        }
        
        defaultRoyalty = RoyaltyInfo(recipient, percentage);
        emit DefaultRoyaltyUpdated(recipient, percentage);
    }

    /**
     * @dev Set royalty for a specific contract
     */
    function setContractRoyalty(address nftContract, address recipient, uint256 percentage) external {
        require(
            msg.sender == owner() || 
            _isContractOwner(nftContract, msg.sender),
            "Not authorized"
        );
        require(percentage <= MAX_ROYALTY_PERCENTAGE, "Royalty too high");
        if (percentage > 0) {
            require(recipient != address(0), "Invalid recipient");
        }
        
        contractRoyalties[nftContract] = RoyaltyInfo(recipient, percentage);
        emit ContractRoyaltyUpdated(nftContract, recipient, percentage);
    }

    /**
     * @dev Set royalty for a specific token
     */
    function setTokenRoyalty(
        address nftContract,
        uint256 tokenId,
        address recipient,
        uint256 percentage
    ) external {
        require(
            msg.sender == owner() || 
            _isTokenOwner(nftContract, tokenId, msg.sender) ||
            _isContractOwner(nftContract, msg.sender),
            "Not authorized"
        );
        require(percentage <= MAX_ROYALTY_PERCENTAGE, "Royalty too high");
        if (percentage > 0) {
            require(recipient != address(0), "Invalid recipient");
        }
        
        tokenRoyalties[nftContract][tokenId] = RoyaltyInfo(recipient, percentage);
        emit TokenRoyaltyUpdated(nftContract, tokenId, recipient, percentage);
    }

    /**
     * @dev Get royalty information for a token sale
     */
    function getRoyalty(
        address nftContract,
        uint256 tokenId,
        uint256 salePrice
    ) external view returns (address recipient, uint256 royaltyAmount) {
        // First check if contract supports EIP-2981
        if (nftContract.supportsInterface(type(IERC2981).interfaceId)) {
            try IERC2981(nftContract).royaltyInfo(tokenId, salePrice) returns (
                address eip2981Recipient,
                uint256 eip2981Amount
            ) {
                // Validate EIP-2981 response
                if (eip2981Recipient != address(0) && eip2981Amount <= salePrice / 10) {
                    return (eip2981Recipient, eip2981Amount);
                }
            } catch {
                // Fall through to manual royalty settings
            }
        }

        // Check token-specific royalty
        RoyaltyInfo memory tokenRoyalty = tokenRoyalties[nftContract][tokenId];
        if (tokenRoyalty.recipient != address(0) || tokenRoyalty.percentage > 0) {
            uint256 amount = (salePrice * tokenRoyalty.percentage) / 10000;
            return (tokenRoyalty.recipient, amount);
        }

        // Check contract-level royalty
        RoyaltyInfo memory contractRoyalty = contractRoyalties[nftContract];
        if (contractRoyalty.recipient != address(0) || contractRoyalty.percentage > 0) {
            uint256 amount = (salePrice * contractRoyalty.percentage) / 10000;
            return (contractRoyalty.recipient, amount);
        }

        // Use default royalty
        if (defaultRoyalty.recipient != address(0) || defaultRoyalty.percentage > 0) {
            uint256 amount = (salePrice * defaultRoyalty.percentage) / 10000;
            return (defaultRoyalty.recipient, amount);
        }

        return (address(0), 0);
    }

    /**
     * @dev Get royalty percentage for a token
     */
    function getRoyaltyPercentage(address nftContract, uint256 tokenId) external view returns (uint256) {
        // Check token-specific royalty
        RoyaltyInfo memory tokenRoyalty = tokenRoyalties[nftContract][tokenId];
        if (tokenRoyalty.recipient != address(0) || tokenRoyalty.percentage > 0) {
            return tokenRoyalty.percentage;
        }

        // Check contract-level royalty
        RoyaltyInfo memory contractRoyalty = contractRoyalties[nftContract];
        if (contractRoyalty.recipient != address(0) || contractRoyalty.percentage > 0) {
            return contractRoyalty.percentage;
        }

        // Return default royalty percentage
        return defaultRoyalty.percentage;
    }

    /**
     * @dev Get royalty recipient for a token
     */
    function getRoyaltyRecipient(address nftContract, uint256 tokenId) external view returns (address) {
        // Check token-specific royalty
        RoyaltyInfo memory tokenRoyalty = tokenRoyalties[nftContract][tokenId];
        if (tokenRoyalty.recipient != address(0)) {
            return tokenRoyalty.recipient;
        }

        // Check contract-level royalty
        RoyaltyInfo memory contractRoyalty = contractRoyalties[nftContract];
        if (contractRoyalty.recipient != address(0)) {
            return contractRoyalty.recipient;
        }

        // Return default royalty recipient
        return defaultRoyalty.recipient;
    }

    /**
     * @dev Check if address is contract owner (basic check)
     */
    function _isContractOwner(address nftContract, address account) internal view returns (bool) {
        try Ownable(nftContract).owner() returns (address contractOwner) {
            return contractOwner == account;
        } catch {
            return false;
        }
    }

    /**
     * @dev Check if address is token owner
     */
    function _isTokenOwner(address nftContract, uint256 tokenId, address account) internal view returns (bool) {
        try IERC721(nftContract).ownerOf(tokenId) returns (address tokenOwner) {
            return tokenOwner == account;
        } catch {
            return false;
        }
    }

    /**
     * @dev Batch set contract royalties
     */
    function batchSetContractRoyalties(
        address[] calldata nftContracts,
        address[] calldata recipients,
        uint256[] calldata percentages
    ) external onlyOwner {
        require(
            nftContracts.length == recipients.length && 
            recipients.length == percentages.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < nftContracts.length; i++) {
            require(percentages[i] <= MAX_ROYALTY_PERCENTAGE, "Royalty too high");
            if (percentages[i] > 0) {
                require(recipients[i] != address(0), "Invalid recipient");
            }
            
            contractRoyalties[nftContracts[i]] = RoyaltyInfo(recipients[i], percentages[i]);
            emit ContractRoyaltyUpdated(nftContracts[i], recipients[i], percentages[i]);
        }
    }

    /**
     * @dev Remove contract royalty
     */
    function removeContractRoyalty(address nftContract) external {
        require(
            msg.sender == owner() || 
            _isContractOwner(nftContract, msg.sender),
            "Not authorized"
        );
        
        delete contractRoyalties[nftContract];
        emit ContractRoyaltyUpdated(nftContract, address(0), 0);
    }

    /**
     * @dev Remove token royalty
     */
    function removeTokenRoyalty(address nftContract, uint256 tokenId) external {
        require(
            msg.sender == owner() || 
            _isTokenOwner(nftContract, tokenId, msg.sender) ||
            _isContractOwner(nftContract, msg.sender),
            "Not authorized"
        );
        
        delete tokenRoyalties[nftContract][tokenId];
        emit TokenRoyaltyUpdated(nftContract, tokenId, address(0), 0);
    }

    /**
     * @dev Check if contract has custom royalty settings
     */
    function hasContractRoyalty(address nftContract) external view returns (bool) {
        RoyaltyInfo memory royalty = contractRoyalties[nftContract];
        return royalty.recipient != address(0) || royalty.percentage > 0;
    }

    /**
     * @dev Check if token has custom royalty settings
     */
    function hasTokenRoyalty(address nftContract, uint256 tokenId) external view returns (bool) {
        RoyaltyInfo memory royalty = tokenRoyalties[nftContract][tokenId];
        return royalty.recipient != address(0) || royalty.percentage > 0;
    }
}

// Interface for basic NFT ownership check
interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address owner);
}
