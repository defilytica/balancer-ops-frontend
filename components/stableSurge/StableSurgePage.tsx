// "use client";
// import React, { useState, useEffect } from "react";
// import {
//   SimpleGrid,
//   Box,
//   Text,
//   Skeleton,
//   useToast,
//   Heading,
//   Container,
//   Button,
//   VStack,
//   HStack,
//   Switch,
//   Select,
//   FormControl,
//   FormLabel,
//   NumberInput,
//   NumberInputField,
//   Card,
//   CardBody,
//   CardHeader,
//   Divider,
//   Flex,
//   Stat,
//   StatLabel,
//   StatNumber,
//   StatHelpText,
//   Alert,
//   AlertIcon,
//   AlertDescription,
// } from "@chakra-ui/react";
// import { StableSurgeChart } from "@/components/stableSurge/StableSurgeChart";

// // Sample data for demonstration
// const generateCurvePoints = (k: number, start: number, end: number, count: number) => {
//   const points = [];
//   const step = (end - start) / count;
  
//   for (let i = 0; i <= count; i++) {
//     const x = start + i * step;
//     const y = k / x;
//     points.push({ x, y });
//   }
  
//   return points;
// };

// const addFees = (points: { x: number; y: number }[], fee: number) => {
//   return points.map(point => ({
//     x: point.x,
//     y: point.y * (1 - fee)
//   }));
// };

// const StableSurgeStatusPage = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [invariantK, setInvariantK] = useState(1000);
//   const [currentPoint, setCurrentPoint] = useState({ x: 10, y: 100 });
//   const [previewPoint, setPreviewPoint] = useState({ x: 15, y: 66.67 });
//   const [fee, setFee] = useState(0.005); // 0.5% fee
//   const [selectedPool, setSelectedPool] = useState("usdc-usdt");
//   const toast = useToast();

//   // Generated curve data
//   const [curveData, setCurveData] = useState({
//     curvePoints: [] as { x: number; y: number }[],
//     curvePointsWithFees: [] as { x: number; y: number }[],
//     initialCurvePoints: [] as { x: number; y: number }[],
//     lowerImbalanceThreshold: { x: 5, y: 200 },
//     upperImbalanceThreshold: { x: 20, y: 50 }
//   });

//   // Sample pool data
//   const pools = [
//     { id: "usdc-usdt", name: "USDC-USDT", tokenA: "USDC", tokenB: "USDT", k: 1000 },
//     { id: "eth-usdc", name: "ETH-USDC", tokenA: "ETH", tokenB: "USDC", k: 2500 },
//     { id: "btc-usdt", name: "BTC-USDT", tokenA: "BTC", tokenB: "USDT", k: 5000 }
//   ];

//   // Initialize curve data on load and when parameters change
//   useEffect(() => {
//     generateCurveData();
//   }, [invariantK, fee, selectedPool]);

//   const generateCurveData = () => {
//     setIsLoading(true);
    
//     const selectedPoolData = pools.find(pool => pool.id === selectedPool) || pools[0];
//     const k = selectedPoolData.k;
    
//     // Generate curve points for current invariant
//     const points = generateCurvePoints(k, 1, 30, 100);
    
//     // Generate curve points with fees applied
//     const pointsWithFees = addFees(points, fee);
    
//     // Generate initial curve points (slightly different k for demonstration)
//     const initialPoints = generateCurvePoints(k * 0.9, 1, 30, 100);
    
//     setCurveData({
//       curvePoints: points,
//       curvePointsWithFees: pointsWithFees,
//       initialCurvePoints: initialPoints,
//       lowerImbalanceThreshold: { x: 5, y: k / 5 },
//       upperImbalanceThreshold: { x: 20, y: k / 20 }
//     });
    
//     // Recalculate current point based on k
//     const newCurrentPoint = { x: 10, y: k / 10 };
//     setCurrentPoint(newCurrentPoint);
    
//     // Calculate preview point (simulate a swap)
//     const newPreviewPoint = { x: 15, y: k / 15 };
//     setPreviewPoint(newPreviewPoint);
    
//     setIsLoading(false);
//   };

//   const handlePoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedPool(e.target.value);
//     const pool = pools.find(p => p.id === e.target.value);
//     if (pool) {
//       setInvariantK(pool.k);
//     }
//   };

//   const handleSwapSimulation = () => {
//     // Simulate a swap by updating the preview point
//     const newX = currentPoint.x + 2 + Math.random() * 3;
//     const newY = invariantK / newX;
//     setPreviewPoint({ x: newX, y: newY });
    
//     toast({
//       title: "Swap Simulated",
//       description: `New projected balance: ${newX.toFixed(2)} ${pools.find(p => p.id === selectedPool)?.tokenA} and ${newY.toFixed(2)} ${pools.find(p => p.id === selectedPool)?.tokenB}`,
//       status: "info",
//       duration: 3000,
//       isClosable: true,
//     });
//   };

//   const handleInvariantChange = (valueAsString: string) => {
//     const value = parseInt(valueAsString);
//     if (!isNaN(value) && value > 0) {
//       setInvariantK(value);
//     }
//   };

//   const handleFeeChange = (valueAsString: string) => {
//     const value = parseFloat(valueAsString);
//     if (!isNaN(value) && value >= 0 && value <= 0.1) {
//       setFee(value);
//     }
//   };

//   const selectedPoolData = pools.find(pool => pool.id === selectedPool) || pools[0];

//   return (
//     <Container maxW="container.xl" py={6}>
//       <VStack spacing={6} align="stretch">
//         <HStack justifyContent="space-between" alignItems="center">
//           <Heading as="h2" size="lg" variant="special">
//             StableSurge Pool Analytics
//           </Heading>
//         </HStack>
        
//         <Alert status="info">
//           <AlertIcon />
//           <Box>
//             <AlertDescription>
//               Visualize and analyze the StableSurge pool curves. Adjust parameters to see how different invariants and fees affect the curve.
//             </AlertDescription>
//           </Box>
//         </Alert>
        
//         <HStack spacing={4} wrap="wrap">
//           <FormControl maxWidth="200px">
//             <FormLabel>Select Pool</FormLabel>
//             <Select value={selectedPool} onChange={handlePoolChange}>
//               {pools.map(pool => (
//                 <option key={pool.id} value={pool.id}>{pool.name}</option>
//               ))}
//             </Select>
//           </FormControl>
          
//           <FormControl maxWidth="200px">
//             <FormLabel>Invariant (k)</FormLabel>
//             <NumberInput value={invariantK} onChange={handleInvariantChange} min={100} max={10000}>
//               <NumberInputField />
//             </NumberInput>
//           </FormControl>
          
//           <FormControl maxWidth="200px">
//             <FormLabel>Fee Rate</FormLabel>
//             <NumberInput 
//               value={fee} 
//               onChange={handleFeeChange} 
//               min={0} 
//               max={0.1} 
//               step={0.001} 
//               precision={3}
//             >
//               <NumberInputField />
//             </NumberInput>
//           </FormControl>
          
//           <Button 
//             colorScheme="blue" 
//             onClick={handleSwapSimulation}
//             alignSelf="flex-end"
//           >
//             Simulate Swap
//           </Button>
//         </HStack>
        
//         <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
//           {/* Chart Card */}
//           <Card variant="outline" height="100%">
//             <CardHeader>
//               <Heading size="md">
//                 {selectedPoolData.tokenA}-{selectedPoolData.tokenB} Pool Curve
//               </Heading>
//             </CardHeader>
//             <CardBody>
//               {isLoading ? (
//                 <Skeleton height="500px" />
//               ) : (
//                 <StableSurgeChart
//                   curvePoints={curveData.curvePoints}
//                   curvePointsWithFees={curveData.curvePointsWithFees}
//                   currentPoint={currentPoint}
//                   initialCurvePoints={curveData.initialCurvePoints}
//                   previewPoint={previewPoint}
//                   lowerImbalanceThreshold={curveData.lowerImbalanceThreshold}
//                   upperImbalanceThreshold={curveData.upperImbalanceThreshold}
//                   tokenInName={selectedPoolData.tokenA}
//                   tokenOutName={selectedPoolData.tokenB}
//                 />
//               )}
//             </CardBody>
//           </Card>
          
//           {/* Stats Card */}
//           <Card variant="outline">
//             <CardHeader>
//               <Heading size="md">Pool Statistics</Heading>
//             </CardHeader>
//             <CardBody>
//               <VStack spacing={4} align="stretch">
//                 <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
//                   <Stat>
//                     <StatLabel>Pool Invariant (k)</StatLabel>
//                     <StatNumber>{invariantK.toLocaleString()}</StatNumber>
//                     <StatHelpText>x * y = k</StatHelpText>
//                   </Stat>
                  
//                   <Stat>
//                     <StatLabel>Swap Fee</StatLabel>
//                     <StatNumber>{(fee * 100).toFixed(2)}%</StatNumber>
//                     <StatHelpText>Applied to all swaps</StatHelpText>
//                   </Stat>
                  
//                   <Stat>
//                     <StatLabel>Current {selectedPoolData.tokenA} Balance</StatLabel>
//                     <StatNumber>{currentPoint.x.toFixed(2)}</StatNumber>
//                     <StatHelpText>Token A</StatHelpText>
//                   </Stat>
                  
//                   <Stat>
//                     <StatLabel>Current {selectedPoolData.tokenB} Balance</StatLabel>
//                     <StatNumber>{currentPoint.y.toFixed(2)}</StatNumber>
//                     <StatHelpText>Token B</StatHelpText>
//                   </Stat>
//                 </SimpleGrid>
                
//                 <Divider />
                
//                 <Heading size="sm">Price Information</Heading>
                
//                 <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
//                   <Stat>
//                     <StatLabel>{selectedPoolData.tokenA} Price (in {selectedPoolData.tokenB})</StatLabel>
//                     <StatNumber>{(currentPoint.y / currentPoint.x).toFixed(4)}</StatNumber>
//                     <StatHelpText>Based on current balances</StatHelpText>
//                   </Stat>
                  
//                   <Stat>
//                     <StatLabel>{selectedPoolData.tokenB} Price (in {selectedPoolData.tokenA})</StatLabel>
//                     <StatNumber>{(currentPoint.x / currentPoint.y).toFixed(4)}</StatNumber>
//                     <StatHelpText>Based on current balances</StatHelpText>
//                   </Stat>
//                 </SimpleGrid>
                
//                 <Divider />
                
//                 <Heading size="sm">Simulated Swap Results</Heading>
                
//                 <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
//                   <Stat>
//                     <StatLabel>New {selectedPoolData.tokenA} Balance</StatLabel>
//                     <StatNumber>{previewPoint.x.toFixed(2)}</StatNumber>
//                     <StatHelpText>After simulated swap</StatHelpText>
//                   </Stat>
                  
//                   <Stat>
//                     <StatLabel>New {selectedPoolData.tokenB} Balance</StatLabel>
//                     <StatNumber>{previewPoint.y.toFixed(2)}</StatNumber>
//                     <StatHelpText>After simulated swap</StatHelpText>
//                   </Stat>
                  
//                   <Stat>
//                     <StatLabel>Price Impact</StatLabel>
//                     <StatNumber>
//                       {(((previewPoint.y / previewPoint.x) / (currentPoint.y / currentPoint.x) - 1) * 100).toFixed(2)}%
//                     </StatNumber>
//                     <StatHelpText>Change in exchange rate</StatHelpText>
//                   </Stat>
//                 </SimpleGrid>
//               </VStack>
//             </CardBody>
//           </Card>
//         </SimpleGrid>
//       </VStack>
//     </Container>
//   );
// };


// export default StableSurgeStatusPage;