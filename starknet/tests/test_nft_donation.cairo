use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};
use starknet::ContractAddress;
use nft_donation::nft_donation::{INFTDonationDispatcher, INFTDonationDispatcherTrait};

fn deploy_contract() -> ContractAddress {
    let contract = declare("NFTDonation").unwrap().contract_class();
    let constructor_calldata = array![];
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    contract_address
}

fn OWNER() -> ContractAddress {
    'owner'.try_into().unwrap()
}

fn DONOR() -> ContractAddress {
    'donor'.try_into().unwrap()
}

// ───── Test: Mint NFT ─────
#[test]
fn test_mint_nft() {
    let contract_address = deploy_contract();
    let dispatcher = INFTDonationDispatcher { contract_address };

    // Mint as OWNER
    start_cheat_caller_address(contract_address, OWNER());

    let token_id = dispatcher.mint_nft("ipfs://QmTest123");

    assert(token_id == 1, 'First token should be 1');
    assert(dispatcher.owner_of(1) == OWNER(), 'Owner should be OWNER');
    assert(dispatcher.total_supply() == 1, 'Total supply should be 1');
    assert(dispatcher.balance_of(OWNER()) == 1, 'Balance should be 1');
    assert(dispatcher.name() == "NFT Donation", 'Wrong name');
    assert(dispatcher.symbol() == "DONATE", 'Wrong symbol');

    stop_cheat_caller_address(contract_address);
}

// ───── Test: Mint Multiple NFTs ─────
#[test]
fn test_mint_multiple_nfts() {
    let contract_address = deploy_contract();
    let dispatcher = INFTDonationDispatcher { contract_address };

    start_cheat_caller_address(contract_address, OWNER());

    let id1 = dispatcher.mint_nft("ipfs://QmFirst");
    let id2 = dispatcher.mint_nft("ipfs://QmSecond");
    let id3 = dispatcher.mint_nft("ipfs://QmThird");

    assert(id1 == 1, 'First ID should be 1');
    assert(id2 == 2, 'Second ID should be 2');
    assert(id3 == 3, 'Third ID should be 3');
    assert(dispatcher.total_supply() == 3, 'Supply should be 3');
    assert(dispatcher.balance_of(OWNER()) == 3, 'Balance should be 3');

    stop_cheat_caller_address(contract_address);
}

// ───── Test: Token URI ─────
#[test]
fn test_token_uri() {
    let contract_address = deploy_contract();
    let dispatcher = INFTDonationDispatcher { contract_address };

    start_cheat_caller_address(contract_address, OWNER());
    dispatcher.mint_nft("ipfs://QmTestURI456");
    stop_cheat_caller_address(contract_address);

    let uri = dispatcher.token_uri(1);
    assert(uri == "ipfs://QmTestURI456", 'Wrong token URI');
}

// ───── Test: Total Donations Initially Zero ─────
#[test]
fn test_total_donations_initial() {
    let contract_address = deploy_contract();
    let dispatcher = INFTDonationDispatcher { contract_address };

    start_cheat_caller_address(contract_address, OWNER());
    dispatcher.mint_nft("ipfs://QmTest");
    stop_cheat_caller_address(contract_address);

    let donations = dispatcher.total_donations(1);
    assert(donations == 0, 'Donations should be 0');
}

// ───── Test: Owner Of Invalid Token Panics ─────
#[test]
#[should_panic(expected: ('Token does not exist',))]
fn test_owner_of_invalid_token() {
    let contract_address = deploy_contract();
    let dispatcher = INFTDonationDispatcher { contract_address };

    // This should panic because token 999 doesn't exist
    dispatcher.owner_of(999);
}

// ───── Test: Donate to Invalid Token Panics ─────
#[test]
#[should_panic(expected: ('Token does not exist',))]
fn test_donate_invalid_token() {
    let contract_address = deploy_contract();
    let dispatcher = INFTDonationDispatcher { contract_address };

    start_cheat_caller_address(contract_address, DONOR());
    // Token 42 doesn't exist, should panic
    dispatcher.donate(42, 1000);
    stop_cheat_caller_address(contract_address);
}

// ───── Test: Donate Zero Amount Panics ─────
#[test]
#[should_panic(expected: ('Donation must be > 0',))]
fn test_donate_zero_amount() {
    let contract_address = deploy_contract();
    let dispatcher = INFTDonationDispatcher { contract_address };

    // First mint a token
    start_cheat_caller_address(contract_address, OWNER());
    dispatcher.mint_nft("ipfs://QmTest");
    stop_cheat_caller_address(contract_address);

    // Try donating 0
    start_cheat_caller_address(contract_address, DONOR());
    dispatcher.donate(1, 0);
    stop_cheat_caller_address(contract_address);
}
