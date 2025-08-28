import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const TENDERLY_API_URL =
  "https://api.tenderly.co/api/v1/account/defilytica/project/balancer-ops/simulate-bundle";
const TENDERLY_ACCESS_KEY = process.env.TENDERLY_KEY;

interface EOATransaction {
  to: string;
  value?: string;
  data?: string;
  gas?: number;
  gas_price?: string;
}

interface EOABundleSimulationRequest {
  network_id: string;
  from: string;
  transactions: EOATransaction[];
}

export async function POST(request: NextRequest) {
  try {
    const { network_id, from, transactions }: EOABundleSimulationRequest = await request.json();

    if (!network_id || !from || !transactions || transactions.length === 0) {
      return NextResponse.json(
        { message: "Missing required fields: network_id, from, transactions" },
        { status: 400 },
      );
    }

    // Build bundle payload according to Tenderly docs
    const bundleTransactions = transactions.map(tx => ({
      network_id,
      from,
      to: tx.to,
      value: tx.value || "0",
      input: tx.data || "0x",
      gas: tx.gas,
      gas_price: tx.gas_price,
      save: true,
      save_if_fails: true,
      simulation_type: "quick",
    }));

    const bundlePayload = {
      simulations: bundleTransactions,
    };

    const simulationResponse = await axios.post(TENDERLY_API_URL, bundlePayload, {
      headers: {
        "X-Access-Key": TENDERLY_ACCESS_KEY as string,
        "Content-Type": "application/json",
      },
    });

    // Check if all simulations succeeded
    const allSucceeded =
      simulationResponse.data.simulation_results?.every((sim: any) => sim.simulation.status) ??
      false;

    let failedSimulationUrl = null;

    // If bundle failed, find first failed simulation and share it for debugging
    if (!allSucceeded && simulationResponse.data.simulation_results) {
      const firstFailedSim = simulationResponse.data.simulation_results.find(
        (sim: any) => !sim.simulation.status,
      );

      if (firstFailedSim?.simulation?.id) {
        try {
          await axios.post(
            `https://api.tenderly.co/api/v1/account/defilytica/project/balancer-ops/simulations/${firstFailedSim.simulation.id}/share`,
            {},
            {
              headers: {
                "X-Access-Key": TENDERLY_ACCESS_KEY as string,
                "Content-Type": "application/json",
              },
            },
          );
          failedSimulationUrl = `https://www.tdly.co/shared/simulation/${firstFailedSim.simulation.id}`;
          console.log("Failed simulation shared successfully:", failedSimulationUrl);
        } catch (shareError) {
          console.error("Failed to share individual simulation:", shareError);
        }
      }
    }

    return NextResponse.json({
      url: failedSimulationUrl,
      success: allSucceeded,
      bundle: simulationResponse.data,
    });
  } catch (error: any) {
    console.error("Bundle Simulation failed:", error);

    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }

    return NextResponse.json(
      {
        message: "Bundle Simulation failed",
        error: error instanceof Error ? error.message : String(error),
        details: axios.isAxiosError(error) ? error.response?.data : null,
      },
      { status: 500 },
    );
  }
}
