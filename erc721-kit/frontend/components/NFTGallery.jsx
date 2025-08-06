import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const NFTGallery = ({ 
  nfts = [], 
  onNFTClick, 
  loading = false, 
  error = null,
  className = '',
  gridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  showPrices = true,
  showOwner = false
}) => {
  const [imageErrors, setImageErrors] = useState(new Set());

  const handleImageError = (tokenId) => {
    setImageErrors(prev => new Set([...prev, tokenId]));
  };

  const formatPrice = (price) => {
    if (!price) return '';
    try {
      return `${ethers.utils.formatEther(price)} ETH`;
    } catch {
      return price;
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className={`grid ${gridCols} gap-6 ${className}`}>
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-300"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              {showPrices && <div className="h-4 bg-gray-300 rounded w-1/2"></div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading NFTs</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!nfts || nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 7a2 2 0 012-2h10a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No NFTs Found</h3>
        <p className="text-gray-500">No NFTs available to display.</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols} gap-6 ${className}`}>
      {nfts.map((nft) => (
        <div
          key={`${nft.contractAddress}-${nft.tokenId}`}
          className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
          onClick={() => onNFTClick && onNFTClick(nft)}
        >
          {/* NFT Image */}
          <div className="aspect-square relative overflow-hidden bg-gray-100">
            {!imageErrors.has(nft.tokenId) ? (
              <img
                src={nft.image || nft.imageUrl || '/placeholder-nft.png'}
                alt={nft.name || `NFT ${nft.tokenId}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={() => handleImageError(nft.tokenId)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <p className="mt-2 text-sm text-purple-500 font-medium">NFT #{nft.tokenId}</p>
                </div>
              </div>
            )}
            
            {/* Status Badge */}
            {nft.status && (
              <div className="absolute top-3 right-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  nft.status === 'listed' ? 'bg-green-100 text-green-800' :
                  nft.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                  nft.status === 'auction' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {nft.status.charAt(0).toUpperCase() + nft.status.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* NFT Details */}
          <div className="p-4">
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {nft.name || `NFT #${nft.tokenId}`}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {nft.collection || nft.contractName || formatAddress(nft.contractAddress)}
              </p>
            </div>

            {nft.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {nft.description}
              </p>
            )}

            {/* Owner Info */}
            {showOwner && nft.owner && (
              <div className="mb-3">
                <p className="text-xs text-gray-500">
                  Owner: <span className="font-medium">{formatAddress(nft.owner)}</span>
                </p>
              </div>
            )}

            {/* Price and Actions */}
            <div className="flex items-center justify-between">
              {showPrices && nft.price && (
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatPrice(nft.price)}
                  </p>
                </div>
              )}

              {nft.lastSale && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Last Sale</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(nft.lastSale)}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {nft.actions && nft.actions.length > 0 && (
              <div className="mt-4 flex gap-2">
                {nft.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick && action.onClick(nft);
                    }}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      action.variant === 'primary' 
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Filter Component
export const NFTFilter = ({ 
  filters, 
  onFilterChange,
  collections = [],
  priceRange = { min: 0, max: 100 }
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      
      {/* Status Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <div className="space-y-2">
          {['all', 'listed', 'auction', 'sold'].map((status) => (
            <label key={status} className="flex items-center">
              <input
                type="radio"
                name="status"
                value={status}
                checked={filters.status === status}
                onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
                className="mr-2"
              />
              <span className="text-sm capitalize">{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Collection Filter */}
      {collections.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Collection</label>
          <select
            value={filters.collection || ''}
            onChange={(e) => onFilterChange({ ...filters, collection: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Collections</option>
            {collections.map((collection) => (
              <option key={collection.address} value={collection.address}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Price Range Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range (ETH)
        </label>
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Sort Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
        <select
          value={filters.sortBy || 'newest'}
          onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => onFilterChange({})}
        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default NFTGallery;
