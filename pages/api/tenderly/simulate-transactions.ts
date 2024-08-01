import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

const TENDERLY_API_URL = 'https://api.tenderly.co/api/v1/account/defilytica/project/balancer-ops/simulate';
const TENDERLY_ACCESS_TOKEN = process.env.TENDERLY_KEY; // Replace this with your actual token

interface Transaction {
    to: string;
    value: string;
    data: string | null;
    contractMethod: {
        inputs: { internalType: string; name: string; type: string }[];
        name: string;
        payable: boolean;
    };
    contractInputsValues: Record<string, string>;
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

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const batchFile: BatchFile = req.body;

        // Convert the batch file to Tenderly simulation payload
        const simulationPayload = {
            network_id: batchFile.chainId,
            from: batchFile.meta.createdFromSafeAddress,
            to: batchFile.transactions[0].to,
            input: batchFile.transactions[0].data || '0x',
            value: batchFile.transactions[0].value,
            // You might want to add these fields if needed:
            // gas: 8000000,
            // gas_price: 0,
            simulation_type: 'quick',
        };

        const response = await axios.post(
            TENDERLY_API_URL,
            simulationPayload,
            {
                headers: {
                    'X-Access-Key': TENDERLY_ACCESS_TOKEN as string,
                    'Content-Type': 'application/json',
                },
            }
        );

        return res.status(200).json(response.data);
    } catch (error) {
        console.error('Simulation failed:', error);

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            return res.status(axiosError.response?.status || 500).json({
                message: 'Simulation failed',
                error: axiosError.response?.data || axiosError.message
            });
        } else {
            return res.status(500).json({
                message: 'Simulation failed',
                error: 'An unexpected error occurred'
            });
        }
    }
}
