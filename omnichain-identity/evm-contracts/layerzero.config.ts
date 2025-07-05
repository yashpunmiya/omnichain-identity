import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'

const sepoliaContract = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'OmnichainIdentityLinker',
}

const solanaContract = {
    eid: EndpointId.SOLANA_V2_TESTNET,
    address: 'DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz', // Your deployed Solana OApp address
}

// Enforced options for both directions
const ENFORCED_OPTIONS = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 200_000,
    },
]

export default {
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
                // Send Library for Sepolia to Solana
                sendLibrary: '0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE',
                receiveLibraryConfig: { 
                    receiveLibrary: '0xdAf00F5eE2158dD58E0d3857851c432E34A3A851', 
                    gracePeriod: 0 
                },
                // Send configuration (when sending FROM Sepolia TO Solana)
                sendConfig: {
                    executorConfig: { 
                        maxMessageSize: 10000, 
                        executor: '0x718B92b5CB0a5552039B593faF724D182A881eDA' // Sepolia executor
                    },
                    ulnConfig: {
                        confirmations: 1,
                        requiredDVNs: ['0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193'], // LayerZero Labs DVN for Sepolia
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    },
                },
                // Receive configuration (when receiving ON Solana FROM Sepolia)
                receiveConfig: {
                    ulnConfig: {
                        confirmations: 32, // More confirmations for Solana finality
                        requiredDVNs: ['4VDjp6XQaxoZf5RGwiPU9NR1EXSZn2TP4ATMmiSzLfhb'], // LayerZero Labs DVN for Solana
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    },
                },
                enforcedOptions: ENFORCED_OPTIONS,
            },
        },
        {
            from: solanaContract,
            to: sepoliaContract,
            config: {
                // Send configuration (when sending FROM Solana TO Sepolia)  
                sendConfig: {
                    executorConfig: { 
                        maxMessageSize: 10000,
                        executor: '0x718B92b5CB0a5552039B593faF724D182A881eDA' // Sepolia executor
                    },
                    ulnConfig: {
                        confirmations: BigInt(32), // Solana confirmations
                        requiredDVNs: ['4VDjp6XQaxoZf5RGwiPU9NR1EXSZn2TP4ATMmiSzLfhb'], // LayerZero Labs DVN for Solana
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    },
                },
                // Receive configuration (when receiving ON Sepolia FROM Solana)
                receiveConfig: {
                    ulnConfig: {
                        confirmations: 1, // Sepolia confirmations
                        requiredDVNs: ['0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193'], // LayerZero Labs DVN for Sepolia
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    },
                },
                enforcedOptions: ENFORCED_OPTIONS,
            },
        },
    ],
}
