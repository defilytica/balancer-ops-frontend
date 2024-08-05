'use client'
import React, { useEffect, useState } from 'react';
import {Box, Card, Flex, Heading, Spinner, Text, VStack} from '@chakra-ui/react';
import {ChainlinkData} from "@/lib/shared/types/interfaces";
import {fetchChainlinkData} from "@/lib/shared/services/fetchChainlinkData";
import {ChainlinkTable} from "@/lib/shared/components/tables/ChainlinkTable";

const ChainlinkAutomationPage: React.FC = () => {
    const [chainlinkData, setChainlinkData] = useState<ChainlinkData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const rawData = await fetchChainlinkData() as any[];
                const processedData: ChainlinkData[] = rawData.map(row => ({
                    ...row,
                    upkeep_balance: parseFloat(row.upkeep_balance),
                    total_link_payments: parseFloat(row.total_link_payments),
                    total_performs: parseInt(row.total_performs),
                    link_per_perform: parseFloat(row.link_per_perform),
                    estimated_actions_left: Math.floor(parseFloat(row.upkeep_balance) / parseFloat(row.link_per_perform)),
                }));
                setChainlinkData(processedData);
            } catch (error) {
                console.error('Error fetching Chainlink data:', error);
            }
        };

        loadData();
        setIsLoading(false)
    }, []);

    return (

        <Box p={8} maxW="container.lg" mx="auto">
            {isLoading ? (
                <Flex justifyContent="center" alignItems="center" height="200px">
                    <Spinner size="xl"/>
                </Flex>
            ) : (
            <VStack spacing={4} align="stretch">
                <Heading as="h2" size="lg" variant="special">Chainlink: Automation Catalog</Heading>
                <Text >Status overview of operational Chainlink Upkeepers maintaned by Balancer Maxis.</Text>
                    <ChainlinkTable data={chainlinkData} />
            </VStack>
                )}
        </Box>
    );
};

export default ChainlinkAutomationPage;
