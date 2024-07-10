'use client'
import {Box, Heading} from "@chakra-ui/react";
import Navbar from "@/app/lib/modules/Navbar";

export default function Page() {
  return (
      <Box>
          <Navbar />
          <Box p={4}>
              <Heading>Welcome to Balancer Ops Tooling</Heading>
          </Box>
      </Box>
  )
}
