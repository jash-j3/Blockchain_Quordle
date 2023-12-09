module wordle::data {
    //use aptos_framework::account;
    //use aptos_framework::event;
    //use std::option::{Self, Option};
    use std::signer;
    use std::error;
    use std::vector;

    const ERR_DOES_NOT_EXIST: u64 = 0;


    struct Data has key {
        data: vector<u8>
    }
    
    public fun init(account: &signer) {
        assert!(!exists<Data>(signer::address_of(account)), error::already_exists(ERR_DOES_NOT_EXIST));
        set_empty(account);
    }
        
    public fun get(account: &signer): vector<u8> acquires Data {
        let d = borrow_global<Data>(signer::address_of(account));
        d.data
    }

    public fun push(account: &signer, val: u8) acquires Data {
        let d = borrow_global_mut<Data>(signer::address_of(account));
        vector::push_back(&mut d.data, val);
    }

    public fun clear(account: &signer) acquires Data {
        let Data { data: _d } = move_from<Data>(signer::address_of(account));
        set_empty(account);
    }

    fun set_empty(account: &signer) {
        let d = Data { data: vector[] };
        move_to(account, d);
    }

    #[test(creator = @0x123)]
    fun test(creator: &signer) acquires Data {
        use std::debug;
        init(creator);
        push(creator, 1);
        push(creator, 2);
        push(creator, 3);
        let res: vector<u8> = get(creator);

        let len: u64 = vector::length<u8>(&res);

        assert!(len == 3, error::invalid_state(0));

        while (len > 0) {
            let v: u8 = *(vector::borrow<u8>(&res, len - 1));
            debug::print(&v);
            debug::print(&res);
            len = len - 1;
        };

        clear(creator);
        debug::print(&get(creator));

    }
}
