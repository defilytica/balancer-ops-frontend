// constants/abis/ChildChainGaugeInjectorV2.ts

// This is the minimal ABI with just the functions we need for the rewards injector configurator
export const ChildChainGaugeInjectorV2ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "recipients",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "amountPerPeriod",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "maxPeriods",
        "type": "uint8"
      },
      {
        "internalType": "uint56",
        "name": "doNotStartBeforeTimestamp",
        "type": "uint56"
      }
    ],
    "name": "addRecipients",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "recipients",
        "type": "address[]"
      }
    ],
    "name": "removeRecipients",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
