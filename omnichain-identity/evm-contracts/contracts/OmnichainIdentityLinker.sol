// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@layerzerolabs/lz-evm-v1-0.7/contracts/lzApp/NonblockingLzApp.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OmnichainIdentityLinker
 * @dev Contract for linking EVM addresses to Solana addresses via LayerZero
 * This contract sends messages from EVM chains to a Solana OApp
 */
contract OmnichainIdentityLinker is NonblockingLzApp, Ownable {
    // Solana chain ID in LayerZero
    uint16 public constant SOLANA_CHAIN_ID = 168; // Solana testnet chain ID in LZ V2

    // Gas limit for cross-chain calls
    uint256 public gasLimit = 200000;

    // Store linked addresses history for reference
    mapping(address => bytes[]) public linkedSolanaAddresses;

    // Event emitted when a link is created
    event IdentityLinked(address evmAddress, bytes solanaAddress, uint256 timestamp);

    constructor(address _lzEndpoint) NonblockingLzApp(_lzEndpoint) Ownable(msg.sender) {}

    /**
     * @dev Link the sender's EVM address to a Solana address
     * @param _solanaAddress Solana address in bytes
     * @param _dstAddress The destination address on Solana
     */
    function linkAddress(bytes memory _solanaAddress, bytes32 _dstAddress) external payable {
        // Construct the payload
        bytes memory payload = abi.encode(
            msg.sender,        // EVM address
            _solanaAddress,    // Solana address
            block.timestamp    // Timestamp
        );

        // Store the linked address in history
        linkedSolanaAddresses[msg.sender].push(_solanaAddress);

        // Emit event
        emit IdentityLinked(msg.sender, _solanaAddress, block.timestamp);

        // Send message to Solana via LayerZero
        _lzSend(
            SOLANA_CHAIN_ID,    // Destination chain ID (Solana)
            payload,            // Payload
            payable(msg.sender),// Refund address
            address(0x0),       // zroPaymentAddress
            bytes(""),          // adapterParams
            msg.value           // Native fee amount
        );
    }

    /**
     * @dev Get linked Solana addresses for an EVM address
     * @param _evmAddress The EVM address to check
     * @return Array of linked Solana addresses
     */
    function getLinkedAddresses(address _evmAddress) external view returns (bytes[] memory) {
        return linkedSolanaAddresses[_evmAddress];
    }

    /**
     * @dev Override the _nonblockingLzReceive function to handle incoming messages (if needed)
     * This would be used if you want to receive messages from Solana back to EVM
     */
    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal override {
        // Add handling for received messages from Solana if needed
    }

    /**
     * @dev Update the gas limit for cross-chain calls
     * @param _gasLimit New gas limit
     */
    function setGasLimit(uint256 _gasLimit) external onlyOwner {
        gasLimit = _gasLimit;
    }

    /**
     * @dev Withdraw any stuck funds (admin function)
     */
    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }
}
