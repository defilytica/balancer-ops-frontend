export const ChildGaugeFactory = [{
    "inputs": [{
        "internalType": "contract IChildChainGauge",
        "name": "gaugeImplementation",
        "type": "address"
    }, {"internalType": "string", "name": "factoryVersion", "type": "string"}, {
        "internalType": "string",
        "name": "productVersion",
        "type": "string"
    }], "stateMutability": "nonpayable", "type": "constructor"
}, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "gauge", "type": "address"}],
    "name": "GaugeCreated",
    "type": "event"
}, {
    "inputs": [{"internalType": "address", "name": "pool", "type": "address"}],
    "name": "create",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [],
    "name": "getGaugeImplementation",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "getProductVersion",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "gauge", "type": "address"}],
    "name": "isGaugeFromFactory",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "version",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
}]
