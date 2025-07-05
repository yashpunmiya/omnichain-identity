const { EndpointId } = require('@layerzerolabs/lz-definitions');

// LayerZero V2 configuration for OApp
const sepoliaContract = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'OmnichainIdentityLinker',
    address: '0xc528A86A786A75271BF01C804DdF33e49Cae75Ea',
};

const solanaContract = {
    eid: EndpointId.SOLANA_V2_TESTNET,
    address: 'DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz',
};

module.exports = {
    contracts: [
        {
            contract: sepoliaContract,
        },
        {
            contract: solanaContract,
        },
    ],
    connections: [
        {
            from: sepoliaContract,
            to: solanaContract,
            config: {
                sendConfig: {
                    executorConfig: {
                        maxMessageSize: 10000,
                        executor: '0x', // Use default executor
                    },
                    ulnConfig: {
                        confirmations: 1,
                        requiredDVNs: [],
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        confirmations: 1,
                        requiredDVNs: [],
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    },
                },
            },
        },
        {
            from: solanaContract,
            to: sepoliaContract,
            config: {
                sendConfig: {
                    executorConfig: {
                        maxMessageSize: 10000,
                        executor: '0x', // Use default executor
                    },
                    ulnConfig: {
                        confirmations: 1,
                        requiredDVNs: [],
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        confirmations: 1,
                        requiredDVNs: [],
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    },
                },
            },
        },
    ],
};
