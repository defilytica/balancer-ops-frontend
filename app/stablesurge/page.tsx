"use client";
import React from "react";
import { Box } from "@chakra-ui/react";
import StableSurge from "@/components/stableSurge/StableSurge";

export default function StableSurgePage() {
  return (
    <Box as="main" py={8}>
      <StableSurge />
    </Box>
  );
}