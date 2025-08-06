const { ethers, network, run } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Verify deployed contracts on block explorers
 * This script reads deployment information and verifies contracts
 */

async function verifyContract(contractAddress, constructorArgs = [], contractName = "") {
  console.log(`\n🔍 Verifying ${contractName} at ${contractAddress}...`);
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ ${contractName} verified successfully!`);
    return true;
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`ℹ️  ${contractName} is already verified`);
      return true;
    } else {
      console.error(`❌ Failed to verify ${contractName}:`, error.message);
      return false;
    }
  }
}

async function loadDeploymentInfo(networkName) {
  const deploymentFile = path.join(__dirname, "../deployments", `${networkName}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }
  
  const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  return deploymentData;
}

async function main() {
  const networkName = network.name;
  
  console.log(`🔍 Starting contract verification on ${networkName} network...`);
  
  // Check if verification is supported on this network
  if (networkName === "localhost" || networkName === "hardhat") {
    console.log(`⚠️  Contract verification is not available for ${networkName} network`);
    return;
  }

  try {
    // Load deployment information
    console.log(`📋 Loading deployment information...`);
    const deploymentInfo = await loadDeploymentInfo(networkName);
    
    console.log(`Found deployment from: ${deploymentInfo.timestamp}`);
    console.log(`Deployer: ${deploymentInfo.deployer}`);
    
    const contracts = deploymentInfo.contracts;
    const verificationResults = {};

    // Verify RoyaltyEngine
    if (contracts.RoyaltyEngine) {
      console.log(`\n📝 1. Verifying RoyaltyEngine...`);
      const success = await verifyContract(
        contracts.RoyaltyEngine.address,
        contracts.RoyaltyEngine.constructorArgs,
        "RoyaltyEngine"
      );
      verificationResults.RoyaltyEngine = success;
      
      // Add delay between verifications
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Verify ERC721Marketplace
    if (contracts.ERC721Marketplace) {
      console.log(`\n📝 2. Verifying ERC721Marketplace...`);
      const success = await verifyContract(
        contracts.ERC721Marketplace.address,
        contracts.ERC721Marketplace.constructorArgs,
        "ERC721Marketplace"
      );
      verificationResults.ERC721Marketplace = success;
      
      // Add delay between verifications
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Verify ERC721Escrow
    if (contracts.ERC721Escrow) {
      console.log(`\n📝 3. Verifying ERC721Escrow...`);
      const success = await verifyContract(
        contracts.ERC721Escrow.address,
        contracts.ERC721Escrow.constructorArgs,
        "ERC721Escrow"
      );
      verificationResults.ERC721Escrow = success;
    }

    // Summary
    console.log(`\n📊 Verification Summary:`);
    console.log(`├─ Network: ${networkName}`);
    
    let allSuccessful = true;
    for (const [contractName, success] of Object.entries(verificationResults)) {
      const status = success ? "✅ Verified" : "❌ Failed";
      console.log(`├─ ${contractName}: ${status}`);
      if (!success) allSuccessful = false;
    }

    if (allSuccessful) {
      console.log(`\n🎉 All contracts verified successfully!`);
      
      // Update deployment info with verification status
      deploymentInfo.verification = {
        timestamp: new Date().toISOString(),
        network: networkName,
        results: verificationResults,
        status: "COMPLETED"
      };
      
      const deploymentFile = path.join(__dirname, "../deployments", `${networkName}.json`);
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
      console.log(`💾 Updated deployment info with verification status`);
      
    } else {
      console.log(`\n⚠️  Some contracts failed verification. Check the errors above.`);
      
      // Update deployment info with partial verification status
      deploymentInfo.verification = {
        timestamp: new Date().toISOString(),
        network: networkName,
        results: verificationResults,
        status: "PARTIAL"
      };
      
      const deploymentFile = path.join(__dirname, "../deployments", `${networkName}.json`);
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    }

    // Generate verification report
    const reportContent = generateVerificationReport(deploymentInfo, verificationResults);
    const reportFile = path.join(__dirname, "../deployments", `${networkName}-verification-report.md`);
    fs.writeFileSync(reportFile, reportContent);
    console.log(`📄 Verification report saved to: ${reportFile}`);

  } catch (error) {
    console.error(`\n❌ Verification process failed:`, error);
    process.exit(1);
  }
}

function generateVerificationReport(deploymentInfo, verificationResults) {
  const networkName = network.name;
  const timestamp = new Date().toISOString();
  
  let report = `# ERC721 Kit Verification Report\n\n`;
  report += `**Network:** ${networkName}\n`;
  report += `**Verification Date:** ${timestamp}\n`;
  report += `**Deployment Date:** ${deploymentInfo.timestamp}\n`;
  report += `**Deployer:** ${deploymentInfo.deployer}\n\n`;
  
  report += `## Contract Addresses\n\n`;
  
  for (const [contractName, contractInfo] of Object.entries(deploymentInfo.contracts)) {
    const verificationStatus = verificationResults[contractName] ? "✅ Verified" : "❌ Not Verified";
    report += `### ${contractName}\n`;
    report += `- **Address:** \`${contractInfo.address}\`\n`;
    report += `- **Status:** ${verificationStatus}\n`;
    report += `- **Constructor Args:** \`${JSON.stringify(contractInfo.constructorArgs)}\`\n\n`;
  }
  
  report += `## Configuration\n\n`;
  if (deploymentInfo.configuration) {
    for (const [key, value] of Object.entries(deploymentInfo.configuration)) {
      report += `- **${key}:** ${value}\n`;
    }
  }
  
  report += `\n## Verification Commands\n\n`;
  report += `To verify these contracts manually, use the following commands:\n\n`;
  
  for (const [contractName, contractInfo] of Object.entries(deploymentInfo.contracts)) {
    const argsString = contractInfo.constructorArgs.map(arg => `"${arg}"`).join(' ');
    report += `\`\`\`bash\n`;
    report += `npx hardhat verify --network ${networkName} ${contractInfo.address}`;
    if (argsString) {
      report += ` ${argsString}`;
    }
    report += `\n\`\`\`\n\n`;
  }
  
  report += `## Block Explorer Links\n\n`;
  
  const explorerUrls = {
    mainnet: "https://etherscan.io",
    sepolia: "https://sepolia.etherscan.io",
    polygon: "https://polygonscan.com",
    mumbai: "https://mumbai.polygonscan.com",
    bsc: "https://bscscan.com",
    bscTestnet: "https://testnet.bscscan.com"
  };
  
  const explorerUrl = explorerUrls[networkName];
  if (explorerUrl) {
    for (const [contractName, contractInfo] of Object.entries(deploymentInfo.contracts)) {
      report += `- [${contractName}](${explorerUrl}/address/${contractInfo.address})\n`;
    }
  }
  
  return report;
}

// Utility function to verify a single contract by address
async function verifySingleContract(contractAddress, constructorArgs = []) {
  console.log(`🔍 Verifying contract at ${contractAddress}...`);
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ Contract verified successfully!`);
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`ℹ️  Contract is already verified`);
    } else {
      console.error(`❌ Verification failed:`, error.message);
      throw error;
    }
  }
}

// Command line argument parsing for single contract verification
if (process.argv.length > 2) {
  const command = process.argv[2];
  
  if (command === "single" && process.argv.length >= 4) {
    const contractAddress = process.argv[3];
    const constructorArgs = process.argv.slice(4);
    
    console.log(`Verifying single contract: ${contractAddress}`);
    console.log(`Constructor args: ${constructorArgs.join(', ')}`);
    
    verifySingleContract(contractAddress, constructorArgs)
      .then(() => {
        console.log(`✅ Single contract verification completed`);
        process.exit(0);
      })
      .catch((error) => {
        console.error(`❌ Single contract verification failed:`, error);
        process.exit(1);
      });
    
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
  verifyContract,
  verifySingleContract,
  loadDeploymentInfo
};
