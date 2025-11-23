import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys MockUSDC for demo purposes
 * Users can call faucet() to get 10,000 test USDC
 */
const deployMockUSDC: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n💵 Deploying MockUSDC...\n");

  const mockUSDC = await deploy("MockUSDC", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("\n✅ MockUSDC deployed at:", mockUSDC.address);
  console.log("💡 Users can call faucet() to get 10,000 test USDC");
  console.log("💡 Or mint(address, amount) to mint custom amounts\n");
};

export default deployMockUSDC;

deployMockUSDC.tags = ["MockUSDC"];
