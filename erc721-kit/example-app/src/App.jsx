import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "./context/AppContext";
import { WalletProvider } from "./context/WalletContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import MarketplacePage from "./pages/MarketplacePage";
import MyNFTsPage from "./pages/MyNFTsPage";
import MintPage from "./pages/MintPage";
import EscrowPage from "./pages/EscrowPage";
import NFTDetailPage from "./pages/NFTDetailPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import "./App.css";

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <AppProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="marketplace" element={<MarketplacePage />} />
                  <Route path="my-nfts" element={<MyNFTsPage />} />
                  <Route path="mint" element={<MintPage />} />
                  <Route path="escrow" element={<EscrowPage />} />
                  <Route
                    path="nft/:contractAddress/:tokenId"
                    element={<NFTDetailPage />}
                  />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </AppProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
