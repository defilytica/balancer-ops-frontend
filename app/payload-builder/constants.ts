// lib/constants.ts
import { FaDollarSign, FaTachometerAlt, FaSkull, FaGift } from 'react-icons/fa';

export const NAVIGATION = [
    {
        href: '/payload-builder/create-payment',
        key: 'create-payment',
        label: 'Create Payment',
        description: 'Build a token payment payload from a set whitelisted tokens and DAO wallets.',
        icon: FaDollarSign
    },
    {
        href: '/payload-builder/enable-gauge',
        key: 'enable-gauge',
        label: 'Enable Gauge',
        description: 'Set up a payload to enable a gauge in the Balancer gauge system.',
        icon: FaTachometerAlt },
    {
        href: '/payload-builder/kill-gauge',
        key: 'kill-gauge',
        label: 'Remove gauge',
        description: 'Set up a payload to remove a gauge from the Balancer gauge system',
        icon: FaSkull },
    {
        href: '/payload-builder/add-reward-to-gauge',
        key: 'add-reward-to-gauge',
        label: 'Add Secondary Reward Tokens to Gauge',
        description: 'Add secondary rewards to a Balancer staking gauge.',
        icon: FaGift },
];
