import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Code, BookOpen, Download, Github, ExternalLink, CheckCircle, Star, Users, Boxes } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Boxes className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">ERC721 Kit</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/components" className="text-sm font-medium hover:text-primary transition-colors">
              Components
            </Link>
            <Link to="/documentation" className="text-sm font-medium hover:text-primary transition-colors">
              Documentation
            </Link>
            <Button size="sm" className="ml-4">
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 Production Ready
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ERC721 Kit
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Complete NFT marketplace and escrow solution with smart contracts, React components, and deployment scripts
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              <BookOpen className="mr-2 h-5 w-5" />
              Documentation
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Test Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5+</div>
              <div className="text-sm text-muted-foreground">Smart Contracts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">Multi-chain</div>
              <div className="text-sm text-muted-foreground">Deployment</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need for NFT Development</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Build secure, scalable NFT applications with our comprehensive toolkit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Smart Contracts */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Contracts</CardTitle>
                <CardDescription>
                  Production-ready ERC721 contracts with escrow, marketplace, and royalty features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ERC721Escrow.sol
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ERC721Marketplace.sol
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    RoyaltyEngine.sol
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Gas Optimized
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Frontend Components */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>React Components</CardTitle>
                <CardDescription>
                  Pre-built UI components and hooks for seamless NFT integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    NFT Gallery Component
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Mint Form Component
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Escrow Dashboard
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Custom Hooks
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Deployment & Testing */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Deployment & Testing</CardTitle>
                <CardDescription>
                  Complete testing suite and multi-chain deployment scripts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    100% Test Coverage
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Auto-Verification
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Multi-chain Support
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Gas Reports
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Project Structure</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Organized, scalable architecture for professional NFT development
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 border">
            <pre className="text-sm overflow-x-auto">
              <code className="text-muted-foreground">
{`erc721-kit/
├── contracts/
│   ├── ERC721Escrow.sol
│   ├── ERC721Marketplace.sol
│   └── RoyaltyEngine.sol
├── frontend/
│   ├── components/
│   │   ├── NFTGallery.jsx
│   │   ├── MintForm.jsx
│   │   └── EscrowDashboard.jsx
│   └── hooks/
│       └── useERC721Marketplace.js
├── scripts/
│   ├── deploy.js
│   └── verify.js
├── test/
│   └── ERC721Escrow.test.js
└── guides/
    └── ERC721_Integration.md`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            Ready to Build Your NFT Marketplace?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Get started with ERC721 Kit and launch your NFT platform in minutes, not months
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              <Download className="mr-2 h-5 w-5" />
              Download Kit
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <ExternalLink className="mr-2 h-5 w-5" />
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <Boxes className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">ERC721 Kit</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete NFT development toolkit for modern blockchain applications.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/components" className="hover:text-foreground">Components</Link></li>
                <li><Link to="/documentation" className="hover:text-foreground">Documentation</Link></li>
                <li><a href="#" className="hover:text-foreground">Examples</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">GitHub</a></li>
                <li><a href="#" className="hover:text-foreground">Discord</a></li>
                <li><a href="#" className="hover:text-foreground">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="#" className="hover:text-foreground">License</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 ERC721 Kit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
