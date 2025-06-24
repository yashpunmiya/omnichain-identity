const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OmnichainIdentityLinker", function () {
  let identityLinker;
  let owner;
  let user;
  let mockLzEndpoint;

  const SOLANA_CHAIN_ID = 168;
  const SOLANA_ADDRESS = ethers.toUtf8Bytes("SolanaAddress123456789");
  const DESTINATION_ADDRESS = ethers.zeroPadValue("0x1111111111111111111111111111111111111111", 32);

  beforeEach(async function () {
    // Get signers
    [owner, user] = await ethers.getSigners();
    
    // Deploy a mock LZ endpoint for testing
    const MockLzEndpoint = await ethers.getContractFactory("MockLzEndpoint");
    mockLzEndpoint = await MockLzEndpoint.deploy();
    
    // Deploy the OmnichainIdentityLinker contract
    const OmnichainIdentityLinker = await ethers.getContractFactory("OmnichainIdentityLinker");
    identityLinker = await OmnichainIdentityLinker.deploy(await mockLzEndpoint.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await identityLinker.owner()).to.equal(owner.address);
    });
    
    it("Should set the LZ endpoint correctly", async function () {
      expect(await identityLinker.lzEndpoint()).to.equal(await mockLzEndpoint.getAddress());
    });
  });

  describe("Linking addresses", function () {
    it("Should emit an event when linking addresses", async function () {
      await expect(
        identityLinker.connect(user).linkAddress(
          SOLANA_ADDRESS,
          DESTINATION_ADDRESS,
          { value: ethers.parseEther("0.01") }
        )
      )
        .to.emit(identityLinker, "IdentityLinked")
        .withArgs(user.address, SOLANA_ADDRESS, await time.latest());
    });
    
    it("Should store the linked Solana address", async function () {
      await identityLinker.connect(user).linkAddress(
        SOLANA_ADDRESS,
        DESTINATION_ADDRESS,
        { value: ethers.parseEther("0.01") }
      );
      
      const linkedAddresses = await identityLinker.getLinkedAddresses(user.address);
      expect(linkedAddresses.length).to.equal(1);
      expect(linkedAddresses[0]).to.deep.equal(SOLANA_ADDRESS);
    });
  });

  describe("Admin functions", function () {
    it("Should allow owner to update gas limit", async function () {
      const newGasLimit = 300000;
      await identityLinker.setGasLimit(newGasLimit);
      expect(await identityLinker.gasLimit()).to.equal(newGasLimit);
    });
    
    it("Should prevent non-owners from updating gas limit", async function () {
      await expect(
        identityLinker.connect(user).setGasLimit(300000)
      ).to.be.revertedWithCustomError(identityLinker, "OwnableUnauthorizedAccount");
    });
    
    it("Should allow owner to withdraw funds", async function () {
      // First send some ETH to the contract
      await owner.sendTransaction({
        to: await identityLinker.getAddress(),
        value: ethers.parseEther("1.0"),
      });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      await identityLinker.withdraw();
      const finalBalance = await ethers.provider.getBalance(owner.address);
      
      // Balance should increase (minus gas costs)
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });
});
