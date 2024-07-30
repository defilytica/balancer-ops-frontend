import {WHITELISTED_PAYMENT_TOKENS} from "@/app/payload-builder/constants";

export interface EnableGaugeInput {
    gauge: string;
    gaugeType: string;
}

export const handleDownloadClick = (generatedPayload: any) => {
    const payloadString = JSON.stringify(JSON.parse(generatedPayload), null, 2);
    const blob = new Blob([payloadString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "BIP-XXX.json";
    link.click();
    URL.revokeObjectURL(link.href);
};

export const copyJsonToClipboard = (generatedPayload: any, toast: any) => {
    const payloadString = JSON.stringify(JSON.parse(generatedPayload), null, 2);
    navigator.clipboard.writeText(payloadString).then(() => {
        toast({
            title: "Copied to clipboard!",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    }).catch(err => {
        toast({
            title: "Could not copy text",
            description: err.message,
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        console.error('Could not copy text: ', err);
    });
};

export const copyTextToClipboard = (text: string, toast: any) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({
            title: "Copied to clipboard!",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    }).catch(err => {
        toast({
            title: "Could not copy text",
            description: err.message,
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        console.error('Could not copy text: ', err);
    });
};


export function generateEnableGaugePayload(inputs: EnableGaugeInput[]) {
    const transactions = inputs.map(input => ({
        to: "0x5DbAd78818D4c8958EfF2d5b95b28385A22113Cd",
        value: "0",
        data: null,
        contractMethod: {
            inputs: [
                { name: "gauge", type: "address", internalType: "address" },
                { name: "gaugeType", type: "string", internalType: "string" }
            ],
            name: "addGauge",
            payable: false
        },
        contractInputsValues: {
            gauge: input.gauge,
            gaugeType: input.gaugeType
        }
    }));

    return {
        version: "1.0",
        chainId: "1",
        createdAt: Date.now(),
        meta: {
            name: "Transactions Batch",
            description: "Add new gauges",
            txBuilderVersion: "1.16.3",
            createdFromSafeAddress: "0xc38c5f97B34E175FFd35407fc91a937300E33860",
            createdFromOwnerAddress: "",
            checksum: ""  // This would be a computed checksum, for now left as an empty string.
        },
        transactions
    };
}

export interface KillGaugeInput {
    target: string;
}

export function generateKillGaugePayload(targets: KillGaugeInput[]) {
    const transactions = targets.map(target => ({
        to: "0xf5dECDB1f3d1ee384908Fbe16D2F0348AE43a9eA",
        value: "0",
        data: null,
        contractMethod: {
            inputs: [
                { name: "target", type: "address", internalType: "address" },
                { name: "data", type: "bytes", internalType: "bytes" }
            ],
            name: "performAction",
            payable: true
        },
        contractInputsValues: {
            target: target.target,
            data: "0xab8f0945"
        }
    }));

    return {
        version: "1.0",
        chainId: "1",
        createdAt: Date.now(),
        meta: {
            name: "Transactions Batch",
            description: "Kill obsolete gauges",
            txBuilderVersion: "1.16.3",
            createdFromSafeAddress: "0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f",
            createdFromOwnerAddress: "",
            checksum: ""
        },
        transactions
    };
}

export interface PaymentInput {
    to: string;
    value: number;
    token: string;
}

interface SafeInfo {
    address: string;
    network: string;
}

export function generateTokenPaymentPayload(inputs: PaymentInput[], safeInfo: SafeInfo) {
    const transactions = inputs.map(input => {
        const tokenInfo = WHITELISTED_PAYMENT_TOKENS[safeInfo.network].find(t => t.address === input.token);
        if (!tokenInfo) {
            throw new Error(`Token ${input.token} not found for network ${safeInfo.network}`);
        }

        const value = BigInt(input.value) * BigInt(10 ** tokenInfo.decimals);

        return {
            to: tokenInfo.address,
            value: "0",
            data: null,
            contractMethod: {
                inputs: [
                    { internalType: "address", name: "to", type: "address" },
                    { internalType: "uint256", name: "value", type: "uint256" }
                ],
                name: "transfer",
                payable: false
            },
            contractInputsValues: {
                to: input.to,
                value: value.toString()
            }
        };
    });

    return {
        version: "1.0",
        chainId: "1",
        createdAt: Date.now(),
        meta: {
            name: "Transactions Batch",
            description: "Fund grants for Q4 2023",
            txBuilderVersion: "1.13.3",
            createdFromSafeAddress: safeInfo.address,
            createdFromOwnerAddress: "",
            checksum: ""
        },
        transactions
    };
}

export function generateHumanReadableForEnableGauge(inputs: EnableGaugeInput[]): string {
    const gaugesList = inputs.map(input => `gauge(address):${input.gauge}\ngaugeType(string): ${input.gaugeType}`).join("\n");

    return `The Balancer Maxi LM Multisig eth:0xc38c5f97B34E175FFd35407fc91a937300E33860 will interact with the GaugeAdderv4 at 0x5DbAd78818D4c8958EfF2d5b95b28385A22113Cd and call the addGauge function with the following arguments:\n${gaugesList}`;
}

export function generateHumanReadableTokenTransfer(payment: PaymentInput, safeInfo: SafeInfo) {
    const tokenInfo = WHITELISTED_PAYMENT_TOKENS[safeInfo.network].find(t => t.address === payment.token);
    if (!tokenInfo) {
        throw new Error(`Token ${payment.token} not found for network ${safeInfo.network}`);
    }

    const value = payment.value * (10 ** tokenInfo.decimals);

    return `The multisig ${safeInfo.address} will interact with ${tokenInfo.symbol} at ${tokenInfo.address} by writing transfer, passing ${payment.to} as recipient and the amount ${payment.value} as ${value}.`;
}

export interface CCTPBridgeInput {
    value: number;
    destinationDomain: string;
    mintRecipient: string;
}

export function generateCCTPBridgePayload(inputs: CCTPBridgeInput[]) {
    const burnToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const USDCMessenger = "0xBd3fa81B58Ba92a82136038B25aDec7066af3155";

    const transactions = inputs.map(input => {
        return [
            {
                to: burnToken,
                value: "0",
                data: null,
                contractMethod: {
                    inputs: [
                        { name: "spender", type: "address", internalType: "address" },
                        { name: "value", type: "uint256", internalType: "uint256" }
                    ],
                    name: "approve",
                    payable: false
                },
                contractInputsValues: {
                    spender: USDCMessenger,
                    value: (input.value * (10 ** 6)).toString() // Assuming the token has 6 decimals
                }
            },
            {
                to: USDCMessenger,
                value: "0",
                data: null,
                contractMethod: {
                    inputs: [
                        { name: "amount", type: "uint256", internalType: "uint256" },
                        { name: "destinationDomain", type: "uint32", internalType: "uint32" },
                        { name: "mintRecipient", type: "bytes32", internalType: "bytes32" },
                        { name: "burnToken", type: "address", internalType: "address" }
                    ],
                    name: "depositForBurn",
                    payable: false
                },
                contractInputsValues: {
                    amount: (input.value * (10 ** 6)).toString(), // Assuming the token has 6 decimals
                    destinationDomain: input.destinationDomain.toString(),
                    mintRecipient: `0x000000000000000000000000${input.mintRecipient.slice(2)}`,
                    burnToken: burnToken
                }
            }
        ];
    }).flat();

    return {
        version: "1.0",
        chainId: "1",
        createdAt: Date.now(),
        meta: {
            name: "Transactions Batch",
            description: "",
            txBuilderVersion: "1.16.5",
            createdFromSafeAddress: "0xc38c5f97B34E175FFd35407fc91a937300E33860",
            createdFromOwnerAddress: "",
            checksum: "0x301f5a7132d04fe310a2eaaac8a7303393ed01c2ca5fbbca2c2a09b1de2755f4"
        },
        transactions
    };
}

export function generateHumanReadableCCTPBridge(inputs: CCTPBridgeInput[]): string {
    const burnToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const USDCMessenger = "0xBd3fa81B58Ba92a82136038B25aDec7066af3155";

    const readableInputs = inputs.map(input => {
        const value = (input.value * (10 ** 6)).toString(); // Assuming the token has 6 decimals
        return `Approve ${USDCMessenger} to spend ${value} USDC\nthen calling depositForBurn passsing ${value} for the amount of USDC with destination domain ${input.destinationDomain} and mint recipient ${input.mintRecipient}. Destination domains can be confirmed here: https://developers.circle.com/stablecoins/docs/supported-domains`;
    }).join("\n\n");

    return `The Maxi Multisig 0xc38c5f97B34E175FFd35407fc91a937300E33860 will interact with the CCTP Bridge as follows:\n${readableInputs}`;
}

export interface AddRewardInput {
    targetGauge: string;
    rewardToken: string;
    distributorAddress: string;
    safeAddress: string;
    authorizerAdaptorEntrypoint: string;
    chainId: string;
}

export function generateAddRewardPayload(inputs: AddRewardInput[]) {
    const transactions = inputs.map(input => ({
        to: input.authorizerAdaptorEntrypoint,
        value: "0",
        data: null,
        contractMethod: {
            inputs: [
                { internalType: "address", name: "target", type: "address" },
                { internalType: "bytes", name: "data", type: "bytes" },
            ],
            name: "performAction",
            payable: true,
        },
        contractInputsValues: {
            target: input.targetGauge,
            data: `0xe8de0d4d000000000000000000000000${input.rewardToken.slice(2)}000000000000000000000000${input.distributorAddress.slice(2)}`,
        },
    }));

    return {
        version: "1.0",
        chainId:  inputs.length > 0 ? inputs[0].chainId : "",
        createdAt: Date.now(),
        meta: {
            name: "Transactions Batch",
            description: "",
            txBuilderVersion: "1.16.5",
            createdFromSafeAddress: inputs.length > 0 ? inputs[0].safeAddress : "",
            createdFromOwnerAddress: "",
            checksum: "0x90f4c82078ec24e1c5389807a2084a2e7a3c9904d86f418ef33e7b6a67722ee5",
        },
        transactions: [ ...transactions ], // Using array notation to handle multiple transactions
    };
}


export function generateHumanReadableAddReward(inputs: AddRewardInput[]): string {
    if (inputs.length === 0) {
        return ''; // Handle case where inputs array is empty
    }

    const readableInputs = inputs.map(input => {
        return `Add Reward:\nTarget (Gauge Address): ${input.targetGauge}\nTo (Authorizer Adaptor Entrypoint): ${input.authorizerAdaptorEntrypoint}\nReward Token: ${input.rewardToken}\nDistributor Address: ${input.distributorAddress}`;
    }).join("\n\n");

    const safeAddress = inputs[0].safeAddress || 'Unknown'; // Default value if safeAddress is undefined

    return `The Maxi Multisig ${safeAddress} will interact with the following gauges:\n${readableInputs}`;
}

export function transformToHumanReadable(input: string): string {
    // Dictionary of special cases
    const specialCases: { [key: string]: string } = {
        'lm': 'LM',
        'dao': 'DAO',
        // Add more special cases here as needed
    };

    // Check if the input is a special case
    if (input.toLowerCase() in specialCases) {
        return specialCases[input.toLowerCase()];
    }

    // General transformation for other cases
    return input
        .split(/[-_]+/) // Split by hyphens or underscores
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
