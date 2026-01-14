// Core Pools Fee Data Fetching Service
// Fetches v3 core pool fee data from GitHub CSV files

export interface CorePoolFeeData {
  pool_id: string;
  chain: string;
  symbol: string;
  earned_fees: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

const BASE_URL =
  "https://raw.githubusercontent.com/BalancerMaxis/protocol_fee_allocator_v2/refs/heads/collect-fees-cron/fee_allocator/allocations/incentives/current_fees";

// Fee allocation percentages
export const FEE_ALLOCATIONS = {
  DAO: 0.175, // 17.5%
  VOTING_INCENTIVES: 0.7, // 70%
  VE_BAL: 0.125, // 12.5%
} as const;

/**
 * Parse a date string in YYYY-MM-DD format
 */
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Generate possible date ranges as a 2-week sliding window
 * Files are generated daily with a 15-day lookback window (inclusive)
 * Example: v3_earned_fees_2025-12-31_2026-01-14.csv (15 days from Dec 31 to Jan 14 inclusive)
 */
export function generatePossibleDateRanges(earliestStartDate: string = "2025-05-29"): DateRange[] {
  const ranges: DateRange[] = [];
  const earliest = parseDate(earliestStartDate);
  const today = new Date();

  // Start from today and work backwards
  // Each file has a 15-day window (end date - 14 days = start date, inclusive)
  let currentEnd = new Date(today);

  // Generate ranges going backwards, one day at a time
  // Limit to reasonable number of recent ranges (e.g., last 30 days of files)
  const maxRanges = 30;

  for (let i = 0; i < maxRanges; i++) {
    const currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() - 14); // 15-day window (inclusive)

    // Stop if we've gone before the earliest possible start date
    if (currentStart < earliest) {
      break;
    }

    const startStr = formatDate(currentStart);
    const endStr = formatDate(currentEnd);

    ranges.push({
      startDate: startStr,
      endDate: endStr,
      label: `${startStr} to ${endStr}`,
    });

    // Move back one day
    currentEnd.setDate(currentEnd.getDate() - 1);
  }

  // Reverse so oldest is first, newest is last
  return ranges.reverse();
}

/**
 * Build the CSV URL for a specific date range
 */
function buildCsvUrl(startDate: string, endDate: string): string {
  return `${BASE_URL}/v3_earned_fees_${startDate}_${endDate}.csv`;
}

/**
 * Parse CSV content into CorePoolFeeData array
 */
function parseCsv(csvContent: string): CorePoolFeeData[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];

  // Skip header line
  const dataLines = lines.slice(1);

  return dataLines
    .map(line => {
      const [pool_id, chain, symbol, earned_fees] = line.split(",");
      if (!pool_id || !chain || !symbol || !earned_fees) return null;

      return {
        pool_id: pool_id.trim(),
        chain: chain.trim().toLowerCase(),
        symbol: symbol.trim(),
        earned_fees: parseFloat(earned_fees.trim()),
      };
    })
    .filter((item): item is CorePoolFeeData => item !== null && !isNaN(item.earned_fees));
}

/**
 * Fetch fee data for a specific date range
 */
export async function fetchCorePoolsFeesForRange(
  startDate: string,
  endDate: string,
): Promise<CorePoolFeeData[]> {
  const url = buildCsvUrl(startDate, endDate);

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.warn(`Failed to fetch core pools fees for ${startDate} to ${endDate}: ${response.status}`);
      return [];
    }

    const csvContent = await response.text();
    return parseCsv(csvContent);
  } catch (error) {
    console.error(`Error fetching core pools fees for ${startDate} to ${endDate}:`, error);
    return [];
  }
}

/**
 * Discover available date ranges by checking which CSV files exist
 */
export async function discoverAvailableDateRanges(
  startDate: string = "2025-05-29",
): Promise<DateRange[]> {
  const possibleRanges = generatePossibleDateRanges(startDate);
  const availableRanges: DateRange[] = [];

  // Check each range in parallel
  const checkPromises = possibleRanges.map(async range => {
    const url = buildCsvUrl(range.startDate, range.endDate);
    try {
      const response = await fetch(url, {
        method: "HEAD",
        next: { revalidate: 3600 },
      });
      return response.ok ? range : null;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(checkPromises);

  for (const result of results) {
    if (result) {
      availableRanges.push(result);
    }
  }

  return availableRanges;
}

/**
 * Fetch fee data for multiple date ranges and aggregate
 */
export async function fetchCorePoolsFeesAggregated(
  dateRanges: DateRange[],
): Promise<CorePoolFeeData[]> {
  if (dateRanges.length === 0) return [];

  // Fetch all ranges in parallel
  const fetchPromises = dateRanges.map(range =>
    fetchCorePoolsFeesForRange(range.startDate, range.endDate),
  );

  const allResults = await Promise.all(fetchPromises);

  // Aggregate fees by pool_id
  const aggregatedMap = new Map<string, CorePoolFeeData>();

  for (const results of allResults) {
    for (const item of results) {
      const existing = aggregatedMap.get(item.pool_id);
      if (existing) {
        existing.earned_fees += item.earned_fees;
      } else {
        aggregatedMap.set(item.pool_id, { ...item });
      }
    }
  }

  return Array.from(aggregatedMap.values());
}

/**
 * Calculate fee distributions
 */
export function calculateFeeDistributions(totalFees: number) {
  return {
    total: totalFees,
    toDao: totalFees * FEE_ALLOCATIONS.DAO,
    toVotingIncentives: totalFees * FEE_ALLOCATIONS.VOTING_INCENTIVES,
    toVeBAL: totalFees * FEE_ALLOCATIONS.VE_BAL,
  };
}
