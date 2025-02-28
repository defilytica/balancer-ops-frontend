// hooks/useDuneData.ts
import { useState, useEffect } from 'react';
import { DuneResponse, GaugeData } from "@/types/interfaces";
import { SortableColumn, SortDirection } from "@/types/types";

export const useDuneData = (queryId: number) => {
  const [data, setData] = useState<GaugeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortableColumn>('days_since_last_vote');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dune?queryId=${queryId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const duneResponse: DuneResponse = await response.json();
        setData(duneResponse.result.rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [queryId]);

  const sortData = (column: SortableColumn) => {
    // If clicking the same column, toggle direction
    const direction: SortDirection =
      column === sortColumn && sortDirection === 'asc' ? 'desc' : 'asc';

    // Clone the data array to avoid mutating state directly
    const sortedData = [...data].sort((a, b) => {
      // Handle numeric columns
      if (typeof a[column] === 'number' && typeof b[column] === 'number') {
        return direction === 'asc'
          ? (a[column] as number) - (b[column] as number)
          : (b[column] as number) - (a[column] as number);
      }

      // Handle string columns
      const aValue = String(a[column]).toLowerCase();
      const bValue = String(b[column]).toLowerCase();

      if (direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    setData(sortedData);
    setSortColumn(column);
    setSortDirection(direction);
  };

  return { data, loading, error, sortData, sortColumn, sortDirection };
};
