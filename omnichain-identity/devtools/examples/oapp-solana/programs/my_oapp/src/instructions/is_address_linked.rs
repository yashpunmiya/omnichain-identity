use crate::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct IsAddressLinkedParams {
    pub solana_address: Pubkey,
    pub evm_address: String,
}

#[derive(Accounts)]
#[instruction(params: IsAddressLinkedParams)]
pub struct IsAddressLinked<'info> {
    #[account(
        seeds = [IDENTITY_SEED, params.solana_address.as_ref()],
        bump,
    )]
    pub identity_account: Account<'info, IdentityAccount>,
}

impl IsAddressLinked<'_> {
    pub fn apply(ctx: &Context<IsAddressLinked>, params: &IsAddressLinkedParams) -> Result<bool> {
        // Check if the EVM address is in the linked addresses list
        let is_linked = ctx.accounts.identity_account.linked_addresses.contains(&params.evm_address);
        
        // Return the result
        Ok(is_linked)
    }
}
