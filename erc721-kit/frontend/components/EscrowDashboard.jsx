import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const EscrowDashboard = ({
  userAddress,
  escrows = [],
  onApproveEscrow,
  onCancelEscrow,
  onInitiateDispute,
  onCreateEscrow,
  loading = false,
  error = null,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filteredEscrows, setFilteredEscrows] = useState([]);

  useEffect(() => {
    let filtered = escrows;
    
    switch (activeTab) {
      case 'buyer':
        filtered = escrows.filter(escrow => escrow.buyer?.toLowerCase() === userAddress?.toLowerCase());
        break;
      case 'seller':
        filtered = escrows.filter(escrow => escrow.seller?.toLowerCase() === userAddress?.toLowerCase());
        break;
      case 'active':
        filtered = escrows.filter(escrow => escrow.status === 'Active');
        break;
      case 'completed':
        filtered = escrows.filter(escrow => escrow.status === 'Completed');
        break;
      case 'disputed':
        filtered = escrows.filter(escrow => escrow.status === 'Disputed');
        break;
      default:
        filtered = escrows;
    }
    
    setFilteredEscrows(filtered.sort((a, b) => b.createdAt - a.createdAt));
  }, [escrows, activeTab, userAddress]);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price) => {
    if (!price) return '0';
    try {
      return ethers.utils.formatEther(price);
    } catch {
      return price.toString();
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'Disputed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canApprove = (escrow) => {
    if (escrow.status !== 'Active') return false;
    const isBuyer = escrow.buyer?.toLowerCase() === userAddress?.toLowerCase();
    const isSeller = escrow.seller?.toLowerCase() === userAddress?.toLowerCase();
    
    if (isBuyer && !escrow.buyerApproved) return true;
    if (isSeller && !escrow.sellerApproved) return true;
    return false;
  };

  const canCancel = (escrow) => {
    if (escrow.status !== 'Active') return false;
    const isParticipant = 
      escrow.buyer?.toLowerCase() === userAddress?.toLowerCase() ||
      escrow.seller?.toLowerCase() === userAddress?.toLowerCase();
    return isParticipant;
  };

  const canDispute = (escrow) => {
    if (escrow.status !== 'Active') return false;
    const isParticipant = 
      escrow.buyer?.toLowerCase() === userAddress?.toLowerCase() ||
      escrow.seller?.toLowerCase() === userAddress?.toLowerCase();
    return isParticipant;
  };

  const tabs = [
    { id: 'all', label: 'All Escrows', count: escrows.length },
    { id: 'buyer', label: 'As Buyer', count: escrows.filter(e => e.buyer?.toLowerCase() === userAddress?.toLowerCase()).length },
    { id: 'seller', label: 'As Seller', count: escrows.filter(e => e.seller?.toLowerCase() === userAddress?.toLowerCase()).length },
    { id: 'active', label: 'Active', count: escrows.filter(e => e.status === 'Active').length },
    { id: 'completed', label: 'Completed', count: escrows.filter(e => e.status === 'Completed').length },
    { id: 'disputed', label: 'Disputed', count: escrows.filter(e => e.status === 'Disputed').length },
  ];

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Escrows</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Escrow Dashboard</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Create Escrow
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Escrows List */}
      <div className="p-6">
        {filteredEscrows.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Escrows Found</h3>
            <p className="text-gray-500">
              {activeTab === 'all' 
                ? 'No escrow transactions found.' 
                : `No ${activeTab} escrows found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEscrows.map((escrow) => (
              <div key={escrow.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                {/* Escrow Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      Escrow #{escrow.id}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(escrow.status)}`}>
                      {escrow.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatPrice(escrow.price)} ETH
                    </p>
                    <p className="text-sm text-gray-500">
                      Created: {formatDate(escrow.createdAt)}
                    </p>
                  </div>
                </div>

                {/* NFT Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">NFT Contract</p>
                      <p className="text-sm text-gray-900 font-mono">{formatAddress(escrow.nftContract)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Token ID</p>
                      <p className="text-sm text-gray-900">#{escrow.tokenId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Deadline</p>
                      <p className="text-sm text-gray-900">{formatDate(escrow.deadline)}</p>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Seller</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 font-mono">{formatAddress(escrow.seller)}</span>
                      {escrow.sellerApproved && (
                        <span className="text-green-600">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Buyer</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 font-mono">{formatAddress(escrow.buyer)}</span>
                      {escrow.buyerApproved && (
                        <span className="text-green-600">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {escrow.status === 'Active' && (
                  <div className="flex flex-wrap gap-2">
                    {canApprove(escrow) && (
                      <button
                        onClick={() => onApproveEscrow(escrow.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {canCancel(escrow) && (
                      <button
                        onClick={() => onCancelEscrow(escrow.id)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {canDispute(escrow) && (
                      <button
                        onClick={() => onInitiateDispute(escrow.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Dispute
                      </button>
                    )}
                  </div>
                )}

                {/* Progress Indicator */}
                {escrow.status === 'Active' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>
                        {(escrow.sellerApproved ? 1 : 0) + (escrow.buyerApproved ? 1 : 0)}/2 approvals
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${((escrow.sellerApproved ? 1 : 0) + (escrow.buyerApproved ? 1 : 0)) * 50}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Escrow Modal */}
      {showCreateModal && (
        <CreateEscrowModal
          onClose={() => setShowCreateModal(false)}
          onCreate={onCreateEscrow}
          userAddress={userAddress}
        />
      )}
    </div>
  );
};

// Create Escrow Modal Component
const CreateEscrowModal = ({ onClose, onCreate, userAddress }) => {
  const [formData, setFormData] = useState({
    buyer: '',
    nftContract: '',
    tokenId: '',
    price: '',
    duration: '7' // days
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!ethers.utils.isAddress(formData.buyer)) {
      newErrors.buyer = 'Invalid buyer address';
    }
    if (!ethers.utils.isAddress(formData.nftContract)) {
      newErrors.nftContract = 'Invalid contract address';
    }
    if (!formData.tokenId || isNaN(formData.tokenId)) {
      newErrors.tokenId = 'Invalid token ID';
    }
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Invalid price';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onCreate({
        buyer: formData.buyer,
        nftContract: formData.nftContract,
        tokenId: formData.tokenId,
        price: ethers.utils.parseEther(formData.price),
        duration: parseInt(formData.duration) * 24 * 60 * 60 // Convert days to seconds
      });
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Create New Escrow</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Buyer Address</label>
            <input
              type="text"
              value={formData.buyer}
              onChange={(e) => setFormData(prev => ({ ...prev, buyer: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0x..."
            />
            {errors.buyer && <p className="text-sm text-red-600 mt-1">{errors.buyer}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">NFT Contract</label>
            <input
              type="text"
              value={formData.nftContract}
              onChange={(e) => setFormData(prev => ({ ...prev, nftContract: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0x..."
            />
            {errors.nftContract && <p className="text-sm text-red-600 mt-1">{errors.nftContract}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Token ID</label>
            <input
              type="number"
              value={formData.tokenId}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenId: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {errors.tokenId && <p className="text-sm text-red-600 mt-1">{errors.tokenId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price (ETH)</label>
            <input
              type="number"
              step="0.0001"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (days)</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>

          {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Escrow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EscrowDashboard;
