use crate::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GetLinkedAddressesParams {
    pub solana_address: Pubkey,
}

#[derive(Accounts)]
#[instruction(params: GetLinkedAddressesParams)]
pub struct GetLinkedAddresses<'info> {
    #[account(
        seeds = [b"identity", params.solana_address.as_ref()],
        bump,
    )]
    pub identity_account: Account<'info, IdentityAccount>,
}

impl GetLinkedAddresses<'_> {
    pub fn apply(ctx: &Context<GetLinkedAddresses>, _params: &GetLinkedAddressesParams) -> Result<Vec<String>> {
        // Return the list of linked addresses
        Ok(ctx.accounts.identity_account.linked_addresses.clone())
    }
}
