module wordle::wordle {
    use std::debug;
    use std::error;
    use std::signer;
    use std::vector;
    use aptos_std::aptos_hash;

    use wordle::wordle_common as common;

    struct Game has key, drop {
        guesses: vector<vector<u8>>,
        word: vector<u8>,
        is_ongoing: bool, // false if over
    }

    struct Account has key {
        games_played: u64,
        games_won: u64,
        streak_length: u64,
        stats_array: vector<u64>, // array of size 6
    }
    
    public fun init(account: &signer) acquires Account, Game {
        assert!(!exists<Account>(signer::address_of(account)), error::already_exists(common::err_already_init()));

        let acc = Account {
            games_played: 0,
            games_won: 0,
            stats_array: vector<u64>[0, 0, 0, 0, 0, 0],
            streak_length: 0,
        };
        move_to(account, acc);

        start_game(account);
    }

    // (is_game_done, wordle_cmp_array)
    public fun submit_guess(account: &signer, guess: vector<u8>): (bool, vector<u8>) acquires Game, Account {
        check_word(&guess);

        let game = borrow_global_mut<Game>(signer::address_of(account));
        assert!(game.is_ongoing, error::invalid_state(common::err_game_over()));

        vector::push_back(&mut game.guesses, guess);

        let res: vector<u8> = wordle_cmp(game.word, guess);

        if (guess == game.word) {
            finish_game(account, game, true);
            (false, res)
        } else if (vector::length(&game.guesses) == common::max_guesses()) {
            finish_game(account, game, false);
            (false, res)
        } else {
            (true, res)
        }
    }

    fun wordle_cmp(target: vector<u8>, guess: vector<u8>): vector<u8> {
        let i = 0;
        let result: vector<u8> = vector[];
        while (i < common::word_length()) {
            vector::push_back(&mut result, common::grey());
            i = i + 1;
        };

        // 26 zeroes, counts unmatched letters in target
        let misplaced: vector<u8> =
            vector[0, 0, 0, 0, 0, 0, 0, 0,
                   0, 0, 0, 0, 0, 0, 0, 0,
                   0, 0, 0, 0, 0, 0, 0, 0,
                   0, 0];

        i = 0;
        while (i < common::word_length()) {
            let tc = *vector::borrow(&target, i);
            let gc = *vector::borrow(&guess, i);
            if (tc == gc) {
                let value = vector::borrow_mut(&mut result, i);
                *value = common::green();
            } else {
                let temp = vector::borrow_mut(&mut misplaced, (tc as u64) - 65);
                *temp = *temp + 1;
            };

            i = i+1;
        };

        i = 0;

        while (i < common::word_length()) {
            let gc = *vector::borrow(&guess, i);
            let value = vector::borrow_mut(&mut result, i);
            let mp = vector::borrow_mut(&mut misplaced, (gc as u64) - 65); 
            if (*value == common::grey() && *mp > 0) {
                *value = common::yellow();
                *mp = *mp - 1;
            };

            i = i + 1;
        };

        result
    }

    fun finish_game(account: &signer, game: &mut Game, won: bool) acquires Account {
        game.is_ongoing = false;
        let account = borrow_global_mut<Account>(signer::address_of(account));

        account.games_played = account.games_played + 1;
        if (won == true) {
            account.streak_length = account.streak_length + 1;
            account.games_won = account.games_won + 1;

            let num_guesses = vector::length(&game.guesses);
            let stat = vector::borrow_mut(&mut account.stats_array, num_guesses - 1);
            *stat = *stat + 1;
        } else {
            account.streak_length = 0;
        }
    }

    // word must be WORD_LENGTH bytes long
    // each byte must be ascii A to Z, so in (65..=90)
    // word must be in common::VALID_WORDS
    fun check_word(word: &vector<u8>) {
        assert!(vector::length(word) == common::word_length(), error::invalid_argument(common::err_wrong_length()));
        let i = 0;
        while (i < common::word_length()) {
            let chr = *vector::borrow(word, i);
            assert!(chr >= 64 && chr <= 91, error::invalid_argument(common::err_not_alpha()));
            i = i + 1;
        };
        assert!(common::is_word_valid(word), error::invalid_argument(common::err_not_word()));
    }

    fun start_game(account: &signer) acquires Account, Game {
        let acc = borrow_global_mut<Account>(signer::address_of(account));
        acc.games_played = acc.games_played + 1;
        let idx: u64 = get_random(account, acc.games_played);
        debug::print(&idx);
        let game = Game {
            guesses: vector[],
            word: *vector::borrow(&common::words(), idx),
            is_ongoing: true
        };

        if (exists<Game>(signer::address_of(account))) {
            move_from<Game>(signer::address_of(account));
        };
        move_to(account, game);
    }

    public fun reset(account: &signer) acquires Game, Account {
        let game = borrow_global<Game>(signer::address_of(account));
        assert!(!game.is_ongoing, error::invalid_state(common::err_incomplete_game()));

        start_game(account);
    }

    fun to_bytes<T>(s: &T): vector<u8> {
        let str = std::string_utils::to_string(s);
        *std::string::bytes(&str)
    }

    // not perfect, but I'd say pretty good
    fun get_random(account: &signer, games_played: u64): u64 {
        let seed: vector<u8> = b"";

        let s = to_bytes(&signer::address_of(account));
        vector::append(&mut seed, s);

        let s = to_bytes(&games_played);
        vector::append(&mut seed, s);

        let range: u64 = vector::length(&common::words());
        let a: u64 = aptos_hash::sip_hash(aptos_hash::keccak256(seed));
        return a % range
    }

    //#[test(account = @0x123)]
    //fun test(account: &signer) acquires Account, Game {
        //use std::debug;

        //init(account);

        //let (b, v) = submit_guess(account, b"APTOS");
        //(b, v) = submit_guess(account, b"APTOS");
        //(b, v) = submit_guess(account, b"APTOS");
        //(b, v) = submit_guess(account, b"APTOS");
        //(b, v) = submit_guess(account, b"APTOS");
        //(b, v) = submit_guess(account, b"APTOS");
        //reset(account);
        //(b, v) = submit_guess(account, b"APTOS");
        
         //debug::print(&b);
         //debug::print(&v);
    //}
}
