import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Code, Download, ExternalLink, Boxes, FileText, Zap, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function Documentation() {
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
            <Link to="/components" className="text-sm font-medium hover:text-primary transition-colors">
              Components
            </Link>
            <Link to="/documentation" className="text-sm font-medium text-primary">
              Documentation
            </Link>
            <Button size="sm" className="ml-4">
              <Code className="mr-2 h-4 w-4" />
              GitHub
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
          <span className="text-foreground">Documentation</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Complete guides, API references, and examples to help you integrate ERC721 Kit 
            into your projects quickly and efficiently.
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Quick Start</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-primary" />
                Get Started in 5 Minutes
              </CardTitle>
              <CardDescription>
                Follow these steps to integrate ERC721 Kit into your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Download and Extract</h4>
                    <p className="text-muted-foreground mb-3">
                      Download the ERC721 Kit and extract it to your project directory.
                    </p>
                    <div className="bg-muted rounded-lg p-4">
                      <code className="text-sm">wget https://example.com/erc721-kit.zip && unzip erc721-kit.zip</code>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Install Dependencies</h4>
                    <p className="text-muted-foreground mb-3">
                      Install required dependencies for the smart contracts and frontend.
                    </p>
                    <div className="bg-muted rounded-lg p-4">
                      <code className="text-sm">npm install && cd frontend && npm install</code>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Deploy Contracts</h4>
                    <p className="text-muted-foreground mb-3">
                      Deploy the smart contracts to your preferred network.
                    </p>
                    <div className="bg-muted rounded-lg p-4">
                      <code className="text-sm">npx hardhat run scripts/deploy.js --network sepolia</code>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Start Building</h4>
                    <p className="text-muted-foreground mb-3">
                      Import components and start building your NFT marketplace.
                    </p>
                    <div className="bg-muted rounded-lg p-4">
                      <code className="text-sm">{`import { NFTGallery, MintForm } from './components'`}</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* Smart Contracts */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Smart Contracts</CardTitle>
              <CardDescription>
                Comprehensive guide to the ERC721 smart contracts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Contract Architecture
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Deployment Guide
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Security Features
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Gas Optimization
                </li>
              </ul>
              <Button size="sm" className="mt-4 w-full">
                <BookOpen className="h-4 w-4 mr-2" />
                Read Guide
              </Button>
            </CardContent>
          </Card>

          {/* Frontend Integration */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Frontend Integration</CardTitle>
              <CardDescription>
                Learn how to integrate React components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Component Setup
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Custom Hooks
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  State Management
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Styling Guide
                </li>
              </ul>
              <Button size="sm" className="mt-4 w-full">
                <BookOpen className="h-4 w-4 mr-2" />
                Read Guide
              </Button>
            </CardContent>
          </Card>

          {/* API Reference */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>API Reference</CardTitle>
              <CardDescription>
                Complete API documentation and examples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Contract Methods
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Event Definitions
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Error Codes
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  TypeScript Types
                </li>
              </ul>
              <Button size="sm" className="mt-4 w-full">
                <BookOpen className="h-4 w-4 mr-2" />
                Read Guide
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Code Examples */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Code Examples</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Basic NFT Minting
                  <Badge variant="secondary">React</Badge>
                </CardTitle>
                <CardDescription>
                  Simple example of minting an NFT using the provided components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 mb-4 overflow-x-auto">
                  <pre className="text-sm">
                    <code>{`import { MintForm } from './components/MintForm';
import { useERC721Marketplace } from './hooks';

export function MyNFTMinter() {
  const { mint } = useERC721Marketplace(contractAddress);
  
  return (
    <MintForm 
      onMint={mint}
      onSuccess={() => console.log('Minted!')}
    />
  );
}`}</code>
                  </pre>
                </div>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Example
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Marketplace Integration
                  <Badge variant="secondary">React</Badge>
                </CardTitle>
                <CardDescription>
                  Complete marketplace with buy/sell functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 mb-4 overflow-x-auto">
                  <pre className="text-sm">
                    <code>{`import { NFTGallery, MarketplaceCard } from './components';
import { useMarketplace } from './hooks';

export function Marketplace() {
  const { listings, buy } = useMarketplace();
  
  return (
    <NFTGallery>
      {listings.map(nft => (
        <MarketplaceCard 
          key={nft.id}
          nft={nft}
          onBuy={() => buy(nft.id)}
        />
      ))}
    </NFTGallery>
  );
}`}</code>
                  </pre>
                </div>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Example
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-muted/30 rounded-lg p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join our community or get in touch with our support team for assistance with integration, 
              customization, or troubleshooting.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-8 w-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-lg">Community</CardTitle>
                <CardDescription>Join our Discord community</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Join Discord
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Code className="h-8 w-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-lg">GitHub</CardTitle>
                <CardDescription>Issues, PRs, and discussions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Repository
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-8 w-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-lg">Support</CardTitle>
                <CardDescription>Direct support and consulting</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
