---
Title: APTOS - Blockchain Challenge - Wordle and Qwordle
Author: Team 35
---

### Steps to setup publish the Aptos package

```bash
$ git clone https://github.com/jash-j3/Blockchain_Quordle.git
$ cd Blockchain_Quordle/contract
$ aptos init
$ aptos move publish --named-addresses wordle=default --included-artifacts none
```

After the package is published, you should see an out similar to the following:

```json
⁠ {
  "Result": {
    "transaction_hash": "0xXXXXX",
    "gas_used": XXXX,
    "gas_unit_price": XXX,
    "sender": "XXXXX",
    "sequence_number": X,
    "success": true,
    "timestamp_us": XXXX,
    "version": XXXXX,
    "vm_status": "Executed successfully"
  }
}
```

### Setup the frontend

Now copy the `sender` address from the output and paste it in the `.env` file in `Blockchain_Quordle/quordle`.

```bash
$ cd Blockchain_Quordle/quordle
$ npm install
$ npm start
```

This should start the frontend on `localhost:3000`. You can now start playing the game. 

The game can only be played in any desktop browser which supports the Petra Wallet, or on mobile using the Petra Wallet app's in-built browser.