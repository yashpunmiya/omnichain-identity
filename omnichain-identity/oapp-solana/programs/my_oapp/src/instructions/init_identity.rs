use crate::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitIdentityParams {}

#[derive(Accounts)]
pub struct InitIdentity<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + IdentityAccount::SIZE,
        seeds = [IDENTITY_SEED, authority.key().as_ref()],
        bump,
    )]
    pub identity_account: Account<'info, IdentityAccount>,

    pub system_program: Program<'info, System>,
}

impl InitIdentity<'_> {
    pub fn apply(ctx: &mut Context<InitIdentity>, _params: &InitIdentityParams) -> Result<()> {
        // Initialize the identity account
        let identity_account = &mut ctx.accounts.identity_account;
        identity_account.authority = ctx.accounts.authority.key();
        identity_account.linked_addresses = Vec::new();
        identity_account.bump = ctx.bumps.identity_account;
        
        msg!("Identity account initialized for {}", ctx.accounts.authority.key());
        Ok(())
    }
}
