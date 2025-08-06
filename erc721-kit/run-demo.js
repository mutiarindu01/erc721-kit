#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn, exec } = require("child_process");
const http = require("http");
const open = require("open");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000) {
  let port = startPort;
  while (!(await checkPort(port))) {
    port++;
  }
  return port;
}

function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn("sh", ["-c", command], {
      stdio: "inherit",
      ...options,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function startSandbox() {
  log("\n🚀 Starting ERC721 Kit Demo Environment...", "cyan");

  const sandboxPath = path.join(__dirname, "sandbox");

  // Check if sandbox exists
  if (!fs.existsSync(sandboxPath)) {
    log("❌ Sandbox directory not found!", "red");
    return;
  }

  log("📁 Sandbox directory found", "green");

  // Check if we can run a simple HTTP server
  try {
    const port = await findAvailablePort(3001);
    log(`🔍 Found available port: ${port}`, "yellow");

    // Try different server options
    const servers = [
      {
        name: "npx serve",
        command: `npx serve "${sandboxPath}" -l ${port}`,
        description: "Using serve package",
      },
      {
        name: "npx http-server",
        command: `npx http-server "${sandboxPath}" -p ${port} -o`,
        description: "Using http-server package",
      },
      {
        name: "python3",
        command: `cd "${sandboxPath}" && python3 -m http.server ${port}`,
        description: "Using Python 3 HTTP server",
      },
      {
        name: "python",
        command: `cd "${sandboxPath}" && python -m SimpleHTTPServer ${port}`,
        description: "Using Python 2 HTTP server",
      },
    ];

    log("\n📋 Attempting to start demo server...", "blue");

    for (const server of servers) {
      try {
        log(`🔄 Trying ${server.description}...`, "yellow");

        const proc = spawn("sh", ["-c", server.command], {
          stdio: ["ignore", "pipe", "pipe"],
        });

        // Wait a bit to see if server starts
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (!proc.killed) {
          log(`✅ Server started successfully!`, "green");
          log(`🌐 Demo URL: http://localhost:${port}`, "cyan");

          // Try to open browser
          try {
            await open(`http://localhost:${port}`);
            log("🎨 Browser opened automatically", "green");
          } catch {
            log(
              "⚠️  Please open http://localhost:" + port + " in your browser",
              "yellow",
            );
          }

          log("\n��� Demo Features:", "blue");
          log("   • Interactive NFT Gallery", "white");
          log("   • Mint Form Testing", "white");
          log("   • Escrow Dashboard", "white");
          log("   • Marketplace Demo", "white");
          log("   • Code Examples", "white");
          log("   • Setup Guide", "white");

          log("\n🛑 Press Ctrl+C to stop the demo server", "yellow");

          // Keep process alive
          process.on("SIGINT", () => {
            log("\n👋 Stopping demo server...", "yellow");
            proc.kill();
            process.exit(0);
          });

          return;
        }
      } catch (error) {
        log(`❌ ${server.name} failed: ${error.message}`, "red");
      }
    }

    // If all servers failed, provide manual instructions
    log("\n⚠️  Could not start server automatically", "yellow");
    log("\n📋 Manual Setup Instructions:", "blue");
    log("1. Navigate to sandbox directory:", "white");
    log(`   cd ${sandboxPath}`, "cyan");
    log("\n2. Start a local server using one of these options:", "white");
    log("   npx serve . -l 3001", "cyan");
    log("   npx http-server . -p 3001", "cyan");
    log("   python3 -m http.server 3001", "cyan");
    log("   python -m SimpleHTTPServer 3001", "cyan");
    log("\n3. Open browser to: http://localhost:3001", "white");
  } catch (error) {
    log(`❌ Error starting demo: ${error.message}`, "red");
  }
}

async function runTests() {
  log("\n🧪 Running ERC721 Kit Tests...", "cyan");

  try {
    // Check if we're in the right directory
    if (!fs.existsSync(path.join(__dirname, "package.json"))) {
      log("❌ Not in ERC721 Kit root directory", "red");
      return;
    }

    log("📦 Installing dependencies...", "yellow");
    await runCommand("npm install");

    log("🔨 Compiling contracts...", "yellow");
    await runCommand("npx hardhat compile");

    log("🧪 Running tests...", "yellow");
    await runCommand("npx hardhat test");

    log("✅ All tests passed!", "green");
  } catch (error) {
    log(`❌ Tests failed: ${error.message}`, "red");
  }
}

async function showInfo() {
  log("\n📊 ERC721 Kit Information", "cyan");
  log("═══════════════════════════════════════", "blue");

  // Package info
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "package.json"), "utf8"),
    );
    log(`📦 Package: ${packageJson.name}`, "white");
    log(`📌 Version: ${packageJson.version}`, "white");
    log(`📝 Description: ${packageJson.description || "ERC721 Kit"}`, "white");
  } catch {
    log("📦 Package: ERC721 Kit", "white");
  }

  // Directory structure
  log("\n📁 Directory Structure:", "blue");
  const dirs = [
    "contracts/",
    "frontend/",
    "example-app/",
    "sandbox/",
    "scripts/",
    "test/",
    "guides/",
  ];

  dirs.forEach((dir) => {
    const dirPath = path.join(__dirname, dir);
    const exists = fs.existsSync(dirPath);
    const icon = exists ? "✅" : "❌";
    log(`   ${icon} ${dir}`, exists ? "green" : "red");
  });

  // File counts
  log("\n📈 Project Statistics:", "blue");
  try {
    const contractsDir = path.join(__dirname, "contracts");
    const frontenDir = path.join(__dirname, "frontend");
    const testsDir = path.join(__dirname, "test");

    if (fs.existsSync(contractsDir)) {
      const contracts = fs
        .readdirSync(contractsDir)
        .filter((f) => f.endsWith(".sol")).length;
      log(`   📜 Smart Contracts: ${contracts}`, "white");
    }

    if (fs.existsSync(frontenDir)) {
      const components = fs
        .readdirSync(path.join(frontenDir, "components"))
        .filter((f) => f.endsWith(".jsx")).length;
      log(`   🎨 Components: ${components}`, "white");
    }

    if (fs.existsSync(testsDir)) {
      const tests = fs
        .readdirSync(testsDir)
        .filter((f) => f.endsWith(".test.js")).length;
      log(`   🧪 Test Files: ${tests}`, "white");
    }
  } catch (error) {
    log("   ⚠️  Could not read project statistics", "yellow");
  }

  log("\n🔗 Quick Commands:", "blue");
  log("   npm run demo      - Start interactive demo", "cyan");
  log("   npm test          - Run test suite", "cyan");
  log("   npm run build     - Build project", "cyan");
  log("   npm run deploy    - Deploy contracts", "cyan");
}

async function deployToTestnet() {
  log("\n🚀 Deploying to Testnet...", "cyan");

  try {
    // Check if .env exists
    if (!fs.existsSync(".env")) {
      log("⚠️  .env file not found. Creating template...", "yellow");

      const envTemplate = `# ERC721 Kit Environment Configuration
PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key

# Contract Configuration
FEE_RECIPIENT=0x0000000000000000000000000000000000000000
DISPUTE_RESOLVER=0x0000000000000000000000000000000000000000
MARKETPLACE_FEE_PERCENTAGE=250
ESCROW_FEE_PERCENTAGE=250
`;

      fs.writeFileSync(".env", envTemplate);
      log("📝 .env template created. Please update with your values.", "green");
      return;
    }

    log("📦 Installing dependencies...", "yellow");
    await runCommand("npm install");

    log("🔨 Compiling contracts...", "yellow");
    await runCommand("npx hardhat compile");

    log("🌐 Deploying to Sepolia testnet...", "yellow");
    await runCommand("npx hardhat run scripts/deploy.js --network sepolia");

    log("✅ Deployment completed!", "green");
    log("📋 Check deployments/ folder for contract addresses", "cyan");
  } catch (error) {
    log(`❌ Deployment failed: ${error.message}`, "red");
    log(
      "💡 Make sure you have configured .env with valid credentials",
      "yellow",
    );
  }
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Header
  log("\n" + "=".repeat(50), "blue");
  log("🎭 ERC721 Kit Demo Runner", "magenta");
  log("=".repeat(50), "blue");

  switch (command) {
    case "demo":
    case "sandbox":
      await startSandbox();
      break;

    case "test":
      await runTests();
      break;

    case "info":
      await showInfo();
      break;

    case "deploy":
      await deployToTestnet();
      break;

    default:
      log("\n📋 Available Commands:", "blue");
      log("   demo     - Start interactive demo sandbox", "cyan");
      log("   test     - Run comprehensive test suite", "cyan");
      log("   info     - Show project information", "cyan");
      log("   deploy   - Deploy contracts to testnet", "cyan");
      log("\n💡 Usage:", "yellow");
      log("   node run-demo.js demo", "white");
      log("   node run-demo.js test", "white");
      log("   node run-demo.js info", "white");
      log("   node run-demo.js deploy", "white");
      log("\n📖 For detailed documentation, see:", "blue");
      log("   ./guides/ERC721_Integration.md", "cyan");
      break;
  }
}

// Handle errors gracefully
process.on("unhandledRejection", (error) => {
  log(`\n❌ Unhandled error: ${error.message}`, "red");
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  log(`\n❌ Uncaught exception: ${error.message}`, "red");
  process.exit(1);
});

// Run main function
main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, "red");
  process.exit(1);
});
