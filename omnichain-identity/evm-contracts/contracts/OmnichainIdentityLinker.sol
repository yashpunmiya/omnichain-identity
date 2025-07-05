// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

/**
 * @title OmnichainIdentityLinker
 * @dev Contract for linking EVM addresses to Solana addresses via LayerZero V2
 * This contract sends messages from EVM chains to a Solana OApp
 */
contract OmnichainIdentityLinker is OApp {
    // Solana chain ID in LayerZero V2
    uint32 public constant SOLANA_CHAIN_ID = 40168; // Solana DEVNET chain ID in LZ V2

    // Gas limit for cross-chain calls
    uint256 public gasLimit = 200000;

    // Store linked addresses history for reference
    mapping(address => bytes[]) public linkedSolanaAddresses;

    // Event emitted when a link is created
    event IdentityLinked(address evmAddress, bytes solanaAddress, uint256 timestamp);

    constructor(address _lzEndpoint, address _delegate) OApp(_lzEndpoint, _delegate) {}

    /**
     * @dev Link the sender's EVM address to a Solana address
     * @param _solanaAddress Solana address as string
     */
    function linkAddress(string memory _solanaAddress) external payable {
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

        // Prepare messaging parameters for LayerZero V2
        bytes memory options = bytes(""); // Use empty options for now
        
        // Send message to Solana via LayerZero V2
        MessagingFee memory fee = _quote(SOLANA_CHAIN_ID, payload, options, false);
        require(msg.value >= fee.nativeFee, "Insufficient fee");
        
        _lzSend(
            SOLANA_CHAIN_ID,     // Destination chain ID (Solana)
            payload,             // Payload
            options,             // Options
            MessagingFee(msg.value, 0), // Fee
            payable(msg.sender)  // Refund address
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
     * @dev Quote the fee for sending a message to Solana
     * @param _solanaAddress The Solana address to link
     * @return fee The estimated messaging fee
     */
    function quoteLinkFee(string memory _solanaAddress) external view returns (MessagingFee memory fee) {
        // Format the message as CSV string for fee estimation
        string memory evmAddressStr = addressToString(msg.sender);
        string memory timestampStr = uint256ToString(block.timestamp);
        string memory message = string(abi.encodePacked(
            evmAddressStr, ",", 
            _solanaAddress, ",", 
            timestampStr
        ));
        
        bytes memory payload = bytes(message);
        bytes memory options = bytes(""); // Default options
        
        return _quote(SOLANA_CHAIN_ID, payload, options, false);
    }

    /**
     * @dev Quote the fee for linking an address
     * @param _solanaAddress Solana address as string
     * @return Fee required for the cross-chain message
     */
    function quoteLinkAddress(string memory _solanaAddress) external view returns (uint256) {
        // Format the same message as in linkAddress
        string memory evmAddressStr = addressToString(msg.sender);
        string memory timestampStr = uint256ToString(block.timestamp);
        string memory message = string(abi.encodePacked(
            evmAddressStr, ",", 
            _solanaAddress, ",", 
            timestampStr
        ));
        
        bytes memory payload = bytes(message);
        
        // Use empty options for compatibility
        bytes memory options = bytes("");
        
        MessagingFee memory fee = _quote(SOLANA_CHAIN_ID, payload, options, false);
        return fee.nativeFee;
    }

    /**
     * @dev Override the _lzReceive function to handle incoming messages (if needed)
     * This would be used if you want to receive messages from Solana back to EVM
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _payload,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        // Add handling for received messages from Solana if needed
        // For now, this is a placeholder
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
