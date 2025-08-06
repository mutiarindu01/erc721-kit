import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useWallet } from '../context/WalletContext';
import NFTGallery, { NFTFilter } from '../../../frontend/components/NFTGallery';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';
import SortSelector from '../components/SortSelector';

const MarketplacePage = () => {
  const { 
    marketplace, 
    isMarketplaceLoading, 
    filters, 
    setFilters, 
    searchQuery, 
    setSearchQuery,
    marketplaceData,
    buyNFT,
    addNotification
  } = useApp();
  
  const { isConnected } = useWallet();
  
  const [allNFTs, setAllNFTs] = useState([]);
  const [featuredNFTs, setFeaturedNFTs] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Mock data for demonstration
  useEffect(() => {
    const fetchMarketplaceData = async () => {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock NFT data
        const mockNFTs = [
          {
            id: '1',
            name: 'Cosmic Cat #1234',
            description: 'A rare cosmic cat floating through space',
            image: 'https://picsum.photos/400/400?random=1',
            price: '2.5',
            contractAddress: '0x123...abc',
            tokenId: '1234',
            owner: '0x456...def',
            creator: '0x789...ghi',
            collection: 'Cosmic Cats',
            status: 'listed',
            lastSale: '2.0',
            attributes: [
              { trait_type: 'Background', value: 'Space' },
              { trait_type: 'Color', value: 'Purple' },
              { trait_type: 'Rarity', value: 'Rare' }
            ],
            actions: [
              { 
                label: 'Buy Now', 
                variant: 'primary',
                onClick: (nft) => handleBuyNFT(nft)
              },
              { 
                label: 'Make Offer', 
                variant: 'secondary',
                onClick: (nft) => handleMakeOffer(nft)
              }
            ]
          },
          {
            id: '2',
            name: 'Digital Landscape #567',
            description: 'Beautiful digital landscape with vibrant colors',
            image: 'https://picsum.photos/400/400?random=2',
            price: '1.8',
            contractAddress: '0x123...abc',
            tokenId: '567',
            owner: '0x456...def',
            creator: '0x789...ghi',
            collection: 'Digital Landscapes',
            status: 'listed',
            lastSale: '1.5',
            attributes: [
              { trait_type: 'Style', value: 'Abstract' },
              { trait_type: 'Color Palette', value: 'Vibrant' },
              { trait_type: 'Size', value: 'Large' }
            ],
            actions: [
              { 
                label: 'Buy Now', 
                variant: 'primary',
                onClick: (nft) => handleBuyNFT(nft)
              },
              { 
                label: 'Make Offer', 
                variant: 'secondary',
                onClick: (nft) => handleMakeOffer(nft)
              }
            ]
          },
          {
            id: '3',
            name: 'Abstract Art #890',
            description: 'Modern abstract art piece with geometric shapes',
            image: 'https://picsum.photos/400/400?random=3',
            price: '0.75',
            contractAddress: '0x123...abc',
            tokenId: '890',
            owner: '0x456...def',
            creator: '0x789...ghi',
            collection: 'Abstract Collection',
            status: 'auction',
            lastSale: '0.5',
            attributes: [
              { trait_type: 'Style', value: 'Geometric' },
              { trait_type: 'Era', value: 'Modern' },
              { trait_type: 'Complexity', value: 'High' }
            ],
            actions: [
              { 
                label: 'Place Bid', 
                variant: 'primary',
                onClick: (nft) => handlePlaceBid(nft)
              }
            ]
          },
          // Add more mock NFTs...
          ...Array.from({ length: 20 }, (_, i) => ({
            id: `${i + 4}`,
            name: `NFT Collection #${i + 4}`,
            description: `Description for NFT #${i + 4}`,
            image: `https://picsum.photos/400/400?random=${i + 4}`,
            price: (Math.random() * 5 + 0.1).toFixed(2),
            contractAddress: '0x123...abc',
            tokenId: `${i + 4}`,
            owner: '0x456...def',
            creator: '0x789...ghi',
            collection: ['Cosmic Cats', 'Digital Landscapes', 'Abstract Collection'][i % 3],
            status: ['listed', 'auction', 'sold'][i % 3],
            lastSale: (Math.random() * 3 + 0.1).toFixed(2),
            attributes: [
              { trait_type: 'Rarity', value: ['Common', 'Rare', 'Epic', 'Legendary'][i % 4] },
              { trait_type: 'Type', value: ['Art', 'Photography', 'Music', 'Video'][i % 4] }
            ],
            actions: i % 3 === 2 ? [] : [
              { 
                label: i % 3 === 1 ? 'Place Bid' : 'Buy Now', 
                variant: 'primary',
                onClick: (nft) => i % 3 === 1 ? handlePlaceBid(nft) : handleBuyNFT(nft)
              }
            ]
          }))
        ];

        setAllNFTs(mockNFTs);
        setFeaturedNFTs(mockNFTs.slice(0, 3));
        
        // Mock collections
        const mockCollections = [
          { name: 'Cosmic Cats', address: '0x123...abc', volume: '1,234', floorPrice: '0.5' },
          { name: 'Digital Landscapes', address: '0x456...def', volume: '892', floorPrice: '0.3' },
          { name: 'Abstract Collection', address: '0x789...ghi', volume: '567', floorPrice: '0.2' }
        ];
        
        setCollections(mockCollections);
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplaceData();
  }, []);

  // Filter and sort NFTs
  const filteredAndSortedNFTs = useMemo(() => {
    let filtered = allNFTs;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(nft =>
        nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.collection.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(nft => nft.status === filters.status);
    }

    // Price range filter
    if (filters.priceRange.min || filters.priceRange.max) {
      filtered = filtered.filter(nft => {
        const price = parseFloat(nft.price);
        const min = filters.priceRange.min ? parseFloat(filters.priceRange.min) : 0;
        const max = filters.priceRange.max ? parseFloat(filters.priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Collection filter
    if (filters.collections && filters.collections.length > 0) {
      filtered = filtered.filter(nft => filters.collections.includes(nft.collection));
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        filtered = filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-high':
        filtered = filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'name':
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'oldest':
        filtered = filtered.sort((a, b) => a.id - b.id);
        break;
      default: // newest
        filtered = filtered.sort((a, b) => b.id - a.id);
    }

    return filtered;
  }, [allNFTs, searchQuery, filters]);

  // Action handlers
  const handleBuyNFT = async (nft) => {
    if (!isConnected) {
      addNotification({
        type: 'warning',
        title: 'Wallet Required',
        message: 'Please connect your wallet to buy NFTs'
      });
      return;
    }

    const success = await buyNFT(nft.listingId, nft.price);
    if (success) {
      // Update NFT status locally
      setAllNFTs(prev => prev.map(n => 
        n.id === nft.id ? { ...n, status: 'sold' } : n
      ));
    }
  };

  const handleMakeOffer = (nft) => {
    if (!isConnected) {
      addNotification({
        type: 'warning',
        title: 'Wallet Required',
        message: 'Please connect your wallet to make offers'
      });
      return;
    }
    
    // Open offer modal (would be implemented)
    addNotification({
      type: 'info',
      title: 'Feature Coming Soon',
      message: 'Offer functionality will be available soon'
    });
  };

  const handlePlaceBid = (nft) => {
    if (!isConnected) {
      addNotification({
        type: 'warning',
        title: 'Wallet Required',
        message: 'Please connect your wallet to place bids'
      });
      return;
    }
    
    // Open bidding modal (would be implemented)
    addNotification({
      type: 'info',
      title: 'Feature Coming Soon',
      message: 'Auction bidding will be available soon'
    });
  };

  const handleNFTClick = (nft) => {
    // Navigate to NFT detail page
    window.location.href = `/nft/${nft.contractAddress}/${nft.tokenId}`;
  };

  if (loading || isMarketplaceLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="large" message="Loading marketplace..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          NFT Marketplace
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Discover, collect, and trade unique digital assets on our decentralized marketplace.
        </p>
      </div>

      {/* Marketplace Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {marketplaceData.stats.totalListings}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {marketplaceData.stats.totalSales}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Sales</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {marketplaceData.stats.totalVolume} ETH
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Volume</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {marketplaceData.stats.floorPrice} ETH
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Floor Price</div>
        </div>
      </div>

      {/* Featured NFTs */}
      {featuredNFTs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Featured NFTs</h2>
          <NFTGallery
            nfts={featuredNFTs}
            onNFTClick={handleNFTClick}
            gridCols="grid-cols-1 md:grid-cols-3"
            showPrices={true}
            className="mb-8"
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="lg:w-1/4">
          <div className="sticky top-24">
            <NFTFilter
              filters={filters}
              onFilterChange={setFilters}
              collections={collections}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          {/* Search and Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search NFTs, collections, or creators..."
              />
            </div>
            <div className="flex items-center gap-4">
              <SortSelector
                value={filters.sortBy}
                onChange={(sortBy) => setFilters({ ...filters, sortBy })}
              />
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  ⊞
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400">
              Showing {filteredAndSortedNFTs.length} of {allNFTs.length} items
            </p>
          </div>

          {/* NFT Grid */}
          <NFTGallery
            nfts={filteredAndSortedNFTs}
            onNFTClick={handleNFTClick}
            loading={loading}
            gridCols={viewMode === 'grid' 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
            }
            showPrices={true}
            showOwner={false}
          />

          {/* Empty State */}
          {filteredAndSortedNFTs.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <span className="text-6xl">🔍</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No NFTs Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({
                    priceRange: { min: '', max: '' },
                    status: 'all',
                    sortBy: 'newest',
                    collections: [],
                    attributes: {},
                  });
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
