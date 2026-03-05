use starknet::ContractAddress;

#[starknet::interface]
pub trait INFTDonation<TContractState> {
    // Write functions
    fn mint_nft(ref self: TContractState, token_uri: ByteArray) -> u256;
    fn donate(ref self: TContractState, token_id: u256, amount: u256);

    // Read functions
    fn owner_of(self: @TContractState, token_id: u256) -> ContractAddress;
    fn token_uri(self: @TContractState, token_id: u256) -> ByteArray;
    fn total_donations(self: @TContractState, token_id: u256) -> u256;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, owner: ContractAddress) -> u256;
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
}

#[starknet::contract]
pub mod NFTDonation {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use core::num::traits::Zero;

    // ───── Storage ─────
    #[storage]
    struct Storage {
        token_id_counter: u256,
        owners: Map<u256, ContractAddress>,
        token_uris: Map<u256, ByteArray>,
        total_donations: Map<u256, u256>,
        balances: Map<ContractAddress, u256>,
    }

    // ───── Events ─────
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Transfer: Transfer,
        DonationReceived: DonationReceived,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Transfer {
        #[key]
        pub from: ContractAddress,
        #[key]
        pub to: ContractAddress,
        #[key]
        pub token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DonationReceived {
        #[key]
        pub donor: ContractAddress,
        #[key]
        pub token_id: u256,
        pub amount: u256,
    }

    // ───── Constructor ─────
    #[constructor]
    fn constructor(ref self: ContractState) {
        self.token_id_counter.write(0);
    }

    // ───── IERC20 dispatcher for STRK token transfers ─────
    #[starknet::interface]
    trait IERC20<TContractState> {
        fn transfer_from(
            ref self: TContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool;
    }

    // STRK token address on StarkNet Sepolia
    // 0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
    const STRK_TOKEN_ADDRESS: felt252 =
        0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d;

    // ───── External implementations ─────
    #[abi(embed_v0)]
    impl NFTDonationImpl of super::INFTDonation<ContractState> {
        /// Mint a new NFT with the given token URI.
        /// Returns the new token ID.
        fn mint_nft(ref self: ContractState, token_uri: ByteArray) -> u256 {
            let caller = get_caller_address();

            // Increment counter
            let new_id = self.token_id_counter.read() + 1;
            self.token_id_counter.write(new_id);

            // Set owner
            self.owners.write(new_id, caller);

            // Set token URI
            self.token_uris.write(new_id, token_uri);

            // Increment balance
            let bal = self.balances.read(caller);
            self.balances.write(caller, bal + 1);

            // Emit transfer event (from zero address = mint)
            self
                .emit(
                    Transfer { from: Zero::zero(), to: caller, token_id: new_id },
                );

            new_id
        }

        /// Donate STRK tokens to the owner of the given token.
        /// Caller must have approved this contract to spend `amount` STRK tokens.
        fn donate(ref self: ContractState, token_id: u256, amount: u256) {
            // Verify token exists
            let token_owner = self.owners.read(token_id);
            assert(!token_owner.is_zero(), 'Token does not exist');

            // Amount must be > 0
            assert(amount > 0, 'Donation must be > 0');

            let caller = get_caller_address();

            // Transfer STRK from donor to token owner via ERC20 transferFrom
            let strk_address: ContractAddress = STRK_TOKEN_ADDRESS.try_into().unwrap();
            let strk_dispatcher = IERC20Dispatcher { contract_address: strk_address };

            // First transfer from donor to this contract (requires approval)
            let success = strk_dispatcher.transfer_from(caller, token_owner, amount);
            assert(success, 'STRK transfer failed');

            // Update donation tracking
            let current = self.total_donations.read(token_id);
            self.total_donations.write(token_id, current + amount);

            // Emit event
            self
                .emit(
                    DonationReceived { donor: caller, token_id, amount },
                );
        }

        /// Returns the owner of the given token.
        fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            let owner = self.owners.read(token_id);
            assert(!owner.is_zero(), 'Token does not exist');
            owner
        }

        /// Returns the URI of the given token.
        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            let owner = self.owners.read(token_id);
            assert(!owner.is_zero(), 'Token does not exist');
            self.token_uris.read(token_id)
        }

        /// Returns total donations received by a token.
        fn total_donations(self: @ContractState, token_id: u256) -> u256 {
            self.total_donations.read(token_id)
        }

        /// Returns the total number of minted tokens.
        fn total_supply(self: @ContractState) -> u256 {
            self.token_id_counter.read()
        }

        /// Returns the number of tokens owned by `owner`.
        fn balance_of(self: @ContractState, owner: ContractAddress) -> u256 {
            self.balances.read(owner)
        }

        /// Returns the collection name.
        fn name(self: @ContractState) -> ByteArray {
            "NFT Donation"
        }

        /// Returns the collection symbol.
        fn symbol(self: @ContractState) -> ByteArray {
            "DONATE"
        }
    }
}
