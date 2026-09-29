import { WalletConnectAdapter } from
  "https://esm.sh/@tronweb3/tronwallet-adapter-walletconnect@3.1.0";

const PROJECT_ID = "ecc1996489bb46449977c5fe927d8d25";

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
          description: "Support humanitarian relief for families in Gaza",
          url: "https://mervatzaqout5-afk.github.io/gaza-relief/",
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

document
  .querySelectorAll("[data-amount]")
  .forEach((button) => {

    button.addEventListener("click", () => {
      $("amount").value = button.dataset.amount;
    });

  });

$("connect").addEventListener("click", connectWallet);
