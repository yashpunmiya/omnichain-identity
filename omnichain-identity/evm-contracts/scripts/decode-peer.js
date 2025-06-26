const { ethers } = require("ethers");

// Decode the peer bytes32
const peerBytes32 = "0x4444794252556e61725635784164546e33586d6a626845477569696e4342524c";

// Convert to string
const peerString = ethers.toUtf8String(peerBytes32);
console.log("Peer decoded:", peerString);

// This should be the Solana program ID
