import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ethers } from 'ethers';
import IGnosisSafeABI from '@/lib/modules/web3/contracts/abis/IGnosisSafe.json';

const TENDERLY_API_URL = 'https://api.tenderly.co/api/v1/account/defilytica/project/balancer-ops/simulate';
const TENDERLY_ACCESS_KEY = process.env.TENDERLY_KEY;

const MULTISEND_ADDRESS = '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

interface Transaction {
    to: string;
    value: string;
    data: string | null;
    operation?: number;
    contractMethod?: {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        payable: boolean;
    };
    contractInputsValues?: {
        [key: string]: string;
    };
}

interface BatchFile {
    version: string;
    chainId: string;
    createdAt: number;
    meta: {
        name: string;
        description: string;
        txBuilderVersion: string;
        createdFromSafeAddress: string;
        createdFromOwnerAddress: string;
        checksum: string;
    };
    transactions: Transaction[];
}

async function getSafeOwners(safeAddress: string, provider: ethers.Provider): Promise<string[]> {
    const safeContract = new ethers.Contract(safeAddress, IGnosisSafeABI, provider);
    return await safeContract.getOwners();
}

function encodeMultiSendData(transactions: Transaction[]): string {
    const encodedTransactions = transactions.map((tx, index) => {
        let data = tx.data;

        // If data is null but we have contractMethod and contractInputsValues, encode them
        if (data === null && tx.contractMethod && tx.contractInputsValues) {
            const functionFragment = {
                type: 'function',
                name: tx.contractMethod.name,
                inputs: tx.contractMethod.inputs,
                outputs: [],
                stateMutability: tx.contractMethod.payable ? 'payable' : 'nonpayable'
            };

            const iface = new ethers.Interface([functionFragment]);
            const params = tx.contractMethod.inputs.map(input => tx.contractInputsValues![input.name]);
            data = iface.encodeFunctionData(tx.contractMethod.name, params);
        }

        if (!data) {
            data = '0x';
        }

        const encoded = ethers.concat([
            ethers.toBeHex(tx.operation || 0, 1),  // operation as 1 byte
            ethers.getAddress(tx.to),              // to address, normalized
            ethers.toBeHex(BigInt(tx.value || '0'), 32),  // value as 32 bytes
            ethers.toBeHex(ethers.dataLength(data), 32),  // data length as 32 bytes
            data                                   // data
        ]);

        console.log(`Encoded transaction ${index}:`, encoded);
        return encoded;
    });

    const result = ethers.concat([
        '0x8d80ff0a', // MultiSend function selector
        ethers.AbiCoder.defaultAbiCoder().encode(['bytes'], [ethers.concat(encodedTransactions)])
    ]);
    return result;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {

        // Extract the JSON string from the received object
        const jsonString = Object.keys(req.body)[0];

        // Parse the JSON string to get the actual batchFile
        const batchFile: BatchFile = JSON.parse(jsonString);
        const safeAddress = batchFile.meta.createdFromSafeAddress;
        const networkId = batchFile.chainId;
        // Set up provider
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        // Get Safe owners
        const owners = await getSafeOwners(safeAddress, provider);
        // Create signatures
        const signatures = owners.map(owner => {
            return ethers.concat([
                ethers.zeroPadValue(owner, 32),
                ethers.zeroPadValue('0x', 32),
                '0x01'
            ]);
        }).reduce((acc, cur) => ethers.concat([acc, cur]), '0x');

        // Encode multi-send data
        const multiSendData = encodeMultiSendData(batchFile.transactions);

        // Create Safe contract instance
        const safeContract = new ethers.Contract(safeAddress, IGnosisSafeABI, provider);

        // Encode execTransaction data
        const execTransactionData = safeContract.interface.encodeFunctionData('execTransaction', [
            MULTISEND_ADDRESS,
            0, // value
            multiSendData,
            1, // operation (1 for delegatecall)
            0, // safeTxGas
            0, // baseGas
            0, // gasPrice
            NULL_ADDRESS, // gasToken
            NULL_ADDRESS, // refundReceiver
            signatures
        ]);

        // Build Tenderly simulation payload
        const simulationPayload = {
            network_id: networkId,
            from: owners[0],
            to: safeAddress,
            input: execTransactionData,
            save: true,
            save_if_fails: true,
            simulation_type: 'quick',
            state_objects: {
                [safeAddress]: {
                    storage: {
                        "0x0000000000000000000000000000000000000000000000000000000000000004": "0x0000000000000000000000000000000000000000000000000000000000000001"
                    }
                }
            },
        };

        // Send simulation request to Tenderly
        const simulationResponse = await axios.post(
            TENDERLY_API_URL,
            simulationPayload,
            {
                headers: {
                    'X-Access-Key': TENDERLY_ACCESS_KEY as string,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Make simulation public
        await axios.post(
            `${TENDERLY_API_URL.replace('simulate', '')}simulations/${simulationResponse.data.simulation.id}/share`,
            {},
            {
                headers: {
                    'X-Access-Key': TENDERLY_ACCESS_KEY as string,
                    'Content-Type': 'application/json',
                },
            }
        );

        const simulationUrl = `https://www.tdly.co/shared/simulation/${simulationResponse.data.simulation.id}`;
        const success = simulationResponse.data.simulation.status ? '🟩 SUCCESS' : '🟥 FAILURE';

        return res.status(200).json({ url: simulationUrl, success });
    } catch (error) {
        console.error('Simulation failed:', error);
        return res.status(500).json({
            message: 'Simulation failed',
            error: error instanceof Error ? error.message : String(error)
        });
    }
}
