const RECIPIENT = "TLbKGSeKQtB1iYh7sBRTk2p9kcYjBQb2Np";
const USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const USDT_DECIMALS = 6;

let tronWeb = null;
let walletAddress = null;

const $ = id => document.getElementById(id);
const msg = text => $("message").textContent = text;

async function connectWallet() {
  try {
    if (!window.tronLink && !window.tron) {
      msg("Open this page in a TRON-compatible wallet browser, or install a supported wallet such as TronLink.");
      return;
    }

    if (window.tronLink) {
      const res = await window.tronLink.request({method: "tron_requestAccounts"});
      if (res.code && res.code !== 200) throw new Error(res.message || "Wallet connection failed");
    }

    const provider = window.tron?.tronWeb || window.tronLink?.tronWeb;
    if (!provider) throw new Error("TRON wallet provider was not detected.");

    tronWeb = provider;
    walletAddress = tronWeb.defaultAddress.base58;

    if (!walletAddress) throw new Error("No wallet account selected.");

    $("wallet").textContent = "Connected: " + walletAddress;
    $("connect").textContent = "Wallet Connected";
    $("donationArea").classList.remove("hidden");
    msg("Wallet connected. Choose an amount and review the transaction in your wallet.");
  } catch (e) {
    msg(e.message || "Could not connect wallet.");
  }
}

document.querySelectorAll("[data-amount]").forEach(btn => {
  btn.addEventListener("click", () => $("amount").value = btn.dataset.amount);
});

$("connect").addEventListener("click", connectWallet);

$("donate").addEventListener("click", async () => {
  try {
    if (!tronWeb || !walletAddress) throw new Error("Connect your wallet first.");
    const amount = Number($("amount").value);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid donation amount.");

    $("donate").disabled = true;
    msg("Preparing the USDT transaction…");

    const contract = await tronWeb.contract().at(USDT);
    const units = Math.round(amount * 10 ** USDT_DECIMALS);

    msg("Please review and approve the transaction in your wallet.");
    const txid = await contract.transfer(RECIPIENT, units).send({
      feeLimit: 100_000_000,
      callValue: 0,
      shouldPollResponse: true
    });

    msg("Donation submitted successfully.");
    $("txLink").href = "https://tronscan.org/#/transaction/" + txid;
    $("txLink").textContent = "View transaction on TRONSCAN";
    $("txLink").classList.remove("hidden");
  } catch (e) {
    msg("Transaction was not completed: " + (e.message || e));
  } finally {
    $("donate").disabled = false;
  }
});
