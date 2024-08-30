import Papa from "papaparse";
import { ChainlinkData } from "@/types/interfaces";

export const fetchChainlinkData = async (): Promise<ChainlinkData[]> => {
  const response = await fetch(
    "https://raw.githubusercontent.com/BalancerMaxis/multisig-ops/upkeeps/upkeeps.csv",
  );
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results: { data: any[] }) => {
        const processedData: ChainlinkData[] = results.data
          .map((row: any) => ({
            blockchain: row.blockchain || "",
            upkeep_name: row.upkeep_name || "",
            upkeep_status: row.upkeep_status || "",
            upkeep_balance: parseFloat(row.upkeep_balance) || 0,
            total_link_payments: parseFloat(row.total_link_payments) || 0,
            total_performs: parseInt(row.total_performs) || 0,
            link_per_perform: parseFloat(row.link_per_perform) || 0,
            upkeep_url: row.upkeep_url || "",
            estimated_actions_left: 0, // We'll calculate this later
          }))
          .filter(
            (row: ChainlinkData) =>
              row.blockchain &&
              row.upkeep_name &&
              !isNaN(row.upkeep_balance) &&
              !isNaN(row.total_link_payments) &&
              !isNaN(row.total_performs) &&
              !isNaN(row.link_per_perform),
          );

        // Calculate estimated_actions_left
        processedData.forEach((row) => {
          row.estimated_actions_left =
            row.link_per_perform > 0
              ? Math.floor(row.upkeep_balance / row.link_per_perform)
              : 0;
        });

        resolve(processedData);
      },
      error: (error: any) => reject(error),
    });
  });
};
