module wordle::qwordle {
    use std::error;
    use std::signer;
    use std::vector;
    use wordle::wordle_common as common;

    struct Game has key, drop {
        guesses: vector<vector<u8>>,
        guess_results: vector<vector<u8>>,
        word1: vector<u8>,
        word2: vector<u8>,
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
        check_word(&guess);

        let game = borrow_global_mut<Game>(signer::address_of(account));
        assert!(game.is_ongoing, error::invalid_state(common::err_game_over()));

        let res: vector<u8> = qwordle_cmp(game.word1, game.word2, guess);

        vector::push_back(&mut game.guesses, guess);
        vector::push_back(&mut game.guess_results, res);

        if (guess == game.word1 || guess == game.word2) {
            finish_game(account, game, true);
        } else if (vector::length(&game.guesses) == common::max_guesses()) {
            finish_game(account, game, false);
        };
    }

    fun qwordle_cmp(target1: vector<u8>, target2: vector<u8>, guess: vector<u8>): vector<u8> {
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
            let tc1 = *vector::borrow(&target1, i);
            let tc2 = *vector::borrow(&target2, i);
            let gc = *vector::borrow(&guess, i);
            if (tc1 == gc || tc2 == gc) {
                let value = vector::borrow_mut(&mut result, i);
                *value = common::green();
            } else {
                let temp = vector::borrow_mut(&mut misplaced, (tc1 as u64) - 65);
                *temp = *temp + 1;
                let temp = vector::borrow_mut(&mut misplaced, (tc2 as u64) - 65);
                *temp = *temp + 1;
            };

            i = i + 1;
        };

        i = 0;

        while (i < common::word_length()) {
            let gc = *vector::borrow(&guess, i);
            let value = vector::borrow_mut(&mut result, i);
            let mp = vector::borrow_mut(&mut misplaced, (gc as u64) - 65); 
            if (*value == common::grey ()&& *mp > 0) {
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
        let (idx1, idx2) = gen_idxes(account, acc);
        let game = Game {
            guesses: vector[],
            guess_results: vector[],
            word1: *vector::borrow(&common::words(), idx1),
            word2: *vector::borrow(&common::words(), idx2),
            is_ongoing: true
        };

        if (exists<Game>(signer::address_of(account))) {
            move_from<Game>(signer::address_of(account));
        };
        move_to(account, game);
    }

    entry fun reset(account: &signer) acquires Game, Account {
        let game = borrow_global<Game>(signer::address_of(account));
        assert!(!game.is_ongoing, error::invalid_state(common::err_incomplete_game()));

        start_game(account);
    }

    fun gen_idxes(account: &signer, acc: &Account): (u64, u64) {
        let seed = b"qwordleseed123";
        std::vector::append(&mut seed, common::to_bytes(&acc.games_played));
        let range = vector::length(&IDX1);
        let idx = common::gen_random(account, range, b"qwordleseed123");

        let idx1 = *vector::borrow(&IDX1, idx);
        let idx2 = *vector::borrow(&IDX2, idx);
        (idx1, idx2)
    }

    #[test(account = @0x123)]
    fun test(account: &signer) acquires Account, Game {
        use std::debug;

        init(account);

        let (b, v) = submit_guess(account, b"APTOS");
        submit_guess(account, b"APTOS");
        submit_guess(account, b"APTOS");
        submit_guess(account, b"APTOS");
        submit_guess(account, b"APTOS");
        submit_guess(account, b"APTOS");
        reset(account);
        (b, v) = submit_guess(account, b"APTOS");
        
         debug::print(&b);
         debug::print(&v);
    }

    // possible non conflicting answer pairs are hardcoded into the contract here
    // repeated random generation of pairs is too expensive

    const IDX1: vector<u64> = vector[
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        2,
        2,
        2,
        2,
        2,
        2,
        3,
        3,
        4,
        4,
        4,
        4,
        5,
        6,
        6,
        6,
        6,
        6,
        7,
        7,
        7,
        7,
        7,
        8,
        8,
        8,
        8,
        9,
        9,
        9,
        10,
        10,
        10,
        10,
        11,
        11,
        11,
        12,
        12,
        12,
        12,
        12,
        12,
        12,
        12,
        12,
        12,
        13,
        14,
        14,
        14,
        14,
        14,
        14,
        15,
        15,
        15,
        15,
        15,
        15,
        16,
        16,
        16,
        17,
        17,
        19,
        19,
        19,
        19,
        19,
        21,
        21,
        21,
        22,
        22,
        22,
        22,
        23,
        23,
        23,
        24,
        24,
        24,
        24,
        25,
        25,
        25,
        25,
        25,
        26,
        26,
        26,
        26,
        27,
        28,
        28,
        29,
        29,
        30,
        30,
        30,
        31,
        31,
        32,
        32,
        32,
        34,
        34,
        34,
        35,
        35,
        35,
        36,
    ];

    const IDX2: vector<u64> = vector[
        10,
        29,
        34,
        35,
        3,
        5,
        8,
        9,
        10,
        11,
        16,
        17,
        20,
        23,
        24,
        27,
        28,
        31,
        33,
        34,
        35,
        37,
        40,
        8,
        12,
        16,
        19,
        31,
        34,
        29,
        35,
        6,
        21,
        32,
        36,
        12,
        11,
        13,
        14,
        22,
        35,
        14,
        24,
        28,
        32,
        37,
        14,
        29,
        32,
        35,
        22,
        25,
        26,
        24,
        25,
        32,
        38,
        12,
        28,
        32,
        13,
        14,
        18,
        20,
        21,
        23,
        29,
        30,
        35,
        36,
        26,
        15,
        19,
        27,
        29,
        31,
        33,
        21,
        23,
        24,
        32,
        36,
        40,
        21,
        32,
        36,
        25,
        26,
        21,
        23,
        30,
        32,
        36,
        24,
        30,
        31,
        27,
        29,
        32,
        33,
        25,
        29,
        31,
        27,
        29,
        33,
        36,
        27,
        28,
        33,
        34,
        35,
        27,
        28,
        34,
        35,
        30,
        29,
        36,
        36,
        40,
        34,
        35,
        36,
        32,
        36,
        33,
        34,
        36,
        36,
        38,
        40,
        36,
        38,
        40,
        37,
    ];
}
