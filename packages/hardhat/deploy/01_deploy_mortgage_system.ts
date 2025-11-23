import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { parseEther } from "ethers";

/**
 * Deploys the Mortgage Pool system contracts:
 * 1. PropertyNFT - Tokenized real estate
 * 2. MortgagePool - Liquidity pool for lenders
 * 3. MortgageManager - Core mortgage logic
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployMortgageContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🏗️  Deploying Mortgage Pool System...\n");

  // 1. Deploy PropertyNFT
  console.log("📝 Deploying PropertyNFT...");
  const propertyNFT = await deploy("PropertyNFT", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // 2. Deploy MortgagePool
  console.log("💰 Deploying MortgagePool...");
  const mortgagePool = await deploy("MortgagePool", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // 3. Deploy MortgageManager
  console.log("🏦 Deploying MortgageManager...");
  const mortgageManager = await deploy("MortgageManager", {
    from: deployer,
    args: [propertyNFT.address, mortgagePool.address],
    log: true,
    autoMine: true,
  });

  console.log("\n⚙️  Configuring contracts...\n");

  // Get signer
  const [signer] = await hre.ethers.getSigners();

  // Get deployed contract instances with signer
  const propertyNFTContract = await hre.ethers.getContractAt("PropertyNFT", propertyNFT.address, signer);
  const mortgagePoolContract = await hre.ethers.getContractAt("MortgagePool", mortgagePool.address, signer);

  // 4. Mint demo properties BEFORE transferring ownership
  console.log("🏠 Minting demo properties...\n");

  const demoProperties = [
    {
      address: "123 Blockchain Ave, Crypto City, CC 12345",
      value: parseEther("200"), // 200 ETH ≈ $200k property
      shares: 1000,
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
      description: "Modern 3BR/2BA suburban home with smart contract deed",
    },
    {
      address: "456 DeFi Street, Web3 Town, WT 67890",
      value: parseEther("150"), // 150 ETH ≈ $150k property
      shares: 1000,
      image: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c",
      description: "Cozy 2BR/1BA starter home with NFT title",
    },
    {
      address: "789 Ethereum Boulevard, Smart City, SC 54321",
      value: parseEther("350"), // 350 ETH ≈ $350k property
      shares: 1000,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
      description: "Luxury 4BR/3BA family home with pool and tokenized ownership",
    },
  ];

  for (let i = 0; i < demoProperties.length; i++) {
    const prop = demoProperties[i];
    console.log(`Minting Property ${i + 1}: ${prop.address}`);

    const tx = await propertyNFTContract.mintProperty(
      mortgageManager.address,
      prop.address,
      prop.value,
      prop.shares,
      prop.image,
      prop.description,
    );
    await tx.wait();

    // List the property
    const listTx = await propertyNFTContract.listProperty(i);
    await listTx.wait();
    console.log(`✅ Property ${i} listed for mortgage`);
  }

  // 5. Set up permissions
  console.log("\n🔐 Transferring PropertyNFT ownership to MortgageManager...");
  const transferTx = await propertyNFTContract.transferOwnership(mortgageManager.address);
  await transferTx.wait();

  // Authorize MortgageManager to borrow from pool
  console.log("🔐 Authorizing MortgageManager to access pool...");
  const authTx = await mortgagePoolContract.authorizeBorrower(mortgageManager.address);
  await authTx.wait();

  console.log("\n✅ Deployment complete!\n");
  console.log("📋 Contract Addresses:");
  console.log("   PropertyNFT:", propertyNFT.address);
  console.log("   MortgagePool:", mortgagePool.address);
  console.log("   MortgageManager:", mortgageManager.address);
  console.log("\n💡 Demo properties minted and ready for mortgages!");
};

export default deployMortgageContracts;

deployMortgageContracts.tags = ["MortgagePool", "PropertyNFT", "MortgageManager"];
