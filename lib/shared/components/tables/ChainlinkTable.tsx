import React, { useState } from 'react';
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Link,
    Icon,
    Tooltip,
    Image,
    Flex,
    Card,
    Box,
} from '@chakra-ui/react';
import { ExternalLinkIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { ChainlinkData } from "@/lib/shared/types/interfaces";
// Import network logos
import PolygonLogo from '@/lib/shared/imgs/polygon.svg';
import OptimismLogo from '@/lib/shared/imgs/optimism.svg';
import ArbitrumLogo from '@/lib/shared/imgs/arbitrum.svg';
import AvalancheLogo from '@/lib/shared/imgs/avalancheLogo.svg';
import GnosisLogo from '@/lib/shared/imgs/gnosis.svg';
import BaseLogo from '@/lib/shared/imgs/base.svg';
import zkevmLogo from '@/lib/shared/imgs/Polygon-zkEVM.png';
import EthereumLogo from '@/lib/shared/imgs/mainnet.svg';

interface ChainlinkTableProps {
    data: ChainlinkData[];
}

interface NetworkInfo {
    logo: string;
    rpc: string;
}

const networks: Record<string, NetworkInfo> = {
    ethereum: { logo: EthereumLogo.src, rpc: "https://eth.llamarpc.com" },
    polygon: { logo: PolygonLogo.src, rpc: "https://1rpc.io/matic" },
    optimism: { logo: OptimismLogo.src, rpc: "https://mainnet.optimism.io" },
    avalanche_c: { logo: AvalancheLogo.src, rpc: "https://avalanche.public-rpc.com" },
    arbitrum: { logo: ArbitrumLogo.src, rpc: "https://arb1.arbitrum.io/rpc" },
    gnosis: { logo: GnosisLogo.src, rpc: "https://rpc.gnosischain.com" },
    base: { logo: BaseLogo.src, rpc: "https://mainnet.base.org" },
    zkevm: { logo: zkevmLogo.src, rpc: "https://zkevm-rpc.com" }
};

export const ChainlinkTable: React.FC<ChainlinkTableProps> = ({ data }) => {
    const [sortColumn, setSortColumn] = useState<keyof ChainlinkData | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (column: keyof ChainlinkData) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortColumn) return 0;
        if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
        if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
        let color;
        switch (status.toLowerCase()) {
            case 'active':
                color = 'green.500';
                break;
            case 'paused':
                color = 'yellow.500';
                break;
            case 'cancelled':
                color = 'red.500';
                break;
            default:
                color = 'gray.500';
        }
        return <Box w="10px" h="10px" borderRadius="full" bg={color} />;
    };

    return (
        <Card>
            <Table variant="simple" size="md">
                <Thead>
                    <Tr>
                        <Th px={2} py={1}>Network</Th>
                        <Th px={2} py={1} cursor="pointer" onClick={() => handleSort('upkeep_name')}>
                            Upkeep Name
                            {sortColumn === 'upkeep_name' && (
                                sortDirection === 'asc' ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />
                            )}
                        </Th>
                        <Th px={2} py={1}>Status</Th>
                        <Th px={2} py={1} isNumeric cursor="pointer" onClick={() => handleSort('upkeep_balance')}>
                            Balance
                            {sortColumn === 'upkeep_balance' && (
                                sortDirection === 'asc' ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />
                            )}
                        </Th>
                        <Th px={2} py={1} isNumeric cursor="pointer" onClick={() => handleSort('total_link_payments')}>
                            Total Payments
                            {sortColumn === 'total_link_payments' && (
                                sortDirection === 'asc' ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />
                            )}
                        </Th>
                        <Th px={2} py={1} isNumeric cursor="pointer" onClick={() => handleSort('total_performs')}>
                            Total Performs
                            {sortColumn === 'total_performs' && (
                                sortDirection === 'asc' ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />
                            )}
                        </Th>
                        <Th px={2} py={1} isNumeric cursor="pointer" onClick={() => handleSort('link_per_perform')}>
                            LINK/Perform
                            {sortColumn === 'link_per_perform' && (
                                sortDirection === 'asc' ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />
                            )}
                        </Th>
                        <Th px={2} py={1} isNumeric cursor="pointer" onClick={() => handleSort('estimated_actions_left')}>
                            Est. Actions Left
                            {sortColumn === 'estimated_actions_left' && (
                                sortDirection === 'asc' ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />
                            )}
                        </Th>
                        <Th px={2} py={1}>URL</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {sortedData.map((row, index) => (
                        <Tr key={index}>
                            <Td px={2} py={1}>
                                <Tooltip label={row.blockchain}>
                                    <Flex alignItems="center">
                                        <Image
                                            src={networks[row.blockchain.toLowerCase()]?.logo}
                                            alt={`${row.blockchain} logo`}
                                            boxSize="20px"
                                        />
                                    </Flex>
                                </Tooltip>
                            </Td>
                            <Td px={2} py={1} fontSize="sm">{row.upkeep_name}</Td>
                            <Td px={2} py={1}>
                                <Tooltip label={row.upkeep_status}>
                                    <Flex alignItems="center">
                                        <StatusIcon status={row.upkeep_status} />
                                    </Flex>
                                </Tooltip>
                            </Td>
                            <Td px={2} py={1} isNumeric fontSize="sm">{row.upkeep_balance.toFixed(2)}</Td>
                            <Td px={2} py={1} isNumeric fontSize="sm">{row.total_link_payments.toFixed(2)}</Td>
                            <Td px={2} py={1} isNumeric fontSize="sm">{row.total_performs}</Td>
                            <Td px={2} py={1} isNumeric fontSize="sm">{row.link_per_perform.toFixed(4)}</Td>
                            <Td px={2} py={1} isNumeric fontSize="sm">{
                                isFinite(row.estimated_actions_left) ? row.estimated_actions_left : '-'
                            }</Td>
                            <Td px={2} py={1}>
                                <Tooltip label="Open upkeep URL">
                                    <Link href={row.upkeep_url} isExternal>
                                        <Icon as={ExternalLinkIcon} boxSize="14px" />
                                    </Link>
                                </Tooltip>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Card>
    );
};
