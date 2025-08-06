import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useApp } from '../context/AppContext';
import WalletConnector from './WalletConnector';
import NotificationSystem from './NotificationSystem';
import ThemeToggle from './ThemeToggle';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isConnected, account, formatAddress, chainId, isNetworkSupported } = useWallet();
  const { notifications, theme } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/marketplace', label: 'Marketplace', icon: '🛒' },
    { path: '/my-nfts', label: 'My NFTs', icon: '🎨', requiresAuth: true },
    { path: '/mint', label: 'Mint', icon: '✨', requiresAuth: true },
    { path: '/escrow', label: 'Escrow', icon: '🔒', requiresAuth: true },
  ];

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <span className="font-bold text-xl text-gray-900 dark:text-white">
                  NFT Kit
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => {
                if (item.requiresAuth && !isConnected) return null;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActivePath(item.path)
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Network Status */}
              {isConnected && (
                <div className="hidden sm:flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${
                    isNetworkSupported(chainId) ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isNetworkSupported(chainId) ? 'Connected' : 'Wrong Network'}
                  </span>
                </div>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              {notifications.length > 0 && (
                <div className="relative">
                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                    <span className="sr-only">Notifications</span>
                    🔔
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {notifications.length}
                    </span>
                  </button>
                </div>
              )}

              {/* Wallet Connection */}
              <WalletConnector />

              {/* Profile Button (when connected) */}
              {isConnected && (
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {account ? account.slice(2, 4).toUpperCase() : '??'}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatAddress(account)}
                  </span>
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              >
                <span className="sr-only">Open menu</span>
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800">
              {navigationItems.map((item) => {
                if (item.requiresAuth && !isConnected) return null;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActivePath(item.path)
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Network Warning */}
      {isConnected && !isNetworkSupported(chainId) && (
        <div className="bg-red-50 dark:bg-red-900 border-b border-red-200 dark:border-red-700">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  You're connected to an unsupported network. Please switch to a supported network.
                </p>
              </div>
              <button
                onClick={() => {/* Handle network switch */}}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm font-medium"
              >
                Switch Network
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                About
              </h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">
                A comprehensive NFT marketplace built with ERC721 Kit, featuring secure escrow and trading.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Marketplace
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/marketplace" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm">
                    Browse NFTs
                  </Link>
                </li>
                <li>
                  <Link to="/mint" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm">
                    Create NFT
                  </Link>
                </li>
                <li>
                  <Link to="/escrow" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm">
                    Escrow Services
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Resources
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Community
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
              © 2024 NFT Kit. Built with ERC721 Kit. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Notification System */}
      <NotificationSystem />
    </div>
  );
};

export default Layout;
