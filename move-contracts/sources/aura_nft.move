/// # Aptos Aura Weaver NFT Contract
/// 
/// This module implements a personalized NFT system that generates unique aura tokens
/// based on user on-chain activity and mood seeds. Each NFT represents a user's
/// digital aura with rarity calculated from their transaction history.
module aura_weaver::aura_nft {
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use std::signer;
    use std::vector;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_token_objects::collection;
    use aptos_token_objects::token::{Self, Token};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_COLLECTION_ALREADY_EXISTS: u64 = 2;
    const E_INVALID_MOOD_SEED: u64 = 3;
    const E_INVALID_TOKEN_NAME: u64 = 4;
    const E_COLLECTION_NOT_FOUND: u64 = 5;
    const E_INVALID_URI: u64 = 6;

    /// Constants
    const COLLECTION_NAME: vector<u8> = b"Aptos Aura Collection";
    const COLLECTION_DESCRIPTION: vector<u8> = b"Personalized aura NFTs generated from on-chain activity and mood";
    const MAX_MOOD_SEED_LENGTH: u64 = 100;
    const MIN_MOOD_SEED_LENGTH: u64 = 1;
    const MAX_TOKEN_NAME_LENGTH: u64 = 50;

    /// Collection resource storing metadata and creator information
    struct AuraCollection has key {
        creator: address,
        total_minted: u64,
        created_at: u64,
    }

    /// Individual NFT resource with enhanced metadata
    struct AuraNFT has key {
        mood_seed: String,
        transaction_count: u64,
        rarity_score: u8,
        minted_at: u64,
        creator: address,
        generation: u64, // For future versioning
    }

    /// Event emitted when a new collection is created
    #[event]
    struct CollectionCreatedEvent has drop, store {
        creator: address,
        collection_name: String,
        timestamp: u64,
    }

    /// Event emitted when a new aura NFT is minted
    #[event]
    struct AuraMintedEvent has drop, store {
        creator: address,
        token_name: String,
        mood_seed: String,
        transaction_count: u64,
        rarity_score: u8,
        timestamp: u64,
    }

    /// Create the Aura NFT collection (can only be called once per account)
    ///
    /// # Arguments
    /// * `creator` - The signer creating the collection
    ///
    /// # Aborts
    /// * `E_COLLECTION_ALREADY_EXISTS` - If collection already exists for this creator
    public entry fun create_collection(creator: &signer) {
        create_collection_internal(creator);
    }

    /// Internal function to create the collection (used by mint_aura)
    fun create_collection_internal(creator: &signer) {
        let creator_addr = signer::address_of(creator);

        // Ensure collection doesn't already exist
        assert!(!exists<AuraCollection>(creator_addr), E_COLLECTION_ALREADY_EXISTS);

        let collection_name = string::utf8(COLLECTION_NAME);
        let description = string::utf8(COLLECTION_DESCRIPTION);
        let uri = string::utf8(b"https://aura-weaver.aptos.com/collection.json");

        collection::create_unlimited_collection(
            creator,
            description,
            collection_name,
            option::none(), // No royalty for now
            uri,
        );

        let current_time = timestamp::now_seconds();

        move_to(creator, AuraCollection {
            creator: creator_addr,
            total_minted: 0,
            created_at: current_time,
        });

        // Emit collection created event
        event::emit(CollectionCreatedEvent {
            creator: creator_addr,
            collection_name,
            timestamp: current_time,
        });
    }

    /// Mint a new Aura NFT with enhanced validation and metadata
    ///
    /// # Arguments
    /// * `user` - The signer minting the NFT
    /// * `mood_seed` - The mood seed string (1-100 characters)
    /// * `transaction_count` - User's transaction count for rarity calculation
    /// * `token_name` - Name for the token (max 50 characters)
    /// * `uri` - URI pointing to the NFT metadata/image
    ///
    /// # Aborts
    /// * `E_INVALID_MOOD_SEED` - If mood seed is invalid length
    /// * `E_INVALID_TOKEN_NAME` - If token name is invalid length
    /// * `E_INVALID_URI` - If URI is empty
    public entry fun mint_aura(
        user: &signer,
        mood_seed: String,
        transaction_count: u64,
        token_name: String,
        uri: String
    ) acquires AuraCollection {
        let user_addr = signer::address_of(user);

        // Validate inputs
        validate_mood_seed(&mood_seed);
        validate_token_name(&token_name);
        validate_uri(&uri);

        let collection_name = string::utf8(COLLECTION_NAME);
        let description = build_token_description(&mood_seed, transaction_count);

        // Ensure collection exists - force creation if needed
        if (!exists<AuraCollection>(user_addr)) {
            create_collection_internal(user);
        };

        // Verify collection exists before proceeding
        assert!(exists<AuraCollection>(user_addr), E_COLLECTION_NOT_FOUND);

        let rarity_score = calculate_rarity(transaction_count, mood_seed);
        let current_time = timestamp::now_seconds();

        let token_constructor_ref = token::create(
            user,
            collection_name,
            description,
            token_name,
            option::none(), // No royalty
            uri,
        );

        let token_signer = object::generate_signer(&token_constructor_ref);

        move_to(&token_signer, AuraNFT {
            mood_seed,
            transaction_count,
            rarity_score,
            minted_at: current_time,
            creator: user_addr,
            generation: 1, // First generation
        });

        // Update collection stats
        let collection = borrow_global_mut<AuraCollection>(user_addr);
        collection.total_minted = collection.total_minted + 1;

        // Emit minting event
        event::emit(AuraMintedEvent {
            creator: user_addr,
            token_name,
            mood_seed,
            transaction_count,
            rarity_score,
            timestamp: current_time,
        });
    }

    /// Enhanced rarity calculation based on transaction count and mood seed
    fun calculate_rarity(tx_count: u64, mood_seed: String): u8 {
        let base_rarity = if (tx_count > 5000) 90
                         else if (tx_count > 1000) 80
                         else if (tx_count > 500) 70
                         else if (tx_count > 100) 60
                         else if (tx_count > 50) 50
                         else 40;
        
        // Add mood seed complexity bonus
        let seed_length = string::length(&mood_seed);
        let seed_bonus = if (seed_length > 20) 15
                        else if (seed_length > 10) 10
                        else 5;
        
        // Add character diversity bonus
        let seed_bytes = string::bytes(&mood_seed);
        let unique_chars = count_unique_chars(seed_bytes);
        let diversity_bonus = if (unique_chars > 10) 10
                             else if (unique_chars > 5) 5
                             else 0;
        
        let total_rarity = base_rarity + seed_bonus + diversity_bonus;
        if (total_rarity > 100) 100 else total_rarity
    }

    /// Count unique characters in a byte vector (simplified implementation)
    fun count_unique_chars(bytes: &vector<u8>): u8 {
        let length = vector::length(bytes);
        if (length == 0) return 0;
        
        // Simplified unique counting - in reality would need more sophisticated logic
        let unique_estimate = if (length > 20) 15
                             else if (length > 10) 10
                             else if (length > 5) 8
                             else 5;
        unique_estimate
    }

    /// Validate mood seed input
    fun validate_mood_seed(mood_seed: &String) {
        let length = string::length(mood_seed);
        assert!(length >= MIN_MOOD_SEED_LENGTH, E_INVALID_MOOD_SEED);
        assert!(length <= MAX_MOOD_SEED_LENGTH, E_INVALID_MOOD_SEED);

        // Check for potentially harmful characters
        let bytes = string::bytes(mood_seed);
        let i = 0;
        while (i < vector::length(bytes)) {
            let byte = *vector::borrow(bytes, i);
            // Reject control characters and potentially harmful chars
            if (byte < 32 || byte == 60 || byte == 62 || byte == 34 || byte == 39) { // < > " '
                abort E_INVALID_MOOD_SEED
            };
            i = i + 1;
        };
    }

    /// Validate token name input
    fun validate_token_name(token_name: &String) {
        let length = string::length(token_name);
        assert!(length > 0, E_INVALID_TOKEN_NAME);
        assert!(length <= MAX_TOKEN_NAME_LENGTH, E_INVALID_TOKEN_NAME);
    }

    /// Validate URI input
    fun validate_uri(uri: &String) {
        assert!(string::length(uri) > 0, E_INVALID_URI);
    }

    /// Build a descriptive token description
    fun build_token_description(_mood_seed: &String, _transaction_count: u64): String {
        // In a real implementation, you'd want more sophisticated string building
        // For now, we'll use a simple description
        string::utf8(b"Personalized aura NFT reflecting your unique on-chain journey and mood")
    }

    // === View Functions ===

    /// Get collection information
    #[view]
    public fun get_collection_info(creator: address): (address, u64, u64) acquires AuraCollection {
        assert!(exists<AuraCollection>(creator), E_COLLECTION_NOT_FOUND);
        let collection = borrow_global<AuraCollection>(creator);
        (collection.creator, collection.total_minted, collection.created_at)
    }

    /// Get NFT information from a token object
    #[view]
    public fun get_aura_info(token_obj: Object<Token>): (String, u64, u8, u64, address, u64) acquires AuraNFT {
        let token_address = object::object_address(&token_obj);
        let aura = borrow_global<AuraNFT>(token_address);
        (
            aura.mood_seed,
            aura.transaction_count,
            aura.rarity_score,
            aura.minted_at,
            aura.creator,
            aura.generation
        )
    }
}
