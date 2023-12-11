"use client"
import { useEffect } from "react";
import Home from "./page1";
const petra =  () => {
  useEffect(() => {
    return async() => {
  if(typeof window !== "undefined"){const isPetraInstalled = window.aptos;
  const getAptosWallet = () => {
    if ("aptos" in window) {
      return window.aptos;
    } else {
      window.open("https://petra.app/", `_blank`);
    }
  };
  const wallet = getAptosWallet();
  try {
    const response = await wallet.connect();
    console.log(response);

    const account = await wallet.account();
    console.log(account);
  } catch (error) {
    console.log(error);
  }}
  const transaction = {
    arguments: [],
    function: '"0x3c92e26dc800a3c7d59bca54097d289708a636dea9d7eee8dc8624f133c84817::wordle::register',
    type_arguments: [],
  };
   
  try {
    const pendingTransaction = await window.aptos.signAndSubmitTransaction(transaction);
    const client = new AptosClient('https://testnet.aptoslabs.com');
    const txn = await client.waitForTransactionWithResult(
      pendingTransaction.hash,
    );
  } catch (error) {
    // see "Errors"
  }

  return <Home />
}
});
};

export default petra;