import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'

const sepoliaContract = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'OmnichainIdentityLinker',
}

const solanaContract = {
    eid: EndpointId.SOLANA_V2_TESTNET,
    address: process.env.SOLANA_OAPP_ADDRESS || 'DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz',
}

// Enforced options for Solana execution
const EVM_ENFORCED_OPTIONS = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 200_000,
    },
]

const SOLANA_ENFORCED_OPTIONS = [
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
            config: {
                enforcedOptions: EVM_ENFORCED_OPTIONS,
            },
        },
        {
            contract: solanaContract, 
            config: {
                enforcedOptions: SOLANA_ENFORCED_OPTIONS,
            },
        },
    ],
    connections: [
        {
            from: sepoliaContract,
            to: solanaContract,
            config: {
                sendLibrary: '0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE',
                receiveLibraryConfig: { 
                    receiveLibrary: '0xdAf00F5eE2158dD58E0d3857851c432E34A3A851', 
                    gracePeriod: 0 
                },
                sendConfig: {
                    executorConfig: { 
                        maxMessageSize: 10000, 
                        executor: '0x718B92b5CB0a5552039B593faF724D182A881eDA' 
                    },
                    ulnConfig: {
                        confirmations: 1,
                        requiredDVNs: ['0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193'],
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        confirmations: 2,
                        requiredDVNs: ['0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193'],
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
                        executor: '0x718B92b5CB0a5552039B593faF724D182A881eDA'
                    },
                    ulnConfig: {
                        confirmations: BigInt(32),
                        requiredDVNs: ['4VDjp6XQaxoZf5RGwiPU9NR1EXSZn2TP4ATMmiSzLfhb'],
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        confirmations: BigInt(32),
                        requiredDVNs: ['4VDjp6XQaxoZf5RGwiPU9NR1EXSZn2TP4ATMmiSzLfhb'],
                        optionalDVNs: [],
                        optionalDVNThreshold: 0,
                    },
                },
            },
        },
    ],
}
