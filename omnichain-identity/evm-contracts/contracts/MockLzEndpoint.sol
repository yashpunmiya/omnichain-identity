// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title MockLzEndpoint
 * @dev A simplified mock of the LayerZero endpoint for testing
 */
contract MockLzEndpoint {
    // Store the last sent message for verification
    bytes public lastPayload;
    uint16 public lastDstChainId;
    bytes public lastDstAddress;

    // Event emitted when a message is sent
    event LzMessageSent(uint16 dstChainId, bytes dstAddress, bytes payload);

    /**
     * @dev Mock send function
     */
    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable {
        // Store the message details
        lastDstChainId = _dstChainId;
        lastDstAddress = _destination;
        lastPayload = _payload;

        // Emit event
        emit LzMessageSent(_dstChainId, _destination, _payload);
    }

    /**
     * @dev Mock estimateFees function
     */
    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParam
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        return (0.01 ether, 0);
    }
}
