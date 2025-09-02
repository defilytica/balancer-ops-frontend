"use client";
import React from "react";
import { Box } from "@chakra-ui/react";
import StableSurgeSimulator from "@/components/stableSurge/StableSurgeSimulator";

export default function StableSurgePage() {
  return (
    <Box as="main" py={8}>
      <StableSurgeSimulator />
    </Box>
  );
}
