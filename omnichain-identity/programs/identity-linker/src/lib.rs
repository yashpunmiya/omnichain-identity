use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use layerzero_v2::{
    oapp::OAppMessenger,
    prelude::*,
};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod identity_linker {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // Initialize program state
        Ok(())
    }
    
    // Health check function to verify the program is deployed and working
    pub fn health_check(ctx: Context<HealthCheck>) -> Result<bool> {
        // Return true to indicate the program is functioning
        msg!("OmnichainIdentityLinker program is healthy!");
        Ok(true)
    }

    // This is the entry point for receiving messages from LayerZero
    pub fn lz_receive(
        ctx: Context<LzReceive>,
        src_endpoint_id: u32,
        src_address: [u8; 32],
        payload: Vec<u8>,
    ) -> Result<()> {
        msg!("Received message from LayerZero");

        // Deserialize the payload from LayerZero message
        let identity_msg = IdentityMessage::try_from_slice(&payload)
            .map_err(|_| error!(ErrorCode::InvalidPayload))?;
        
        msg!("EVM Address: {}", identity_msg.evm_address);
        msg!("Solana Address: {}", identity_msg.solana_address);
        
        // Find the identity account PDA for this Solana address
        let solana_address_pubkey = Pubkey::try_from(identity_msg.solana_address.as_bytes())
            .map_err(|_| error!(ErrorCode::InvalidAddress))?;
        
        let (identity_pda, _bump) = Pubkey::find_program_address(
            &[b"identity", solana_address_pubkey.as_ref()], 
            ctx.program_id
        );
        
        // Check if this PDA exists
        let account_info = ctx.accounts.system_program.to_account_info();
        let identity_account_exists = account_info.owner != &system_program::ID;
        
        if !identity_account_exists {
            // Create new identity account
            let create_account_ix = system_instruction::create_account(
                &ctx.accounts.payer.key(),
                &identity_pda,
                Rent::get()?.minimum_balance(IdentityAccount::SIZE),
                IdentityAccount::SIZE as u64,
                ctx.program_id,
            );
            
            invoke(
                &create_account_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
            
            // Initialize the identity account
            let mut identity_account = IdentityAccount::try_from_slice(&[0; IdentityAccount::SIZE])
                .map_err(|_| error!(ErrorCode::AccountInitializationFailed))?;
            
            identity_account.authority = solana_address_pubkey;
            identity_account.linked_addresses = vec![identity_msg.evm_address];
            
            // Serialize and store
            identity_account
                .try_serialize(&mut &mut identity_pda.to_account_info().data.borrow_mut()[..])
                .map_err(|_| error!(ErrorCode::AccountSerializationFailed))?;
        } else {
            // Update existing identity account
            let mut identity_account = IdentityAccount::try_from_slice(
                &identity_pda.to_account_info().data.borrow()
            ).map_err(|_| error!(ErrorCode::AccountDeserializationFailed))?;
            
            // Check if EVM address is already linked
            if !identity_account.linked_addresses.contains(&identity_msg.evm_address) {
                identity_account.linked_addresses.push(identity_msg.evm_address);
                
                // Serialize and store
                identity_account
                    .try_serialize(&mut &mut identity_pda.to_account_info().data.borrow_mut()[..])
                    .map_err(|_| error!(ErrorCode::AccountSerializationFailed))?;
            }
        }
        
        Ok(())
    }
    
    // Function to get linked addresses for a Solana wallet
    pub fn get_linked_addresses(
        ctx: Context<GetLinkedAddresses>,
        solana_address: Pubkey,
    ) -> Result<Vec<String>> {
        // Find the identity account PDA for this Solana address
        let (identity_pda, _bump) = Pubkey::find_program_address(
            &[b"identity", solana_address.as_ref()], 
            ctx.program_id
        );
        
        // Check if the identity account exists
        let identity_account_info = ctx.accounts.identity_account.to_account_info();
        if identity_account_info.data_is_empty() {
            return Err(error!(ErrorCode::IdentityAccountNotFound));
        }
        
        // Deserialize the identity account
        let identity_account = IdentityAccount::try_from_slice(
            &identity_account_info.data.borrow()
        ).map_err(|_| error!(ErrorCode::AccountDeserializationFailed))?;
        
        // Return the linked addresses
        Ok(identity_account.linked_addresses)
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct HealthCheck<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct LzReceive<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        constraint = endpoint.key() == &layerzero_v2::ID
    )]
    /// CHECK: We check this account against the LayerZero endpoint ID
    pub endpoint: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetLinkedAddresses<'info> {
    /// CHECK: This account will be checked in the instruction
    pub identity_account: UncheckedAccount<'info>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct IdentityMessage {
    pub evm_address: String,
    pub solana_address: String,
    pub timestamp: i64,
}

#[account]
pub struct IdentityAccount {
    pub authority: Pubkey,                 // Solana wallet owner
    pub linked_addresses: Vec<String>,     // List of EVM addresses
}

impl IdentityAccount {
    pub const SIZE: usize = 32 + // authority
        4 + (50 * 10); // linked_addresses (assuming max 10 addresses of 50 chars each)
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid LayerZero payload")]
    InvalidPayload,
    #[msg("Invalid address format")]
    InvalidAddress,
    #[msg("Failed to initialize account")]
    AccountInitializationFailed,
    #[msg("Failed to serialize account data")]
    AccountSerializationFailed,
    #[msg("Failed to deserialize account data")]
    AccountDeserializationFailed,
    #[msg("Identity account not found")]
    IdentityAccountNotFound,
}
