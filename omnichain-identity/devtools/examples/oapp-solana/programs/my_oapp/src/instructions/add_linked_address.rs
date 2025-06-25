use crate::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AddLinkedAddressParams {
    pub evm_address: String,
}

#[derive(Accounts)]
#[instruction(params: AddLinkedAddressParams)]
pub struct AddLinkedAddress<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [IDENTITY_SEED, authority.key().as_ref()],
        bump = identity_account.bump,
        constraint = identity_account.authority == authority.key() @ ErrorCode::InvalidAddress
    )]
    pub identity_account: Account<'info, IdentityAccount>,
}

impl AddLinkedAddress<'_> {
    pub fn apply(ctx: &Context<AddLinkedAddress>, params: &AddLinkedAddressParams) -> Result<()> {
        let identity_account = &mut ctx.accounts.identity_account;
        
        // Validate EVM address format
        if !identity_msg_codec::is_valid_evm_address(&params.evm_address) {
            msg!("Invalid EVM address format");
            return Err(error!(ErrorCode::InvalidAddress));
        }
        
        // Check if this address is already linked
        if identity_account.linked_addresses.contains(&params.evm_address) {
            msg!("This EVM address is already linked to this account");
            return Ok(());
        }
        
        // Check if we're exceeding the maximum number of linked addresses
        if identity_account.linked_addresses.len() >= IdentityAccount::MAX_ADDRESSES {
            msg!("Maximum number of linked addresses reached");
            return Err(error!(ErrorCode::InvalidPayload));
        }
        
        // Add the new EVM address to the list
        identity_account.linked_addresses.push(params.evm_address.clone());
        
        msg!("Added new linked address for {}", ctx.accounts.authority.key());
        Ok(())
    }
}
