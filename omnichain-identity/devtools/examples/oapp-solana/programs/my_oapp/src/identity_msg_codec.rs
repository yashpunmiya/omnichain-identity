use anchor_lang::prelude::*;
use std::str;

// Identity message structure
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct IdentityMessage {
    pub evm_address: String,       // EVM wallet address
    pub solana_address: String,    // Solana wallet address
    pub timestamp: i64,            // Timestamp for the link
}

// Check if the string is a valid EVM address (0x followed by 40 hex chars)
pub fn is_valid_evm_address(address: &str) -> bool {
    if !address.starts_with("0x") || address.len() != 42 {
        return false;
    }

    for c in address[2..].chars() {
        if !c.is_ascii_hexdigit() {
            return false;
        }
    }

    true
}

pub fn decode_identity_message(message: &[u8]) -> Result<IdentityMessage> {
    // Try to decode as JSON first (simplest approach)
    let message_str = match str::from_utf8(message) {
        Ok(s) => s,
        Err(_) => return Err(error!(ErrorCode::InvalidMessageFormat))
    };

    // Split by comma for simple parsing (CSV-like format)
    let parts: Vec<&str> = message_str.split(",").collect();
    if parts.len() < 3 {
        return Err(error!(ErrorCode::InvalidMessageFormat));
    }

    // Extract parts
    let evm_address = parts[0].trim().to_string();
    let solana_address = parts[1].trim().to_string();
    
    // Validate EVM address format
    if !is_valid_evm_address(&evm_address) {
        msg!("Invalid EVM address format: {}", evm_address);
        return Err(error!(ErrorCode::InvalidAddress));
    }
    
    // Parse timestamp
    let timestamp = match parts[2].trim().parse::<i64>() {
        Ok(t) => t,
        Err(_) => return Err(error!(ErrorCode::InvalidMessageFormat))
    };

    Ok(IdentityMessage {
        evm_address,
        solana_address,
        timestamp,
    })
}
