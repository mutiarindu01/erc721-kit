const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Configuration for different networks
const NETWORK_CONFIG = {
  // Ethereum Mainnet
  mainnet: {
    feeRecipient: "0x0000000000000000000000000000000000000000", // Replace with actual address
    disputeResolver: "0x0000000000000000000000000000000000000000", // Replace with actual address
    verify: true,
    blockConfirmations: 6,
  },
  // Ethereum Sepolia Testnet
  sepolia: {
    feeRecipient: "0x0000000000000000000000000000000000000000", // Replace with actual address
    disputeResolver: "0x0000000000000000000000000000000000000000", // Replace with actual address
    verify: true,
    blockConfirmations: 3,
  },
  // Polygon Mainnet
  polygon: {
    feeRecipient: "0x0000000000000000000000000000000000000000", // Replace with actual address
    disputeResolver: "0x0000000000000000000000000000000000000000", // Replace with actual address
    verify: true,
    blockConfirmations: 5,
  },
  // Polygon Mumbai Testnet
  mumbai: {
    feeRecipient: "0x0000000000000000000000000000000000000000", // Replace with actual address
    disputeResolver: "0x0000000000000000000000000000000000000000", // Replace with actual address
    verify: true,
    blockConfirmations: 2,
  },
  // Local/Hardhat Network
  localhost: {
    feeRecipient: null, // Will use deployer address
    disputeResolver: null, // Will use deployer address
    verify: false,
    blockConfirmations: 1,
  },
  hardhat: {
    feeRecipient: null, // Will use deployer address
    disputeResolver: null, // Will use deployer address
    verify: false,
    blockConfirmations: 1,
  },
};

async function main() {
  const networkName = network.name;
  const config = NETWORK_CONFIG[networkName];

  if (!config) {
    throw new Error(`No configuration found for network: ${networkName}`);
  }

  console.log(`🚀 Deploying ERC721 Kit to ${networkName} network...`);
  console.log(`Configuration:`, config);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`\n📝 Deploying with account: ${deployer.address}`);

  const balance = await deployer.getBalance();
  console.log(`💰 Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  // Use deployer address as fallback for local networks
  const feeRecipient = config.feeRecipient || deployer.address;
  const disputeResolver = config.disputeResolver || deployer.address;

  console.log(`\n⚙️  Deployment Parameters:`);
  console.log(`Fee Recipient: ${feeRecipient}`);
  console.log(`Dispute Resolver: ${disputeResolver}`);

  const deployments = {};

  try {
    // 1. Deploy RoyaltyEngine
    console.log(`\n📋 1. Deploying RoyaltyEngine...`);
    const RoyaltyEngine = await ethers.getContractFactory("RoyaltyEngine");
    const royaltyEngine = await RoyaltyEngine.deploy();
    await royaltyEngine.deployed();

    console.log(`✅ RoyaltyEngine deployed to: ${royaltyEngine.address}`);
    deployments.RoyaltyEngine = {
      address: royaltyEngine.address,
      constructorArgs: [],
    };

    // Wait for block confirmations
    if (config.blockConfirmations > 1) {
      console.log(
        `⏳ Waiting for ${config.blockConfirmations} block confirmations...`,
      );
      await royaltyEngine.deployTransaction.wait(config.blockConfirmations);
    }

    // 2. Deploy ERC721Marketplace
    console.log(`\n📋 2. Deploying ERC721Marketplace...`);
    const ERC721Marketplace =
      await ethers.getContractFactory("ERC721Marketplace");
    const marketplace = await ERC721Marketplace.deploy(
      feeRecipient,
      royaltyEngine.address,
    );
    await marketplace.deployed();

    console.log(`✅ ERC721Marketplace deployed to: ${marketplace.address}`);
    deployments.ERC721Marketplace = {
      address: marketplace.address,
      constructorArgs: [feeRecipient, royaltyEngine.address],
    };

    // Wait for block confirmations
    if (config.blockConfirmations > 1) {
      console.log(
        `⏳ Waiting for ${config.blockConfirmations} block confirmations...`,
      );
      await marketplace.deployTransaction.wait(config.blockConfirmations);
    }

    // 3. Deploy ERC721Escrow
    console.log(`\n📋 3. Deploying ERC721Escrow...`);
    const ERC721Escrow = await ethers.getContractFactory("ERC721Escrow");
    const escrow = await ERC721Escrow.deploy(feeRecipient, disputeResolver);
    await escrow.deployed();

    console.log(`✅ ERC721Escrow deployed to: ${escrow.address}`);
    deployments.ERC721Escrow = {
      address: escrow.address,
      constructorArgs: [feeRecipient, disputeResolver],
    };

    // Wait for block confirmations
    if (config.blockConfirmations > 1) {
      console.log(
        `⏳ Waiting for ${config.blockConfirmations} block confirmations...`,
      );
      await escrow.deployTransaction.wait(config.blockConfirmations);
    }

    // 4. Initial Configuration
    console.log(`\n⚙️  4. Performing initial configuration...`);

    // Set default royalty (2.5%)
    console.log(`Setting default royalty to 2.5% for fee recipient...`);
    const setDefaultRoyaltyTx = await royaltyEngine.setDefaultRoyalty(
      feeRecipient,
      250,
    );
    await setDefaultRoyaltyTx.wait();
    console.log(`✅ Default royalty set`);

    // Set marketplace fee (2.5%)
    console.log(`Setting marketplace fee to 2.5%...`);
    const setMarketplaceFeeTx = await marketplace.setMarketplaceFee(250);
    await setMarketplaceFeeTx.wait();
    console.log(`✅ Marketplace fee set`);

    // Set escrow fee (2.5%)
    console.log(`Setting escrow fee to 2.5%...`);
    const setEscrowFeeTx = await escrow.setEscrowFee(250);
    await setEscrowFeeTx.wait();
    console.log(`✅ Escrow fee set`);

    // Save deployment info
    const deploymentInfo = {
      network: networkName,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      deployerBalance: ethers.utils.formatEther(balance),
      contracts: deployments,
      configuration: {
        feeRecipient,
        disputeResolver,
        defaultRoyaltyPercentage: "2.5%",
        marketplaceFeePercentage: "2.5%",
        escrowFeePercentage: "2.5%",
      },
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

    // Generate frontend config
    const frontendConfig = {
      [networkName]: {
        chainId: network.config.chainId,
        contracts: {
          ERC721Marketplace: {
            address: marketplace.address,
            abi: "ERC721Marketplace", // Reference to ABI file
          },
          ERC721Escrow: {
            address: escrow.address,
            abi: "ERC721Escrow", // Reference to ABI file
          },
          RoyaltyEngine: {
            address: royaltyEngine.address,
            abi: "RoyaltyEngine", // Reference to ABI file
          },
        },
      },
    };

    const frontendConfigFile = path.join(
      __dirname,
      "../frontend/config/contracts.json",
    );
    const frontendConfigDir = path.dirname(frontendConfigFile);
    if (!fs.existsSync(frontendConfigDir)) {
      fs.mkdirSync(frontendConfigDir, { recursive: true });
    }

    // Load existing config and merge
    let existingConfig = {};
    if (fs.existsSync(frontendConfigFile)) {
      existingConfig = JSON.parse(fs.readFileSync(frontendConfigFile, "utf8"));
    }

    const mergedConfig = { ...existingConfig, ...frontendConfig };
    fs.writeFileSync(frontendConfigFile, JSON.stringify(mergedConfig, null, 2));
    console.log(`💾 Frontend config saved to: ${frontendConfigFile}`);

    console.log(`\n🎉 Deployment completed successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`├─ Network: ${networkName}`);
    console.log(`├─ RoyaltyEngine: ${royaltyEngine.address}`);
    console.log(`├─ ERC721Marketplace: ${marketplace.address}`);
    console.log(`└─ ERC721Escrow: ${escrow.address}`);

    // Contract verification
    if (
      config.verify &&
      networkName !== "localhost" &&
      networkName !== "hardhat"
    ) {
      console.log(`\n🔍 Starting contract verification...`);
      console.log(`Note: You can also run verification separately using:`);
      console.log(`npx hardhat run scripts/verify.js --network ${networkName}`);

      try {
        const { exec } = require("child_process");
        const util = require("util");
        const execPromise = util.promisify(exec);

        // Verify RoyaltyEngine
        console.log(`Verifying RoyaltyEngine...`);
        await execPromise(
          `npx hardhat verify --network ${networkName} ${royaltyEngine.address}`,
        );
        console.log(`✅ RoyaltyEngine verified`);

        // Verify ERC721Marketplace
        console.log(`Verifying ERC721Marketplace...`);
        await execPromise(
          `npx hardhat verify --network ${networkName} ${marketplace.address} "${feeRecipient}" "${royaltyEngine.address}"`,
        );
        console.log(`✅ ERC721Marketplace verified`);

        // Verify ERC721Escrow
        console.log(`Verifying ERC721Escrow...`);
        await execPromise(
          `npx hardhat verify --network ${networkName} ${escrow.address} "${feeRecipient}" "${disputeResolver}"`,
        );
        console.log(`✅ ERC721Escrow verified`);

        console.log(`\n✅ All contracts verified successfully!`);
      } catch (verificationError) {
        console.log(
          `\n⚠️  Automatic verification failed:`,
          verificationError.message,
        );
        console.log(`You can verify manually using the verify.js script`);
      }
    }

    console.log(`\n🔗 Next Steps:`);
    console.log(`1. Update frontend configuration with contract addresses`);
    console.log(`2. Test the deployment using the provided test scripts`);
    console.log(`3. Configure NFT contract whitelisting as needed`);
    console.log(`4. Set up monitoring and alerts for the contracts`);

    return deployments;
  } catch (error) {
    console.error(`\n❌ Deployment failed:`, error);

    // Save partial deployment info for debugging
    if (Object.keys(deployments).length > 0) {
      const partialDeploymentInfo = {
        network: networkName,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        status: "FAILED",
        error: error.message,
        partialDeployments: deployments,
      };

      const deploymentsDir = path.join(__dirname, "../deployments");
      if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
      }

      const failedDeploymentFile = path.join(
        deploymentsDir,
        `${networkName}-failed.json`,
      );
      fs.writeFileSync(
        failedDeploymentFile,
        JSON.stringify(partialDeploymentInfo, null, 2),
      );
      console.log(
        `💾 Partial deployment info saved to: ${failedDeploymentFile}`,
      );
    }

    process.exit(1);
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

module.exports = main;
