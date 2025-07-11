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

export function validatePayloadCompatibility(operations: PayloadOperation[]): {
  isCompatible: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Basic validation
  if (operations.length === 0) {
    issues.push("No operations provided");
    return { isCompatible: false, issues };
  }

  // Check if operations have valid payloads
  for (const operation of operations) {
    if (!operation.payload) {
      issues.push(`Operation "${operation.title}" has no payload`);
      continue;
    }

    if (!operation.payload.transactions || operation.payload.transactions.length === 0) {
      issues.push(`Operation "${operation.title}" has no transactions`);
    }
  }

  // Check network consistency
  const networks = new Set(
    operations.map(op => getNetworkString(Number(op.payload?.chainId))).filter(Boolean),
  );

  const chainIds = new Set(operations.map(op => op.payload?.chainId).filter(Boolean));

  if (networks.size > 1) {
    const networkList = Array.from(networks).join(", ");
    const chainIdList = Array.from(chainIds).join(" vs ");
    issues.push(`Operations target different networks: ${networkList} (Chain IDs: ${chainIdList})`);
  }

  // Check Safe address consistency
  const safeAddresses = new Set(
    operations.map(op => op.payload?.meta?.createdFromSafeAddress).filter(Boolean),
  );

  if (safeAddresses.size > 1) {
    issues.push(
      `Operations reference different Safe addresses: ${Array.from(safeAddresses).join(", ")}`,
    );
  }

  return {
    isCompatible: issues.length === 0,
    issues,
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

    // Create combined payload
    const combinedPayload: SafeBatchFile = {
      version: "1.0",
      chainId: chainId || "1",
      createdAt: Date.now(),
      meta: {
        name: `Combined Transactions Batch (${operations.length} operations)`,
        description: `Composed from: ${operations.map(op => op.title).join(", ")}`,
        createdFromSafeAddress: safeAddress || "0x0000000000000000000000000000000000000000",
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
