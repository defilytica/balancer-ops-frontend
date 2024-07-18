// lib/constants.ts
import { FaDollarSign, FaTachometerAlt, FaSkull, FaGift } from 'react-icons/fa';
import { FaBridgeCircleCheck } from "react-icons/fa6";

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

];
