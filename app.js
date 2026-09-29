import { WalletConnectAdapter } from "https://esm.sh/@tronweb3/tronwallet-adapter-walletconnect@3.1.0";
import TronWeb from "https://esm.sh/tronweb@6.0.4";

const RECIPIENT = "TLbKGSeKQtB1iYh7sBRTk2p9kcYjBQb2Np";
const USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const USDT_DECIMALS = 6;

const PROJECT_ID = "ecc1996489bb46449977c5fe927d8d25";

const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io"
});

let adapter = null;
let walletAddress = null;

const $ = id => document.getElementById(id);
const msg = text => $("message").textContent = text;

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
          description: "Support humanitarian relief in Gaza",
          url: "https://mervatzaqout5-afk.github.io/gaza-relief/",
          icons: [
            "https://mervatzaqout5-afk.github.io/gaza-relief/icon.png"
          ]
        }
      },
      themeMode: "light"
    });

    await adapter.connect();

    walletAddress = adapter.address;

    if (!walletAddress) {
      throw new Error("No wallet address was returned.");
    }

    $("wallet").textContent = "Connected: " + shortenAddress(walletAddress);
    $("connect").textContent = "Wallet Connected";
    $("donationArea").classList.remove("hidden");

    msg("Wallet connected. Choose an amount and continue.");
  } catch (e) {
    console.error(e);
    msg("Wallet connection failed: " + (e.message || e));
  }
}

document.querySelectorAll("[data-amount]").forEach(btn => {
  btn.addEventListener("click", () => {
    $("amount").value = btn.dataset.amount;
  });
});

$("connect").addEventListener("click", connectWallet);

$("donate").addEventListener("click", async () => {
  try {
    if (!adapter || !walletAddress) {
      throw new Error("Connect your wallet first.");
    }

    const amount = Number($("amount").value);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a valid donation amount.");
    }

    $("donate").disabled = true;
    $("txLink").classList.add("hidden");

    msg("Preparing your USDT transaction...");

    const units = Math.round(amount * 10 ** USDT_DECIMALS);

    const parameter = [
      {
        type: "address",
        value: RECIPIENT
      },
      {
        type: "uint256",
        value: units.toString()
      }
    ];

    const result = await tronWeb.transactionBuilder.triggerSmartContract(
      USDT,
      "transfer(address,uint256)",
      {
        feeLimit: 100_000_000,
        callValue: 0
      },
      parameter,
      walletAddress
    );

    if (!result || !result.transaction) {
      throw new Error("Could not create the USDT transaction.");
    }

    msg("Please confirm the USDT transaction in your wallet...");

    const signedTransaction = await adapter.signTransaction(
      result.transaction
    );

    msg("Broadcasting transaction...");

    const broadcast = await tronWeb.trx.sendRawTransaction(
      signedTransaction
    );

    if (!broadcast.result) {
      throw new Error(
        broadcast.message
          ? tronWeb.toUtf8(broadcast.message)
          : "Transaction was rejected by the TRON network."
      );
    }

    const txid = broadcast.txid || signedTransaction.txID;

    msg("Donation submitted successfully. Thank you!");

    $("txLink").href =
      "https://tronscan.org/#/transaction/" + txid;

    $("txLink").textContent = "View transaction on TRONSCAN";
    $("txLink").classList.remove("hidden");

  } catch (e) {
    console.error(e);

    msg(
      "Transaction was not completed: " +
      (e.message || e)
    );
  } finally {
    $("donate").disabled = false;
  }
});
