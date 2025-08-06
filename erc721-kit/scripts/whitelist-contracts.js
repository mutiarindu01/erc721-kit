const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script to whitelist NFT contracts in marketplace and escrow
 */

// NFT contracts to whitelist (add your contracts here)
const NFT_CONTRACTS = [
  {
    name: "MockNFT",
    address: "0x...", // Replace with actual deployed address
    description: "Example NFT contract for testing",
  },
  // Add more contracts as needed
];

async function loadDeploymentInfo(networkName) {
  const deploymentFile = path.join(
    __dirname,
    "../deployments",
    `${networkName}.json`,
  );

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  return deploymentData;
}

async function whitelistContract(
  contractInstance,
  contractAddress,
  contractName,
) {
  try {
    console.log(`Whitelisting ${contractName} (${contractAddress})...`);

    // Check if already whitelisted
    const isWhitelisted =
      await contractInstance.whitelistedContracts(contractAddress);

    if (isWhitelisted) {
      console.log(`✓ ${contractName} is already whitelisted`);
      return true;
    }

    // Whitelist the contract
    const tx = await contractInstance.setContractWhitelist(
      contractAddress,
      true,
    );
    console.log(`Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(
      `✓ ${contractName} whitelisted successfully (Gas used: ${receipt.gasUsed})`,
    );

    return true;
  } catch (error) {
    console.error(`❌ Failed to whitelist ${contractName}:`, error.message);
    return false;
  }
}

async function main() {
  const networkName = network.name;
  console.log(`🔧 Whitelisting contracts on ${networkName} network...`);

  try {
    // Load deployment information
    const deploymentInfo = await loadDeploymentInfo(networkName);

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log(`Using account: ${signer.address}`);

    // Get contract instances
    const marketplaceAddress =
      deploymentInfo.contracts.ERC721Marketplace.address;
    const escrowAddress = deploymentInfo.contracts.ERC721Escrow.address;

    console.log(`\nMarketplace: ${marketplaceAddress}`);
    console.log(`Escrow: ${escrowAddress}`);

    const marketplace = await ethers.getContractAt(
      "ERC721Marketplace",
      marketplaceAddress,
      signer,
    );
    const escrow = await ethers.getContractAt(
      "ERC721Escrow",
      escrowAddress,
      signer,
    );

    // If no specific contracts provided, try to whitelist deployed MockNFT
    let contractsToWhitelist = NFT_CONTRACTS;

    if (
      contractsToWhitelist.length === 0 ||
      contractsToWhitelist[0].address === "0x..."
    ) {
      console.log(
        "\n⚠️ No specific contracts configured. Looking for deployed MockNFT...",
      );

      // Check if MockNFT was deployed
      const mockNFTFile = path.join(
        __dirname,
        "../deployments",
        `${networkName}-mock-nft.json`,
      );
      if (fs.existsSync(mockNFTFile)) {
        const mockNFTData = JSON.parse(fs.readFileSync(mockNFTFile, "utf8"));
        contractsToWhitelist = [
          {
            name: "MockNFT",
            address: mockNFTData.address,
            description: "Example NFT contract for testing",
          },
        ];
      }
    }

    if (
      contractsToWhitelist.length === 0 ||
      contractsToWhitelist[0].address === "0x..."
    ) {
      console.log(
        "\n⚠️ No contracts to whitelist. Please update the NFT_CONTRACTS array in this script.",
      );
      console.log("Example configuration:");
      console.log(`const NFT_CONTRACTS = [
  {
    name: "MyNFTCollection",
    address: "0x1234567890123456789012345678901234567890",
    description: "My awesome NFT collection"
  }
];`);
      return;
    }

    console.log(`\n📋 Contracts to whitelist: ${contractsToWhitelist.length}`);

    const results = {
      marketplace: {},
      escrow: {},
    };

    // Whitelist in marketplace
    console.log(`\n🛒 Whitelisting in Marketplace...`);
    for (const contract of contractsToWhitelist) {
      if (!ethers.utils.isAddress(contract.address)) {
        console.log(
          `❌ Invalid address for ${contract.name}: ${contract.address}`,
        );
        results.marketplace[contract.name] = false;
        continue;
      }

      results.marketplace[contract.name] = await whitelistContract(
        marketplace,
        contract.address,
        contract.name,
      );
    }

    // Whitelist in escrow
    console.log(`\n🔒 Whitelisting in Escrow...`);
    for (const contract of contractsToWhitelist) {
      if (!ethers.utils.isAddress(contract.address)) {
        console.log(
          `❌ Invalid address for ${contract.name}: ${contract.address}`,
        );
        results.escrow[contract.name] = false;
        continue;
      }

      results.escrow[contract.name] = await whitelistContract(
        escrow,
        contract.address,
        contract.name,
      );
    }

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`Network: ${networkName}`);
    console.log(`Total contracts processed: ${contractsToWhitelist.length}`);

    console.log(`\nMarketplace Results:`);
    for (const [name, success] of Object.entries(results.marketplace)) {
      console.log(`├─ ${name}: ${success ? "✅ Success" : "❌ Failed"}`);
    }

    console.log(`\nEscrow Results:`);
    for (const [name, success] of Object.entries(results.escrow)) {
      console.log(`├─ ${name}: ${success ? "✅ Success" : "❌ Failed"}`);
    }

    // Check for failures
    const marketplaceFailures = Object.values(results.marketplace).filter(
      (v) => !v,
    ).length;
    const escrowFailures = Object.values(results.escrow).filter(
      (v) => !v,
    ).length;

    if (marketplaceFailures > 0 || escrowFailures > 0) {
      console.log(
        `\n⚠️ Some contracts failed to whitelist. Check the errors above.`,
      );
    } else {
      console.log(`\n🎉 All contracts whitelisted successfully!`);
    }

    // Save results
    const resultsFile = path.join(
      __dirname,
      "../deployments",
      `${networkName}-whitelist-results.json`,
    );
    const resultsData = {
      timestamp: new Date().toISOString(),
      network: networkName,
      contracts: contractsToWhitelist,
      results: results,
      success: marketplaceFailures === 0 && escrowFailures === 0,
    };

    fs.writeFileSync(resultsFile, JSON.stringify(resultsData, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
  } catch (error) {
    console.error(`\n❌ Whitelisting failed:`, error);
    process.exit(1);
  }
}

// Utility function to check whitelist status
async function checkWhitelistStatus(contractAddress, deploymentInfo) {
  console.log(`\n🔍 Checking whitelist status for ${contractAddress}...`);

  try {
    const [signer] = await ethers.getSigners();

    const marketplace = await ethers.getContractAt(
      "ERC721Marketplace",
      deploymentInfo.contracts.ERC721Marketplace.address,
      signer,
    );

    const escrow = await ethers.getContractAt(
      "ERC721Escrow",
      deploymentInfo.contracts.ERC721Escrow.address,
      signer,
    );

    const marketplaceWhitelisted =
      await marketplace.whitelistedContracts(contractAddress);
    const escrowWhitelisted =
      await escrow.whitelistedContracts(contractAddress);

    console.log(
      `Marketplace: ${marketplaceWhitelisted ? "✅ Whitelisted" : "❌ Not whitelisted"}`,
    );
    console.log(
      `Escrow: ${escrowWhitelisted ? "✅ Whitelisted" : "❌ Not whitelisted"}`,
    );

    return {
      marketplace: marketplaceWhitelisted,
      escrow: escrowWhitelisted,
    };
  } catch (error) {
    console.error(`Error checking whitelist status:`, error.message);
    return null;
  }
}

// Command line argument parsing
if (process.argv.length > 2) {
  const command = process.argv[2];

  if (command === "check" && process.argv.length >= 4) {
    const contractAddress = process.argv[3];

    console.log(`Checking whitelist status for: ${contractAddress}`);

    loadDeploymentInfo(network.name)
      .then((deploymentInfo) =>
        checkWhitelistStatus(contractAddress, deploymentInfo),
      )
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });

    return;
  }

  if (command === "help") {
    console.log(`
Usage:
  npx hardhat run scripts/whitelist-contracts.js --network <network>
    Whitelist all configured contracts
    
  npx hardhat run scripts/whitelist-contracts.js check <address> --network <network>
    Check whitelist status for a specific contract
    
  npx hardhat run scripts/whitelist-contracts.js help
    Show this help message

Examples:
  npx hardhat run scripts/whitelist-contracts.js --network sepolia
  npx hardhat run scripts/whitelist-contracts.js check 0x1234... --network sepolia
`);
    return;
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  main,
  checkWhitelistStatus,
  whitelistContract,
};
