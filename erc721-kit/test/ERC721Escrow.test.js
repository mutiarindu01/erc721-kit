const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ERC721Escrow", function () {
  // Test fixture to deploy contracts
  async function deployEscrowFixture() {
    const [owner, seller, buyer, feeRecipient, disputeResolver, other] = await ethers.getSigners();

    // Deploy a mock ERC721 contract for testing
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const mockNFT = await MockERC721.deploy("Test NFT", "TNFT");
    await mockNFT.deployed();

    // Mint an NFT to the seller
    await mockNFT.connect(seller).mint(seller.address, 1);
    await mockNFT.connect(seller).mint(seller.address, 2);

    // Deploy ERC721Escrow
    const ERC721Escrow = await ethers.getContractFactory("ERC721Escrow");
    const escrow = await ERC721Escrow.deploy(feeRecipient.address, disputeResolver.address);
    await escrow.deployed();

    // Whitelist the mock NFT contract
    await escrow.setContractWhitelist(mockNFT.address, true);

    return { escrow, mockNFT, owner, seller, buyer, feeRecipient, disputeResolver, other };
  }

  describe("Deployment", function () {
    it("Should set the correct fee recipient and dispute resolver", async function () {
      const { escrow, feeRecipient, disputeResolver } = await loadFixture(deployEscrowFixture);

      expect(await escrow.feeRecipient()).to.equal(feeRecipient.address);
      expect(await escrow.disputeResolver()).to.equal(disputeResolver.address);
    });

    it("Should set default escrow fee to 2.5%", async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);

      expect(await escrow.escrowFeePercentage()).to.equal(250); // 2.5% in basis points
    });

    it("Should set dispute window to 7 days", async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);

      expect(await escrow.disputeWindow()).to.equal(7 * 24 * 60 * 60); // 7 days in seconds
    });
  });

  describe("Contract Whitelisting", function () {
    it("Should allow owner to whitelist contracts", async function () {
      const { escrow, mockNFT, owner } = await loadFixture(deployEscrowFixture);

      await expect(escrow.connect(owner).setContractWhitelist(mockNFT.address, true))
        .to.emit(escrow, "ContractWhitelisted")
        .withArgs(mockNFT.address, true);

      expect(await escrow.whitelistedContracts(mockNFT.address)).to.be.true;
    });

    it("Should not allow non-owner to whitelist contracts", async function () {
      const { escrow, mockNFT, seller } = await loadFixture(deployEscrowFixture);

      await expect(
        escrow.connect(seller).setContractWhitelist(mockNFT.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Escrow Creation", function () {
    it("Should create escrow successfully", async function () {
      const { escrow, mockNFT, seller, buyer } = await loadFixture(deployEscrowFixture);

      const price = ethers.utils.parseEther("1.0");
      const deadline = (await time.latest()) + 86400; // 1 day from now

      // Approve escrow contract to transfer NFT
      await mockNFT.connect(seller).approve(escrow.address, 1);

      await expect(
        escrow.connect(seller).createEscrow(buyer.address, mockNFT.address, 1, deadline, { value: price })
      )
        .to.emit(escrow, "EscrowCreated")
        .withArgs(1, seller.address, buyer.address, mockNFT.address, 1, price);

      // Check that NFT is transferred to escrow
      expect(await mockNFT.ownerOf(1)).to.equal(escrow.address);

      // Check escrow details
      const escrowData = await escrow.getEscrow(1);
      expect(escrowData.seller).to.equal(seller.address);
      expect(escrowData.buyer).to.equal(buyer.address);
      expect(escrowData.nftContract).to.equal(mockNFT.address);
      expect(escrowData.tokenId).to.equal(1);
      expect(escrowData.price).to.equal(price);
      expect(escrowData.status).to.equal(0); // Active status
    });

    it("Should fail if contract is not whitelisted", async function () {
      const { escrow, seller, buyer } = await loadFixture(deployEscrowFixture);

      // Deploy another NFT contract that is not whitelisted
      const MockERC721 = await ethers.getContractFactory("MockERC721");
      const unwhitelistedNFT = await MockERC721.deploy("Unwhitelisted NFT", "UNFT");
      await unwhitelistedNFT.deployed();

      const price = ethers.utils.parseEther("1.0");
      const deadline = (await time.latest()) + 86400;

      await expect(
        escrow.connect(seller).createEscrow(buyer.address, unwhitelistedNFT.address, 1, deadline, { value: price })
      ).to.be.revertedWith("Contract not whitelisted");
    });

    it("Should fail if seller doesn't own the NFT", async function () {
      const { escrow, mockNFT, seller, buyer, other } = await loadFixture(deployEscrowFixture);

      const price = ethers.utils.parseEther("1.0");
      const deadline = (await time.latest()) + 86400;

      await expect(
        escrow.connect(other).createEscrow(buyer.address, mockNFT.address, 1, deadline, { value: price })
      ).to.be.revertedWith("Seller doesn't own NFT");
    });

    it("Should fail if price is zero", async function () {
      const { escrow, mockNFT, seller, buyer } = await loadFixture(deployEscrowFixture);

      const deadline = (await time.latest()) + 86400;

      await expect(
        escrow.connect(seller).createEscrow(buyer.address, mockNFT.address, 1, deadline, { value: 0 })
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should fail if deadline is in the past", async function () {
      const { escrow, mockNFT, seller, buyer } = await loadFixture(deployEscrowFixture);

      const price = ethers.utils.parseEther("1.0");
      const deadline = (await time.latest()) - 3600; // 1 hour ago

      await mockNFT.connect(seller).approve(escrow.address, 1);

      await expect(
        escrow.connect(seller).createEscrow(buyer.address, mockNFT.address, 1, deadline, { value: price })
      ).to.be.revertedWith("Invalid deadline");
    });
  });

  describe("Escrow Approval", function () {
    async function createEscrowFixture() {
      const base = await loadFixture(deployEscrowFixture);
      const { escrow, mockNFT, seller, buyer } = base;

      const price = ethers.utils.parseEther("1.0");
      const deadline = (await time.latest()) + 86400;

      await mockNFT.connect(seller).approve(escrow.address, 1);
      await escrow.connect(seller).createEscrow(buyer.address, mockNFT.address, 1, deadline, { value: price });

      return { ...base, price };
    }

    it("Should allow seller to approve escrow", async function () {
      const { escrow, seller } = await loadFixture(createEscrowFixture);

      await escrow.connect(seller).approveEscrow(1);

      const escrowData = await escrow.getEscrow(1);
      expect(escrowData.sellerApproved).to.be.true;
    });

    it("Should allow buyer to approve escrow", async function () {
      const { escrow, buyer } = await loadFixture(createEscrowFixture);

      await escrow.connect(buyer).approveEscrow(1);

      const escrowData = await escrow.getEscrow(1);
      expect(escrowData.buyerApproved).to.be.true;
    });

    it("Should complete escrow when both parties approve", async function () {
      const { escrow, mockNFT, seller, buyer, feeRecipient, price } = await loadFixture(createEscrowFixture);

      const sellerInitialBalance = await seller.getBalance();
      const feeRecipientInitialBalance = await feeRecipient.getBalance();

      // Both parties approve
      await escrow.connect(seller).approveEscrow(1);
      await escrow.connect(buyer).approveEscrow(1);

      // Check that escrow is completed
      const escrowData = await escrow.getEscrow(1);
      expect(escrowData.status).to.equal(1); // Completed status

      // Check that NFT is transferred to buyer
      expect(await mockNFT.ownerOf(1)).to.equal(buyer.address);

      // Check payments
      const fee = price.mul(250).div(10000); // 2.5% fee
      const sellerAmount = price.sub(fee);

      const sellerFinalBalance = await seller.getBalance();
      const feeRecipientFinalBalance = await feeRecipient.getBalance();

      expect(sellerFinalBalance).to.be.closeTo(sellerInitialBalance.add(sellerAmount), ethers.utils.parseEther("0.01"));
      expect(feeRecipientFinalBalance).to.equal(feeRecipientInitialBalance.add(fee));
    });

    it("Should not allow non-participants to approve", async function () {
      const { escrow, other } = await loadFixture(createEscrowFixture);

      await expect(
        escrow.connect(other).approveEscrow(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should not allow approval of non-existent escrow", async function () {
      const { escrow, seller } = await loadFixture(createEscrowFixture);

      await expect(
        escrow.connect(seller).approveEscrow(999)
      ).to.be.revertedWith("Invalid escrow ID");
    });
  });

  describe("Escrow Cancellation", function () {
    async function createEscrowFixture() {
      const base = await loadFixture(deployEscrowFixture);
      const { escrow, mockNFT, seller, buyer } = base;

      const price = ethers.utils.parseEther("1.0");
      const deadline = (await time.latest()) + 86400;

      await mockNFT.connect(seller).approve(escrow.address, 1);
      await escrow.connect(seller).createEscrow(buyer.address, mockNFT.address, 1, deadline, { value: price });

      return { ...base, price };
    }

    it("Should allow seller to cancel escrow", async function () {
      const { escrow, mockNFT, seller, buyer, price } = await loadFixture(createEscrowFixture);

      const buyerInitialBalance = await buyer.getBalance();

      await expect(escrow.connect(seller).cancelEscrow(1))
        .to.emit(escrow, "EscrowCancelled")
        .withArgs(1);

      // Check that escrow is cancelled
      const escrowData = await escrow.getEscrow(1);
      expect(escrowData.status).to.equal(2); // Cancelled status

      // Check that NFT is returned to seller
      expect(await mockNFT.ownerOf(1)).to.equal(seller.address);

      // Check that ETH is returned to buyer
      const buyerFinalBalance = await buyer.getBalance();
      expect(buyerFinalBalance).to.equal(buyerInitialBalance.add(price));
    });

    it("Should allow buyer to cancel escrow", async function () {
      const { escrow, mockNFT, seller, buyer, price } = await loadFixture(createEscrowFixture);

      const buyerInitialBalance = await buyer.getBalance();

      await escrow.connect(buyer).cancelEscrow(1);

      // Check that NFT is returned to seller
      expect(await mockNFT.ownerOf(1)).to.equal(seller.address);

      // Check that ETH is returned to buyer
      const buyerFinalBalance = await buyer.getBalance();
      expect(buyerFinalBalance).to.equal(buyerInitialBalance.add(price));
    });

    it("Should allow cancellation after deadline", async function () {
      const { escrow, mockNFT, seller, buyer, other, price } = await loadFixture(createEscrowFixture);

      // Fast forward past deadline
      await time.increase(86401); // 1 day + 1 second

      await escrow.connect(other).cancelEscrow(1);

      // Check that NFT is returned to seller
      expect(await mockNFT.ownerOf(1)).to.equal(seller.address);
    });

    it("Should not allow non-participants to cancel before deadline", async function () {
      const { escrow, other } = await loadFixture(createEscrowFixture);

      await expect(
        escrow.connect(other).cancelEscrow(1)
      ).to.be.revertedWith("Not authorized to cancel");
    });
  });

  describe("Dispute Management", function () {
    async function createEscrowFixture() {
      const base = await loadFixture(deployEscrowFixture);
      const { escrow, mockNFT, seller, buyer } = base;

      const price = ethers.utils.parseEther("1.0");
      const deadline = (await time.latest()) + 86400;

      await mockNFT.connect(seller).approve(escrow.address, 1);
      await escrow.connect(seller).createEscrow(buyer.address, mockNFT.address, 1, deadline, { value: price });

      return { ...base, price };
    }

    it("Should allow participants to initiate dispute", async function () {
      const { escrow, seller } = await loadFixture(createEscrowFixture);

      await expect(escrow.connect(seller).initiateDispute(1))
        .to.emit(escrow, "EscrowDisputed")
        .withArgs(1);

      const escrowData = await escrow.getEscrow(1);
      expect(escrowData.status).to.equal(3); // Disputed status
    });

    it("Should not allow dispute after dispute window", async function () {
      const { escrow, seller } = await loadFixture(createEscrowFixture);

      // Fast forward past deadline + dispute window
      await time.increase(86400 + 7 * 86400 + 1); // 1 day + 7 days + 1 second

      await expect(
        escrow.connect(seller).initiateDispute(1)
      ).to.be.revertedWith("Dispute window closed");
    });

    it("Should allow dispute resolver to resolve in favor of buyer", async function () {
      const { escrow, mockNFT, seller, buyer, disputeResolver, feeRecipient, price } = await loadFixture(createEscrowFixture);

      // Initiate dispute
      await escrow.connect(seller).initiateDispute(1);

      const sellerInitialBalance = await seller.getBalance();
      const feeRecipientInitialBalance = await feeRecipient.getBalance();

      // Resolve in favor of buyer
      await expect(escrow.connect(disputeResolver).resolveDispute(1, true))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1, true);

      // Check that NFT goes to buyer
      expect(await mockNFT.ownerOf(1)).to.equal(buyer.address);

      // Check payments (should complete the transaction)
      const fee = price.mul(250).div(10000);
      const sellerAmount = price.sub(fee);

      const sellerFinalBalance = await seller.getBalance();
      const feeRecipientFinalBalance = await feeRecipient.getBalance();

      expect(sellerFinalBalance).to.be.closeTo(sellerInitialBalance.add(sellerAmount), ethers.utils.parseEther("0.01"));
      expect(feeRecipientFinalBalance).to.equal(feeRecipientInitialBalance.add(fee));
    });

    it("Should allow dispute resolver to resolve in favor of seller", async function () {
      const { escrow, mockNFT, seller, buyer, disputeResolver, price } = await loadFixture(createEscrowFixture);

      // Initiate dispute
      await escrow.connect(seller).initiateDispute(1);

      const buyerInitialBalance = await buyer.getBalance();

      // Resolve in favor of seller
      await escrow.connect(disputeResolver).resolveDispute(1, false);

      // Check that NFT is returned to seller
      expect(await mockNFT.ownerOf(1)).to.equal(seller.address);

      // Check that ETH is returned to buyer
      const buyerFinalBalance = await buyer.getBalance();
      expect(buyerFinalBalance).to.equal(buyerInitialBalance.add(price));
    });

    it("Should not allow non-dispute resolver to resolve disputes", async function () {
      const { escrow, seller } = await loadFixture(createEscrowFixture);

      // Initiate dispute
      await escrow.connect(seller).initiateDispute(1);

      await expect(
        escrow.connect(seller).resolveDispute(1, true)
      ).to.be.revertedWith("Only dispute resolver");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to update escrow fee", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);

      await expect(escrow.connect(owner).setEscrowFee(500))
        .to.emit(escrow, "FeeUpdated")
        .withArgs(500);

      expect(await escrow.escrowFeePercentage()).to.equal(500);
    });

    it("Should not allow setting fee above maximum", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);

      await expect(
        escrow.connect(owner).setEscrowFee(1001) // More than 10%
      ).to.be.revertedWith("Fee too high");
    });

    it("Should allow owner to update fee recipient", async function () {
      const { escrow, owner, other } = await loadFixture(deployEscrowFixture);

      await escrow.connect(owner).setFeeRecipient(other.address);
      expect(await escrow.feeRecipient()).to.equal(other.address);
    });

    it("Should not allow setting zero address as fee recipient", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);

      await expect(
        escrow.connect(owner).setFeeRecipient(ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause contract", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);

      await escrow.connect(owner).pause();
      expect(await escrow.paused()).to.be.true;
    });

    it("Should not allow creating escrow when paused", async function () {
      const { escrow, mockNFT, seller, buyer, owner } = await loadFixture(deployEscrowFixture);

      await escrow.connect(owner).pause();

      const price = ethers.utils.parseEther("1.0");
      const deadline = (await time.latest()) + 86400;

      await mockNFT.connect(seller).approve(escrow.address, 1);

      await expect(
        escrow.connect(seller).createEscrow(buyer.address, mockNFT.address, 1, deadline, { value: price })
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow owner to emergency withdraw when paused", async function () {
      const { escrow, mockNFT, seller, buyer, owner } = await loadFixture(deployEscrowFixture);

      // Create an escrow first
      const price = ethers.utils.parseEther("1.0");
      const deadline = (await time.latest()) + 86400;

      await mockNFT.connect(seller).approve(escrow.address, 1);
      await escrow.connect(seller).createEscrow(buyer.address, mockNFT.address, 1, deadline, { value: price });

      // Pause and withdraw
      await escrow.connect(owner).pause();

      const ownerInitialBalance = await owner.getBalance();
      const tx = await escrow.connect(owner).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(tx.gasPrice);

      const ownerFinalBalance = await owner.getBalance();
      expect(ownerFinalBalance).to.equal(ownerInitialBalance.add(price).sub(gasUsed));
    });
  });

  describe("View Functions", function () {
    async function createMultipleEscrowsFixture() {
      const base = await loadFixture(deployEscrowFixture);
      const { escrow, mockNFT, seller, buyer } = base;

      // Create multiple escrows
      const price = ethers.utils.parseEther("1.0");
      const deadline = (await time.latest()) + 86400;

      await mockNFT.connect(seller).approve(escrow.address, 1);
      await escrow.connect(seller).createEscrow(buyer.address, mockNFT.address, 1, deadline, { value: price });

      await mockNFT.connect(seller).approve(escrow.address, 2);
      await escrow.connect(seller).createEscrow(buyer.address, mockNFT.address, 2, deadline, { value: price });

      return base;
    }

    it("Should return user escrows correctly", async function () {
      const { escrow, seller, buyer } = await loadFixture(createMultipleEscrowsFixture);

      const sellerEscrows = await escrow.getUserEscrows(seller.address);
      const buyerEscrows = await escrow.getUserEscrows(buyer.address);

      expect(sellerEscrows.length).to.equal(2);
      expect(buyerEscrows.length).to.equal(2);
      expect(sellerEscrows[0]).to.equal(1);
      expect(sellerEscrows[1]).to.equal(2);
    });

    it("Should return correct escrow details", async function () {
      const { escrow, mockNFT, seller, buyer } = await loadFixture(createMultipleEscrowsFixture);

      const escrowData = await escrow.getEscrow(1);
      
      expect(escrowData.seller).to.equal(seller.address);
      expect(escrowData.buyer).to.equal(buyer.address);
      expect(escrowData.nftContract).to.equal(mockNFT.address);
      expect(escrowData.tokenId).to.equal(1);
      expect(escrowData.status).to.equal(0); // Active
    });
  });
});

// Mock ERC721 contract for testing
const MockERC721Source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {
    uint256 private _tokenIdCounter;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }
}
`;

// Export the mock contract source for use in other tests
module.exports = {
  MockERC721Source
};
