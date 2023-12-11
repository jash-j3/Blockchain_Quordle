# APTOS - Blockchain Challenge - Wordle and Qwordle

*Inter IIT Tech 12.0 - Team 35*


### Steps to Publish the Aptos Package

```bash
git clone https://github.com/jash-j3/Blockchain_Quordle.git
cd Blockchain_Quordle/contract
aptos init
aptos move publish --named-addresses wordle=default --included-artifacts none
```

After the package is published, you should see an out similar to the following:

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

### Run the Frontend

Copy the `sender` address from the previous JSON output and paste it into `Blockchain_Quordle/qwordle_r/.env`. The
frontend can now be started using the following commands:

```bash
cd Blockchain_Quordle/qwordle_r
npm install
npm start
```

This should start the frontend on `localhost:3000`. The game should now be playable, as long as there are sufficient
funds in your account to pay the gas fees.

The game can be played in any desktop browser which supports the Petra Wallet, or on mobile using the Petra Wallet
app's in-built browser.
