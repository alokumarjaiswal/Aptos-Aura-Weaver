module aura_weaver::aura_nft {
    use std::string::{Self, String};
    use std::option;
    use std::signer;
    use aptos_framework::object::{Self};
    use aptos_token_objects::collection;
    use aptos_token_objects::token;

    struct AuraCollection has key {
        creator: address,
    }

    struct AuraNFT has key {
        mood_seed: String,
        transaction_count: u64,
        rarity_score: u8,
    }

    public entry fun create_collection(creator: &signer) {
        let collection_name = string::utf8(b"Aptos Aura Collection");
        let description = string::utf8(b"Personalized aura NFTs");
        let uri = string::utf8(b"https://your-domain.com/collection.json");
        
        collection::create_unlimited_collection(
            creator,
            description,
            collection_name,
            option::none(),
            uri,
        );

        move_to(creator, AuraCollection {
            creator: signer::address_of(creator)
        });
    }

    public entry fun mint_aura(
        user: &signer,
        mood_seed: String,
        transaction_count: u64,
        token_name: String,
        uri: String
    ) {
        let collection_name = string::utf8(b"Aptos Aura Collection");
        let description = string::utf8(b"Your personalized aura NFT");
        
        let rarity_score = calculate_rarity(transaction_count, mood_seed);
        
        let token_constructor_ref = token::create_named_token(
            user,
            collection_name,
            description,
            token_name,
            option::none(),
            uri,
        );

        let token_signer = object::generate_signer(&token_constructor_ref);
        
        move_to(&token_signer, AuraNFT {
            mood_seed,
            transaction_count,
            rarity_score,
        });
    }

    fun calculate_rarity(tx_count: u64, mood_seed: String): u8 {
        let base_rarity = if (tx_count > 1000) 80
                         else if (tx_count > 100) 60
                         else 40;
        
        let seed_bonus = (string::length(&mood_seed) % 20) as u8;
        ((base_rarity + seed_bonus) % 100) as u8
    }
}
