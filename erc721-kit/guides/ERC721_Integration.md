# ERC721 Kit Integration Guide

A comprehensive guide for integrating ERC721 Kit into your NFT marketplace or application.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Smart Contract Integration](#smart-contract-integration)
4. [Frontend Integration](#frontend-integration)
5. [Deployment Guide](#deployment-guide)
6. [Configuration](#configuration)
7. [Testing](#testing)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

## Overview

ERC721 Kit provides a complete solution for building NFT marketplaces with the following components:

- **ERC721Escrow**: Secure escrow service for NFT transactions
- **ERC721Marketplace**: Decentralized marketplace with listing/bidding functionality
- **RoyaltyEngine**: EIP-2981 compliant royalty management system
- **React Components**: Ready-to-use UI components
- **Custom Hooks**: React hooks for blockchain interaction

### Key Features

- ✅ Secure escrow system with dispute resolution
- ✅ Built-in marketplace functionality
- ✅ Automatic royalty distribution
- ✅ Gas-optimized smart contracts
- ✅ Comprehensive test coverage
- ✅ Multi-chain deployment support
- ✅ React components and hooks

## Quick Start

### Prerequisites

- Node.js v16+ and npm/yarn
- Hardhat development environment
- MetaMask or compatible Web3 wallet
- Basic knowledge of React and Ethereum

### Installation

1. **Download and Extract the Kit**
   ```bash
   # Download the kit (replace with actual download URL)
   wget https://example.com/erc721-kit.zip
   unzip erc721-kit.zip
   cd erc721-kit
   ```

2. **Install Dependencies**
   ```bash
   # Install smart contract dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Set Up Environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Deploy Contracts**
   ```bash
   # Deploy to local network
   npx hardhat run scripts/deploy.js --network localhost
   
   # Deploy to testnet (e.g., Sepolia)
   npx hardhat run scripts/deploy.js --network sepolia
   ```

5. **Start Frontend Development**
   ```bash
   cd frontend
   npm start
   ```

## Smart Contract Integration

### Contract Addresses

After deployment, you'll have three main contracts:

```javascript
const contracts = {
  ERC721Marketplace: "0x...", // Main marketplace contract
  ERC721Escrow: "0x...",      // Escrow service
  RoyaltyEngine: "0x..."      // Royalty management
};
```

### Basic Usage

#### 1. Marketplace Listing

```solidity
// 1. Approve marketplace to transfer your NFT
IERC721(nftContract).approve(marketplaceAddress, tokenId);

// 2. List the NFT
marketplace.listItem(
    nftContract,
    tokenId,
    price,
    duration  // in seconds
);
```

#### 2. Buying an NFT

```solidity
// Get listing details
bytes32 listingId = marketplace.getListingId(nftContract, tokenId);
Listing memory listing = marketplace.getListing(listingId);

// Buy the NFT
marketplace.buyItem{value: listing.price}(listingId);
```

#### 3. Creating an Escrow

```solidity
// 1. Approve escrow contract
IERC721(nftContract).approve(escrowAddress, tokenId);

// 2. Create escrow
escrow.createEscrow{value: price}(
    buyerAddress,
    nftContract,
    tokenId,
    deadline
);
```

### Contract Whitelisting

For security, contracts must be whitelisted before use:

```solidity
// Whitelist an NFT contract (owner only)
marketplace.setContractWhitelist(nftContractAddress, true);
escrow.setContractWhitelist(nftContractAddress, true);
```

## Frontend Integration

### Using the Custom Hook

The `useERC721Marketplace` hook provides easy integration:

```javascript
import useERC721Marketplace from './hooks/useERC721Marketplace';

function MyNFTApp() {
  const {
    isConnected,
    userAddress,
    connectWallet,
    listItem,
    buyItem,
    userListings,
    escrows
  } = useERC721Marketplace(
    MARKETPLACE_ADDRESS,
    ESCROW_ADDRESS
  );

  // Connect wallet
  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  // List an NFT
  const handleListNFT = async (nftContract, tokenId, price) => {
    try {
      await listItem(nftContract, tokenId, price, 7); // 7 days
      alert('NFT listed successfully!');
    } catch (error) {
      console.error('Listing failed:', error);
    }
  };

  return (
    <div>
      {!isConnected ? (
        <button onClick={handleConnect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {userAddress}</p>
          {/* Your NFT interface here */}
        </div>
      )}
    </div>
  );
}
```

### Using React Components

#### NFT Gallery

```javascript
import NFTGallery from './components/NFTGallery';

function MarketplacePage() {
  const [nfts, setNfts] = useState([]);

  const handleNFTClick = (nft) => {
    // Handle NFT selection
    console.log('Selected NFT:', nft);
  };

  return (
    <NFTGallery
      nfts={nfts}
      onNFTClick={handleNFTClick}
      showPrices={true}
      gridCols="grid-cols-1 md:grid-cols-3 lg:grid-cols-4"
    />
  );
}
```

#### Mint Form

```javascript
import MintForm from './components/MintForm';

function MintPage() {
  const { mint } = useERC721Marketplace();

  const handleMint = async (mintData) => {
    // Process mint data (upload to IPFS, etc.)
    const tokenURI = await uploadToIPFS(mintData.metadata);
    
    // Mint the NFT
    await mint({
      ...mintData,
      tokenURI
    });
  };

  return (
    <MintForm
      onMint={handleMint}
      onSuccess={() => alert('NFT minted successfully!')}
      userAddress={userAddress}
    />
  );
}
```

#### Escrow Dashboard

```javascript
import EscrowDashboard from './components/EscrowDashboard';

function EscrowPage() {
  const {
    escrows,
    approveEscrow,
    cancelEscrow,
    initiateDispute,
    createEscrow
  } = useERC721Marketplace();

  return (
    <EscrowDashboard
      userAddress={userAddress}
      escrows={escrows}
      onApproveEscrow={approveEscrow}
      onCancelEscrow={cancelEscrow}
      onInitiateDispute={initiateDispute}
      onCreateEscrow={createEscrow}
    />
  );
}
```

## Deployment Guide

### Network Configuration

Update `hardhat.config.js` with your networks:

```javascript
module.exports = {
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 1
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 137
    }
  }
};
```

### Deployment Script

```bash
# Deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Verify contracts
npx hardhat run scripts/verify.js --network sepolia
```

### Post-Deployment Configuration

1. **Update Frontend Config**
   ```javascript
   // frontend/config/contracts.json
   {
     "sepolia": {
       "chainId": 11155111,
       "contracts": {
         "ERC721Marketplace": {
           "address": "0x...",
           "abi": "ERC721Marketplace"
         }
       }
     }
   }
   ```

2. **Whitelist NFT Contracts**
   ```bash
   npx hardhat run scripts/whitelist-contracts.js --network sepolia
   ```

3. **Set Initial Configuration**
   ```bash
   npx hardhat run scripts/configure.js --network sepolia
   ```

## Configuration

### Environment Variables

```bash
# .env
PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key

# Contract Configuration
FEE_RECIPIENT=0x...
DISPUTE_RESOLVER=0x...
MARKETPLACE_FEE_PERCENTAGE=250  # 2.5%
ESCROW_FEE_PERCENTAGE=250       # 2.5%
DEFAULT_ROYALTY_PERCENTAGE=250  # 2.5%
```

### Smart Contract Settings

```javascript
// Update fees (owner only)
await marketplace.setMarketplaceFee(250); // 2.5%
await escrow.setEscrowFee(250); // 2.5%
await royaltyEngine.setDefaultRoyalty(feeRecipient, 250); // 2.5%

// Update recipients
await marketplace.setFeeRecipient(newFeeRecipient);
await escrow.setFeeRecipient(newFeeRecipient);
await escrow.setDisputeResolver(newDisputeResolver);
```

### Frontend Configuration

```javascript
// frontend/src/config/app.js
export const APP_CONFIG = {
  // Network settings
  SUPPORTED_NETWORKS: [1, 5, 137, 80001], // Mainnet, Goerli, Polygon, Mumbai
  DEFAULT_NETWORK: 5, // Goerli
  
  // Contract settings
  MARKETPLACE_ADDRESS: process.env.REACT_APP_MARKETPLACE_ADDRESS,
  ESCROW_ADDRESS: process.env.REACT_APP_ESCROW_ADDRESS,
  
  // IPFS settings
  IPFS_GATEWAY: 'https://ipfs.io/ipfs/',
  PINATA_API_KEY: process.env.REACT_APP_PINATA_API_KEY,
  
  // UI settings
  ITEMS_PER_PAGE: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};
```

## Testing

### Running Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/ERC721Escrow.test.js

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Run tests with coverage
npx hardhat coverage
```

### Test Coverage

The kit includes comprehensive tests covering:

- Contract deployment and initialization
- Marketplace listing and buying functionality
- Escrow creation, approval, and completion
- Dispute resolution system
- Royalty distribution
- Fee management
- Security edge cases
- Gas optimization

### Integration Testing

```javascript
// Example integration test
describe("Full Marketplace Flow", function() {
  it("Should complete end-to-end NFT sale", async function() {
    // 1. Mint NFT
    await nftContract.mint(seller.address, tokenId);
    
    // 2. Approve marketplace
    await nftContract.connect(seller).approve(marketplace.address, tokenId);
    
    // 3. List NFT
    await marketplace.connect(seller).listItem(nftContract.address, tokenId, price, duration);
    
    // 4. Buy NFT
    await marketplace.connect(buyer).buyItem(listingId, { value: price });
    
    // 5. Verify ownership transfer
    expect(await nftContract.ownerOf(tokenId)).to.equal(buyer.address);
  });
});
```

## Security Considerations

### Smart Contract Security

1. **Access Controls**
   - Owner-only functions for fee and configuration updates
   - Participant-only functions for escrow operations
   - Whitelist mechanism for NFT contracts

2. **Reentrancy Protection**
   - All external calls use ReentrancyGuard
   - State changes before external calls
   - Proper CEI (Checks-Effects-Interactions) pattern

3. **Integer Overflow Protection**
   - SafeMath usage (Solidity 0.8+ has built-in protection)
   - Reasonable limits on fees and values

4. **Emergency Functions**
   - Pausable functionality for emergency stops
   - Emergency withdrawal for paused contracts
   - Time-based dispute resolution

### Frontend Security

1. **Wallet Interaction**
   ```javascript
   // Always validate addresses
   if (!ethers.utils.isAddress(address)) {
     throw new Error('Invalid address');
   }
   
   // Check network
   if (network.chainId !== EXPECTED_CHAIN_ID) {
     throw new Error('Wrong network');
   }
   ```

2. **Input Validation**
   ```javascript
   // Validate price inputs
   const validatePrice = (price) => {
     const priceWei = ethers.utils.parseEther(price);
     if (priceWei.lte(0)) {
       throw new Error('Price must be greater than 0');
     }
     return priceWei;
   };
   ```

3. **IPFS Security**
   ```javascript
   // Validate metadata
   const validateMetadata = (metadata) => {
     if (!metadata.name || !metadata.description) {
       throw new Error('Invalid metadata');
     }
     // Additional validation...
   };
   ```

### Best Practices

- Always validate user inputs
- Use proper error handling
- Implement rate limiting for API calls
- Store sensitive data securely
- Regular security audits
- Monitor contract events

## Troubleshooting

### Common Issues

#### 1. Transaction Failed: "Contract not whitelisted"

**Solution**: Whitelist the NFT contract before use:

```javascript
await marketplace.setContractWhitelist(nftContractAddress, true);
```

#### 2. "Insufficient allowance" Error

**Solution**: Approve the contract to transfer your NFT:

```javascript
await nftContract.approve(marketplaceAddress, tokenId);
// Or for all tokens:
await nftContract.setApprovalForAll(marketplaceAddress, true);
```

#### 3. MetaMask Connection Issues

**Solution**: Check network configuration:

```javascript
// Switch to correct network
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x5' }], // Goerli
});
```

#### 4. High Gas Fees

**Solutions**:
- Use gas estimation: `await contract.estimateGas.functionName()`
- Batch operations when possible
- Consider Layer 2 solutions (Polygon, Arbitrum)

#### 5. IPFS Upload Failures

**Solutions**:
- Check IPFS gateway connectivity
- Validate file size and format
- Use alternative IPFS services (Pinata, Infura)

### Debugging Tips

1. **Contract Events**: Monitor events for debugging:
   ```javascript
   marketplace.on("ItemListed", (listingId, seller, nftContract, tokenId, price) => {
     console.log('New listing:', { listingId, seller, nftContract, tokenId, price });
   });
   ```

2. **Transaction Tracing**: Use tools like Tenderly for transaction analysis

3. **Local Development**: Use Hardhat's console.log for debugging:
   ```solidity
   import "hardhat/console.sol";
   
   function debugFunction() public {
     console.log("Debug value:", someVariable);
   }
   ```

## API Reference

### useERC721Marketplace Hook

```javascript
const {
  // Connection state
  isConnected,
  isLoading,
  error,
  userAddress,
  
  // Connection functions
  connectWallet,
  disconnectWallet,
  
  // Marketplace functions
  listItem,
  buyItem,
  cancelListing,
  updateListing,
  createOffer,
  acceptOffer,
  
  // Escrow functions
  createEscrow,
  approveEscrow,
  cancelEscrow,
  initiateDispute,
  
  // NFT utilities
  approveNFT,
  setApprovalForAll,
  getNFTMetadata,
  
  // Data
  listings,
  userListings,
  userOffers,
  escrows,
  marketplaceStats,
  
  // Utilities
  refresh
} = useERC721Marketplace(marketplaceAddress, escrowAddress, options);
```

### Component Props

#### NFTGallery
```javascript
<NFTGallery
  nfts={Array}              // NFT data array
  onNFTClick={Function}     // Click handler
  loading={Boolean}         // Loading state
  error={String}            // Error message
  className={String}        // CSS classes
  gridCols={String}         // Grid columns
  showPrices={Boolean}      // Show prices
  showOwner={Boolean}       // Show owner info
/>
```

#### MintForm
```javascript
<MintForm
  onMint={Function}         // Mint handler
  onSuccess={Function}      // Success callback
  onError={Function}        // Error callback
  loading={Boolean}         // Loading state
  contractAddress={String}  // Contract address
  userAddress={String}      // User address
  className={String}        // CSS classes
/>
```

#### EscrowDashboard
```javascript
<EscrowDashboard
  userAddress={String}      // User address
  escrows={Array}           // Escrow data
  onApproveEscrow={Function}    // Approve handler
  onCancelEscrow={Function}     // Cancel handler
  onInitiateDispute={Function}  // Dispute handler
  onCreateEscrow={Function}     // Create handler
  loading={Boolean}         // Loading state
  error={String}            // Error message
  className={String}        // CSS classes
/>
```

### Smart Contract Functions

#### ERC721Marketplace

```solidity
// Listing functions
function listItem(address nftContract, uint256 tokenId, uint256 price, uint256 duration) external
function buyItem(bytes32 listingId) external payable
function cancelListing(bytes32 listingId) external
function updateListing(bytes32 listingId, uint256 newPrice) external

// Offer functions
function createOffer(address nftContract, uint256 tokenId, uint256 duration) external payable
function acceptOffer(bytes32 offerId) external
function cancelOffer(bytes32 offerId) external

// View functions
function getListing(bytes32 listingId) external view returns (Listing memory)
function getOffer(bytes32 offerId) external view returns (Offer memory)
function getUserListings(address user) external view returns (bytes32[] memory)
function getUserOffers(address user) external view returns (bytes32[] memory)
```

#### ERC721Escrow

```solidity
// Escrow functions
function createEscrow(address buyer, address nftContract, uint256 tokenId, uint256 deadline) external payable
function approveEscrow(uint256 escrowId) external
function cancelEscrow(uint256 escrowId) external
function initiateDispute(uint256 escrowId) external

// Admin functions
function resolveDispute(uint256 escrowId, bool favorBuyer) external
function setEscrowFee(uint256 newFeePercentage) external
function setContractWhitelist(address nftContract, bool whitelisted) external

// View functions
function getEscrow(uint256 escrowId) external view returns (EscrowTransaction memory)
function getUserEscrows(address user) external view returns (uint256[] memory)
```

---

## Support and Resources

- **Documentation**: [Full API documentation](./api-docs.md)
- **Examples**: Check the `examples/` directory for implementation examples
- **Community**: Join our [Discord community](https://discord.gg/erc721kit)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/erc721kit/issues)
- **Updates**: Follow [@ERC721Kit](https://twitter.com/erc721kit) for updates

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

*This guide covers the essential aspects of integrating ERC721 Kit. For advanced use cases and customization, refer to the individual component documentation and source code.*
