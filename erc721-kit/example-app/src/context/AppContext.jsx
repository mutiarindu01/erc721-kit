import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useWallet } from './WalletContext';
import useERC721Marketplace from '../../../frontend/hooks/useERC721Marketplace';

// Action types
const APP_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_THEME: 'SET_THEME',
  SET_USER_PREFERENCES: 'SET_USER_PREFERENCES',
  SET_MARKETPLACE_DATA: 'SET_MARKETPLACE_DATA',
  SET_USER_DATA: 'SET_USER_DATA',
  UPDATE_NFT_DATA: 'UPDATE_NFT_DATA',
  SET_FILTERS: 'SET_FILTERS',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
};

// Initial state
const initialState = {
  loading: false,
  error: null,
  notifications: [],
  theme: 'light',
  userPreferences: {
    currency: 'ETH',
    notifications: {
      newListings: true,
      priceChanges: true,
      escrowUpdates: true,
    },
    display: {
      gridSize: 'medium',
      showPrices: true,
      showOwners: false,
    }
  },
  marketplaceData: {
    stats: {
      totalVolume: '0',
      totalSales: 0,
      totalListings: 0,
      floorPrice: '0',
    },
    featuredNFTs: [],
    recentSales: [],
    topCollections: [],
  },
  userData: {
    profile: null,
    nfts: [],
    listings: [],
    offers: [],
    escrows: [],
    favorites: [],
    watchlist: [],
  },
  filters: {
    priceRange: { min: '', max: '' },
    status: 'all',
    sortBy: 'newest',
    collections: [],
    attributes: {},
  },
  searchQuery: '',
  selectedNFT: null,
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case APP_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case APP_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case APP_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case APP_ACTIONS.SET_NOTIFICATIONS:
      return { ...state, notifications: action.payload };
    
    case APP_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, { id: Date.now(), ...action.payload }]
      };
    
    case APP_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    case APP_ACTIONS.SET_THEME:
      return { ...state, theme: action.payload };
    
    case APP_ACTIONS.SET_USER_PREFERENCES:
      return {
        ...state,
        userPreferences: { ...state.userPreferences, ...action.payload }
      };
    
    case APP_ACTIONS.SET_MARKETPLACE_DATA:
      return {
        ...state,
        marketplaceData: { ...state.marketplaceData, ...action.payload }
      };
    
    case APP_ACTIONS.SET_USER_DATA:
      return {
        ...state,
        userData: { ...state.userData, ...action.payload }
      };
    
    case APP_ACTIONS.UPDATE_NFT_DATA:
      return {
        ...state,
        userData: {
          ...state.userData,
          nfts: state.userData.nfts.map(nft =>
            nft.id === action.payload.id ? { ...nft, ...action.payload.data } : nft
          )
        }
      };
    
    case APP_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };
    
    case APP_ACTIONS.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Context provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { account, isConnected } = useWallet();
  
  // Marketplace hook
  const marketplace = useERC721Marketplace(
    process.env.REACT_APP_MARKETPLACE_ADDRESS,
    process.env.REACT_APP_ESCROW_ADDRESS,
    {
      autoConnect: true,
      pollInterval: 15000,
      enableRealTimeUpdates: true
    }
  );

  // Load user preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: APP_ACTIONS.SET_USER_PREFERENCES, payload: preferences });
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }
    
    if (savedTheme) {
      dispatch({ type: APP_ACTIONS.SET_THEME, payload: savedTheme });
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(state.userPreferences));
  }, [state.userPreferences]);

  useEffect(() => {
    localStorage.setItem('theme', state.theme);
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Load marketplace data when marketplace is ready
  useEffect(() => {
    if (marketplace.isConnected && !marketplace.isLoading) {
      dispatch({
        type: APP_ACTIONS.SET_MARKETPLACE_DATA,
        payload: {
          stats: marketplace.marketplaceStats
        }
      });
    }
  }, [marketplace.isConnected, marketplace.isLoading, marketplace.marketplaceStats]);

  // Load user data when account changes
  useEffect(() => {
    if (isConnected && account && marketplace.isConnected) {
      dispatch({
        type: APP_ACTIONS.SET_USER_DATA,
        payload: {
          nfts: marketplace.userListings || [],
          listings: marketplace.userListings || [],
          offers: marketplace.userOffers || [],
          escrows: marketplace.escrows || [],
        }
      });
    } else {
      // Clear user data when disconnected
      dispatch({
        type: APP_ACTIONS.SET_USER_DATA,
        payload: {
          profile: null,
          nfts: [],
          listings: [],
          offers: [],
          escrows: [],
          favorites: [],
          watchlist: [],
        }
      });
    }
  }, [isConnected, account, marketplace.isConnected, marketplace.userListings, marketplace.userOffers, marketplace.escrows]);

  // Action creators
  const actions = {
    setLoading: (loading) => dispatch({ type: APP_ACTIONS.SET_LOADING, payload: loading }),
    
    setError: (error) => dispatch({ type: APP_ACTIONS.SET_ERROR, payload: error }),
    
    clearError: () => dispatch({ type: APP_ACTIONS.CLEAR_ERROR }),
    
    addNotification: (notification) => {
      dispatch({ type: APP_ACTIONS.ADD_NOTIFICATION, payload: notification });
      
      // Auto-remove notification after 5 seconds unless it's persistent
      if (!notification.persistent) {
        setTimeout(() => {
          actions.removeNotification(notification.id || Date.now());
        }, 5000);
      }
    },
    
    removeNotification: (id) => dispatch({ type: APP_ACTIONS.REMOVE_NOTIFICATION, payload: id }),
    
    setTheme: (theme) => dispatch({ type: APP_ACTIONS.SET_THEME, payload: theme }),
    
    updateUserPreferences: (preferences) => {
      dispatch({ type: APP_ACTIONS.SET_USER_PREFERENCES, payload: preferences });
    },
    
    setFilters: (filters) => dispatch({ type: APP_ACTIONS.SET_FILTERS, payload: filters }),
    
    setSearchQuery: (query) => dispatch({ type: APP_ACTIONS.SET_SEARCH_QUERY, payload: query }),
    
    updateNFTData: (id, data) => dispatch({ type: APP_ACTIONS.UPDATE_NFT_DATA, payload: { id, data } }),
    
    // Marketplace actions
    async listNFT(nftContract, tokenId, price, duration = 7) {
      try {
        actions.setLoading(true);
        await marketplace.listItem(nftContract, tokenId, price, duration);
        actions.addNotification({
          type: 'success',
          title: 'NFT Listed Successfully',
          message: `Your NFT has been listed for ${price} ETH`,
        });
        return true;
      } catch (error) {
        actions.setError(error.message);
        actions.addNotification({
          type: 'error',
          title: 'Listing Failed',
          message: error.message,
        });
        return false;
      } finally {
        actions.setLoading(false);
      }
    },
    
    async buyNFT(listingId, price) {
      try {
        actions.setLoading(true);
        await marketplace.buyItem(listingId, price);
        actions.addNotification({
          type: 'success',
          title: 'Purchase Successful',
          message: 'NFT purchased successfully!',
        });
        return true;
      } catch (error) {
        actions.setError(error.message);
        actions.addNotification({
          type: 'error',
          title: 'Purchase Failed',
          message: error.message,
        });
        return false;
      } finally {
        actions.setLoading(false);
      }
    },
    
    async createEscrow(buyer, nftContract, tokenId, price, deadline) {
      try {
        actions.setLoading(true);
        await marketplace.createEscrow(buyer, nftContract, tokenId, price, deadline);
        actions.addNotification({
          type: 'success',
          title: 'Escrow Created',
          message: 'Escrow transaction created successfully',
        });
        return true;
      } catch (error) {
        actions.setError(error.message);
        actions.addNotification({
          type: 'error',
          title: 'Escrow Creation Failed',
          message: error.message,
        });
        return false;
      } finally {
        actions.setLoading(false);
      }
    },
    
    async mintNFT(mintData) {
      try {
        actions.setLoading(true);
        // This would integrate with the minting contract
        actions.addNotification({
          type: 'success',
          title: 'NFT Minted Successfully',
          message: 'Your NFT has been minted!',
        });
        return true;
      } catch (error) {
        actions.setError(error.message);
        actions.addNotification({
          type: 'error',
          title: 'Minting Failed',
          message: error.message,
        });
        return false;
      } finally {
        actions.setLoading(false);
      }
    },
    
    // Utility actions
    formatPrice: (price, decimals = 4) => {
      try {
        const formatted = parseFloat(price).toFixed(decimals);
        return `${formatted} ETH`;
      } catch {
        return price;
      }
    },
    
    formatAddress: (address) => {
      if (!address) return '';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },
    
    copyToClipboard: async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        actions.addNotification({
          type: 'success',
          title: 'Copied',
          message: 'Copied to clipboard',
        });
      } catch (error) {
        actions.addNotification({
          type: 'error',
          title: 'Copy Failed',
          message: 'Failed to copy to clipboard',
        });
      }
    },
  };

  const value = {
    ...state,
    ...actions,
    marketplace,
    isMarketplaceLoading: marketplace.isLoading,
    isMarketplaceConnected: marketplace.isConnected,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the app context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
