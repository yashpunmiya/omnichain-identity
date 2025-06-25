use crate::*;
use anchor_lang::prelude::*;
use oapp::{
    endpoint::{
        cpi::accounts::Clear,
        instructions::ClearParams,
        ConstructCPIContext, ID as ENDPOINT_ID,
    },
    LzReceiveParams,
};

#[derive(Accounts)]
#[instruction(params: LzReceiveParams)]
pub struct LzReceive<'info> {
    /// OApp Store PDA.  This account represents the "address" of your OApp on
    /// Solana and can contain any state relevant to your application.
    /// Customize the fields in `Store` as needed.
    #[account(mut, seeds = [STORE_SEED], bump = store.bump)]
    pub store: Account<'info, Store>,
    /// Peer config PDA for the sending chain. Ensures `params.sender` can only be the allowed peer from that remote chain.
    #[account(
        seeds = [PEER_SEED, &store.key().to_bytes(), &params.src_eid.to_be_bytes()],
        bump = peer.bump,
        constraint = params.sender == peer.peer_address
    )]
    pub peer: Account<'info, PeerConfig>
}

impl LzReceive<'_> {
    pub fn apply(ctx: &mut Context<LzReceive>, params: &LzReceiveParams) -> Result<()> {
        // The OApp Store PDA is used to sign the CPI to the Endpoint program.
        let seeds: &[&[u8]] = &[STORE_SEED, &[ctx.accounts.store.bump]];

        // The first Clear::MIN_ACCOUNTS_LEN accounts were returned by
        // `lz_receive_types` and are required for Endpoint::clear
        let accounts_for_clear = &ctx.remaining_accounts[0..Clear::MIN_ACCOUNTS_LEN];
        // Call the Endpoint::clear CPI to clear the message from the Endpoint program.
        // This is necessary to ensure the message is processed only once and to
        // prevent replays.
        let _ = oapp::endpoint_cpi::clear(
            ENDPOINT_ID,
            ctx.accounts.store.key(),
            accounts_for_clear,
            seeds,
            ClearParams {
                receiver: ctx.accounts.store.key(),
                src_eid: params.src_eid,
                sender: params.sender,
                nonce: params.nonce,
                guid: params.guid,
                message: params.message.clone(),
            },
        )?;

        // Try to decode the standard string message
        match msg_codec::decode(&params.message) {
            Ok(string_value) => {
                let store = &mut ctx.accounts.store;
                store.string = string_value;
                
                // If it's a standard string message, just process it normally
                return Ok(());
            },
            Err(_) => {
                // If it fails, try to decode it as an identity message
                match identity_msg_codec::decode_identity_message(&params.message) {
                    Ok(identity_msg) => {
                        msg!("Identity message decoded successfully");
                        msg!("EVM Address: {}", identity_msg.evm_address);
                        msg!("Solana Address: {}", identity_msg.solana_address);
                        
                        // Process the identity message
                        process_identity_message(ctx, &identity_msg)?;
                    },
                    Err(err) => {
                        // Failed to decode as identity message too
                        msg!("Failed to decode message format");
                        return Err(err);
                    }
                }
            }
        }

        Ok(())
    }
}

// Process an identity linking message and try to update the identity PDA if it exists
fn process_identity_message(ctx: &Context<LzReceive>, identity_msg: &identity_msg_codec::IdentityMessage) -> Result<()> {
    // Validate the EVM address format
    if !identity_msg_codec::is_valid_evm_address(&identity_msg.evm_address) {
        msg!("Invalid EVM address format");
        return Err(error!(ErrorCode::InvalidAddress));
    }

    // Try to parse the Solana address
    let solana_pubkey = match Pubkey::try_from_str(&identity_msg.solana_address) {
        Ok(pubkey) => pubkey,
        Err(_) => {
            msg!("Invalid Solana address format");
            return Err(error!(ErrorCode::InvalidAddress));
        }
    };
    
    // Log the information we received
    msg!("Processing identity link between:");
    msg!("  EVM Address: {}", identity_msg.evm_address);
    msg!("  Solana Address: {}", solana_pubkey);
    msg!("  Timestamp: {}", identity_msg.timestamp);

    // Construct identity account PDA address
    let seeds = [
        IDENTITY_SEED, 
        solana_pubkey.as_ref()
    ];
    
    let (pda_address, _bump) = Pubkey::find_program_address(&seeds, &crate::ID);
    msg!("Identity PDA address: {}", pda_address);
    
    // Since we can't directly access or create PDAs here easily, we'll just log the information
    // Users will need to initialize the identity account first using the init_identity instruction
    msg!("Cross-chain identity linking request received. The user should initialize an identity account if not done already.");
    
    Ok(())
}

