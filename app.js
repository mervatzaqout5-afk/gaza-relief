import { BinanceAdapter } from
  "https://esm.sh/@tronweb3/tronwallet-adapter-binance@1.1.1";

const RECIPIENT =
  "TLbKGSeKQtB1iYh7sBRTk2p9kcYjBQb2Np";

const USDT =
  "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

let adapter = null;
let walletAddress = null;
let tronWeb = null;

const $ = (id) =>
  document.getElementById(id);

function msg(text) {
  $("message").textContent = text;
}

function shortenAddress(address) {
  return (
    address.slice(0, 6) +
    "..." +
    address.slice(-6)
  );
}

function createTronWeb() {
  if (
    window.TronWeb &&
    window.TronWeb.TronWeb
  ) {
    return new window.TronWeb.TronWeb({
      fullHost: "https://api.trongrid.io"
    });
  }

  if (window.TronWeb) {
    return new window.TronWeb({
      fullHost: "https://api.trongrid.io"
    });
  }

  throw new Error("TronWeb failed to load.");
}


/* =========================
   CONNECT BINANCE WALLET
========================= */

async function connectWallet() {

  try {

    msg("Opening Binance Wallet...");

    adapter = new BinanceAdapter();

    await adapter.connect();

    walletAddress =
      adapter.address;

    if (!walletAddress) {
      throw new Error(
        "Binance Wallet address was not returned."
      );
    }

    tronWeb =
      createTronWeb();

    $("wallet").textContent =
      "Connected: " +
      shortenAddress(walletAddress);

    $("connect").textContent =
      "Binance Wallet Connected";

    $("donationArea")
      .classList
      .remove("hidden");

    msg(
      "Binance Wallet connected successfully."
    );

  } catch (error) {

    console.error(
      "Binance Wallet connection error:",
      error
    );

    msg(
      "Connection failed: " +
      (error.message || error)
    );

  }
}


/* =========================
   PRESET AMOUNTS
========================= */

document
  .querySelectorAll("[data-amount]")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        $("amount").value =
          button.dataset.amount;

      }
    );

  });


/* =========================
   DONATE USDT
========================= */

async function donateUSDT() {

  try {

    if (!adapter || !walletAddress) {
      throw new Error(
        "Connect Binance Wallet first."
      );
    }

    if (!tronWeb) {
      tronWeb =
        createTronWeb();
    }

    const amount =
      Number($("amount").value);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "Enter a valid donation amount."
      );
    }

    const units =
      BigInt(
        Math.round(
          amount * 1_000_000
        )
      );

    if (units <= 0n) {
      throw new Error(
        "Donation amount is too small."
      );
    }

    $("donate").disabled =
      true;

    $("txLink")
      .classList
      .add("hidden");

    msg(
      "Preparing the USDT transaction..."
    );


    /* Convert recipient to TRON hex */

    const recipientHex =
      tronWeb.address.toHex(
        RECIPIENT
      );

    const recipient20 =
      recipientHex
        .replace(/^41/, "")
        .toLowerCase();


    /* ABI encode transfer(address,uint256) */

    const encodedAddress =
      recipient20.padStart(
        64,
        "0"
      );

    const encodedAmount =
      units
        .toString(16)
        .padStart(
          64,
          "0"
        );

    const parameter =
      encodedAddress +
      encodedAmount;


    /* Build unsigned USDT transaction */

    const result =
      await tronWeb
        .transactionBuilder
        .triggerSmartContract(

          USDT,

          "transfer(address,uint256)",

          {
            feeLimit:
              100_000_000,

            callValue:
              0,

            rawParameter:
              parameter
          },

          [],

          walletAddress

        );


    if (
      !result ||
      !result.transaction
    ) {
      throw new Error(
        "Could not create the USDT transaction."
      );
    }


    msg(
      "Please review the transaction in Binance Wallet..."
    );


    /*
     * Binance Adapter:
     * sign + broadcast
     */
    const response =
      await adapter.signAndSendTransaction(
        result.transaction
      );


    console.log(
      "Binance transaction response:",
      response
    );


    const txid =
      response?.txid ||
      response?.transaction?.txID ||
      response?.txID;


    if (!txid) {

      throw new Error(
        "Binance Wallet did not return a transaction ID."
      );

    }


    msg(
      "Donation submitted successfully. Thank you!"
    );


    $("txLink").href =
      "https://tronscan.org/#/transaction/" +
      txid;

    $("txLink").textContent =
      "View transaction on TRONSCAN";

    $("txLink")
      .classList
      .remove("hidden");


  } catch (error) {

    console.error(
      "Donation error:",
      error
    );

    msg(
      "Donation failed: " +
      (error.message || error)
    );

  } finally {

    $("donate").disabled =
      false;

  }

}


/* =========================
   BUTTONS
========================= */

$("connect")
  .addEventListener(
    "click",
    connectWallet
  );

$("donate")
  .addEventListener(
    "click",
    donateUSDT
  );
