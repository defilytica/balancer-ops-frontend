import { getNetworkString } from "@/lib/utils/getNetworkString";
import { PayloadOperation } from "./PayloadComposerContext";

// Types for Safe transaction structure
export interface SafeTransaction {
  to: string;
  value: string;
  data: string | null;
  contractMethod?: {
    inputs: Array<{
      name: string;
      type: string;
      internalType: string;
    }>;
    name: string;
    payable: boolean;
  };
  contractInputsValues?: Record<string, any>;
}

export interface SafeBatchFile {
  version: string;
  chainId: string;
  createdAt: number;
  meta: {
    name: string;
    description?: string;
    createdFromSafeAddress: string;
  };
  transactions: SafeTransaction[];
}

export interface PayloadCombinationResult {
  success: boolean;
  payload?: SafeBatchFile;
  errors: string[];
  metadata: {
    totalOperations: number;
    totalTransactions: number;
    payloadSizeBytes: number;
    networks: string[];
    operationTypes: string[];
  };
}

export interface ValidationResult {
  isCompatible: boolean;
  blockingIssues: string[];
  warningIssues: string[];
}

export function validatePayloadCompatibility(operations: PayloadOperation[]): ValidationResult {
  const blockingIssues: string[] = [];
  const warningIssues: string[] = [];

  // Basic validation
  if (operations.length === 0) {
    blockingIssues.push("No operations provided");
    return { isCompatible: false, blockingIssues, warningIssues };
  }

  // Check if operations have valid payloads
  for (const operation of operations) {
    if (!operation.payload) {
      blockingIssues.push(`Operation "${operation.title}" has no payload`);
      continue;
    }

    if (!operation.payload.transactions || operation.payload.transactions.length === 0) {
      blockingIssues.push(`Operation "${operation.title}" has no transactions`);
    }
  }

  // Check network consistency - BLOCKING ERROR
  const networks = new Set(
    operations.map(op => getNetworkString(Number(op.payload?.chainId))).filter(Boolean),
  );

  const chainIds = new Set(operations.map(op => op.payload?.chainId).filter(Boolean));

  if (networks.size > 1) {
    const networkList = Array.from(networks).join(", ");
    const chainIdList = Array.from(chainIds).join(" vs ");
    blockingIssues.push(
      `Operations target different networks: ${networkList} (Chain IDs: ${chainIdList})`,
    );
  }

  // Check Safe address consistency - WARNING ONLY (allows manual editing)
  const safeAddresses = new Set(
    operations.map(op => op.payload?.meta?.createdFromSafeAddress).filter(Boolean),
  );

  if (safeAddresses.size > 1) {
    warningIssues.push(
      `Operations reference different Safe addresses: ${Array.from(safeAddresses).join(", ")}. You can manually edit the final payload to use the correct Safe address.`,
    );
  }

  return {
    isCompatible: blockingIssues.length === 0,
    blockingIssues,
    warningIssues,
  };
}

export function combinePayloadOperations(operations: PayloadOperation[]): PayloadCombinationResult {
  const networks = new Set<string>();
  const operationTypes = new Set<string>();
  const allTransactions: SafeTransaction[] = [];

  let chainId = "";
  let safeAddress = "";

  try {
    // Pure combination logic - no validation (that's handled by validatePayloadCompatibility)
    for (const operation of operations) {
      operationTypes.add(operation.type);

      // Extract network info from payload
      if (operation.payload?.chainId) {
        const network = getNetworkString(Number(operation.payload.chainId));
        networks.add(network);

        if (!chainId) {
          chainId = operation.payload.chainId;
        }
      }

      // Use the stored payload
      const individualPayload: SafeBatchFile = operation.payload;

      // Extract safe address (just pick the first one - validation already checked consistency)
      if (!safeAddress && individualPayload.meta.createdFromSafeAddress) {
        safeAddress = individualPayload.meta.createdFromSafeAddress;
      }

      // Add transactions to combined list
      allTransactions.push(...individualPayload.transactions);
    }

    // Check if there are multiple Safe addresses (indicating a conflict)
    const safeAddresses = new Set(
      operations.map(op => op.payload?.meta?.createdFromSafeAddress).filter(Boolean),
    );
    const hasMultipleSafeAddresses = safeAddresses.size > 1;

    // Create combined payload
    const combinedPayload: SafeBatchFile = {
      version: "1.0",
      chainId: chainId || "1",
      createdAt: Date.now(),
      meta: {
        name: `Combined Transactions Batch (${operations.length} operations)`,
        description: `Composed from: ${operations.map(op => op.title).join(", ")}`,
        createdFromSafeAddress: hasMultipleSafeAddresses ? "" : safeAddress || "",
      },
      transactions: allTransactions,
    };

    // Calculate metadata
    const payloadJson = JSON.stringify(combinedPayload, null, 2);
    const metadata = {
      totalOperations: operations.length,
      totalTransactions: allTransactions.length,
      payloadSizeBytes: new TextEncoder().encode(payloadJson).length,
      networks: Array.from(networks),
      operationTypes: Array.from(operationTypes),
    };

    return {
      success: true,
      payload: combinedPayload,
      errors: [], // No errors - validation happens elsewhere
      metadata,
    };
  } catch (error) {
    // Only technical/unexpected errors here
    return {
      success: false,
      errors: [
        `Technical error combining operations: ${error instanceof Error ? error.message : String(error)}`,
      ],
      metadata: {
        totalOperations: operations.length,
        totalTransactions: 0,
        payloadSizeBytes: 0,
        networks: Array.from(networks),
        operationTypes: Array.from(operationTypes),
      },
    };
  }
}
