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
      lzEndpoint = process.env.LZ_ETHEREUM_ENDPOINT;
      break;
    case "polygon":
      lzEndpoint = process.env.LZ_POLYGON_ENDPOINT;
      break;
    case "bsc":
      lzEndpoint = process.env.LZ_BSC_ENDPOINT;
      break;
    default:
      console.error("Unsupported network for deployment");
      process.exit(1);
  }
  
  console.log(`Using LayerZero endpoint: ${lzEndpoint}`);

  // Deploy the contract
  const OmnichainIdentityLinker = await hre.ethers.getContractFactory("OmnichainIdentityLinker");
  const identityLinker = await OmnichainIdentityLinker.deploy(lzEndpoint);

  await identityLinker.waitForDeployment();
  
  const deployedAddress = await identityLinker.getAddress();
  console.log(`OmnichainIdentityLinker deployed to: ${deployedAddress}`);
  console.log("Save this address for configuring your frontend!");
  
  console.log("\nVerification command:");
  console.log(`npx hardhat verify --network ${network} ${deployedAddress} ${lzEndpoint}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
