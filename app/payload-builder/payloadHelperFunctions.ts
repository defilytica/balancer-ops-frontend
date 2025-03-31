import { V3_VAULT_ADDRESS, WHITELISTED_PAYMENT_TOKENS } from "@/constants/constants";
import { BatchFile, Transaction } from "@/components/btns/SimulateTransactionButton";
import { addDays } from "date-fns";
import { ethers, JsonRpcSigner } from "ethers";
import { encodeFunctionData } from "viem";
import { vaultAdminAbi } from "@/abi/VaultAdmin";

export interface EnableGaugeInput {
  gauge: string;
  gaugeType: string;
}

export const handleDownloadClick = (generatedPayload: any) => {
  const payloadString = JSON.stringify(JSON.parse(generatedPayload), null, 2);
  const blob = new Blob([payloadString], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "payload.json";
  link.click();
  URL.revokeObjectURL(link.href);
};

export const copyJsonToClipboard = (generatedPayload: any, toast: any) => {
  const payloadString = JSON.stringify(JSON.parse(generatedPayload), null, 2);
  navigator.clipboard
    .writeText(payloadString)
    .then(() => {
      toast({
        title: "Copied to clipboard!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    })
    .catch(err => {
      toast({
        title: "Could not copy text",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Could not copy text: ", err);
    });
};

export const copyTextToClipboard = (text: string, toast: any) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast({
        title: "Copied to clipboard!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    })
    .catch(err => {
      toast({
        title: "Could not copy text",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Could not copy text: ", err);
    });
};

// --- ENABLE GAUGE
export function generateEnableGaugePayload(inputs: EnableGaugeInput[]) {
  const transactions = inputs.map(input => ({
    to: "0x5DbAd78818D4c8958EfF2d5b95b28385A22113Cd",
    value: "0",
    data: null,
    contractMethod: {
      inputs: [
        { name: "gauge", type: "address", internalType: "address" },
        { name: "gaugeType", type: "string", internalType: "string" },
      ],
      name: "addGauge",
      payable: false,
    },
    contractInputsValues: {
      gauge: input.gauge,
      gaugeType: input.gaugeType,
    },
  }));

  return {
    version: "1.0",
    chainId: "1",
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      createdFromSafeAddress: "0xc38c5f97B34E175FFd35407fc91a937300E33860",
    },
    transactions,
  };
}

export function generateHumanReadableForEnableGauge(inputs: EnableGaugeInput[]): string {
  const gaugesList = inputs
    .map(input => `gauge(address):${input.gauge}\ngaugeType(string): ${input.gaugeType}`)
    .join("\n");

  return `The Balancer Maxi LM Multisig eth:0xc38c5f97B34E175FFd35407fc91a937300E33860 will interact with the GaugeAdderv4 at 0x5DbAd78818D4c8958EfF2d5b95b28385A22113Cd and call the addGauge function with the following arguments:\n${gaugesList}`;
}

// --- KILL GAUGE ---
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
        { name: "data", type: "bytes", internalType: "bytes" },
      ],
      name: "performAction",
      payable: true,
    },
    contractInputsValues: {
      target: target.target,
      data: "0xab8f0945",
    },
  }));

  return {
    version: "1.0",
    chainId: "1",
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      createdFromSafeAddress: "0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f",
    },
    transactions,
  };
}

// --- PAYMENT ---
export interface PaymentInput {
  to: string;
  value: number;
  displayValue: string;
  token: string;
}

interface SafeInfo {
  address: string;
  network: string;
}

type NetworkType = keyof typeof WHITELISTED_PAYMENT_TOKENS;

const safeChainIDs: { [key in NetworkType]: string } = {
  mainnet: "1",
  arbitrum: "42161",
  avalanche: "43114",
  polygon: "137",
};

function convertToTokenValue(amount: number, decimals: number): string {
  // Convert the amount to a string and remove any existing decimal point
  const [integerPart, fractionalPart = ""] = amount.toString().split(".");

  // Pad the fractional part with zeros if needed
  const paddedFractionalPart = fractionalPart.padEnd(decimals, "0");

  // Combine integer and fractional parts
  const fullValue = integerPart + paddedFractionalPart;

  // Remove leading zeros
  return fullValue.replace(/^0+/, "") || "0";
}

export function generateTokenPaymentPayload(inputs: PaymentInput[], safeInfo: SafeInfo) {
  const transactions = inputs.map(input => {
    const tokenInfo = WHITELISTED_PAYMENT_TOKENS[safeInfo.network].find(
      t => t.address === input.token,
    );
    if (!tokenInfo) {
      throw new Error(`Token ${input.token} not found for network ${safeInfo.network}`);
    }

    const value = convertToTokenValue(input.value, tokenInfo.decimals);

    const isWETH = tokenInfo.symbol === "WETH";

    return {
      to: tokenInfo.address,
      value: "0",
      data: null,
      contractMethod: {
        inputs: [
          {
            internalType: "address",
            name: isWETH ? "dst" : "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: isWETH ? "wad" : "value",
            type: "uint256",
          },
        ],
        name: "transfer",
        payable: false,
      },
      contractInputsValues: {
        [isWETH ? "dst" : "to"]: input.to,
        [isWETH ? "wad" : "value"]: value,
      },
    };
  });

  return {
    version: "1.0",
    chainId: safeChainIDs[safeInfo.network as NetworkType] || "1",
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      createdFromSafeAddress: safeInfo.address,
    },
    transactions,
  };
}

export function generateHumanReadableTokenTransfer(payment: PaymentInput, safeInfo: SafeInfo) {
  const tokenInfo = WHITELISTED_PAYMENT_TOKENS[safeInfo.network].find(
    t => t.address === payment.token,
  );
  if (!tokenInfo) {
    throw new Error(`Token ${payment.token} not found for network ${safeInfo.network}`);
  }

  const value = payment.value * 10 ** tokenInfo.decimals;

  return `The multisig ${safeInfo.address} will interact with ${tokenInfo.symbol} at ${tokenInfo.address} by writing transfer, passing ${payment.to} as recipient and the amount ${payment.value} as ${value}.`;
}

// --- CCTP BRIDGE ---
export interface CCTPBridgeInput {
  value: number;
  destinationDomain: string;
  mintRecipient: string;
}

export function generateCCTPBridgePayload(inputs: CCTPBridgeInput[]) {
  const burnToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const USDCMessenger = "0xBd3fa81B58Ba92a82136038B25aDec7066af3155";

  const transactions = inputs
    .map(input => {
      return [
        {
          to: burnToken,
          value: "0",
          data: null,
          contractMethod: {
            inputs: [
              { name: "spender", type: "address", internalType: "address" },
              { name: "value", type: "uint256", internalType: "uint256" },
            ],
            name: "approve",
            payable: false,
          },
          contractInputsValues: {
            spender: USDCMessenger,
            value: (input.value * 10 ** 6).toString(), // Assuming the token has 6 decimals
          },
        },
        {
          to: USDCMessenger,
          value: "0",
          data: null,
          contractMethod: {
            inputs: [
              { name: "amount", type: "uint256", internalType: "uint256" },
              {
                name: "destinationDomain",
                type: "uint32",
                internalType: "uint32",
              },
              {
                name: "mintRecipient",
                type: "bytes32",
                internalType: "bytes32",
              },
              { name: "burnToken", type: "address", internalType: "address" },
            ],
            name: "depositForBurn",
            payable: false,
          },
          contractInputsValues: {
            amount: (input.value * 10 ** 6).toString(), // Assuming the token has 6 decimals
            destinationDomain: input.destinationDomain.toString(),
            mintRecipient: `0x000000000000000000000000${input.mintRecipient.slice(2)}`,
            burnToken: burnToken,
          },
        },
      ];
    })
    .flat();

  return {
    version: "1.0",
    chainId: "1",
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      createdFromSafeAddress: "0xc38c5f97B34E175FFd35407fc91a937300E33860",
    },
    transactions,
  };
}

export function generateHumanReadableCCTPBridge(inputs: CCTPBridgeInput[]): string {
  const burnToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const USDCMessenger = "0xBd3fa81B58Ba92a82136038B25aDec7066af3155";

  const readableInputs = inputs
    .map(input => {
      const value = (input.value * 10 ** 6).toString(); // Assuming the token has 6 decimals
      return `Approve ${USDCMessenger} to spend ${value} USDC\nthen calling depositForBurn passsing ${value} for the amount of USDC with destination domain ${input.destinationDomain} and mint recipient ${input.mintRecipient}. Destination domains can be confirmed here: https://developers.circle.com/stablecoins/docs/supported-domains`;
    })
    .join("\n\n");

  return `The Maxi Multisig 0xc38c5f97B34E175FFd35407fc91a937300E33860 will interact with the CCTP Bridge as follows:\n${readableInputs}`;
}

// --- ADD REWARD ---
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
    chainId: inputs.length > 0 ? inputs[0].chainId : "",
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      createdFromSafeAddress: inputs.length > 0 ? inputs[0].safeAddress : "",
    },
    transactions: [...transactions], // Using array notation to handle multiple transactions
  };
}

// --- Injector configurator ---
export interface InjectorScheduleInput {
  gaugeAddress: string;
  amountPerPeriod: string;
  rawAmountPerPeriod: string;
  maxPeriods: string;
}

interface PayloadGeneratorInputV2 {
  injectorAddress: string;
  chainId: number;
  safeAddress: string;
  operation: "add" | "remove";
  scheduleInputs: {
    gaugeAddress: string;
    amountPerPeriod?: string;
    rawAmountPerPeriod?: string;
    maxPeriods?: string;
    doNotStartBeforeTimestamp?: string;
  }[];
}

export function generateInjectorSchedulePayloadV2({
  injectorAddress,
  chainId,
  safeAddress,
  operation,
  scheduleInputs,
}: PayloadGeneratorInputV2): BatchFile {
  const contractMethods = {
    add: {
      inputs: [
        {
          name: "recipients",
          type: "address[]",
          internalType: "address[]",
        },
        {
          name: "amountPerPeriod",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "maxPeriods",
          type: "uint8",
          internalType: "uint8",
        },
        {
          name: "doNotStartBeforeTimestamp",
          type: "uint56",
          internalType: "uint56",
        },
      ],
      name: "addRecipients",
      payable: false,
    },
    remove: {
      inputs: [
        {
          name: "recipients",
          type: "address[]",
          internalType: "address[]",
        },
      ],
      name: "removeRecipients",
      payable: false,
    },
  };

  const contractMethod = contractMethods[operation];

  let parameters: any[];
  if (operation === "add") {
    const firstConfig = scheduleInputs.find(
      input => input.rawAmountPerPeriod && input.maxPeriods && input.doNotStartBeforeTimestamp,
    );

    if (!firstConfig) {
      throw new Error("Invalid add configuration: missing required parameters");
    }

    parameters = [
      scheduleInputs.map(input => input.gaugeAddress),
      firstConfig.rawAmountPerPeriod,
      firstConfig.maxPeriods,
      firstConfig.doNotStartBeforeTimestamp || "0",
    ];
  } else {
    parameters = [scheduleInputs.map(input => input.gaugeAddress)];
  }

  const batchTransaction = {
    to: injectorAddress,
    value: "0",
    data: null,
    contractMethod,
    contractInputsValues: {
      recipients: `[${parameters[0].join(", ")}]`,
      amountPerPeriod: parameters[1],
      maxPeriods: parameters[2],
      doNotStartBeforeTimestamp: parameters[3],
    },
  };

  return {
    version: "1.0",
    chainId: chainId.toString(),
    createdAt: Math.floor(Date.now() / 1000),
    meta: {
      name: `Rewards Injector Schedule - ${operation.toUpperCase()}`,
      description: `Configure rewards injector schedule to ${operation} recipients`,
      createdFromSafeAddress: safeAddress,
    },
    transactions: [batchTransaction],
  };
}

export interface PayloadGeneratorInput {
  injectorType: "v1" | "v2";
  injectorAddress: string;
  chainId: string;
  safeAddress: string;
  scheduleInputs: InjectorScheduleInput[];
}

export function generateInjectorSchedulePayload({
  injectorType,
  injectorAddress,
  chainId,
  safeAddress,
  scheduleInputs,
}: PayloadGeneratorInput): BatchFile {
  let contractMethod;
  if (injectorType === "v1") {
    contractMethod = {
      inputs: [
        {
          name: "gaugeAddresses",
          type: "address[]",
          internalType: "address[]",
        },
        {
          name: "amountsPerPeriod",
          type: "uint256[]",
          internalType: "uint256[]",
        },
        { name: "maxPeriods", type: "uint8[]", internalType: "uint8[]" },
      ],
      name: "setRecipientList",
      payable: false,
    };
  } else {
    contractMethod = {
      inputs: [
        {
          name: "gaugeAddresses",
          type: "address[]",
          internalType: "address[]",
        },
        {
          name: "amountsPerPeriod",
          type: "uint256[]",
          internalType: "uint256[]",
        },
        { name: "maxPeriods", type: "uint32[]", internalType: "uint32[]" },
      ],
      name: "setMany",
      payable: false,
    };
  }

  const transaction: Transaction = {
    to: injectorAddress,
    value: "0",
    data: null,
    contractMethod,
    contractInputsValues: {
      gaugeAddresses: `[${scheduleInputs.map(input => input.gaugeAddress).join(", ")}]`,
      amountsPerPeriod: `[${scheduleInputs.map(input => input.rawAmountPerPeriod).join(", ")}]`,
      maxPeriods: `[${scheduleInputs.map(input => input.maxPeriods).join(", ")}]`,
    },
  };

  const payload: BatchFile = {
    version: "1.0",
    chainId: chainId,
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      createdFromSafeAddress: safeAddress,
    },
    transactions: [transaction],
  };

  return payload;
}

export function generateHumanReadableAddReward(inputs: AddRewardInput[]): string {
  if (inputs.length === 0) {
    return ""; // Handle case where inputs array is empty
  }

  const readableInputs = inputs
    .map(input => {
      return `Add Reward:\nTarget (Gauge Address): ${input.targetGauge}\nTo (Authorizer Adaptor Entrypoint): ${input.authorizerAdaptorEntrypoint}\nReward Token: ${input.rewardToken}\nDistributor Address: ${input.distributorAddress}`;
    })
    .join("\n\n");

  const safeAddress = inputs[0].safeAddress || "Unknown"; // Default value if safeAddress is undefined

  return `The Maxi Multisig ${safeAddress} will interact with the following gauges:\n${readableInputs}`;
}

export function transformToHumanReadable(input: string): string {
  // Dictionary of special cases
  const specialCases: { [key: string]: string } = {
    lm: "LM",
    dao: "DAO",
    // Add more special cases here as needed
  };

  // Split the input by dots
  const parts = input.split(".");

  // Remove and store the category (multisig or contributor)
  const category = parts.shift();

  // Process each part
  const transformedParts = parts.map(part => {
    // Check if the part is a special case
    if (part.toLowerCase() in specialCases) {
      return specialCases[part.toLowerCase()];
    }

    // General transformation for other cases
    return part
      .split(/[-_]+/) // Split by hyphens or underscores
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  });

  // Join the transformed parts
  const result = transformedParts.join(" ");

  // Add the category back if it exists
  return category ? `${category.charAt(0).toUpperCase() + category.slice(1)}: ${result}` : result;
}

// Add this to payloadHelperFunctions.ts

export interface SwapFeeChangeInput {
  poolAddress: string;
  newSwapFeePercentage: string;
  poolName: string;
}

export function generateSwapFeeChangePayload(
  input: SwapFeeChangeInput,
  chainId: string,
  multisig: string,
) {
  const swapFeePercentage = (parseFloat(input.newSwapFeePercentage) * 1e16).toString(); // Convert to wei format

  const transaction = {
    to: input.poolAddress,
    value: "0",
    data: null,
    contractMethod: {
      inputs: [
        {
          name: "swapFeePercentage",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      name: "setSwapFeePercentage",
      payable: false,
    },
    contractInputsValues: {
      swapFeePercentage: swapFeePercentage,
    },
  };

  return {
    version: "1.0",
    chainId: chainId,
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      description: `Set swap fee to ${input.newSwapFeePercentage}% for ${input.poolName}`,
      createdFromSafeAddress: multisig,
    },
    transactions: [transaction],
  };
}

// -- SET SWAP FEES ON V3 POOLS HELPERS --
// Helper function to check if an address is the zero address
export function isZeroAddress(address: string): boolean {
  return address === "0x0000000000000000000000000000000000000000";
}

// Convert percentage to wei format (e.g., 0.1% -> 1000000000000000)
export function percentageToWei(percentage: string): string {
  return (parseFloat(percentage) * 1e16).toString();
}

// Generate payload for DAO-governed pools (swapFeeManager is zero address)
export function generateDAOSwapFeeChangePayload(
  input: SwapFeeChangeInput,
  chainId: string,
  multisig: string,
) {
  const swapFeePercentage = percentageToWei(input.newSwapFeePercentage);

  const transaction = {
    to: V3_VAULT_ADDRESS,
    value: "0",
    data: null,
    contractMethod: {
      inputs: [
        {
          name: "pool",
          type: "address",
          internalType: "address",
        },
        {
          name: "swapFeePercentage",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      name: "setStaticSwapFeePercentage",
      payable: false,
    },
    contractInputsValues: {
      pool: input.poolAddress,
      swapFeePercentage: swapFeePercentage,
    },
  };

  return {
    version: "1.0",
    chainId: chainId,
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      description: `Set swap fee to ${input.newSwapFeePercentage}% for ${input.poolName}`,
      createdFromSafeAddress: multisig,
    },
    transactions: [transaction],
  };
}

export async function isSwapFeeManager(
  provider: ethers.BrowserProvider,
  poolAddress: string,
  signer: JsonRpcSigner,
): Promise<boolean> {
  const poolInterface = new ethers.Interface(["function swapFeeManager() view returns (address)"]);

  const poolContract = new ethers.Contract(poolAddress, poolInterface, provider);

  try {
    const manager = await poolContract.swapFeeManager();
    const signerAddress = await signer.getAddress();
    return manager.toLowerCase() === signerAddress.toLowerCase();
  } catch (error) {
    console.error("Error checking swap fee manager:", error);
    return false;
  }
}

// --- SET NEW DISTRIBUTOR ---
export interface SetDistributorInput {
  targetGauge: string;
  rewardToken: string;
  distributorAddress: string;
  safeAddress: string;
  authorizerAdaptorEntrypoint: string;
  chainId: string;
}

export function generateSetDistributorPayload(inputs: SetDistributorInput[]) {
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
      data: `0x058a3a24000000000000000000000000${input.rewardToken.slice(2)}000000000000000000000000${input.distributorAddress.slice(2)}`,
    },
  }));

  return {
    version: "1.0",
    chainId: inputs.length > 0 ? inputs[0].chainId : "",
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      description: "",
      createdFromSafeAddress: inputs.length > 0 ? inputs[0].safeAddress : "",
    },
    transactions: [...transactions], // Using array notation to handle multiple transactions
  };
}

export function generateHumanReadableSetDistributor(inputs: SetDistributorInput[]): string {
  if (inputs.length === 0) {
    return ""; // Handle case where inputs array is empty
  }

  const readableInputs = inputs
    .map(input => {
      return `Set Distributor:\nTarget (Gauge Address): ${input.targetGauge}\nTo (Authorizer Adaptor Entrypoint): ${input.authorizerAdaptorEntrypoint}\nReward Token: ${input.rewardToken}\nDistributor Address: ${input.distributorAddress}`;
    })
    .join("\n\n");

  const safeAddress = inputs[0].safeAddress || "Unknown"; // Default value if safeAddress is undefined

  return `The Maxi Multisig ${safeAddress} will interact with the following gauges:\n${readableInputs}`;
}

interface Permit2ApprovalInput {
  token: string;
  amount: string;
  permit2Address: string;
  targetContractAddress: string;
  expiration: string;
}

function generatePermit2ApprovalPayload(params: Permit2ApprovalInput) {
  return [
    // ERC20 approval to Permit2
    {
      to: params.token,
      value: "0",
      data: null,
      contractMethod: {
        inputs: [
          {
            name: "spender",
            type: "address",
          },
          {
            name: "amount",
            type: "uint256",
          },
        ],
        name: "approve",
        payable: false,
      },
      contractInputsValues: {
        spender: params.permit2Address,
        amount: params.amount,
      },
    },
    // Permit2 approval to target contract
    {
      to: params.permit2Address,
      value: "0",
      data: null,
      contractMethod: {
        inputs: [
          {
            name: "token",
            type: "address",
            internalType: "address",
          },
          {
            name: "spender",
            type: "address",
            internalType: "address",
          },
          {
            name: "amount",
            type: "uint160",
            internalType: "uint160",
          },
          {
            name: "expiration",
            type: "uint48",
            internalType: "uint48",
          },
        ],
        name: "approve",
        payable: false,
      },
      contractInputsValues: {
        token: params.token,
        spender: params.targetContractAddress,
        amount: params.amount,
        expiration: params.expiration,
      },
    },
  ];
}

export interface InitializeBufferInput {
  wrappedToken: string;
  underlyingToken?: string;
  exactAmountUnderlyingIn: string;
  exactAmountWrappedIn: string;
  minIssuedShares: string;
  seedingSafe?: string;
  includePermit2: boolean;
}

export function generateInitializeBufferPayload(
  input: InitializeBufferInput,
  chainId: string,
  bufferRouterAddress: string,
  permit2Address?: string,
) {
  let transactions = [];

  // Add permit2 approvals if needed
  if (input.includePermit2 && permit2Address) {
    let expiration = Math.floor(addDays(Date.now(), 1).getTime() / 1000).toString();

    if (input.exactAmountUnderlyingIn !== "0" && input.underlyingToken) {
      transactions.push(
        ...generatePermit2ApprovalPayload({
          token: input.underlyingToken,
          amount: input.exactAmountUnderlyingIn,
          permit2Address,
          targetContractAddress: bufferRouterAddress,
          expiration,
        }),
      );
    }

    if (input.exactAmountWrappedIn !== "0") {
      transactions.push(
        ...generatePermit2ApprovalPayload({
          token: input.wrappedToken,
          amount: input.exactAmountWrappedIn,
          permit2Address,
          targetContractAddress: bufferRouterAddress,
          expiration,
        }),
      );
    }
  }

  transactions.push({
    to: bufferRouterAddress,
    value: "0",
    data: null,
    contractMethod: {
      inputs: [
        {
          internalType: "contract IERC4626",
          name: "wrappedToken",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "exactAmountUnderlyingIn",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "exactAmountWrappedIn",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "minIssuedShares",
          type: "uint256",
        },
      ],
      name: "initializeBuffer",
      payable: false,
    },
    contractInputsValues: {
      wrappedToken: input.wrappedToken,
      exactAmountUnderlyingIn: input.exactAmountUnderlyingIn,
      exactAmountWrappedIn: input.exactAmountWrappedIn,
      minIssuedShares: input.minIssuedShares,
    },
  });

  return {
    version: "1.0",
    chainId: chainId,
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      description: `Initialize buffer for wrapped token ${input.wrappedToken}.`,
      createdFromSafeAddress: input.seedingSafe ?? "",
    },
    transactions,
  };
}

export interface AddLiquidityToBufferInput {
  wrappedToken: string;
  underlyingToken?: string;
  maxAmountUnderlyingIn: string;
  maxAmountWrappedIn: string;
  exactSharesToIssue: string;
  ownerSafe?: string;
  includePermit2: boolean;
}

export function generateAddLiquidityToBufferPayload(
  input: AddLiquidityToBufferInput,
  chainId: string,
  bufferRouterAddress: string,
  permit2Address?: string,
) {
  let transactions = [];

  // Add permit2 approvals if needed
  if (input.includePermit2 && permit2Address) {
    let expiration = Math.floor(addDays(Date.now(), 1).getTime() / 1000).toString();

    if (input.maxAmountUnderlyingIn !== "0" && input.underlyingToken) {
      transactions.push(
        ...generatePermit2ApprovalPayload({
          token: input.underlyingToken,
          amount: input.maxAmountUnderlyingIn,
          permit2Address,
          targetContractAddress: bufferRouterAddress,
          expiration,
        }),
      );
    }

    if (input.maxAmountWrappedIn !== "0") {
      transactions.push(
        ...generatePermit2ApprovalPayload({
          token: input.wrappedToken,
          amount: input.maxAmountWrappedIn,
          permit2Address,
          targetContractAddress: bufferRouterAddress,
          expiration,
        }),
      );
    }
  }

  transactions.push({
    to: bufferRouterAddress,
    value: "0",
    data: null,
    contractMethod: {
      inputs: [
        {
          internalType: "contract IERC4626",
          name: "wrappedToken",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "maxAmountUnderlyingIn",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "maxAmountWrappedIn",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "exactSharesToIssue",
          type: "uint256",
        },
      ],
      name: "addLiquidityToBuffer",
      payable: false,
    },
    contractInputsValues: {
      wrappedToken: input.wrappedToken,
      maxAmountUnderlyingIn: input.maxAmountUnderlyingIn,
      maxAmountWrappedIn: input.maxAmountWrappedIn,
      exactSharesToIssue: input.exactSharesToIssue,
    },
  });

  return {
    version: "1.0",
    chainId: chainId,
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      description: `Add liquidity to buffer for wrapped token ${input.wrappedToken}.`,
      createdFromSafeAddress: input.ownerSafe ?? "",
    },
    transactions,
  };
}

export interface RemoveLiquidityInput {
  wrappedToken: string;
  sharesToRemove: string;
  minAmountUnderlyingOutRaw: string;
  minAmountWrappedOutRaw: string;
  ownerSafe?: string;
}

export function generateRemoveLiquidityPayload(
  input: RemoveLiquidityInput,
  chainId: string,
  vaultAddress: string,
) {
  // Encode function data, because removeLiquidityFromBuffer is available as a proxy call
  const data = encodeFunctionData({
    abi: vaultAdminAbi,
    functionName: "removeLiquidityFromBuffer",
    args: [
      input.wrappedToken,
      input.sharesToRemove,
      input.minAmountUnderlyingOutRaw,
      input.minAmountWrappedOutRaw,
    ],
  });

  const transactions = [
    {
      to: vaultAddress,
      value: "0",
      data: data,
      contractMethod: {
        inputs: [],
        name: "removeLiquidityFromBuffer",
        payable: true,
      },
      contractInputsValues: null,
    },
  ];

  return {
    version: "1.0",
    chainId: chainId,
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      description: `Remove liquidity from buffer for wrapped token ${input.wrappedToken}.`,
      createdFromSafeAddress: input.ownerSafe ?? "",
    },
    transactions,
  };
}

export interface StableSurgeParamsInput {
  poolAddress: string;
  newMaxSurgeFeePercentage?: string;
  newSurgeThresholdPercentage?: string;
}

export function generateStableSurgeParamsPayload(
  input: StableSurgeParamsInput,
  chainId: string,
  hookAddress: string,
  multisig: string,
) {
  const transactions = [];

  if (input.newMaxSurgeFeePercentage) {
    const maxSurgeFeePercentage = percentageToWei(input.newMaxSurgeFeePercentage);

    transactions.push({
      to: hookAddress,
      value: "0",
      data: null,
      contractMethod: {
        inputs: [
          { internalType: "address", name: "pool", type: "address" },
          { internalType: "uint256", name: "newMaxSurgeSurgeFeePercentage", type: "uint256" },
        ],
        name: "setMaxSurgeFeePercentage",
        payable: false,
      },
      contractInputsValues: {
        pool: input.poolAddress,
        newMaxSurgeSurgeFeePercentage: maxSurgeFeePercentage,
      },
    });
  }

  if (input.newSurgeThresholdPercentage) {
    const surgeThresholdPercentage = percentageToWei(input.newSurgeThresholdPercentage);

    transactions.push({
      to: hookAddress,
      value: "0",
      data: null,
      contractMethod: {
        inputs: [
          { internalType: "address", name: "pool", type: "address" },
          { internalType: "uint256", name: "newSurgeThresholdPercentage", type: "uint256" },
        ],
        name: "setSurgeThresholdPercentage",
        payable: false,
      },
      contractInputsValues: {
        pool: input.poolAddress,
        newSurgeThresholdPercentage: surgeThresholdPercentage,
      },
    });
  }

  // Generate description based on what's being changed
  let description = "";
  if (input.newSurgeThresholdPercentage && input.newMaxSurgeFeePercentage) {
    description = `Set surge threshold to ${input.newSurgeThresholdPercentage}% and max surge fee to ${input.newMaxSurgeFeePercentage}% for pool ${input.poolAddress}`;
  } else if (input.newSurgeThresholdPercentage) {
    description = `Set surge threshold to ${input.newSurgeThresholdPercentage}% for pool ${input.poolAddress}`;
  } else if (input.newMaxSurgeFeePercentage) {
    description = `Set max surge fee to ${input.newMaxSurgeFeePercentage}% for pool ${input.poolAddress}`;
  }

  return {
    version: "1.0",
    chainId: chainId,
    createdAt: Date.now(),
    meta: {
      name: "Transactions Batch",
      description: description,
      createdFromSafeAddress: multisig,
    },
    transactions,
  };
}
