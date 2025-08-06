import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Download,
  Play,
  CheckCircle,
  AlertCircle,
  Code,
  Rocket,
  Package,
  Settings,
  Terminal,
  Eye,
  Copy,
  ExternalLink,
  ArrowLeft,
  Boxes,
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock implementations of ERC721 Kit components for demo
const MockNFTGallery = () => {
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    // Simulate loading NFTs
    setTimeout(() => {
      setNfts([
        {
          id: "1",
          name: "Cosmic Cat #1234",
          image: "https://picsum.photos/300/300?random=1",
          price: "2.5 ETH",
          status: "listed",
        },
        {
          id: "2",
          name: "Digital Art #567",
          image: "https://picsum.photos/300/300?random=2",
          price: "1.8 ETH",
          status: "listed",
        },
        {
          id: "3",
          name: "Abstract #890",
          image: "https://picsum.photos/300/300?random=3",
          price: "0.75 ETH",
          status: "auction",
        },
      ]);
      setLoading(false);
    }, 2000);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-200 animate-pulse rounded-lg aspect-square"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {nfts.map((nft) => (
        <div
          key={nft.id}
          className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full aspect-square object-cover"
          />
          <div className="p-3">
            <h4 className="font-medium text-sm">{nft.name}</h4>
            <p className="text-xs text-gray-600">{nft.price}</p>
            <Badge
              variant={nft.status === "auction" ? "default" : "secondary"}
              className="mt-2 text-xs"
            >
              {nft.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

const MockMintForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMinting(true);
    setTimeout(() => {
      setMinting(false);
      setMinted(true);
      setTimeout(() => setMinted(false), 3000);
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">NFT Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter NFT name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Enter description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Price (ETH)</label>
        <input
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="0.0"
        />
      </div>
      <Button type="submit" disabled={minting} className="w-full">
        {minting ? "Minting..." : minted ? "Minted Successfully!" : "Mint NFT"}
      </Button>
    </form>
  );
};

const MockEscrowDashboard = () => {
  const escrows = [
    {
      id: 1,
      nft: "Cosmic Cat #1234",
      price: "2.5 ETH",
      status: "Active",
      buyer: "0x123...abc",
      seller: "0x456...def",
    },
    {
      id: 2,
      nft: "Digital Art #567",
      price: "1.8 ETH",
      status: "Completed",
      buyer: "0x789...ghi",
      seller: "0x321...fed",
    },
  ];

  return (
    <div className="space-y-4">
      {escrows.map((escrow) => (
        <div key={escrow.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium">Escrow #{escrow.id}</h4>
              <p className="text-sm text-gray-600">{escrow.nft}</p>
            </div>
            <Badge
              variant={escrow.status === "Active" ? "default" : "secondary"}
            >
              {escrow.status}
            </Badge>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Price:</span> {escrow.price}
            </p>
            <p>
              <span className="font-medium">Buyer:</span> {escrow.buyer}
            </p>
            <p>
              <span className="font-medium">Seller:</span> {escrow.seller}
            </p>
          </div>
          {escrow.status === "Active" && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="default">
                Approve
              </Button>
              <Button size="sm" variant="outline">
                Dispute
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function Demo() {
  const [activeDemo, setActiveDemo] = useState("gallery");
  const [walletConnected, setWalletConnected] = useState(false);
  const [setupStep, setSetupStep] = useState(0);

  const setupSteps = [
    {
      title: "Download Kit",
      description: "Download the complete ERC721 Kit package",
      status: "completed",
    },
    {
      title: "Install Dependencies",
      description: "Run npm install to install all dependencies",
      status: "completed",
    },
    {
      title: "Deploy Contracts",
      description: "Deploy smart contracts to your preferred network",
      status: "in-progress",
    },
    {
      title: "Configure Frontend",
      description: "Update contract addresses in frontend config",
      status: "pending",
    },
    {
      title: "Launch Application",
      description: "Start your NFT marketplace application",
      status: "pending",
    },
  ];

  const features = [
    {
      title: "Smart Contracts",
      description:
        "Production-ready contracts with escrow, marketplace, and royalty features",
      items: [
        "ERC721Escrow.sol",
        "ERC721Marketplace.sol",
        "RoyaltyEngine.sol",
        "MockNFT.sol",
      ],
    },
    {
      title: "React Components",
      description: "Pre-built UI components for rapid development",
      items: ["NFTGallery", "MintForm", "EscrowDashboard", "WalletConnector"],
    },
    {
      title: "Development Tools",
      description: "Complete toolkit for deployment and testing",
      items: [
        "Deploy Scripts",
        "Test Suite",
        "Verification Tools",
        "Documentation",
      ],
    },
  ];

  const demoCode = {
    gallery: `import NFTGallery from './components/NFTGallery';

function Marketplace() {
  const [nfts, setNfts] = useState([]);
  
  return (
    <NFTGallery
      nfts={nfts}
      onNFTClick={handleNFTClick}
      showPrices={true}
      gridCols="grid-cols-3"
    />
  );
}`,
    mint: `import MintForm from './components/MintForm';

function MintPage() {
  const handleMint = async (data) => {
    // Upload to IPFS and mint NFT
    await mint(data);
  };
  
  return (
    <MintForm
      onMint={handleMint}
      onSuccess={() => alert('Minted!')}
    />
  );
}`,
    escrow: `import EscrowDashboard from './components/EscrowDashboard';

function EscrowPage() {
  const { escrows, approveEscrow } = useEscrow();
  
  return (
    <EscrowDashboard
      escrows={escrows}
      onApprove={approveEscrow}
    />
  );
}`,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Boxes className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">ERC721 Kit</span>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              to="/components"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Components
            </Link>
            <Link
              to="/documentation"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Documentation
            </Link>
            <Link to="/demo" className="text-sm font-medium text-primary">
              Demo
            </Link>
            <Button size="sm" className="ml-4">
              <Download className="mr-2 h-4 w-4" />
              Download Kit
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Live Demo</span>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4">
            <Play className="mr-2 h-4 w-4" />
            Interactive Demo
          </Badge>
          <h1 className="text-4xl font-bold mb-4">ERC721 Kit Live Demo</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Experience the complete NFT marketplace solution in action. Test all
            components, see the code, and understand how everything works
            together.
          </p>

          <Alert className="max-w-2xl mx-auto mb-8">
            <Rocket className="h-4 w-4" />
            <AlertTitle>Ready for Production</AlertTitle>
            <AlertDescription>
              This demo shows the actual components included in the ERC721 Kit.
              All code is production-ready and fully tested.
            </AlertDescription>
          </Alert>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.items.map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm">
                      <div className="h-2 w-2 bg-primary rounded-full mr-2"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Interactive Demo */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Interactive Component Demo
            </CardTitle>
            <CardDescription>
              Experience the ERC721 Kit components in action. Click on different
              tabs to see various components.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeDemo} onValueChange={setActiveDemo}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="gallery">NFT Gallery</TabsTrigger>
                <TabsTrigger value="mint">Mint Form</TabsTrigger>
                <TabsTrigger value="escrow">Escrow Dashboard</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="gallery" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      NFT Gallery Component
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigator.clipboard.writeText(demoCode.gallery)
                        }
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Live Preview</h4>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <MockNFTGallery />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Code Example</h4>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <pre>{demoCode.gallery}</pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mint" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Mint Form Component
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigator.clipboard.writeText(demoCode.mint)
                        }
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Live Preview</h4>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <MockMintForm />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Code Example</h4>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <pre>{demoCode.mint}</pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="escrow" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Escrow Dashboard Component
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigator.clipboard.writeText(demoCode.escrow)
                        }
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Live Preview</h4>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <MockEscrowDashboard />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Code Example</h4>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <pre>{demoCode.escrow}</pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Setup Guide */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Quick Setup Guide
            </CardTitle>
            <CardDescription>
              Get your NFT marketplace running in minutes with these simple
              steps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {setupSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : step.status === "in-progress"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {step.status === "in-progress" && (
                    <Badge variant="outline">In Progress</Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Terminal className="h-4 w-4 mr-2" />
                Quick Start Commands
              </h4>
              <div className="space-y-2 text-sm font-mono bg-gray-900 text-gray-100 p-3 rounded">
                <div># Clone and install</div>
                <div>git clone &lt;repo-url&gt; && cd erc721-kit</div>
                <div>npm install</div>
                <div></div>
                <div># Deploy contracts</div>
                <div>npx hardhat run scripts/deploy.js --network sepolia</div>
                <div></div>
                <div># Start frontend</div>
                <div>cd example-app && npm start</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Contents */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              What's Included
            </CardTitle>
            <CardDescription>
              Complete package contents for building production-ready NFT
              marketplaces.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Smart Contracts</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ERC721Escrow.sol - Secure escrow system
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ERC721Marketplace.sol - Complete marketplace
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    RoyaltyEngine.sol - EIP-2981 royalty system
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    MockNFT.sol - Example NFT contract
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Frontend Components</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    NFTGallery - Responsive gallery component
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    MintForm - Complete minting form
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    EscrowDashboard - Transaction management
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Custom Hooks - React integration
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Development Tools</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Deployment Scripts - Multi-chain support
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Test Suite - 100% coverage
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Verification Tools - Contract verification
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Utility Scripts - Management tools
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Documentation</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Integration Guide - Step-by-step setup
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    API Reference - Complete documentation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Example App - Full implementation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    README - Comprehensive guide
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center bg-primary/5 rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Your NFT Marketplace?
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get the complete ERC721 Kit and launch your NFT marketplace in
            minutes, not months. Everything you need is included.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8">
              <Download className="mr-2 h-5 w-5" />
              Download ERC721 Kit
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              <ExternalLink className="mr-2 h-5 w-5" />
              View Documentation
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Production-ready • 100% tested • Complete documentation included
          </p>
        </div>
      </div>
    </div>
  );
}
