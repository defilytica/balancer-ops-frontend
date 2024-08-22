import { FaDollarSign, FaTachometerAlt, FaSkull, FaGift } from 'react-icons/fa';
import { FaBridgeCircleCheck } from "react-icons/fa6";
import MainnetLogo from "@/public/imgs/mainnet.svg";
import PolygonLogo from "@/public/imgs/polygon.svg";
import OptimismLogo from "@/public/imgs/optimism.svg";
import AvalancheLogo from "@/public/imgs/avalancheLogo.svg";
import ArbitrumLogo from "@/public/imgs/arbitrum.svg";
import GnosisLogo from "@/public/imgs/gnosis.svg";
import BaseLogo from "@/public/imgs/base.svg";
import zkevmLogo from "@/public/imgs/Polygon-zkEVM.png";
import {NetworkInfo} from "@/types/types";

export const PAYLOAD_OPTIONS = [
    {
        href: '/payload-builder/create-payment',
        key: 'create-payment',
        label: 'Create DAO Payment Request',
        button_label: 'Create Payment',
        description: 'Build a token payment payload from a set whitelisted tokens and DAO wallets.',
        icon: FaDollarSign
    },
    {
        href: '/payload-builder/enable-gauge',
        key: 'enable-gauge',
        label: 'Enable Gauge for BAL Rewards in the veBAL system',
        button_label: 'Enable Gauge',
        description: 'Set up a payload to enable a gauge in the Balancer gauge system.',
        icon: FaTachometerAlt
    },
    {
        href: '/payload-builder/kill-gauge',
        key: 'kill-gauge',
        label: 'Remove Gauge from the veBAL system',
        button_label: 'Kill Gauge',
        description: 'Set up a payload to remove a gauge from the Balancer gauge system',
        icon: FaSkull
    },
    {
        href: '/payload-builder/add-reward-to-gauge',
        key: 'add-reward-to-gauge',
        label: 'Add Secondary Reward Tokens to Gauge',
        button_label: 'Add Reward Tokens',
        description: 'Add secondary rewards to a Balancer staking gauge.',
        icon: FaGift
    },
    {
        href: '/payload-builder/ccip-bridge',
        key: 'ccip-bridge',
        label: 'Bridge USDC via CCIP',
        button_label: 'Create Bridge Tx',
        description: 'Bridge USDC stable coins between DAO Multisigs with the official CCIP bridge',
        icon: FaBridgeCircleCheck
    },
];

export const REPO_OPTIONS = ['defilytica/multisig-ops-mock', 'defilytica/multisig-ops-mock2']

export const PAYLOAD_TYPES = {
    "add-reward-to-gauge": {
        "branchNamePlaceholder": "feature/add-reward-to-gauge",
        "prNamePlaceholder": "Add Reward to Gauge XYZ"
    },
    "ccip-bridge": {
        "branchNamePlaceholder": "feature/ccip-bridge-setup",
        "prNamePlaceholder": "Set Up CCIP Bridge for Network XYZ"
    },
    "create-payment": {
        "branchNamePlaceholder": "feature/create-payment",
        "prNamePlaceholder": "Create Payment for Service XYZ"
    },
    "kill-gauge": {
        "branchNamePlaceholder": "feature/kill-gauge",
        "prNamePlaceholder": "Kill Gauge XYZ"
    },
    "enable-gauge": {
        "branchNamePlaceholder": "feature/enable-gauge",
        "prNamePlaceholder": "Enable Gauge XYZ"
    },
};

//TODO: refactor to reference address book
export const NETWORK_OPTIONS = [
    {label: 'Ethereum', chainId: '1', maxiSafe:'0xc38c5f97B34E175FFd35407fc91a937300E33860', entrypoint:'0xf5dECDB1f3d1ee384908Fbe16D2F0348AE43a9eA'},
    {label: 'Arbitrum', chainId: '42161', maxiSafe:'0xc38c5f97B34E175FFd35407fc91a937300E33860', entrypoint:'0x97207B095e4D5C9a6e4cfbfcd2C3358E03B90c4A'},
    {label: 'Polygon', chainId: '137', maxiSafe:'0xc38c5f97B34E175FFd35407fc91a937300E33860', entrypoint:'0xAB093cd16e765b5B23D34030aaFaF026558e0A19'},
    {label: 'Polygon ZKEVM', chainId: '1101', maxiSafe:'0xB59Ab49CA8d064E645Bf2c546d9FE6d1d4147a09', entrypoint:'0xb9aD3466cdd42015cc05d4804DC68D562b6a2065'},
    {label: 'Optimism', chainId: '10', maxiSafe:'0x09Df1626110803C7b3b07085Ef1E053494155089', entrypoint:'0xed86ff0c507D3AF5F35d3523B77C17415FCfFaCb'},
    {label: 'Avalanche', chainId: '43114', maxiSafe:'0x326A7778DB9B741Cb2acA0DE07b9402C7685dAc6', entrypoint:'0x4E7bBd911cf1EFa442BC1b2e9Ea01ffE785412EC'},
    {label: 'Base', chainId: '8453', maxiSafe:'0x65226673F3D202E0f897C862590d7e1A992B2048', entrypoint:'0x9129E834e15eA19b6069e8f08a8EcFc13686B8dC'},
    {label: 'Gnosis', chainId: '100', maxiSafe:'0x14969B55a675d13a1700F71A37511bc22D90155a', entrypoint:'0x8F42aDBbA1B16EaAE3BB5754915E0D06059aDd75'},
    {label: 'Fraxtal', chainId: '2522', maxiSafe:'0x7BBAc709a9535464690A435ca7361256496f13Ce', entrypoint:'0xb9F8AB3ED3F3aCBa64Bc6cd2DcA74B7F38fD7B88'},
];

export const networks: Record<string, NetworkInfo> = {
    mainnet: {logo: MainnetLogo.src, rpc: "https://eth.drpc.org"},
    ethereum: {logo: MainnetLogo.src, rpc: "https://eth.drpc.org"},
    polygon: {logo: PolygonLogo.src, rpc: "https://1rpc.io/matic"},
    optimism: {logo: OptimismLogo.src, rpc: "https://mainnet.optimism.io"},
    avalanche: {logo: AvalancheLogo.src, rpc: "https://avalanche.public-rpc.com"},
    avalanche_c: {logo: AvalancheLogo.src, rpc: "https://avalanche.public-rpc.com"},
    arbitrum: {logo: ArbitrumLogo.src, rpc: "https://arb1.arbitrum.io/rpc"},
    gnosis: {logo: GnosisLogo.src, rpc: "https://rpc.gnosischain.com"},
    base: {logo: BaseLogo.src, rpc: "https://mainnet.base.org"},
    zkevm: {logo: zkevmLogo.src, rpc: "https://zkevm-rpc.com"}
}


// tokenConstants.ts

export interface TokenInfo {
    symbol: string;
    address: string;
    decimals: number;
}

export const WHITELISTED_PAYMENT_TOKENS: { [network: string]: TokenInfo[] } = {
    mainnet: [
        { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
        { symbol: 'BAL', address: '0xba100000625a3754423978a60c9317c58a424e3D', decimals: 18 },
        { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
        // Add more mainnet tokens as needed
    ],
    arbitrum: [
        { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
        { symbol: 'BAL', address: '0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8', decimals: 18 },
        { symbol: 'ARB', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
        // Add more Goerli tokens as needed
    ],
    avalanche: [
        { symbol: 'USDC', address: '0x099D7767eC64Ac33C076f1e3Eb3DC24D08FA86A5', decimals: 6 },
        { symbol: 'BAL', address: '0xe15bcb9e0ea69e6ab9fa080c4c4a5632896298c3', decimals: 18 },
        { symbol: 'WAVAX', address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', decimals: 18 },
        // Add more Goerli tokens as needed
    ],
    polygon: [
        { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
        { symbol: 'BAL', address: '0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3', decimals: 18 },
        { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
        // Add more Goerli tokens as needed
    ],
};
