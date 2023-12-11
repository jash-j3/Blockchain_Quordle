module wordle::wordle {
    use std::error;
    use std::signer;
    use std::vector;

    use wordle::wordle_common as common;

    struct Game has key, drop {
        guesses: vector<vector<u8>>,
        guess_results: vector<vector<u8>>,
        word: vector<u8>,
        is_ongoing: bool, // false if over
    }

    struct Account has key {
        games_played: u64,
        games_won: u64,
        streak_length: u64,
        stats_array: vector<u64>, // array of size 6
    }

    #[view]
    public fun get_stats(addr: address): (u64, u64, u64, vector<u64>) acquires Account {
        assert!(exists<Account>(addr), error::not_found(common::err_not_init()));
        let account = borrow_global<Account>(addr);

        (account.games_played, account.games_won, account.streak_length, account.stats_array)
    }

    #[view]
    public fun get_game_state(addr: address): (vector<vector<u8>>, vector<vector<u8>>, bool) acquires Game {
        assert!(exists<Game>(addr), error::not_found(common::err_not_init())); // change error messages
        let game = borrow_global<Game>(addr);

        (game.guesses, game.guess_results, game.is_ongoing)
    }
    
    entry fun register(account: &signer) acquires Account, Game {
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
    entry fun submit_guess(account: &signer, guess: vector<u8>) acquires Game, Account {
        if (!common::check_word(&guess)) {
            return
        };

        let game = borrow_global_mut<Game>(signer::address_of(account));
        assert!(game.is_ongoing, error::invalid_state(common::err_game_over()));

        let res: vector<u8> = wordle_cmp(game.word, guess);

        vector::push_back(&mut game.guesses, guess);
        vector::push_back(&mut game.guess_results, res);

        if (guess == game.word) {
            finish_game(account, game, true);
        } else if (vector::length(&game.guesses) == common::max_guesses()) {
            finish_game(account, game, false);
        };
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

    fun gen_idx(account: &signer, acc: &Account, seed: vector<u8>): u64 {
        // append games_played to seed so that the index is different for each game
        std::vector::append(&mut seed, common::to_bytes(&acc.games_played));
        let range = vector::length(&common::words());

        common::gen_random(account, range, seed)
    }

    fun start_game(account: &signer) acquires Account, Game {
        let acc = borrow_global_mut<Account>(signer::address_of(account));
        let idx: u64 = gen_idx(account, acc, b"wordleseed123");
        let game = Game {
            guesses: vector[],
            guess_results: vector[],
            word: *vector::borrow(&common::words(), idx),
            is_ongoing: true
        };

        if (exists<Game>(signer::address_of(account))) {
            move_from<Game>(signer::address_of(account));
        };
        move_to(account, game);
    }

    entry fun reset(account: &signer) acquires Game, Account {
        let game = borrow_global<Game>(signer::address_of(account));
        if (game.is_ongoing) {
            return
        };

        start_game(account);
    }

    #[test(account = @0x123)]
    fun test(account: &signer) acquires Account, Game {
        use std::debug;

        init(account);

        let (b, v) = submit_guess(account, b"APTOS");
        (b, v) = submit_guess(account, b"APTOS");
        (b, v) = submit_guess(account, b"APTOS");
        (b, v) = submit_guess(account, b"APTOS");
        (b, v) = submit_guess(account, b"APTOS");
        (b, v) = submit_guess(account, b"APTOS");
        reset(account);
        (b, v) = submit_guess(account, b"APTOS");
        
         debug::print(&b);
         debug::print(&v);
    }
}
