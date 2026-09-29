const RECIPIENT = "TLbKGSeKQtB1iYh7sBRTk2p9kcYjBQb2Np";
const USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const USDT_DECIMALS = 6;

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

    const adapters =
      window["@tronweb3/tronwallet-adapters"];

    if (!adapters) {
      throw new Error("TRON Wallet Adapter did not load.");
    }

    const { WalletConnectAdapter } = adapters;

    adapter = new WalletConnectAdapter({
      network: "Mainnet",
      options: {
        relayUrl: "wss://relay.walletconnect.com",
        projectId: PROJECT_ID,
        metadata: {
          name: "Gaza Relief",
          description: "Support humanitarian relief in Gaza",
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

document.querySelectorAll("[data-amount]").forEach((button) => {
  button.addEventListener("click", () => {
    $("amount").value = button.dataset.amount;
  });
});

$("connect").addEventListener("click", connectWallet);
