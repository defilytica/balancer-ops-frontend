import { FaDollarSign, FaTachometerAlt, FaSkull, FaGift } from "react-icons/fa";
import { FaBridgeCircleCheck } from "react-icons/fa6";
import MainnetLogo from "@/public/imgs/mainnet.svg";
import PolygonLogo from "@/public/imgs/polygon.svg";
import OptimismLogo from "@/public/imgs/optimism.svg";
import AvalancheLogo from "@/public/imgs/avalancheLogo.svg";
import ArbitrumLogo from "@/public/imgs/arbitrum.svg";
import GnosisLogo from "@/public/imgs/gnosis.svg";
import BaseLogo from "@/public/imgs/base.svg";
import zkevmLogo from "@/public/imgs/Polygon-zkEVM.png";
import FraxtalLogo from "@/public/imgs/frax.svg";
import ModeLogo from "@/public/imgs/mode.svg";
import { TbSettingsDollar } from "react-icons/tb";
import { NetworkInfo } from "@/types/types";
import { TokenInfo } from "@/types/interfaces";

export const tokenDecimals: Record<string, number> = {
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 6, // mainnet
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": 6, // polygon
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831": 6, // arbitrum
  "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83": 6, // gnosis
  "0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035": 6, // zkevm
  "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": 6, // avalanche
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 6, // base
  "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": 6, // base USDbC
  "0x0b2c639c533813f4aa9d7837caf62653d097ff85": 6, // OP USDC
};

export const PAYLOAD_OPTIONS = [
  {
    href: "/payload-builder/create-payment",
    key: "create-payment",
    label: "Create DAO Payment Request",
    button_label: "Create Payment",
    description:
      "Build a token payment payload from a set whitelisted tokens and DAO wallets.",
    icon: FaDollarSign,
    repos: ["BalancerMaxis/multisig-ops"],
    branchNamePlaceholder: "feature/create-payment",
    prNamePlaceholder: "Create Payment for Service XYZ",
    prTypePath: "BIPs/YYYY-WXX/",
  },
  {
    href: "/payload-builder/enable-gauge",
    key: "enable-gauge",
    label: "Enable Gauge for BAL Rewards in the veBAL system",
    button_label: "Enable Gauge",
    description:
      "Set up a payload to enable a gauge in the Balancer gauge system.",
    icon: FaTachometerAlt,
    repos: ["BalancerMaxis/multisig-ops"],
    branchNamePlaceholder: "feature/enable-gauge",
    prNamePlaceholder: "Enable Gauge XYZ",
    prTypePath: "BIPs/YYYY-WXX/",
  },
  {
    href: "/payload-builder/kill-gauge",
    key: "kill-gauge",
    label: "Remove Gauge from the veBAL system",
    button_label: "Kill Gauge",
    description:
      "Set up a payload to remove a gauge from the Balancer gauge system",
    icon: FaSkull,
    repos: ["BalancerMaxis/multisig-ops"],
    branchNamePlaceholder: "feature/kill-gauge",
    prNamePlaceholder: "Kill Gauge XYZ",
    prTypePath: "BIPs/YYYY-WXX/",
  },
  {
    href: "/payload-builder/add-reward-to-gauge",
    key: "add-reward-to-gauge",
    label: "Add Secondary Reward Tokens to Gauge",
    button_label: "Add Reward Tokens",
    description: "Add secondary rewards to a Balancer staking gauge.",
    icon: FaGift,
    repos: ["BalancerMaxis/multisig-ops"],
    branchNamePlaceholder: "feature/add-reward-to-gauge",
    prNamePlaceholder: "Add Reward to Gauge XYZ",
    prTypePath: "MaxiOps/add_rewards/[chain]/",
  },
  {
    href: "/payload-builder/set-reward-distributor-to-gauge",
    key: "set-reward-distributor-to-gauge",
    label: "Set Gauge Reward Distributor to a Gauge",
    button_label: "Set Reward Distributor",
    description: "Set a rewards distributor to distribute rewards to a Gauge.",
    icon: FaGift,
    repos: ["BalancerMaxis/multisig-ops"],
    branchNamePlaceholder: "feature/set-reward-distributor-to-gauge",
    prNamePlaceholder: "Set Reward Distributor to Gauge XYZ",
    prTypePath: "MaxiOps/add_rewards/[chain]/",
  },
  {
    href: "/payload-builder/cctp-bridge",
    key: "cctp-bridge",
    label: "Bridge USDC via CCTP",
    button_label: "Create Bridge Tx",
    description:
      "Bridge USDC stable coins between DAO Multisigs with the official CCTP bridge",
    icon: FaBridgeCircleCheck,
    repos: ["BalancerMaxis/multisig-ops"],
    branchNamePlaceholder: "feature/cctp-bridge-setup",
    prNamePlaceholder: "Set Up CCTP Bridge for Network XYZ",
    prTypePath: "MaxiOps/CCTP_Bridge/",
  },
  {
    href: "/payload-builder/fee-setter",
    key: "fee-setter",
    label: "Configure Swap Fees on a Pool",
    button_label: "Configure Swap Fees",
    description:
      "Configure the swap fee setting on a pool that have swap fee settings delegated to the DAO.",
    icon: TbSettingsDollar,
    repos: ["BalancerMaxis/multisig-ops"],
    branchNamePlaceholder: "feature/set-swapfee",
    prNamePlaceholder: "Set Swap Fee on Pool XYZ",
    prTypePath: "MaxiOps/PoolParameterChanges/PoolSwapFeeChanges/",
  },
  {
    href: "/payload-builder/injector-configurator",
    key: "injector-configurator",
    label: "Configure Rewards Injectors",
    button_label: "Configure rewards",
    description:
      "Configure a rewards injector with a new token emission schedule.",
    icon: TbSettingsDollar,
    repos: ["BalancerMaxis/multisig-ops"],
    branchNamePlaceholder: "feature/set-injector",
    prNamePlaceholder: "Program rewards injector XYZ",
    prTypePath: "MaxiOps/injectorScheduling/[chain]/",
  },
];

//TODO: refactor to reference address book
export const NETWORK_OPTIONS = [
  {
    label: "Ethereum",
    apiID: "MAINNET",
    chainId: "1",
    maxiSafe: "0xc38c5f97B34E175FFd35407fc91a937300E33860",
    entrypoint: "0xf5dECDB1f3d1ee384908Fbe16D2F0348AE43a9eA",
  },
  {
    label: "Arbitrum",
    apiID: "ARBITRUM",
    chainId: "42161",
    maxiSafe: "0xc38c5f97B34E175FFd35407fc91a937300E33860",
    entrypoint: "0x97207B095e4D5C9a6e4cfbfcd2C3358E03B90c4A",
  },
  {
    label: "Polygon",
    apiID: "POLYGON",
    chainId: "137",
    maxiSafe: "0xc38c5f97B34E175FFd35407fc91a937300E33860",
    entrypoint: "0xAB093cd16e765b5B23D34030aaFaF026558e0A19",
  },
  {
    label: "Polygon ZKEVM",
    apiID: "ZKEVM",
    chainId: "1101",
    maxiSafe: "0xB59Ab49CA8d064E645Bf2c546d9FE6d1d4147a09",
    entrypoint: "0xb9aD3466cdd42015cc05d4804DC68D562b6a2065",
  },
  {
    label: "Optimism",
    apiID: "OPTIMISM",
    chainId: "10",
    maxiSafe: "0x09Df1626110803C7b3b07085Ef1E053494155089",
    entrypoint: "0xed86ff0c507D3AF5F35d3523B77C17415FCfFaCb",
  },
  {
    label: "Avalanche",
    apiID: "AVALANCHE",
    chainId: "43114",
    maxiSafe: "0x326A7778DB9B741Cb2acA0DE07b9402C7685dAc6",
    entrypoint: "0x4E7bBd911cf1EFa442BC1b2e9Ea01ffE785412EC",
  },
  {
    label: "Base",
    apiID: "BASE",
    chainId: "8453",
    maxiSafe: "0x65226673F3D202E0f897C862590d7e1A992B2048",
    entrypoint: "0x9129E834e15eA19b6069e8f08a8EcFc13686B8dC",
  },
  {
    label: "Gnosis",
    apiID: "GNOSIS",
    chainId: "100",
    maxiSafe: "0x14969B55a675d13a1700F71A37511bc22D90155a",
    entrypoint: "0x8F42aDBbA1B16EaAE3BB5754915E0D06059aDd75",
  },
  {
    label: "Fraxtal",
    apiID: "FRAXTAL",
    chainId: "2522",
    maxiSafe: "0x7BBAc709a9535464690A435ca7361256496f13Ce",
    entrypoint: "0xb9F8AB3ED3F3aCBa64Bc6cd2DcA74B7F38fD7B88",
  },
];

export const networks: Record<string, NetworkInfo> = {
  mainnet: {
    logo: MainnetLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=ethereum&dkey=",
    explorer: "https://etherscan.io/",
    chainId: "1",
  },
  polygon: {
    logo: PolygonLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=polygon&dkey=",
    explorer: "https://polygonscan.com/",
    chainId: "137",
  },
  optimism: {
    logo: OptimismLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=optimism&dkey=",
    explorer: "https://optimistic.etherscan.io/",
    chainId: "10",
  },
  avalanche: {
    logo: AvalancheLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=avalanche&dkey=",
    explorer: "https://snowscan.xyz/",
    chainId: "43114",
  },
  arbitrum: {
    logo: ArbitrumLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=arbitrum&dkey=",
    explorer: "https://arbiscan.io/",
    chainId: "42161",
  },
  gnosis: {
    logo: GnosisLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=gnosis&dkey=",
    explorer: "https://gnosisscan.io/",
    chainId: "100",
  },
  base: {
    logo: BaseLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=base&dkey=",
    explorer: "https://basescan.org/",
    chainId: "8453",
  },
  zkevm: {
    logo: zkevmLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=polygon-zkevm&dkey=",
    explorer: "https://gnosisscan.io/",
    chainId: "1101",
  },
  avalanche_c: {
    logo: AvalancheLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=avalanche&dkey=",
    explorer: "https://snowscan.xyz/",
    chainId: "43114",
  },
  ethereum: {
    logo: MainnetLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=ethereum&dkey=",
    explorer: "https://polygonscan.com/",
    chainId: "1",
  },
  fraxtal: {
    logo: FraxtalLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=fraxtal&dkey=",
    explorer: "https://fraxscan.io/",
    chainId: "252",
  },
  mode: {
    logo: ModeLogo.src,
    rpc: "https://lb.drpc.org/ogrpc?network=mode&dkey=",
    explorer: "https://explorer.mode.network/",
    chainId: "34443",
  },
};

export const WHITELISTED_PAYMENT_TOKENS: { [network: string]: TokenInfo[] } = {
  mainnet: [
    {
      symbol: "USDC",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
    },
    {
      symbol: "BAL",
      address: "0xba100000625a3754423978a60c9317c58a424e3D",
      decimals: 18,
    },
    {
      symbol: "WETH",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      decimals: 18,
    },
    // Add more mainnet tokens as needed
  ],
  arbitrum: [
    {
      symbol: "USDC",
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      decimals: 6,
    },
    {
      symbol: "BAL",
      address: "0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8",
      decimals: 18,
    },
    {
      symbol: "ARB",
      address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      decimals: 18,
    },
    // Add more Goerli tokens as needed
  ],
  avalanche: [
    {
      symbol: "USDC",
      address: "0x099D7767eC64Ac33C076f1e3Eb3DC24D08FA86A5",
      decimals: 6,
    },
    {
      symbol: "BAL",
      address: "0xe15bcb9e0ea69e6ab9fa080c4c4a5632896298c3",
      decimals: 18,
    },
    {
      symbol: "WAVAX",
      address: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
      decimals: 18,
    },
    // Add more Goerli tokens as needed
  ],
  polygon: [
    {
      symbol: "USDC",
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      decimals: 6,
    },
    {
      symbol: "BAL",
      address: "0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3",
      decimals: 18,
    },
    {
      symbol: "WMATIC",
      address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      decimals: 18,
    },
    // Add more Goerli tokens as needed
  ],
};
