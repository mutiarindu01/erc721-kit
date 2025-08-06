import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";

// Supported wallet types
const WALLET_TYPES = {
  METAMASK: "metamask",
  WALLETCONNECT: "walletconnect",
  COINBASE: "coinbase",
  INJECTED: "injected",
};

// Network configurations
const SUPPORTED_NETWORKS = {
  1: {
    name: "Ethereum Mainnet",
    chainId: "0x1",
    rpcUrls: ["https://mainnet.infura.io/v3/"],
    blockExplorerUrls: ["https://etherscan.io"],
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  },
  5: {
    name: "Goerli Testnet",
    chainId: "0x5",
    rpcUrls: ["https://goerli.infura.io/v3/"],
    blockExplorerUrls: ["https://goerli.etherscan.io"],
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  },
  11155111: {
    name: "Sepolia Testnet",
    chainId: "0xaa36a7",
    rpcUrls: ["https://sepolia.infura.io/v3/"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  },
  137: {
    name: "Polygon Mainnet",
    chainId: "0x89",
    rpcUrls: ["https://polygon-mainnet.infura.io/v3/"],
    blockExplorerUrls: ["https://polygonscan.com"],
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  },
  80001: {
    name: "Polygon Mumbai",
    chainId: "0x13881",
    rpcUrls: ["https://polygon-mumbai.infura.io/v3/"],
    blockExplorerUrls: ["https://mumbai.polygonscan.com"],
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  },
};

// Action types
const WALLET_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_CONNECTED: "SET_CONNECTED",
  SET_ACCOUNT: "SET_ACCOUNT",
  SET_CHAIN_ID: "SET_CHAIN_ID",
  SET_BALANCE: "SET_BALANCE",
  SET_PROVIDER: "SET_PROVIDER",
  SET_SIGNER: "SET_SIGNER",
  SET_ERROR: "SET_ERROR",
  SET_WALLET_TYPE: "SET_WALLET_TYPE",
  CLEAR_WALLET_DATA: "CLEAR_WALLET_DATA",
  SET_ENS_NAME: "SET_ENS_NAME",
};

// Initial state
const initialState = {
  isConnected: false,
  isLoading: false,
  account: null,
  chainId: null,
  balance: "0",
  provider: null,
  signer: null,
  error: null,
  walletType: null,
  ensName: null,
  supportedNetworks: SUPPORTED_NETWORKS,
};

// Reducer
function walletReducer(state, action) {
  switch (action.type) {
    case WALLET_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case WALLET_ACTIONS.SET_CONNECTED:
      return { ...state, isConnected: action.payload };

    case WALLET_ACTIONS.SET_ACCOUNT:
      return { ...state, account: action.payload };

    case WALLET_ACTIONS.SET_CHAIN_ID:
      return { ...state, chainId: action.payload };

    case WALLET_ACTIONS.SET_BALANCE:
      return { ...state, balance: action.payload };

    case WALLET_ACTIONS.SET_PROVIDER:
      return { ...state, provider: action.payload };

    case WALLET_ACTIONS.SET_SIGNER:
      return { ...state, signer: action.payload };

    case WALLET_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case WALLET_ACTIONS.SET_WALLET_TYPE:
      return { ...state, walletType: action.payload };

    case WALLET_ACTIONS.SET_ENS_NAME:
      return { ...state, ensName: action.payload };

    case WALLET_ACTIONS.CLEAR_WALLET_DATA:
      return {
        ...initialState,
        supportedNetworks: state.supportedNetworks,
      };

    default:
      return state;
  }
}

// Create context
const WalletContext = createContext();

// Provider component
export function WalletProvider({ children }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Helper functions
  const setLoading = (loading) =>
    dispatch({ type: WALLET_ACTIONS.SET_LOADING, payload: loading });
  const setError = (error) =>
    dispatch({ type: WALLET_ACTIONS.SET_ERROR, payload: error });
  const clearError = () =>
    dispatch({ type: WALLET_ACTIONS.SET_ERROR, payload: null });

  // Check if wallet is installed
  const isWalletInstalled = useCallback((walletType) => {
    switch (walletType) {
      case WALLET_TYPES.METAMASK:
        return (
          typeof window !== "undefined" &&
          window.ethereum &&
          window.ethereum.isMetaMask
        );
      case WALLET_TYPES.COINBASE:
        return (
          typeof window !== "undefined" &&
          window.ethereum &&
          window.ethereum.isCoinbaseWallet
        );
      case WALLET_TYPES.INJECTED:
        return typeof window !== "undefined" && window.ethereum;
      default:
        return false;
    }
  }, []);

  // Get provider for wallet type
  const getProvider = useCallback((walletType) => {
    if (typeof window === "undefined") return null;

    switch (walletType) {
      case WALLET_TYPES.METAMASK:
        if (window.ethereum?.isMetaMask) {
          return new ethers.providers.Web3Provider(window.ethereum);
        }
        break;
      case WALLET_TYPES.COINBASE:
        if (window.ethereum?.isCoinbaseWallet) {
          return new ethers.providers.Web3Provider(window.ethereum);
        }
        break;
      case WALLET_TYPES.INJECTED:
        if (window.ethereum) {
          return new ethers.providers.Web3Provider(window.ethereum);
        }
        break;
      default:
        return null;
    }
    return null;
  }, []);

  // Connect wallet
  const connectWallet = useCallback(
    async (walletType = WALLET_TYPES.METAMASK) => {
      try {
        setLoading(true);
        clearError();

        if (!isWalletInstalled(walletType)) {
          throw new Error(`${walletType} wallet is not installed`);
        }

        const provider = getProvider(walletType);
        if (!provider) {
          throw new Error("Unable to get provider");
        }

        // Request account access
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const account = await signer.getAddress();
        const network = await provider.getNetwork();
        const balance = await provider.getBalance(account);

        // Update state
        dispatch({ type: WALLET_ACTIONS.SET_PROVIDER, payload: provider });
        dispatch({ type: WALLET_ACTIONS.SET_SIGNER, payload: signer });
        dispatch({ type: WALLET_ACTIONS.SET_ACCOUNT, payload: account });
        dispatch({
          type: WALLET_ACTIONS.SET_CHAIN_ID,
          payload: network.chainId,
        });
        dispatch({
          type: WALLET_ACTIONS.SET_BALANCE,
          payload: ethers.utils.formatEther(balance),
        });
        dispatch({ type: WALLET_ACTIONS.SET_WALLET_TYPE, payload: walletType });
        dispatch({ type: WALLET_ACTIONS.SET_CONNECTED, payload: true });

        // Try to resolve ENS name
        try {
          const ensName = await provider.lookupAddress(account);
          dispatch({ type: WALLET_ACTIONS.SET_ENS_NAME, payload: ensName });
        } catch (ensError) {
          // ENS lookup failed, ignore
        }

        // Save connection to localStorage
        localStorage.setItem("walletConnected", "true");
        localStorage.setItem("walletType", walletType);

        return true;
      } catch (error) {
        console.error("Wallet connection error:", error);
        setError(error.message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isWalletInstalled, getProvider],
  );

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    dispatch({ type: WALLET_ACTIONS.CLEAR_WALLET_DATA });
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletType");
  }, []);

  // Switch network
  const switchNetwork = useCallback(
    async (chainId) => {
      try {
        setLoading(true);

        if (!state.provider) {
          throw new Error("No provider available");
        }

        const network = SUPPORTED_NETWORKS[chainId];
        if (!network) {
          throw new Error("Unsupported network");
        }

        await state.provider.send("wallet_switchEthereumChain", [
          { chainId: network.chainId },
        ]);

        return true;
      } catch (error) {
        // If network doesn't exist, try to add it
        if (error.code === 4902) {
          try {
            const network = SUPPORTED_NETWORKS[chainId];
            await state.provider.send("wallet_addEthereumChain", [network]);
            return true;
          } catch (addError) {
            setError(addError.message);
            return false;
          }
        } else {
          setError(error.message);
          return false;
        }
      } finally {
        setLoading(false);
      }
    },
    [state.provider],
  );

  // Add token to wallet
  const addTokenToWallet = useCallback(
    async (tokenAddress, tokenSymbol, tokenDecimals = 18, tokenImage) => {
      try {
        if (!state.provider) {
          throw new Error("No provider available");
        }

        await state.provider.send("wallet_watchAsset", [
          {
            type: "ERC20",
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: tokenDecimals,
              image: tokenImage,
            },
          },
        ]);

        return true;
      } catch (error) {
        setError(error.message);
        return false;
      }
    },
    [state.provider],
  );

  // Update balance
  const updateBalance = useCallback(async () => {
    if (state.provider && state.account) {
      try {
        const balance = await state.provider.getBalance(state.account);
        dispatch({
          type: WALLET_ACTIONS.SET_BALANCE,
          payload: ethers.utils.formatEther(balance),
        });
      } catch (error) {
        console.error("Balance update error:", error);
      }
    }
  }, [state.provider, state.account]);

  // Check if network is supported
  const isNetworkSupported = useCallback((chainId) => {
    return chainId in SUPPORTED_NETWORKS;
  }, []);

  // Get network info
  const getNetworkInfo = useCallback((chainId) => {
    return SUPPORTED_NETWORKS[chainId] || null;
  }, []);

  // Format address
  const formatAddress = useCallback((address, length = 4) => {
    if (!address) return "";
    return `${address.slice(0, 2 + length)}...${address.slice(-length)}`;
  }, []);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem("walletConnected");
    const savedWalletType = localStorage.getItem("walletType");

    if (wasConnected === "true" && savedWalletType) {
      connectWallet(savedWalletType);
    }
  }, [connectWallet]);

  // Listen for account/network changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== state.account) {
        dispatch({ type: WALLET_ACTIONS.SET_ACCOUNT, payload: accounts[0] });
        updateBalance();
      }
    };

    const handleChainChanged = (chainId) => {
      const numericChainId = parseInt(chainId, 16);
      dispatch({ type: WALLET_ACTIONS.SET_CHAIN_ID, payload: numericChainId });
      updateBalance();
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged,
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, [state.account, disconnectWallet, updateBalance]);

  // Update balance periodically
  useEffect(() => {
    if (state.isConnected && state.account) {
      const interval = setInterval(updateBalance, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [state.isConnected, state.account, updateBalance]);

  const value = {
    ...state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    addTokenToWallet,
    updateBalance,
    isNetworkSupported,
    getNetworkInfo,
    formatAddress,
    isWalletInstalled,
    clearError,
    WALLET_TYPES,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

// Custom hook
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

export default WalletContext;
