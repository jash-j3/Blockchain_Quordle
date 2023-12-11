import React, { useState, useEffect } from 'react';
import Home from "./page1";
import {
  Types,
  AptosClient,
  AptosAccount,
  HexString,
  TxnBuilderTypes,
} from "aptos";

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

      const transaction = {
        arguments: [],
        function: '0x3c92e26dc800a3c7d59bca54097d289708a636dea9d7eee8dc8624f133c84817::wordle::register',
        type_arguments: [],
      };

      try {
        const pendingTransaction = await window.aptos.signAndSubmitTransaction(transaction);
        const client = new AptosClient('https://testnet.aptoslabs.com');
        const txn = await client.waitForTransactionWithResult(pendingTransaction.hash);
        setTransactionResult(txn);
      } catch (err) {
        console.log(err);
        setError(err);
      }
    };

    executeTransaction();
  }, [account]);  // Re-run the effect if account changes

  if (error) {
    console.log("error hereee", error);
    return <div>Error: {error.message}</div>;}
  if (!account) return <div>Loading...</div>;

  return (
    <div>
      <Home />
      {transactionResult && <div>Transaction successful: {JSON.stringify(transactionResult)}</div>}
    </div>
  );
};

export default App;
