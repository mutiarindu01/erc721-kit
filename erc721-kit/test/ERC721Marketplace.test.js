const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ERC721Marketplace", function () {
  // Test fixture to deploy contracts
  async function deployMarketplaceFixture() {
    const [owner, seller, buyer, feeRecipient, other] = await ethers.getSigners();

    // Deploy RoyaltyEngine
    const RoyaltyEngine = await ethers.getContractFactory("RoyaltyEngine");
    const royaltyEngine = await RoyaltyEngine.deploy();
    await royaltyEngine.deployed();

    // Deploy MockNFT
    const MockNFT = await ethers.getContractFactory("MockNFT");
    const mockNFT = await MockNFT.deploy("Test NFT", "TNFT", seller.address, 500); // 5% royalty
    await mockNFT.deployed();

    // Mint NFTs to seller
    await mockNFT.connect(seller).mint(seller.address, "ipfs://test1");
    await mockNFT.connect(seller).mint(seller.address, "ipfs://test2");
    await mockNFT.connect(seller).mint(seller.address, "ipfs://test3");

    // Deploy ERC721Marketplace
    const ERC721Marketplace = await ethers.getContractFactory("ERC721Marketplace");
    const marketplace = await ERC721Marketplace.deploy(feeRecipient.address, royaltyEngine.address);
    await marketplace.deployed();

    // Whitelist the mock NFT contract
    await marketplace.setContractWhitelist(mockNFT.address, true);

    return { marketplace, mockNFT, royaltyEngine, owner, seller, buyer, feeRecipient, other };
  }

  describe("Deployment", function () {
    it("Should set the correct fee recipient and royalty engine", async function () {
      const { marketplace, royaltyEngine, feeRecipient } = await loadFixture(deployMarketplaceFixture);

      expect(await marketplace.feeRecipient()).to.equal(feeRecipient.address);
      expect(await marketplace.royaltyEngine()).to.equal(royaltyEngine.address);
    });

    it("Should set default marketplace fee to 2.5%", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);

      expect(await marketplace.marketplaceFeePercentage()).to.equal(250); // 2.5% in basis points
    });
  });

  describe("Listing Management", function () {
    it("Should list an NFT successfully", async function () {
      const { marketplace, mockNFT, seller } = await loadFixture(deployMarketplaceFixture);

      const price = ethers.utils.parseEther("1.0");
      const duration = 7 * 24 * 60 * 60; // 7 days

      // Approve marketplace to transfer NFT
      await mockNFT.connect(seller).approve(marketplace.address, 1);

      const tx = await marketplace.connect(seller).listItem(mockNFT.address, 1, price, duration);
      const receipt = await tx.wait();

      // Get listing ID from event
      const event = receipt.events?.find(e => e.event === 'ItemListed');
      const listingId = event?.args?.listingId;

      expect(event).to.not.be.undefined;
      expect(event.args.seller).to.equal(seller.address);
      expect(event.args.nftContract).to.equal(mockNFT.address);
      expect(event.args.tokenId).to.equal(1);
      expect(event.args.price).to.equal(price);

      // Check listing details
      const listing = await marketplace.getListing(listingId);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.nftContract).to.equal(mockNFT.address);
      expect(listing.tokenId).to.equal(1);
      expect(listing.price).to.equal(price);
      expect(listing.active).to.be.true;
    });

    it("Should fail to list without approval", async function () {
      const { marketplace, mockNFT, seller } = await loadFixture(deployMarketplaceFixture);

      const price = ethers.utils.parseEther("1.0");
      const duration = 7 * 24 * 60 * 60;

      await expect(
        marketplace.connect(seller).listItem(mockNFT.address, 1, price, duration)
      ).to.be.revertedWith("Contract not approved");
    });

    it("Should fail to list NFT from non-whitelisted contract", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      // Deploy another NFT contract that's not whitelisted
      const MockNFT = await ethers.getContractFactory("MockNFT");
      const unwhitelistedNFT = await MockNFT.deploy("Unwhitelisted", "UN", seller.address, 0);
      await unwhitelistedNFT.deployed();

      const price = ethers.utils.parseEther("1.0");
      const duration = 7 * 24 * 60 * 60;

      await expect(
        marketplace.connect(seller).listItem(unwhitelistedNFT.address, 1, price, duration)
      ).to.be.revertedWith("Contract not whitelisted");
    });

    it("Should update listing price", async function () {
      const { marketplace, mockNFT, seller } = await loadFixture(deployMarketplaceFixture);

      const price = ethers.utils.parseEther("1.0");
      const newPrice = ethers.utils.parseEther("1.5");
      const duration = 7 * 24 * 60 * 60;

      await mockNFT.connect(seller).approve(marketplace.address, 1);
      const tx = await marketplace.connect(seller).listItem(mockNFT.address, 1, price, duration);
      const receipt = await tx.wait();
      const listingId = receipt.events?.find(e => e.event === 'ItemListed')?.args?.listingId;

      await expect(marketplace.connect(seller).updateListing(listingId, newPrice))
        .to.emit(marketplace, "ListingUpdated")
        .withArgs(listingId, newPrice);

      const listing = await marketplace.getListing(listingId);
      expect(listing.price).to.equal(newPrice);
    });

    it("Should cancel listing", async function () {
      const { marketplace, mockNFT, seller } = await loadFixture(deployMarketplaceFixture);

      const price = ethers.utils.parseEther("1.0");
      const duration = 7 * 24 * 60 * 60;

      await mockNFT.connect(seller).approve(marketplace.address, 1);
      const tx = await marketplace.connect(seller).listItem(mockNFT.address, 1, price, duration);
      const receipt = await tx.wait();
      const listingId = receipt.events?.find(e => e.event === 'ItemListed')?.args?.listingId;

      await expect(marketplace.connect(seller).cancelListing(listingId))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(listingId);

      const listing = await marketplace.getListing(listingId);
      expect(listing.active).to.be.false;
    });
  });

  describe("Buying NFTs", function () {
    async function createListingFixture() {
      const base = await loadFixture(deployMarketplaceFixture);
      const { marketplace, mockNFT, seller } = base;

      const price = ethers.utils.parseEther("1.0");
      const duration = 7 * 24 * 60 * 60;

      await mockNFT.connect(seller).approve(marketplace.address, 1);
      const tx = await marketplace.connect(seller).listItem(mockNFT.address, 1, price, duration);
      const receipt = await tx.wait();
      const listingId = receipt.events?.find(e => e.event === 'ItemListed')?.args?.listingId;

      return { ...base, listingId, price };
    }

    it("Should buy NFT successfully", async function () {
      const { marketplace, mockNFT, seller, buyer, feeRecipient, listingId, price } = await loadFixture(createListingFixture);

      const sellerInitialBalance = await seller.getBalance();
      const feeRecipientInitialBalance = await feeRecipient.getBalance();

      await expect(marketplace.connect(buyer).buyItem(listingId, { value: price }))
        .to.emit(marketplace, "ItemSold")
        .withArgs(listingId, buyer.address, seller.address, mockNFT.address, 1, price);

      // Check NFT ownership
      expect(await mockNFT.ownerOf(1)).to.equal(buyer.address);

      // Check listing is inactive
      const listing = await marketplace.getListing(listingId);
      expect(listing.active).to.be.false;

      // Check payments (accounting for gas fees and royalties)
      const marketplaceFee = price.mul(250).div(10000); // 2.5%
      const royalty = price.mul(500).div(10000); // 5% royalty
      const sellerAmount = price.sub(marketplaceFee).sub(royalty);

      const sellerFinalBalance = await seller.getBalance();
      const feeRecipientFinalBalance = await feeRecipient.getBalance();

      expect(sellerFinalBalance).to.be.closeTo(
        sellerInitialBalance.add(sellerAmount), 
        ethers.utils.parseEther("0.01")
      );
      expect(feeRecipientFinalBalance).to.equal(feeRecipientInitialBalance.add(marketplaceFee));
    });

    it("Should fail to buy with insufficient payment", async function () {
      const { marketplace, buyer, listingId, price } = await loadFixture(createListingFixture);

      const insufficientPrice = price.sub(ethers.utils.parseEther("0.1"));

      await expect(
        marketplace.connect(buyer).buyItem(listingId, { value: insufficientPrice })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should refund excess payment", async function () {
      const { marketplace, buyer, listingId, price } = await loadFixture(createListingFixture);

      const excessPayment = price.add(ethers.utils.parseEther("0.5"));
      const buyerInitialBalance = await buyer.getBalance();

      const tx = await marketplace.connect(buyer).buyItem(listingId, { value: excessPayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(tx.gasPrice);

      const buyerFinalBalance = await buyer.getBalance();
      const expectedBalance = buyerInitialBalance.sub(price).sub(gasUsed);

      expect(buyerFinalBalance).to.be.closeTo(expectedBalance, ethers.utils.parseEther("0.01"));
    });

    it("Should not allow seller to buy their own NFT", async function () {
      const { marketplace, seller, listingId, price } = await loadFixture(createListingFixture);

      await expect(
        marketplace.connect(seller).buyItem(listingId, { value: price })
      ).to.be.revertedWith("Cannot buy own item");
    });
  });

  describe("Offers", function () {
    it("Should create offer successfully", async function () {
      const { marketplace, mockNFT, buyer } = await loadFixture(deployMarketplaceFixture);

      const offerAmount = ethers.utils.parseEther("0.5");
      const duration = 7 * 24 * 60 * 60;

      await expect(
        marketplace.connect(buyer).createOffer(mockNFT.address, 1, duration, { value: offerAmount })
      )
        .to.emit(marketplace, "OfferCreated")
        .withArgs(
          ethers.utils.anyValue, // offerId
          buyer.address,
          mockNFT.address,
          1,
          offerAmount
        );
    });

    it("Should accept offer successfully", async function () {
      const { marketplace, mockNFT, seller, buyer, feeRecipient } = await loadFixture(deployMarketplaceFixture);

      const offerAmount = ethers.utils.parseEther("0.5");
      const duration = 7 * 24 * 60 * 60;

      // Create offer
      const tx = await marketplace.connect(buyer).createOffer(mockNFT.address, 1, duration, { value: offerAmount });
      const receipt = await tx.wait();
      const offerId = receipt.events?.find(e => e.event === 'OfferCreated')?.args?.offerId;

      // Approve marketplace
      await mockNFT.connect(seller).approve(marketplace.address, 1);

      const sellerInitialBalance = await seller.getBalance();
      const feeRecipientInitialBalance = await feeRecipient.getBalance();

      // Accept offer
      await expect(marketplace.connect(seller).acceptOffer(offerId))
        .to.emit(marketplace, "OfferAccepted")
        .withArgs(offerId, seller.address, buyer.address, offerAmount);

      // Check NFT ownership
      expect(await mockNFT.ownerOf(1)).to.equal(buyer.address);

      // Check payments
      const marketplaceFee = offerAmount.mul(250).div(10000); // 2.5%
      const royalty = offerAmount.mul(500).div(10000); // 5% royalty
      const sellerAmount = offerAmount.sub(marketplaceFee).sub(royalty);

      const sellerFinalBalance = await seller.getBalance();
      const feeRecipientFinalBalance = await feeRecipient.getBalance();

      expect(sellerFinalBalance).to.be.closeTo(
        sellerInitialBalance.add(sellerAmount),
        ethers.utils.parseEther("0.01")
      );
      expect(feeRecipientFinalBalance).to.equal(feeRecipientInitialBalance.add(marketplaceFee));
    });

    it("Should cancel offer and refund", async function () {
      const { marketplace, mockNFT, buyer } = await loadFixture(deployMarketplaceFixture);

      const offerAmount = ethers.utils.parseEther("0.5");
      const duration = 7 * 24 * 60 * 60;

      // Create offer
      const tx = await marketplace.connect(buyer).createOffer(mockNFT.address, 1, duration, { value: offerAmount });
      const receipt = await tx.wait();
      const offerId = receipt.events?.find(e => e.event === 'OfferCreated')?.args?.offerId;

      const buyerInitialBalance = await buyer.getBalance();

      // Cancel offer
      const cancelTx = await marketplace.connect(buyer).cancelOffer(offerId);
      const cancelReceipt = await cancelTx.wait();
      const gasUsed = cancelReceipt.gasUsed.mul(cancelTx.gasPrice);

      await expect(cancelTx)
        .to.emit(marketplace, "OfferCancelled")
        .withArgs(offerId);

      // Check refund
      const buyerFinalBalance = await buyer.getBalance();
      const expectedBalance = buyerInitialBalance.add(offerAmount).sub(gasUsed);

      expect(buyerFinalBalance).to.be.closeTo(expectedBalance, ethers.utils.parseEther("0.01"));
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to update marketplace fee", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(owner).setMarketplaceFee(500); // 5%
      expect(await marketplace.marketplaceFeePercentage()).to.equal(500);
    });

    it("Should not allow setting fee above maximum", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);

      await expect(
        marketplace.connect(owner).setMarketplaceFee(1001) // More than 10%
      ).to.be.revertedWith("Fee too high");
    });

    it("Should allow owner to update fee recipient", async function () {
      const { marketplace, owner, other } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(owner).setFeeRecipient(other.address);
      expect(await marketplace.feeRecipient()).to.equal(other.address);
    });
  });

  describe("Statistics", function () {
    it("Should track marketplace statistics", async function () {
      const { marketplace, mockNFT, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      const price = ethers.utils.parseEther("1.0");
      const duration = 7 * 24 * 60 * 60;

      // Initial stats
      expect(await marketplace.totalListings()).to.equal(0);
      expect(await marketplace.totalSales()).to.equal(0);
      expect(await marketplace.totalVolume()).to.equal(0);

      // Create listing
      await mockNFT.connect(seller).approve(marketplace.address, 1);
      const tx = await marketplace.connect(seller).listItem(mockNFT.address, 1, price, duration);
      const receipt = await tx.wait();
      const listingId = receipt.events?.find(e => e.event === 'ItemListed')?.args?.listingId;

      expect(await marketplace.totalListings()).to.equal(1);

      // Buy NFT
      await marketplace.connect(buyer).buyItem(listingId, { value: price });

      expect(await marketplace.totalSales()).to.equal(1);
      expect(await marketplace.totalVolume()).to.equal(price);
    });
  });

  describe("View Functions", function () {
    it("Should return user listings correctly", async function () {
      const { marketplace, mockNFT, seller } = await loadFixture(deployMarketplaceFixture);

      const price = ethers.utils.parseEther("1.0");
      const duration = 7 * 24 * 60 * 60;

      // Create multiple listings
      await mockNFT.connect(seller).approve(marketplace.address, 1);
      await marketplace.connect(seller).listItem(mockNFT.address, 1, price, duration);

      await mockNFT.connect(seller).approve(marketplace.address, 2);
      await marketplace.connect(seller).listItem(mockNFT.address, 2, price, duration);

      const userListings = await marketplace.getUserListings(seller.address);
      expect(userListings.length).to.equal(2);
    });

    it("Should return user offers correctly", async function () {
      const { marketplace, mockNFT, buyer } = await loadFixture(deployMarketplaceFixture);

      const offerAmount = ethers.utils.parseEther("0.5");
      const duration = 7 * 24 * 60 * 60;

      // Create multiple offers
      await marketplace.connect(buyer).createOffer(mockNFT.address, 1, duration, { value: offerAmount });
      await marketplace.connect(buyer).createOffer(mockNFT.address, 2, duration, { value: offerAmount });

      const userOffers = await marketplace.getUserOffers(buyer.address);
      expect(userOffers.length).to.equal(2);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause contract", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(owner).pause();
      expect(await marketplace.paused()).to.be.true;
    });

    it("Should not allow listing when paused", async function () {
      const { marketplace, mockNFT, seller, owner } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(owner).pause();

      const price = ethers.utils.parseEther("1.0");
      const duration = 7 * 24 * 60 * 60;

      await mockNFT.connect(seller).approve(marketplace.address, 1);

      await expect(
        marketplace.connect(seller).listItem(mockNFT.address, 1, price, duration)
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
