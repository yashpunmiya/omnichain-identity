import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools'
import { OAppEnforcedOption, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

// Sepolia contract configuration
const sepoliaContract: OmniPointHardhat = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'OmnichainIdentityLinker',
}

// Solana contract configuration
const solanaContract: OmniPointHardhat = {
    eid: EndpointId.SOLANA_V2_TESTNET,
    contractName: 'MyOApp', // This should match the deployed Solana program
}

// Enforced options for message execution
const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 200000,
        value: 0,
    },
]

// Solana enforced options
const SOLANA_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 200000,
        value: 0,
    },
]

// Pathway configuration between Sepolia and Solana
const pathways: TwoWayConfig[] = [
    [
        sepoliaContract, // Sepolia contract
        solanaContract, // Solana contract
        [['LayerZero Labs'], []], // [ requiredDVN[], [ optionalDVN[], threshold ] ]
        [1, 2], // [Sepolia to Solana confirmations, Solana to Sepolia confirmations]
        [SOLANA_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS], // Solana enforcedOptions, Sepolia enforcedOptions
    ],
]

export default async function () {
    return {
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
        connections: generateConnectionsConfig(pathways),
    }
}
