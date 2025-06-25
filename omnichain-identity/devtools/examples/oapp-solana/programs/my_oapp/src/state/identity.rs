use crate::*;
use anchor_lang::prelude::*;

// Account state for storing linked identities
#[account]
pub struct IdentityAccount {
    pub authority: Pubkey,                // Solana wallet owner
    pub linked_addresses: Vec<String>,    // List of EVM addresses
    pub bump: u8,                         // Canonical bump
}

impl IdentityAccount {
    pub const MAX_ADDRESS_LENGTH: usize = 42;   // Standard Ethereum address is 42 chars with 0x prefix
    pub const MAX_ADDRESSES: usize = 10;        // Allow up to 10 linked addresses
    pub const SIZE: usize = 8 +                 // Discriminator
                            32 +                // authority: Pubkey
                            1 +                 // bump: u8
                            4 +                 // vec length
                            (Self::MAX_ADDRESS_LENGTH * Self::MAX_ADDRESSES); // addresses storage
}
