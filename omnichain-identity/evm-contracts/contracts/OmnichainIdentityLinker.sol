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
     * @param _solanaAddress Solana address as string
     * @param _dstAddress The destination address on Solana
     */
    function linkAddress(string memory _solanaAddress, bytes32 _dstAddress) external payable {
        // Format the message as CSV string for easy parsing on Solana
        // Format: "evmAddress,solanaAddress,timestamp"
        string memory evmAddressStr = addressToString(msg.sender);
        string memory timestampStr = uint256ToString(block.timestamp);
        string memory message = string(abi.encodePacked(
            evmAddressStr, ",", 
            _solanaAddress, ",", 
            timestampStr
        ));
        
        // Convert string to bytes for sending
        bytes memory payload = bytes(message);

        // Store the linked address in history
        linkedSolanaAddresses[msg.sender].push(bytes(_solanaAddress));

        // Emit event
        emit IdentityLinked(msg.sender, bytes(_solanaAddress), block.timestamp);

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
     * @dev Convert an address to a string
     * @param _addr The address to convert
     * @return String representation of the address
     */
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        
        return string(str);
    }
    
    /**
     * @dev Convert a uint256 to a string
     * @param _value The uint256 to convert
     * @return String representation of the uint256
     */
    function uint256ToString(uint256 _value) internal pure returns (string memory) {
        if (_value == 0) {
            return "0";
        }
        
        uint256 temp = _value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(_value % 10)));
            _value /= 10;
        }
        
        return string(buffer);
    }

    /**
     * @dev Get linked Solana addresses for an EVM address
     * @param _evmAddress The EVM address to check
     * @return Array of linked Solana addresses as bytes
     */
    function getLinkedAddresses(address _evmAddress) external view returns (bytes[] memory) {
        return linkedSolanaAddresses[_evmAddress];
    }
    
    /**
     * @dev Get linked Solana addresses for an EVM address as strings
     * @param _evmAddress The EVM address to check
     * @return Array of linked Solana addresses as strings
     */
    function getLinkedAddressesAsStrings(address _evmAddress) external view returns (string[] memory) {
        bytes[] memory bytesAddresses = linkedSolanaAddresses[_evmAddress];
        string[] memory strAddresses = new string[](bytesAddresses.length);
        
        for (uint i = 0; i < bytesAddresses.length; i++) {
            strAddresses[i] = string(bytesAddresses[i]);
        }
        
        return strAddresses;
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
