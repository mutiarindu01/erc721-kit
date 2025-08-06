import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// ABI fragments for the contracts (in a real implementation, these would be imported from generated types)
const ERC721_MARKETPLACE_ABI = [
  "function listItem(address nftContract, uint256 tokenId, uint256 price, uint256 duration) external",
  "function buyItem(bytes32 listingId) external payable",
  "function cancelListing(bytes32 listingId) external",
  "function updateListing(bytes32 listingId, uint256 newPrice) external",
  "function createOffer(address nftContract, uint256 tokenId, uint256 duration) external payable",
  "function acceptOffer(bytes32 offerId) external",
  "function cancelOffer(bytes32 offerId) external",
  "function getUserListings(address user) external view returns (bytes32[])",
  "function getUserOffers(address user) external view returns (bytes32[])",
  "function getListing(bytes32 listingId) external view returns (tuple(address seller, address nftContract, uint256 tokenId, uint256 price, uint256 createdAt, uint256 expiresAt, bool active))",
  "function getOffer(bytes32 offerId) external view returns (tuple(address buyer, address nftContract, uint256 tokenId, uint256 amount, uint256 createdAt, uint256 expiresAt, bool active))",
  "function totalListings() external view returns (uint256)",
  "function totalSales() external view returns (uint256)",
  "function totalVolume() external view returns (uint256)",
  "event ItemListed(bytes32 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price)",
  "event ItemSold(bytes32 indexed listingId, address indexed buyer, address indexed seller, address nftContract, uint256 tokenId, uint256 price)",
  "event ListingCancelled(bytes32 indexed listingId)",
  "event OfferCreated(bytes32 indexed offerId, address indexed buyer, address indexed nftContract, uint256 tokenId, uint256 amount)",
  "event OfferAccepted(bytes32 indexed offerId, address indexed seller, address indexed buyer, uint256 amount)",
];

const ERC721_ESCROW_ABI = [
  "function createEscrow(address buyer, address nftContract, uint256 tokenId, uint256 deadline) external payable",
  "function approveEscrow(uint256 escrowId) external",
  "function cancelEscrow(uint256 escrowId) external",
  "function initiateDispute(uint256 escrowId) external",
  "function getUserEscrows(address user) external view returns (uint256[])",
  "function getEscrow(uint256 escrowId) external view returns (tuple(address seller, address buyer, address nftContract, uint256 tokenId, uint256 price, uint256 createdAt, uint256 deadline, uint8 status, bool sellerApproved, bool buyerApproved))",
  "event EscrowCreated(uint256 indexed escrowId, address indexed seller, address indexed buyer, address nftContract, uint256 tokenId, uint256 price)",
  "event EscrowCompleted(uint256 indexed escrowId)",
  "event EscrowCancelled(uint256 indexed escrowId)",
  "event EscrowDisputed(uint256 indexed escrowId)",
];

const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function approve(address to, uint256 tokenId) external",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
];

const useERC721Marketplace = (
  marketplaceAddress,
  escrowAddress,
  options = {},
) => {
  const {
    autoConnect = true,
    pollInterval = 15000, // 15 seconds
    enableRealTimeUpdates = true,
  } = options;

  // State
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Contract instances
  const [marketplaceContract, setMarketplaceContract] = useState(null);
  const [escrowContract, setEscrowContract] = useState(null);

  // Data state
  const [listings, setListings] = useState([]);
  const [userListings, setUserListings] = useState([]);
  const [userOffers, setUserOffers] = useState([]);
  const [escrows, setEscrows] = useState([]);
  const [marketplaceStats, setMarketplaceStats] = useState({
    totalListings: 0,
    totalSales: 0,
    totalVolume: "0",
  });

  // Initialize wallet connection
  const connectWallet = useCallback(async () => {
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = accounts[0];

      setProvider(provider);
      setSigner(signer);
      setUserAddress(address);
      setIsConnected(true);

      // Initialize contracts
      if (marketplaceAddress) {
        const marketplace = new ethers.Contract(
          marketplaceAddress,
          ERC721_MARKETPLACE_ABI,
          signer,
        );
        setMarketplaceContract(marketplace);
      }

      if (escrowAddress) {
        const escrow = new ethers.Contract(
          escrowAddress,
          ERC721_ESCROW_ABI,
          signer,
        );
        setEscrowContract(escrow);
      }

      return { provider, signer, address };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [marketplaceAddress, escrowAddress]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setUserAddress(null);
    setIsConnected(false);
    setMarketplaceContract(null);
    setEscrowContract(null);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && typeof window.ethereum !== "undefined") {
      // Check if already connected
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts.length > 0) {
            connectWallet();
          }
        })
        .catch(console.error);
    }
  }, [autoConnect, connectWallet]);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== userAddress) {
          connectWallet();
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () =>
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged,
        );
    }
  }, [userAddress, connectWallet, disconnectWallet]);

  // Marketplace functions
  const listItem = useCallback(
    async (nftContract, tokenId, price, durationDays = 7) => {
      if (!marketplaceContract)
        throw new Error("Marketplace contract not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const duration = durationDays * 24 * 60 * 60; // Convert days to seconds
        const tx = await marketplaceContract.listItem(
          nftContract,
          tokenId,
          price,
          duration,
        );
        await tx.wait();

        // Refresh listings
        await fetchUserListings();
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [marketplaceContract],
  );

  const buyItem = useCallback(
    async (listingId, price) => {
      if (!marketplaceContract)
        throw new Error("Marketplace contract not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const tx = await marketplaceContract.buyItem(listingId, {
          value: price,
        });
        await tx.wait();

        // Refresh data
        await Promise.all([
          fetchListings(),
          fetchUserListings(),
          fetchMarketplaceStats(),
        ]);
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [marketplaceContract],
  );

  const cancelListing = useCallback(
    async (listingId) => {
      if (!marketplaceContract)
        throw new Error("Marketplace contract not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const tx = await marketplaceContract.cancelListing(listingId);
        await tx.wait();

        await fetchUserListings();
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [marketplaceContract],
  );

  const updateListing = useCallback(
    async (listingId, newPrice) => {
      if (!marketplaceContract)
        throw new Error("Marketplace contract not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const tx = await marketplaceContract.updateListing(listingId, newPrice);
        await tx.wait();

        await fetchUserListings();
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [marketplaceContract],
  );

  const createOffer = useCallback(
    async (nftContract, tokenId, amount, durationDays = 7) => {
      if (!marketplaceContract)
        throw new Error("Marketplace contract not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const duration = durationDays * 24 * 60 * 60;
        const tx = await marketplaceContract.createOffer(
          nftContract,
          tokenId,
          duration,
          { value: amount },
        );
        await tx.wait();

        await fetchUserOffers();
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [marketplaceContract],
  );

  const acceptOffer = useCallback(
    async (offerId) => {
      if (!marketplaceContract)
        throw new Error("Marketplace contract not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const tx = await marketplaceContract.acceptOffer(offerId);
        await tx.wait();

        await Promise.all([fetchUserOffers(), fetchMarketplaceStats()]);
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [marketplaceContract],
  );

  // Escrow functions
  const createEscrow = useCallback(
    async (buyer, nftContract, tokenId, price, deadlineDays = 7) => {
      if (!escrowContract) throw new Error("Escrow contract not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const deadline =
          Math.floor(Date.now() / 1000) + deadlineDays * 24 * 60 * 60;
        const tx = await escrowContract.createEscrow(
          buyer,
          nftContract,
          tokenId,
          deadline,
          { value: price },
        );
        await tx.wait();

        await fetchEscrows();
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [escrowContract],
  );

  const approveEscrow = useCallback(
    async (escrowId) => {
      if (!escrowContract) throw new Error("Escrow contract not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const tx = await escrowContract.approveEscrow(escrowId);
        await tx.wait();

        await fetchEscrows();
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [escrowContract],
  );

  const cancelEscrow = useCallback(
    async (escrowId) => {
      if (!escrowContract) throw new Error("Escrow contract not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const tx = await escrowContract.cancelEscrow(escrowId);
        await tx.wait();

        await fetchEscrows();
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [escrowContract],
  );

  const initiateDispute = useCallback(
    async (escrowId) => {
      if (!escrowContract) throw new Error("Escrow contract not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const tx = await escrowContract.initiateDispute(escrowId);
        await tx.wait();

        await fetchEscrows();
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [escrowContract],
  );

  // NFT utility functions
  const approveNFT = useCallback(
    async (nftContract, tokenId, spender) => {
      if (!signer) throw new Error("Wallet not connected");

      setIsLoading(true);
      setError(null);

      try {
        const nftContractInstance = new ethers.Contract(
          nftContract,
          ERC721_ABI,
          signer,
        );
        const tx = await nftContractInstance.approve(spender, tokenId);
        await tx.wait();
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [signer],
  );

  const setApprovalForAll = useCallback(
    async (nftContract, operator, approved = true) => {
      if (!signer) throw new Error("Wallet not connected");

      setIsLoading(true);
      setError(null);

      try {
        const nftContractInstance = new ethers.Contract(
          nftContract,
          ERC721_ABI,
          signer,
        );
        const tx = await nftContractInstance.setApprovalForAll(
          operator,
          approved,
        );
        await tx.wait();
        return tx;
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [signer],
  );

  const getNFTMetadata = useCallback(
    async (nftContract, tokenId) => {
      if (!provider) throw new Error("Provider not initialized");

      try {
        const nftContractInstance = new ethers.Contract(
          nftContract,
          ERC721_ABI,
          provider,
        );
        const [tokenURI, owner] = await Promise.all([
          nftContractInstance.tokenURI(tokenId),
          nftContractInstance.ownerOf(tokenId),
        ]);

        // Fetch metadata from URI (could be IPFS or HTTP)
        let metadata = {};
        try {
          const response = await fetch(tokenURI);
          metadata = await response.json();
        } catch (error) {
          console.warn("Failed to fetch metadata:", error);
        }

        return {
          tokenId,
          tokenURI,
          owner,
          metadata,
          contractAddress: nftContract,
        };
      } catch (error) {
        console.error("Error fetching NFT metadata:", error);
        return null;
      }
    },
    [provider],
  );

  // Data fetching functions
  const fetchUserListings = useCallback(async () => {
    if (!marketplaceContract || !userAddress) return;

    try {
      const listingIds = await marketplaceContract.getUserListings(userAddress);
      const listingsData = await Promise.all(
        listingIds.map(async (id) => {
          try {
            const listing = await marketplaceContract.getListing(id);
            return { id, ...listing };
          } catch (error) {
            console.warn(`Failed to fetch listing ${id}:`, error);
            return null;
          }
        }),
      );
      setUserListings(listingsData.filter(Boolean));
    } catch (error) {
      console.error("Error fetching user listings:", error);
    }
  }, [marketplaceContract, userAddress]);

  const fetchUserOffers = useCallback(async () => {
    if (!marketplaceContract || !userAddress) return;

    try {
      const offerIds = await marketplaceContract.getUserOffers(userAddress);
      const offersData = await Promise.all(
        offerIds.map(async (id) => {
          try {
            const offer = await marketplaceContract.getOffer(id);
            return { id, ...offer };
          } catch (error) {
            console.warn(`Failed to fetch offer ${id}:`, error);
            return null;
          }
        }),
      );
      setUserOffers(offersData.filter(Boolean));
    } catch (error) {
      console.error("Error fetching user offers:", error);
    }
  }, [marketplaceContract, userAddress]);

  const fetchEscrows = useCallback(async () => {
    if (!escrowContract || !userAddress) return;

    try {
      const escrowIds = await escrowContract.getUserEscrows(userAddress);
      const escrowsData = await Promise.all(
        escrowIds.map(async (id) => {
          try {
            const escrow = await escrowContract.getEscrow(id);
            return { id: id.toNumber(), ...escrow };
          } catch (error) {
            console.warn(`Failed to fetch escrow ${id}:`, error);
            return null;
          }
        }),
      );
      setEscrows(escrowsData.filter(Boolean));
    } catch (error) {
      console.error("Error fetching escrows:", error);
    }
  }, [escrowContract, userAddress]);

  const fetchMarketplaceStats = useCallback(async () => {
    if (!marketplaceContract) return;

    try {
      const [totalListings, totalSales, totalVolume] = await Promise.all([
        marketplaceContract.totalListings(),
        marketplaceContract.totalSales(),
        marketplaceContract.totalVolume(),
      ]);

      setMarketplaceStats({
        totalListings: totalListings.toNumber(),
        totalSales: totalSales.toNumber(),
        totalVolume: ethers.utils.formatEther(totalVolume),
      });
    } catch (error) {
      console.error("Error fetching marketplace stats:", error);
    }
  }, [marketplaceContract]);

  const fetchListings = useCallback(async () => {
    // This would require additional contract methods or events to fetch all listings
    // For now, this is a placeholder
    setListings([]);
  }, []);

  // Fetch data when contracts are available
  useEffect(() => {
    if (marketplaceContract && userAddress) {
      fetchUserListings();
      fetchUserOffers();
      fetchMarketplaceStats();
    }
  }, [
    marketplaceContract,
    userAddress,
    fetchUserListings,
    fetchUserOffers,
    fetchMarketplaceStats,
  ]);

  useEffect(() => {
    if (escrowContract && userAddress) {
      fetchEscrows();
    }
  }, [escrowContract, userAddress, fetchEscrows]);

  // Polling for updates
  useEffect(() => {
    if (!enableRealTimeUpdates || !pollInterval) return;

    const interval = setInterval(() => {
      if (isConnected && !isLoading) {
        fetchUserListings();
        fetchUserOffers();
        fetchEscrows();
        fetchMarketplaceStats();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [
    enableRealTimeUpdates,
    pollInterval,
    isConnected,
    isLoading,
    fetchUserListings,
    fetchUserOffers,
    fetchEscrows,
    fetchMarketplaceStats,
  ]);

  return {
    // Connection state
    isConnected,
    isLoading,
    error,
    userAddress,
    provider,
    signer,

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

    // NFT utility functions
    approveNFT,
    setApprovalForAll,
    getNFTMetadata,

    // Data
    listings,
    userListings,
    userOffers,
    escrows,
    marketplaceStats,

    // Refresh functions
    refresh: useCallback(() => {
      fetchUserListings();
      fetchUserOffers();
      fetchEscrows();
      fetchMarketplaceStats();
    }, [
      fetchUserListings,
      fetchUserOffers,
      fetchEscrows,
      fetchMarketplaceStats,
    ]),
  };
};

export default useERC721Marketplace;

// Additional utility hooks
export const useNFTApproval = (nftContract, tokenId, spender) => {
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkApproval = useCallback(async () => {
    if (
      !nftContract ||
      !tokenId ||
      !spender ||
      typeof window.ethereum === "undefined"
    )
      return;

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(nftContract, ERC721_ABI, provider);

      const approved = await contract.getApproved(tokenId);
      const approvedForAll = await contract.isApprovedForAll(
        await contract.ownerOf(tokenId),
        spender,
      );

      setIsApproved(approved === spender || approvedForAll);
    } catch (error) {
      console.error("Error checking approval:", error);
      setIsApproved(false);
    } finally {
      setLoading(false);
    }
  }, [nftContract, tokenId, spender]);

  useEffect(() => {
    checkApproval();
  }, [checkApproval]);

  return { isApproved, loading, checkApproval };
};

export const useNFTOwnership = (nftContract, tokenId, userAddress) => {
  const [isOwner, setIsOwner] = useState(false);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkOwnership = useCallback(async () => {
    if (!nftContract || !tokenId || typeof window.ethereum === "undefined")
      return;

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(nftContract, ERC721_ABI, provider);

      const tokenOwner = await contract.ownerOf(tokenId);
      setOwner(tokenOwner);
      setIsOwner(tokenOwner?.toLowerCase() === userAddress?.toLowerCase());
    } catch (error) {
      console.error("Error checking ownership:", error);
      setIsOwner(false);
      setOwner(null);
    } finally {
      setLoading(false);
    }
  }, [nftContract, tokenId, userAddress]);

  useEffect(() => {
    checkOwnership();
  }, [checkOwnership]);

  return { isOwner, owner, loading, checkOwnership };
};
