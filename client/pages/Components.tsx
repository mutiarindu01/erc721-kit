import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Code, Copy, ExternalLink, Boxes, ImageIcon, ShoppingCart, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Components() {
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
            <Link to="/components" className="text-sm font-medium text-primary">
              Components
            </Link>
            <Link to="/documentation" className="text-sm font-medium hover:text-primary transition-colors">
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
          <span className="text-foreground">Components</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">React Components</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Production-ready React components for building NFT marketplaces and escrow systems. 
            Copy, paste, and customize to fit your needs.
          </p>
        </div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NFT Gallery Component */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>NFT Gallery</CardTitle>
                    <CardDescription>Responsive gallery for displaying NFT collections</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">React</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Preview */}
              <div className="bg-muted/30 rounded-lg p-6 mb-4">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-primary/60" />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Live Demo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mint Form Component */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Code className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Mint Form</CardTitle>
                    <CardDescription>Complete form for minting new NFTs</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">React</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Preview */}
              <div className="bg-muted/30 rounded-lg p-6 mb-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-foreground/10 rounded w-16"></div>
                    <div className="h-10 bg-background border rounded-md"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-foreground/10 rounded w-20"></div>
                    <div className="h-24 bg-background border rounded-md"></div>
                  </div>
                  <div className="h-10 bg-primary rounded-md flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">Mint NFT</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Live Demo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Escrow Dashboard Component */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Escrow Dashboard</CardTitle>
                    <CardDescription>Monitor and manage escrow transactions</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">React</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Preview */}
              <div className="bg-muted/30 rounded-lg p-6 mb-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-foreground/10 rounded w-24"></div>
                    <div className="h-6 bg-green-500/20 text-green-700 rounded-full px-3 py-1 text-xs">Active</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="h-3 bg-foreground/10 rounded w-16"></div>
                      <div className="h-4 bg-foreground/20 rounded w-20"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 bg-foreground/10 rounded w-12"></div>
                      <div className="h-4 bg-foreground/20 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Live Demo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Marketplace Component */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Marketplace</CardTitle>
                    <CardDescription>Complete marketplace with buy/sell functionality</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">React</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Preview */}
              <div className="bg-muted/30 rounded-lg p-6 mb-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-foreground/10 rounded w-16"></div>
                          <div className="h-4 bg-foreground/20 rounded w-12"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Live Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Hooks Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">Custom Hooks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">useERC721Marketplace</CardTitle>
                <CardDescription>
                  React hook for interacting with ERC721 marketplace contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <code className="text-sm">
                    {`const { mint, buy, sell, listings } = useERC721Marketplace(contractAddress);`}
                  </code>
                </div>
                <Button size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Hook
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">useEscrow</CardTitle>
                <CardDescription>
                  Hook for managing escrow transactions and states
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <code className="text-sm">
                    {`const { createEscrow, releaseEscrow, disputes } = useEscrow();`}
                  </code>
                </div>
                <Button size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Hook
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-16 bg-muted/30 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4">Getting Started</h3>
          <p className="text-muted-foreground mb-6">
            All components are built with TypeScript and include full type definitions. 
            They work seamlessly with the included smart contracts and deployment scripts.
          </p>
          <div className="flex space-x-4">
            <Button>
              <Code className="h-4 w-4 mr-2" />
              View Documentation
            </Button>
            <Button variant="outline">
              Download Examples
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
