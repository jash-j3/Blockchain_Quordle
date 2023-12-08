module wordle::wordle {
    // use aptos_framework::account;
    // use aptos_framework::event;
    use std::error;
    // use std::option::{Self, Option};
    use std::signer;
    use std::vector;
    use aptos_std::aptos_hash;

    //// ERROR CONSTANTS
    const ERR_ALREADY_INIT: u64 = 1;
    const ERR_INCOMPLETE_GAME: u64 = 2;
    const ERR_WRONG_LENGTH: u64 = 3;
    const ERR_NOT_ALPHA: u64 = 4;
    const ERR_GAME_OVER: u64 = 5;

    //// GAME CONSTANTS
    const WORD_LENGTH: u64 = 5;
    const MAX_GUESSES: u64 = 6;
    const WORDS: vector<vector<u8>> = vector[b"aptos", b"block", b"chain", b"smart"];

    const GREY: u8 = 0;
    const YELLOW: u8 = 1;
    const GREEN: u8 = 2;


    struct Game has key {
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
    
    public fun init(account: &signer) acquires Account {
        assert!(!exists<Account>(signer::address_of(account)), error::already_exists(ERR_ALREADY_INIT));

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
        assert!(game.is_ongoing, error::invalid_state(ERR_GAME_OVER));

        vector::push_back(&mut game.guesses, guess);

        let res: vector<u8> = wordle_cmp(game.word, guess);

        if (guess == game.word) {
            finish_game(account, game, true);
            (false, res)
        } else if (vector::length(&game.guesses) == MAX_GUESSES) {
            finish_game(account, game, false);
            (false, res)
        } else {
            (true, res)
        }
    }

    fun wordle_cmp(target: vector<u8>, guess: vector<u8>): vector<u8> {
        let i = 0;
        let result: vector<u8> = vector[];
        while (i < WORD_LENGTH) {
            vector::push_back(&mut result, GREY);
        };

        // 26 zeroes, counts unmatched letters in target
        let misplaced: vector<u8> = vector[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        i = 0;
        while (i < WORD_LENGTH) {
            let tc = *vector::borrow(&target, i);
            let gc = *vector::borrow(&guess, i);
            if (tc == gc) {
                let value = vector::borrow_mut(&mut result, i);
                *value = GREEN;
            } else {
                let temp = vector::borrow_mut(&mut misplaced, (tc as u64) - 65);
                *temp = *temp + 1;
            };

            i = i+1;
        };

        i = 0;

        while (i < WORD_LENGTH) {
            let gc = *vector::borrow(&guess, i);
            let value = vector::borrow_mut(&mut result, i);
            let mp = vector::borrow_mut(&mut misplaced, (gc as u64) - 65); 
            if (*value == GREY && *mp > 0) {
                *value = YELLOW;
                *mp = *mp - 1;
            };

            i = i+1;
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
    fun check_word(word: &vector<u8>) {
        assert!(vector::length(word) == WORD_LENGTH, error::invalid_argument(ERR_WRONG_LENGTH));
        let i = 0;
        while (i < WORD_LENGTH) {
            let chr = *vector::borrow(word, i);
            assert!(chr >= 64 && chr <= 91, error::invalid_argument(ERR_NOT_ALPHA));
        };
    }

    fun start_game(account: &signer) acquires Account {
        let acc = borrow_global_mut<Account>(signer::address_of(account));
        acc.games_played = acc.games_played + 1;
        let idx: u64 = get_random();
        let game = Game {
            guesses: vector[],
            word: *vector::borrow(&WORDS, idx),
            is_ongoing: true
        };

        move_to(account, game);
    }

    public fun reset(account: &signer) acquires Game, Account {
        let game = borrow_global<Game>(signer::address_of(account));
        assert!(!game.is_ongoing, error::invalid_state(ERR_INCOMPLETE_GAME));

        start_game(account);
    }

    fun get_random(): u64 {
        // TODO: not random yet
        let range: u64 = vector::length(&WORDS);
        let a: u64 = aptos_hash::sip_hash(aptos_hash::keccak256(b"This is seed"));
        return a % range
    }

}