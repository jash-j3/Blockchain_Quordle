# APTOS - Blockchain Challenge - Wordle and Qwordle

*Inter IIT Tech 12.0 - Team 35*


The code is available at https://github.com/jash-j3/Blockchain_Quordle


### Steps to Publish the Aptos Package

```bash
cd Blockchain_Quordle/contract
aptos init # creates a new account (public/private key pair)
aptos move publish --named-addresses wordle=default --included-artifacts none
```

After the package is published, you should see an output similar to the following:

```json
{
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

#### Note about Published Package Size

Because of the large word list, we had to make some optimizations to reduce the size of the package. The main two
changes were:

1. Each word is stored as a 32-bit integer, instead of a string.
2. The package is published with the `--included-artifacts none` option, which removes the build artifacts
### Run the Frontend

Copy the `sender` address from the previous JSON output and replace the address in `Blockchain_Quordle/qwordle_r/.env`.
The frontend can now be started using the following commands:

```bash
cd Blockchain_Quordle/qwordle_r
npm install
npm start
```

This should start the frontend on `localhost:3000`. The game should now be playable, as long as there are sufficient
funds in your account to pay the gas fees.

The game can be played in any desktop browser which supports the Petra Wallet, or on mobile using the Petra Wallet
app's in-built browser.
