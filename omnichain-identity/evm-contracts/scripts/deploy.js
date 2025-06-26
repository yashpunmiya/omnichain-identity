const hre = require("hardhat");

async function main() {
  console.log("Deploying OmnichainIdentityLinker contract...");

  // Get the network
  const network = hre.network.name;
  console.log(`Deploying to network: ${network}`);
  
  // Get the LayerZero endpoint address based on the network
  let lzEndpoint;
  switch(network) {
    case "ethereum":
    case "sepolia":
      lzEndpoint = process.env.LZ_ETHEREUM_ENDPOINT;
      break;
    case "polygon":
    case "mumbai":
      lzEndpoint = process.env.LZ_POLYGON_ENDPOINT;
      break;
    case "bsc":
    case "bscTestnet":
      lzEndpoint = process.env.LZ_BSC_ENDPOINT;
      break;
    default:
      console.error("Unsupported network for deployment: " + network);
      console.error("Supported networks: ethereum, sepolia, polygon, mumbai, bsc, bscTestnet");
      process.exit(1);
  }
  
  console.log(`Using LayerZero endpoint: ${lzEndpoint}`);

  // Get signer address to use as delegate
  const [signer] = await hre.ethers.getSigners();
  const delegateAddress = signer.address;
  console.log(`Using delegate address: ${delegateAddress}`);

  // Deploy the contract with LayerZero V2 parameters (endpoint and delegate)
  const OmnichainIdentityLinker = await hre.ethers.getContractFactory("OmnichainIdentityLinker");
  const identityLinker = await OmnichainIdentityLinker.deploy(lzEndpoint, delegateAddress);

  await identityLinker.waitForDeployment();
  
  const deployedAddress = await identityLinker.getAddress();
  console.log(`OmnichainIdentityLinker deployed to: ${deployedAddress}`);
  console.log("Save this address for configuring your frontend!");
  
  console.log("\nVerification command:");
  console.log(`npx hardhat verify --network ${network} ${deployedAddress} ${lzEndpoint} ${delegateAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
