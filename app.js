import { WalletConnectAdapter } from
  "https://esm.sh/@tronweb3/tronwallet-adapter-walletconnect@3.1.0";



const PROJECT_ID = "ecc1996489bb46449977c5fe927d8d25";

const RECIPIENT = "TLbKGSeKQtB1iYh7sBRTk2p9kcYjBQb2Np";

const USDT_CONTRACT =
  "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

const tronWeb = window.TronWeb.TronWeb
  ? new window.TronWeb.TronWeb({
      fullHost: "https://api.trongrid.io"
    })
  : new window.TronWeb({
      fullHost: "https://api.trongrid.io"
    });

let adapter = null;
let walletAddress = null;

const $ = (id) => document.getElementById(id);

function msg(text) {
  $("message").textContent = text;
}

function shortenAddress(address) {
  return address.slice(0, 6) + "..." + address.slice(-6);
}

async function connectWallet() {
  try {
    msg("Opening wallet connection...");

    adapter = new WalletConnectAdapter({
      network: "Mainnet",

      options: {
        relayUrl: "wss://relay.walletconnect.com",

        projectId: PROJECT_ID,

        metadata: {
          name: "Gaza Relief",
          description:
            "Support humanitarian relief for families in Gaza",
          url:
            "https://mervatzaqout5-afk.github.io/gaza-relief/",
          icons: []
        }
      },

      themeMode: "light"
    });

    await adapter.connect();

    walletAddress = adapter.address;

    if (!walletAddress) {
      throw new Error("Wallet address was not returned.");
    }

    $("wallet").textContent =
      "Connected: " + shortenAddress(walletAddress);

    $("connect").textContent = "Wallet Connected";

    $("donationArea").classList.remove("hidden");

    msg("Wallet connected successfully.");

  } catch (error) {
    console.error(error);

    msg(
      "Connection failed: " +
      (error.message || error)
    );
  }
}

async function donateUSDT() {
  try {
    if (!adapter || !walletAddress) {
      msg("Please connect your wallet first.");
      return;
    }

    const amountInput = $("amount").value;
    const amount = Number(amountInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      msg("Please enter a valid donation amount.");
      return;
    }

    msg("Preparing USDT transaction...");

    // USDT uses 6 decimals
    const amountInUnits = Math.round(amount * 1_000_000);

    // Build the TRC-20 transfer transaction.
    // TRON's official WalletConnect example uses
    // typed ABI parameters here.
    const result =
      await tronWeb.transactionBuilder.triggerSmartContract(
        USDT_CONTRACT,
        "transfer(address,uint256)",
        {
          feeLimit: 100_000_000,
          callValue: 0
        },
        [
          {
            type: "address",
            value: RECIPIENT
          },
          {
            type: "uint256",
            value: amountInUnits.toString()
          }
        ],
        walletAddress
      );

    if (!result || !result.transaction) {
      console.error("Transaction creation result:", result);
      throw new Error("Could not create the USDT transaction.");
    }

    msg("Waiting for wallet approval...");

    const signedTransaction =
      await adapter.signTransaction(result.transaction);

    msg("Broadcasting transaction...");

    const broadcast =
      await tronWeb.trx.sendRawTransaction(
        signedTransaction
      );

    console.log("Broadcast result:", broadcast);

    if (!broadcast.result) {
      throw new Error(
        broadcast.message
          ? tronWeb.toUtf8(broadcast.message)
          : "Transaction was rejected by the TRON network."
      );
    }

    const txid = broadcast.txid;

    msg("Donation sent successfully. Thank you!");

    $("txLink").href =
      "https://tronscan.org/#/transaction/" + txid;

    $("txLink").textContent =
      "View transaction on TRONSCAN";

    $("txLink").classList.remove("hidden");

  } catch (error) {
    console.error("Donation error:", error);

    msg(
      "Donation failed: " +
      (error?.message || String(error))
    );
  }
}
  try {
    if (!adapter || !walletAddress) {
      msg("Please connect your wallet first.");
      return;
    }

    const amountInput = $("amount").value;

    if (!amountInput || Number(amountInput) <= 0) {
      msg("Please enter a donation amount.");
      return;
    }

    const amount = Number(amountInput);

    msg("Preparing USDT transaction...");

    // USDT TRC-20 uses 6 decimals
    const amountInSun = Math.round(amount * 1_000_000);

    // Convert addresses to hexadecimal format
    const contractAddress =
      tronWeb.address.toHex(USDT_CONTRACT);

    const recipientAddress =
      tronWeb.address.toHex(RECIPIENT);

    // Encode transfer(address,uint256)
    const parameter =
      tronWeb.utils.abi.encodeParams(
        ["address", "uint256"],
        [recipientAddress, amountInSun.toString()]
      );

    // Create unsigned TRC-20 transaction
    const transaction =
      await tronWeb.transactionBuilder.triggerSmartContract(
        contractAddress,
        "transfer(address,uint256)",
        {
          feeLimit: 100_000_000,
          callValue: 0
        },
        parameter,
        walletAddress
      );

    if (!transaction.result || !transaction.transaction) {
      throw new Error(
        "Could not create the USDT transaction."
      );
    }

    msg("Waiting for wallet approval...");

    // Ask the connected wallet to sign
    const signedTransaction =
      await adapter.signTransaction(
        transaction.transaction
      );

    msg("Broadcasting transaction...");

    // Broadcast signed transaction
    const result =
      await tronWeb.trx.sendRawTransaction(
        signedTransaction
      );

    if (!result.result) {
      throw new Error(
        result.message
          ? tronWeb.toUtf8(result.message)
          : "Transaction was rejected by the TRON network."
      );
    }

    const txid = result.txid;

    msg("Donation sent successfully. Thank you!");

    $("txLink").href =
      "https://tronscan.org/#/transaction/" + txid;

    $("txLink").textContent =
      "View transaction on TRONSCAN";

    $("txLink").classList.remove("hidden");

  } catch (error) {
    console.error(error);

    msg(
      "Donation failed: " +
      (error.message || error)
    );
  }
}

// Preset amount buttons
document
  .querySelectorAll("[data-amount]")
  .forEach((button) => {

    button.addEventListener("click", () => {
      $("amount").value = button.dataset.amount;
    });

  });

// Connect wallet button
$("connect").addEventListener(
  "click",
  connectWallet
);

// Donate button
$("donate").addEventListener(
  "click",
  donateUSDT
);
