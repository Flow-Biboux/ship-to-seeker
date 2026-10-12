import type { DiagramName, GuidePanel } from "./guidePanels";

export type DiagramRow = readonly string[];

export const GUIDE_DIAGRAMS: Record<DiagramName, readonly DiagramRow[]> = {
  wallet: [
    ["Seed phrase"],
    ["Private key"],
    ["Wallet approves"],
    ["App sees the address only"],
  ],
  assets: [
    ["SOL", "pays fees"],
    ["SKR", "SPL token"],
    ["Genesis Token", "NFT, one per Seeker"],
  ],
  transaction: [
    ["Signature"],
    ["Status", "Fee", "Compute"],
    ["Logs"],
    ["Confirmed or failed"],
  ],
  program: [
    ["Your app", "RPC + wallet"],
    ["No program on chain"],
    ["A program", "only if you store shared state"],
  ],
  token2022: [
    ["Mint"],
    ["Metadata pointer"],
    ["Group member"],
    ["Not a plain SPL balance"],
  ],
  landed: [
    ["Status: success"],
    ["Wrong account or low compute"],
    ["The thing you wanted did not happen"],
  ],
  listing: [
    ["Signed APK"],
    ["What's New"],
    ["Icon", "Screenshots"],
  ],
};

export const EXTRA_GUIDE_PANELS: Record<string, readonly GuidePanel[]> = {
  "07": [
    {
      title: "Three different secrets",
      blocks: [
        { kind: "diagram", diagram: "wallet" },
        { kind: "text", text: "A wallet is the app that holds keys and asks you to approve. On a Seeker that app is Seed Vault. Ship to Seeker never asks you to type a seed phrase." },
      ],
    },
    {
      title: "Seed phrase",
      blocks: [
        { kind: "text", text: "The seed phrase is a list of words. It can recreate every key in that wallet. Anyone who has the words owns the assets. Do not paste it into a chat, a guide, or the Explainer." },
      ],
    },
    {
      title: "Private key",
      blocks: [
        { kind: "text", text: "The private key is what signs. The public key is the address people can see. Signing proves the private key, without sending the key itself." },
      ],
    },
    {
      title: "What the app is allowed to see",
      blocks: [
        { kind: "text", text: "Mobile Wallet Adapter sends the public key back after you approve. That is the whole secret boundary." },
        { kind: "code", code: "const account = await authorizeSession(wallet);\naccount.publicKey.toBase58();" },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You can say which of the three never belongs in your app. Connect on Diagnostics and the screen shows an address, not a seed phrase." },
      ],
    },
  ],
  "08": [
    {
      title: "Three kinds of asset",
      blocks: [
        { kind: "diagram", diagram: "assets" },
        { kind: "text", text: "SOL pays fees and is the native coin. A token is a separate mint with its own balance. An NFT is a mint with a supply of one. They do not share an account." },
      ],
    },
    {
      title: "SKR is the token",
      blocks: [
        { kind: "text", text: "SKR is a normal SPL token on mainnet, 6 decimals. Holding any amount unlocks the extra guides in this app. It is not the phone, and it is not proof that you own a Seeker." },
        { kind: "code", code: "const SKR_MINT = \"SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3\";" },
      ],
    },
    {
      title: "The Genesis Token is the NFT",
      blocks: [
        { kind: "text", text: "The Seeker Genesis Token is minted once per device into the Seed Vault primary account. It uses Token-2022. A wallet can hold SKR and have no Genesis Token, or the other way around." },
      ],
    },
    {
      title: "Do not treat them as one check",
      blocks: [
        { kind: "text", text: "Diagnostics reads the Genesis Token on mainnet. The SKR gate is a different mainnet read. A red or grey result on one says nothing about the other." },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You can point at SKR and say \"token\", and at the Genesis Token and say \"NFT\". You do not use one mint address for both." },
      ],
    },
  ],
  "09": [
    {
      title: "Start from the signature",
      blocks: [
        { kind: "diagram", diagram: "transaction" },
        { kind: "text", text: "A signature is the id of one transaction. Diagnostics prints it after a devnet send. Open it on explorer.solana.com and set the cluster to devnet, the same cluster you sent on." },
      ],
    },
    {
      title: "What the numbers mean",
      blocks: [
        { kind: "text", text: "• Fee is lamports. 1 SOL is 1,000,000,000 lamports. A few thousand lamports is a normal fee.\n• Compute units are the work budget. \"Used\" is what the transaction spent. \"Requested\" is the cap.\n• Slot is the place in the chain where it landed.\n• Confirmed is enough to trust a devnet test. Finalized is the later, harder commitment." },
        { kind: "code", code: "const LAMPORTS_PER_SOL = 1_000_000_000;\nconst feeSol = feeLamports / LAMPORTS_PER_SOL;" },
      ],
    },
    {
      title: "Read the logs",
      blocks: [
        { kind: "text", text: "Logs are the lines each program printed. \"Program X success\" means that instruction finished. \"Program X failed\" is the line to read. The Explainer tab can take the same signature and do this fetch for you." },
      ],
    },
    {
      title: "Five ways it fails",
      blocks: [
        { kind: "text", text: "• Blockhash expired: it was not landed before the blockhash went stale. The explorer has no success row, or the app said block height exceeded even though a later check found it.\n• Insufficient funds: the fee payer could not pay. The error mentions insufficient lamports.\n• Program error: status is failed and a log names the program. Custom error 1 on SPL Token is insufficient token balance.\n• Simulation failed: the wallet or RPC rejected it before send. There is no signature to open.\n• Dropped: you have a signature, and after the blockhash window neither status nor the transaction exists." },
      ],
    },
    {
      title: "Fetch it yourself",
      blocks: [
        { kind: "code", code: "const tx = await connection.getTransaction(signature, {\n  commitment: \"confirmed\",\n  maxSupportedTransactionVersion: 0,\n});\nconst failed = tx?.meta?.err != null;" },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "Take a signature from Diagnostics. You can name the fee, whether it failed, and which of the five failure types it was. If it succeeded, say so from the status, not from the fee being small." },
      ],
    },
  ],
  "10": [
    {
      title: "This app has no program",
      blocks: [
        { kind: "diagram", diagram: "program" },
        { kind: "text", text: "Ship to Seeker does not deploy an Anchor program. The checks are RPC reads and a wallet signature. That is a complete app." },
      ],
    },
    {
      title: "What stays in the client",
      blocks: [
        { kind: "text", text: "Reading an account, reading a token balance, asking the wallet to sign a transfer, and showing the result. The chain already has the programs for those (System, Token, Token-2022)." },
        { kind: "code", code: "await connection.getBalance(owner);" },
      ],
    },
    {
      title: "When you need your own program",
      blocks: [
        { kind: "text", text: "You need one when many people must share state that is not a normal token balance: a game account, a claim record, a rule the client must not be able to skip. A client check can be bypassed." },
      ],
    },
    {
      title: "Do not block shipping on it",
      blocks: [
        { kind: "text", text: "A Seeker dApp can ship with wallet connect, a devnet transfer, and a mainnet token read. Add a program when the product needs shared state, not because a tutorial said every app has one." },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You can name one thing in this app that is only a client read, and one product idea that would need your own program." },
      ],
    },
  ],
  "11": [
    {
      title: "A normal balance check misses it",
      blocks: [
        { kind: "diagram", diagram: "token2022" },
        { kind: "text", text: "The Genesis Token is Token-2022, not the older SPL token program. getParsedTokenAccountsByOwner on the classic token program returns nothing for it, even when the wallet holds one." },
      ],
    },
    {
      title: "Two extensions that identify it",
      blocks: [
        { kind: "text", text: "Each Genesis Token mint points its metadata at one shared address, and its group member at that same address. Both must match. One without the other is not the Genesis Token." },
        { kind: "code", code: "const SGT_GROUP = \"GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te\";\nconst isSgt =\n  metadataAddress === SGT_GROUP && group === SGT_GROUP;" },
      ],
    },
    {
      title: "Skip empty accounts",
      blocks: [
        { kind: "text", text: "Moving the token leaves the old token account open with a balance of 0. Only a non-zero balance counts as holding it now." },
      ],
    },
    {
      title: "Where this app does it",
      blocks: [
        { kind: "text", text: "Diagnostics runs this read on mainnet for the connected wallet. A grey \"not on this wallet\" result means that wallet does not hold one. It does not mean the check crashed." },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You can say why filtering the classic SPL program misses a Genesis Token, and which two extension fields have to match." },
      ],
    },
  ],
  "12": [
    {
      title: "Success is only the status",
      blocks: [
        { kind: "diagram", diagram: "landed" },
        { kind: "text", text: "meta.err == null means every instruction completed. It does not mean the user's goal happened. You still have to read the accounts that changed." },
      ],
    },
    {
      title: "Compute ran out",
      blocks: [
        { kind: "text", text: "If the budget is too small, the transaction fails and the log says it exceeded the compute units. If you set a budget and never look at units consumed, you will not know you are close to that edge." },
        { kind: "code", code: "const used = tx.meta?.computeUnitsConsumed;" },
      ],
    },
    {
      title: "Wrong account",
      blocks: [
        { kind: "text", text: "A transfer can succeed into a token account you were not watching. The signature is green. The wallet you checked still shows the old balance. Match the mint and the owner in the post-token balances, not just the status." },
      ],
    },
    {
      title: "What to compare",
      blocks: [
        { kind: "text", text: "preBalances and postBalances show lamports. Post-token balances show token amounts. If both are unchanged for the account you care about, the success was for a different account." },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "Given a successful signature, you can say whether the account you care about actually changed. Status alone is not the answer." },
      ],
    },
  ],
  "13": [
    {
      title: "What the form asks for",
      blocks: [
        { kind: "diagram", diagram: "listing" },
        { kind: "text", text: "The publisher portal at publish.solanamobile.com takes a signed release APK, not a debug build from your laptop. Version name and version code must go up for each upload." },
      ],
    },
    {
      title: "What's New",
      blocks: [
        { kind: "text", text: "Write what this version does. Replace the placeholder bullets about \"performance\" and \"UI updates\" if you did not do that work." },
      ],
    },
    {
      title: "Icon and screenshots",
      blocks: [
        { kind: "text", text: "Use a real screen from the installed app. A drawn mock of a progress count reads as unfinished. The portal also asks for an icon." },
        { kind: "code", code: "https://publish.solanamobile.com/" },
      ],
    },
    {
      title: "Review is a separate queue",
      blocks: [
        { kind: "text", text: "After you submit, the release shows In Review. That is not the same as the CLOCK IN form. Docs say review mail usually arrives in 3–5 business days. Do not write that the listing is approved until that mail says so." },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You can name the four assets: signed APK, What's New, icon, screenshots. You know which file is the release APK." },
      ],
    },
  ],
};
