export const ChildChainGaugeInjectorV2Factory =
  [{
    "inputs": [{ "internalType": "address", "name": "logic", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "constructor",
  }, { "inputs": [], "name": "ERC1167FailedCreateClone", "type": "error" }, {
    "anonymous": false,
    "inputs": [{
      "indexed": true,
      "internalType": "address",
      "name": "injector",
      "type": "address",
    }, {
      "indexed": false,
      "internalType": "address[]",
      "name": "keeperAddresses",
      "type": "address[]",
    }, {
      "indexed": false,
      "internalType": "address",
      "name": "injectTokenAddress",
      "type": "address",
    }, { "indexed": false, "internalType": "address", "name": "owner", "type": "address" }],
    "name": "InjectorCreated",
    "type": "event",
  }, {
    "inputs": [{
      "internalType": "address[]",
      "name": "keeperAddresses",
      "type": "address[]",
    }, { "internalType": "uint256", "name": "minWaitPeriodSeconds", "type": "uint256" }, {
      "internalType": "address",
      "name": "injectTokenAddress",
      "type": "address",
    }, { "internalType": "uint256", "name": "maxInjectionAmount", "type": "uint256" }, {
      "internalType": "address",
      "name": "owner",
      "type": "address",
    }],
    "name": "createInjector",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function",
  }, {
    "inputs": [],
    "name": "getDeployedInjectors",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function",
  }, {
    "inputs": [],
    "name": "implementation",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function",
  }];
