import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools'
import { OAppEnforcedOption, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

import { getSolanaOAppAddress } from './tasks/solana'

const sepoliaContract: OmniPointHardhat = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    address: '0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa', // Your deployed EVM contract
}

const solanaContract: OmniPointHardhat = {
    eid: EndpointId.SOLANA_V2_TESTNET,
    address: 'DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz', // Your deployed Solana OApp
}

// Enforced options for cross-chain execution
const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 200_000,
    },
]

const SOLANA_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 200_000,
    },
]

// Two-way configuration between Sepolia and Solana
const pathways: TwoWayConfig[] = [
    [
        sepoliaContract,    // EVM contract (Sepolia)
        solanaContract,     // Solana contract  
        [['LayerZero Labs'], []], // [ requiredDVN[], [ optionalDVN[], threshold ] ]
        [1, 32], // [Sepolia to Solana confirmations, Solana to Sepolia confirmations]
        [SOLANA_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS], // [Solana enforcedOptions, EVM enforcedOptions]
    ],
]

export default async function () {
    // Generate the connections config based on the pathways
    const connections = await generateConnectionsConfig(pathways)
    return {
        contracts: [{ contract: sepoliaContract }, { contract: solanaContract }],
        connections,
    }
}
