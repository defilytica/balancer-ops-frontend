import { ethers } from "ethers";
import { SimulationTransaction } from "@/types/interfaces";
import { getAddress } from "@/lib/data/maxis/addressBook";
import { V3vaultAdmin } from "@/abi/v3vaultAdmin";
import BufferRouterABI from "@/abi/BufferRouter.json";
import { V3_VAULT_ADDRESS } from "@/constants/constants";
import {
  getBufferRouterAddress,
  getPermit2Address,
  getVaultAddress,
} from "@/lib/utils/sonicNetworkUtils";
import { reClammPoolAbi } from "@/abi/ReclammPool.js";
import { stableSurgeHookAbi } from "@/abi/StableSurgeHook";
import { mevCaptureHookAbi } from "@/abi/MevCaptureHook";
import { protocolFeeControllerAbi } from "@/abi/ProtocolFeeController";
import {
  ManageBufferSimulationTransactionsParams,
  BufferOperation,
  InitializeBufferSimulationTransactionsParams,
  ChangeSwapFeeV3SimulationTransactionsParams,
  ReClammParameterSimulationTransactionsParams,
  StableSurgeParameterSimulationTransactionsParams,
  MevCaptureParameterSimulationTransactionsParams,
  ChangeProtocolFeeV3SimulationTransactionsParams,
} from "@/types/interfaces";

export function buildManageBufferSimulationTransactions(
  params: ManageBufferSimulationTransactionsParams,
): SimulationTransaction[] | null {
  const {
    selectedToken,
    selectedNetwork,
    sharesAmount,
    operationType,
    wrappedTokenAmount,
    underlyingTokenAmount,
    underlyingTokenAddress,
    addressBook,
  } = params;

  if (!selectedToken || !selectedNetwork || !sharesAmount) return null;

  const transactions: SimulationTransaction[] = [];

  if (operationType === BufferOperation.ADD) {
    const bufferRouterAddress = getBufferRouterAddress(addressBook, selectedNetwork);
    if (!bufferRouterAddress) return null;

    const permit2Address = getPermit2Address(addressBook, selectedNetwork);
    if (!permit2Address) return null;

    const expiration = Math.floor(Date.now() / 1000) + 86400 * 365; // 1 year

    // Add approval transactions if needed
    if (wrappedTokenAmount && parseFloat(wrappedTokenAmount) > 0) {
      // ERC20 approval to Permit2
      const wrappedApprovalData = new ethers.Interface([
        "function approve(address spender, uint256 amount)",
      ]).encodeFunctionData("approve", [permit2Address, wrappedTokenAmount]);

      transactions.push({
        to: selectedToken.address,
        data: wrappedApprovalData,
        value: "0",
      });

      // Permit2 approval to BufferRouter
      const permit2ApprovalData = new ethers.Interface([
        "function approve(address token, address spender, uint160 amount, uint48 expiration)",
      ]).encodeFunctionData("approve", [
        selectedToken.address,
        bufferRouterAddress,
        wrappedTokenAmount,
        expiration,
      ]);

      transactions.push({
        to: permit2Address,
        data: permit2ApprovalData,
        value: "0",
      });
    }

    if (underlyingTokenAmount && parseFloat(underlyingTokenAmount) > 0 && underlyingTokenAddress) {
      // ERC20 approval to Permit2
      const underlyingApprovalData = new ethers.Interface([
        "function approve(address spender, uint256 amount)",
      ]).encodeFunctionData("approve", [permit2Address, underlyingTokenAmount]);

      transactions.push({
        to: underlyingTokenAddress,
        data: underlyingApprovalData,
        value: "0",
      });

      // Permit2 approval to BufferRouter
      const permit2ApprovalData = new ethers.Interface([
        "function approve(address token, address spender, uint160 amount, uint48 expiration)",
      ]).encodeFunctionData("approve", [
        underlyingTokenAddress,
        bufferRouterAddress,
        underlyingTokenAmount,
        expiration,
      ]);

      transactions.push({
        to: permit2Address,
        data: permit2ApprovalData,
        value: "0",
      });
    }

    // Add final buffer add liquidity transaction
    const addLiquidityData = new ethers.Interface(BufferRouterABI).encodeFunctionData(
      "addLiquidityToBuffer",
      [
        selectedToken.address,
        underlyingTokenAmount || "0",
        wrappedTokenAmount || "0",
        sharesAmount,
      ],
    );

    transactions.push({
      to: bufferRouterAddress,
      data: addLiquidityData,
      value: "0",
    });
  } else {
    // REMOVE operation
    const vaultAddress = getVaultAddress(addressBook, selectedNetwork);
    if (!vaultAddress) return null;

    const removeLiquidityData = new ethers.Interface(V3vaultAdmin).encodeFunctionData(
      "removeLiquidityFromBuffer",
      [
        selectedToken.address,
        sharesAmount,
        underlyingTokenAmount || "0",
        wrappedTokenAmount || "0",
      ],
    );

    transactions.push({
      to: vaultAddress,
      data: removeLiquidityData,
      value: "0",
    });
  }

  return transactions;
}

export function buildInitializeBufferSimulationTransactions(
  params: InitializeBufferSimulationTransactionsParams,
): SimulationTransaction[] | null {
  const {
    selectedToken,
    selectedNetwork,
    exactAmountWrappedIn,
    exactAmountUnderlyingIn,
    underlyingTokenAddress,
    minIssuedShares,
    addressBook,
  } = params;

  if (!selectedToken || !selectedNetwork) return null;

  const bufferRouterAddress = getBufferRouterAddress(addressBook, selectedNetwork);
  if (!bufferRouterAddress) return null;

  const permit2Address = getPermit2Address(addressBook, selectedNetwork);
  if (!permit2Address) return null;

  const transactions: SimulationTransaction[] = [];
  const expiration = Math.floor(Date.now() / 1000) + 86400 * 365; // 1 year

  // Add approval transactions if needed
  if (exactAmountWrappedIn && parseFloat(exactAmountWrappedIn) > 0) {
    // ERC20 approval to Permit2
    const wrappedApprovalData = new ethers.Interface([
      "function approve(address spender, uint256 amount)",
    ]).encodeFunctionData("approve", [permit2Address, exactAmountWrappedIn]);

    transactions.push({
      to: selectedToken.address,
      data: wrappedApprovalData,
      value: "0",
    });

    // Permit2 approval to BufferRouter
    const permit2ApprovalData = new ethers.Interface([
      "function approve(address token, address spender, uint160 amount, uint48 expiration)",
    ]).encodeFunctionData("approve", [
      selectedToken.address,
      bufferRouterAddress,
      exactAmountWrappedIn,
      expiration,
    ]);

    transactions.push({
      to: permit2Address,
      data: permit2ApprovalData,
      value: "0",
    });
  }

  if (
    exactAmountUnderlyingIn &&
    parseFloat(exactAmountUnderlyingIn) > 0 &&
    underlyingTokenAddress
  ) {
    // ERC20 approval to Permit2
    const underlyingApprovalData = new ethers.Interface([
      "function approve(address spender, uint256 amount)",
    ]).encodeFunctionData("approve", [permit2Address, exactAmountUnderlyingIn]);

    transactions.push({
      to: underlyingTokenAddress,
      data: underlyingApprovalData,
      value: "0",
    });

    // Permit2 approval to BufferRouter
    const permit2ApprovalData = new ethers.Interface([
      "function approve(address token, address spender, uint160 amount, uint48 expiration)",
    ]).encodeFunctionData("approve", [
      underlyingTokenAddress,
      bufferRouterAddress,
      exactAmountUnderlyingIn,
      expiration,
    ]);

    transactions.push({
      to: permit2Address,
      data: permit2ApprovalData,
      value: "0",
    });
  }

  // Add final buffer initialization transaction
  const initializeData = new ethers.Interface(BufferRouterABI).encodeFunctionData(
    "initializeBuffer",
    [
      selectedToken.address,
      exactAmountUnderlyingIn || "0",
      exactAmountWrappedIn || "0",
      minIssuedShares || "0",
    ],
  );

  transactions.push({
    to: bufferRouterAddress,
    data: initializeData,
    value: "0",
  });

  return transactions;
}

export function buildChangeSwapFeeV3SimulationTransactions(
  params: ChangeSwapFeeV3SimulationTransactionsParams,
): SimulationTransaction[] | null {
  const { selectedPool, newSwapFeePercentage } = params;

  if (!selectedPool || !newSwapFeePercentage) return null;

  try {
    const contract = new ethers.Contract(V3_VAULT_ADDRESS, V3vaultAdmin);
    const swapFeePercentage = ((parseFloat(newSwapFeePercentage) / 100) * 1e18).toString();

    const data = contract.interface.encodeFunctionData("setStaticSwapFeePercentage", [
      selectedPool.address.toLowerCase(),
      swapFeePercentage,
    ]);

    return [
      {
        to: V3_VAULT_ADDRESS,
        data,
        value: "0",
      },
    ];
  } catch (error) {
    console.error("Error building swap fee change transaction:", error);
    return null;
  }
}

export function buildReClammParameterSimulationTransactions(
  params: ReClammParameterSimulationTransactionsParams,
): SimulationTransaction[] | null {
  const {
    selectedPool,
    hasCenterednessMargin,
    hasDailyPriceShiftExponent,
    hasPriceRatioUpdate,
    centerednessMargin,
    dailyPriceShiftExponent,
    endPriceRatio,
    priceRatioUpdateStartTime,
    priceRatioUpdateEndTime,
  } = params;

  if (!selectedPool) return null;

  try {
    const contract = new ethers.Contract(selectedPool.address, reClammPoolAbi);
    const transactions: SimulationTransaction[] = [];

    if (hasCenterednessMargin && centerednessMargin) {
      const centerednessMarginValue = ((parseFloat(centerednessMargin) / 100) * 1e18).toString();

      const data = contract.interface.encodeFunctionData("setCenterednessMargin", [
        centerednessMarginValue,
      ]);

      transactions.push({
        to: selectedPool.address,
        data,
        value: "0",
      });
    }

    if (hasDailyPriceShiftExponent && dailyPriceShiftExponent) {
      const dailyPriceShiftExponentValue = (
        (parseFloat(dailyPriceShiftExponent) / 100) *
        1e18
      ).toString();

      const data = contract.interface.encodeFunctionData("setDailyPriceShiftExponent", [
        dailyPriceShiftExponentValue,
      ]);

      transactions.push({
        to: selectedPool.address,
        data,
        value: "0",
      });
    }

    if (
      hasPriceRatioUpdate &&
      endPriceRatio &&
      priceRatioUpdateStartTime &&
      priceRatioUpdateEndTime
    ) {
      const endPriceRatioValue = (parseFloat(endPriceRatio) * 1e18).toString();

      const data = contract.interface.encodeFunctionData("startPriceRatioUpdate", [
        endPriceRatioValue,
        priceRatioUpdateStartTime,
        priceRatioUpdateEndTime,
      ]);

      transactions.push({
        to: selectedPool.address,
        data,
        value: "0",
      });
    }

    return transactions.length > 0 ? transactions : null;
  } catch (error) {
    console.error("Error building ReCLAMM parameter transactions:", error);
    return null;
  }
}

export function buildStableSurgeParameterSimulationTransactions(
  params: StableSurgeParameterSimulationTransactionsParams,
): SimulationTransaction[] | null {
  const {
    selectedPool,
    hasMaxSurgeFeePercentage,
    hasSurgeThresholdPercentage,
    maxSurgeFeePercentage,
    surgeThresholdPercentage,
  } = params;

  if (!selectedPool || !selectedPool.hook?.address) return null;

  try {
    const contract = new ethers.Contract(selectedPool.hook.address, stableSurgeHookAbi);
    const transactions: SimulationTransaction[] = [];

    if (hasMaxSurgeFeePercentage && maxSurgeFeePercentage) {
      const maxSurgeFeeValue = BigInt(parseFloat(maxSurgeFeePercentage) * 1e16).toString();

      const data = contract.interface.encodeFunctionData("setMaxSurgeFeePercentage", [
        selectedPool.address,
        maxSurgeFeeValue,
      ]);

      transactions.push({
        to: selectedPool.hook.address,
        data,
        value: "0",
      });
    }

    if (hasSurgeThresholdPercentage && surgeThresholdPercentage) {
      const surgeThresholdValue = BigInt(parseFloat(surgeThresholdPercentage) * 1e16).toString();

      const data = contract.interface.encodeFunctionData("setSurgeThresholdPercentage", [
        selectedPool.address,
        surgeThresholdValue,
      ]);

      transactions.push({
        to: selectedPool.hook.address,
        data,
        value: "0",
      });
    }

    return transactions.length > 0 ? transactions : null;
  } catch (error) {
    console.error("Error building StableSurge parameter transactions:", error);
    return null;
  }
}

export function buildMevCaptureParameterSimulationTransactions(
  params: MevCaptureParameterSimulationTransactionsParams,
): SimulationTransaction[] | null {
  const {
    selectedPool,
    hasMevTaxThreshold,
    hasMevTaxMultiplier,
    mevTaxThreshold,
    mevTaxMultiplier,
  } = params;

  if (!selectedPool || !selectedPool.hook?.address) return null;

  try {
    const contract = new ethers.Contract(selectedPool.hook.address, mevCaptureHookAbi);
    const transactions: SimulationTransaction[] = [];

    if (hasMevTaxThreshold && mevTaxThreshold) {
      // Convert from Gwei to Wei for transaction
      const txMevTaxThreshold = ethers.parseUnits(mevTaxThreshold, "gwei");

      const data = contract.interface.encodeFunctionData("setPoolMevTaxThreshold", [
        selectedPool.address,
        txMevTaxThreshold.toString(),
      ]);

      transactions.push({
        to: selectedPool.hook.address,
        data,
        value: "0",
      });
    }

    if (hasMevTaxMultiplier && mevTaxMultiplier) {
      // Convert multiplier from MEther to Wei for tx payload (multiply by 1e24)
      const txMevTaxMultiplier = ethers.parseUnits(mevTaxMultiplier, 24);

      const data = contract.interface.encodeFunctionData("setPoolMevTaxMultiplier", [
        selectedPool.address,
        txMevTaxMultiplier.toString(),
      ]);

      transactions.push({
        to: selectedPool.hook.address,
        data,
        value: "0",
      });
    }

    return transactions.length > 0 ? transactions : null;
  } catch (error) {
    console.error("Error building MEV Capture parameter transactions:", error);
    return null;
  }
}

export function buildChangeProtocolFeeV3SimulationTransactions(
  params: ChangeProtocolFeeV3SimulationTransactionsParams,
): SimulationTransaction[] | null {
  const {
    selectedPool,
    protocolFeeControllerAddress,
    hasProtocolSwapFee,
    hasProtocolYieldFee,
    protocolSwapFeePercentage,
    protocolYieldFeePercentage,
  } = params;

  if (!selectedPool || !protocolFeeControllerAddress) return null;

  try {
    const contract = new ethers.Contract(
      protocolFeeControllerAddress,
      protocolFeeControllerAbi,
    );
    const transactions: SimulationTransaction[] = [];

    if (hasProtocolSwapFee && protocolSwapFeePercentage) {
      // Convert percentage to 18-decimal format (e.g., 25% -> 250000000000000000)
      const protocolSwapFeeValue = BigInt(parseFloat(protocolSwapFeePercentage) * 1e16).toString();

      const data = contract.interface.encodeFunctionData("setProtocolSwapFeePercentage", [
        selectedPool.address,
        protocolSwapFeeValue,
      ]);

      transactions.push({
        to: protocolFeeControllerAddress,
        data,
        value: "0",
      });
    }

    if (hasProtocolYieldFee && protocolYieldFeePercentage) {
      // Convert percentage to 18-decimal format (e.g., 25% -> 250000000000000000)
      const protocolYieldFeeValue = BigInt(parseFloat(protocolYieldFeePercentage) * 1e16).toString();

      const data = contract.interface.encodeFunctionData("setProtocolYieldFeePercentage", [
        selectedPool.address,
        protocolYieldFeeValue,
      ]);

      transactions.push({
        to: protocolFeeControllerAddress,
        data,
        value: "0",
      });
    }

    return transactions.length > 0 ? transactions : null;
  } catch (error) {
    console.error("Error building Protocol Fee change transactions:", error);
    return null;
  }
}
