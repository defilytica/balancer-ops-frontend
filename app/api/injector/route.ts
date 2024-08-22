// pages/api/injector-data.js

import {ethers} from "ethers";
import {InjectorABIV1} from "@/abi/InjectorV1";
import {ERC20} from "@/abi/erc20";
import {poolsABI} from "@/abi/pool";
import {gaugeABI} from "@/abi/gauge";
import {NextRequest, NextResponse} from "next/server";
import {networks} from "@/constants/constants";



const tokenDecimals: Record<string, number> = {
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

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const network = searchParams.get('network');
    const token = searchParams.get('token');

    if (!address || !network || !token) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(address, InjectorABIV1, provider);

    try {
        const [watchList, injectorTokenAddress] = await Promise.all([
            contract.getWatchList(),
            contract.getInjectTokenAddress()
        ]);

        const tokenInfo = await fetchTokenInfo(injectorTokenAddress, provider);
        const gauges = await fetchGaugeInfo(watchList, contract, provider, address);

        return NextResponse.json({ tokenInfo, gauges });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: 'An error occurred while fetching data' }, { status: 500 });
    }
}

async function fetchTokenInfo(tokenAddress, provider) {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
    const [name, symbol] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol()
    ]);
    return {name, symbol};
}

async function fetchGaugeInfo(gaugeAddresses, contract, provider, injectorAddress) {
    const gaugeContracts = gaugeAddresses.map(address => new ethers.Contract(address, gaugeABI, provider));

    const gaugeInfoPromises = gaugeAddresses.map(async (address, index) => {
        const [accountInfo, lpToken] = await Promise.all([
            contract.getAccountInfo(address),
            gaugeContracts[index].lp_token()
        ]);

        return {
            gaugeAddress: address,
            accountInfo,
            lpToken
        };
    });

    const gaugeInfos = await Promise.all(gaugeInfoPromises);

    const gauges = await Promise.all(gaugeInfos.map(async (info) => ({
        gaugeAddress: info.gaugeAddress,
        poolName: await fetchPoolName(info.lpToken, provider),
        amountPerPeriod: formatTokenAmount(info.accountInfo.amountPerPeriod, injectorAddress),
        maxPeriods: info.accountInfo.maxPeriods.toString(),
        periodNumber: info.accountInfo.periodNumber.toString(),
        lastInjectionTimeStamp: info.accountInfo.lastInjectionTimeStamp.toString()
    })));

    return gauges;
}

async function fetchPoolName(lpTokenAddress, provider) {
    try {
        const poolContract = new ethers.Contract(lpTokenAddress, poolsABI, provider);
        return await poolContract.name();
    } catch (error) {
        console.error(`Error fetching pool name for address ${lpTokenAddress}:`, error);
        return "Unknown Pool";
    }
}

function formatTokenAmount(amount, tokenAddress) {
    if (amount === null || amount === undefined) return "Loading...";

    const formattedAmount = BigInt(amount.toString());
    const decimals = tokenDecimals[tokenAddress.toLowerCase()] || 18;

    return ethers.formatUnits(formattedAmount, decimals);
}