import React, { useState, useEffect } from "react";
import Home from "./page1";
import "./App.css";
import {
  Types,
  AptosClient,
  AptosAccount,
  HexString,
  TxnBuilderTypes,
} from "aptos";
const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

const App = () => {
  const [account, setAccount] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getAptosWallet = () => {
      if ("aptos" in window) {
        return window.aptos;
      } else {
        window.open("https://petra.app/", `_blank`);
      }
    };

    const connectWallet = async () => {
      const wallet = getAptosWallet();
      try {
        await wallet.connect();
        const acc = await wallet.account();
        setAccount(acc);
      } catch (err) {
        console.log(err);
        setError(err);
      }
    };

    if (typeof window !== "undefined") {
      connectWallet();
    }
  }, []);

  useEffect(() => {
    const executeTransaction = async () => {
      if (!account) return;

      console.log("account:", account);
      const payload = {
        function:
          "0x7653ff4b28a1da697bf2d75aeed4df1821926cedd0e889379593f2b7847f386e::wordle::get_stats",
        type_arguments: [],
        arguments: [account.address],
      };
      const balance = await client.view(payload);
      console.log("view here ", balance);
      if (!balance) {
        const transaction = {
          arguments: [],
          function:
            "0x7653ff4b28a1da697bf2d75aeed4df1821926cedd0e889379593f2b7847f386e::wordle::register",
          type_arguments: [],
        };
        try {
          const pendingTransaction =
            await window.aptos.signAndSubmitTransaction(transaction);
          const client = new AptosClient("https://testnet.aptoslabs.com");
          const txn = await client.waitForTransactionWithResult(
            pendingTransaction.hash
          );
          setTransactionResult(txn);
        } catch (err) {
          console.log(err);
          setError(err);
        }
      }
    };

    executeTransaction();
  }, [account]); // Re-run the effect if account changes

  if (error) {
    console.log("error hereee", error);
    return <div>Error: {error.message}</div>;
  }
  if (!account) return <div>Loading...</div>;

  return (
    <div>
      <Home />
      {transactionResult && (
        <div>Transaction successful: {JSON.stringify(transactionResult)}</div>
      )}
    </div>
  );
};

export default App;
