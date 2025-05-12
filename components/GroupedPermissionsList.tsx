import React, { useMemo, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Spinner,
  Checkbox,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Tooltip,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { FormattedDeployment, Permission } from "@/types/interfaces";
import { formatDeploymentName } from "@/lib/utils/formatDeploymentName";
import { formatFunctionName } from "@/lib/utils/formatFunctionName";

interface GroupedPermissionsListProps {
  permissions: Permission[];
  selectedPermissions: string[];
  onToggle: (actionId: string) => void;
  loading: boolean;
  searchTerm: string;
}

interface GroupedPermissions {
  [deployment: string]: {
    [contract: string]: Permission[];
  };
}

// Memoized helper component for the permission row
const PermissionRow = React.memo(
  ({
    permission,
    isSelected,
    onToggle,
    hoverBg,
  }: {
    permission: Permission;
    isSelected: boolean;
    onToggle: (actionId: string) => void;
    hoverBg: string;
  }) => {
    const functionName = formatFunctionName(permission.description);

    return (
      <Flex
        py={1}
        px={2}
        _hover={{ bg: hoverBg }}
        alignItems="center"
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        <Checkbox isChecked={isSelected} onChange={() => onToggle(permission.actionId)} mr={2} />
        <Box flex="1" onClick={() => onToggle(permission.actionId)} cursor="pointer">
          <Text fontSize="sm" isTruncated>
            {functionName}
          </Text>
        </Box>
        <Tooltip label={permission.actionId}>
          <Text fontSize="xs" fontFamily="monospace" isTruncated w="80px">
            {permission.actionId.substring(0, 10)}...
          </Text>
        </Tooltip>
      </Flex>
    );
  },
);

// Memoized component for rendering a virtualized list of permissions
const VirtualizedPermissionList = React.memo(
  ({
    permissions,
    selectedPermissions,
    onToggle,
  }: {
    permissions: Permission[];
    selectedPermissions: string[];
    onToggle: (actionId: string) => void;
  }) => {
    const hoverBg = useColorModeValue("gray.50", "gray.700");

    const RowRenderer = useCallback(
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const permission = permissions[index];
        const isSelected = selectedPermissions.includes(permission.actionId);

        return (
          <div style={style}>
            <PermissionRow
              permission={permission}
              isSelected={isSelected}
              onToggle={onToggle}
              hoverBg={hoverBg}
            />
          </div>
        );
      },
      [permissions, selectedPermissions, onToggle, hoverBg],
    );

    return (
      <Box height="200px" width="100%">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={permissions.length}
              itemSize={35}
              overscanCount={5}
            >
              {RowRenderer}
            </List>
          )}
        </AutoSizer>
      </Box>
    );
  },
);

// Memoized contract section component
const ContractSection = React.memo(
  ({
    contract,
    permissions,
    selectedPermissions,
    onToggle,
  }: {
    contract: string;
    permissions: Permission[];
    selectedPermissions: string[];
    onToggle: (actionId: string) => void;
  }) => {
    const headerBg = useColorModeValue("gray.50", "gray.700");
    const borderColor = useColorModeValue("gray.200", "gray.600");

    // Count selected permissions in this contract
    const selectedCount = useMemo(
      () => permissions.filter(p => selectedPermissions.includes(p.actionId)).length,
      [permissions, selectedPermissions],
    );

    return (
      <Box mb={2}>
        <Flex
          py={1}
          px={2}
          bg={headerBg}
          borderTop="1px solid"
          borderBottom="1px solid"
          borderColor={borderColor}
          alignItems="center"
          justifyContent="space-between"
        >
          <Text fontSize="sm" fontWeight="medium">
            {contract}
          </Text>
          <Badge variant="subtle" colorScheme={selectedCount > 0 ? "green" : "gray"}>
            {selectedCount}/{permissions.length}
          </Badge>
        </Flex>

        <VirtualizedPermissionList
          permissions={permissions}
          selectedPermissions={selectedPermissions}
          onToggle={onToggle}
        />
      </Box>
    );
  },
);

/**
 * Groups permissions by deployment and then by contract
 */
const groupPermissionsByDeployment = (permissions: Permission[]): GroupedPermissions => {
  const grouped: GroupedPermissions = {};

  permissions.forEach(permission => {
    const deployment = permission.deployment;
    // Extract contract name from description (before the dot)
    const contractName = permission.description.split(".")[0];

    if (!grouped[deployment]) {
      grouped[deployment] = {};
    }

    if (!grouped[deployment][contractName]) {
      grouped[deployment][contractName] = [];
    }

    grouped[deployment][contractName].push(permission);
  });

  return grouped;
};

const GroupedPermissionsList: React.FC<GroupedPermissionsListProps> = ({
  permissions,
  selectedPermissions,
  onToggle,
  loading,
  searchTerm,
}) => {
  // Group permissions - memoized for performance
  const groupedPermissionsData = useMemo(() => {
    const grouped = groupPermissionsByDeployment(permissions);

    // Calculate selected counts
    const deploymentCounts: Record<string, { selected: number; total: number }> = {};

    Object.entries(grouped).forEach(([deployment, contracts]) => {
      let selectedCount = 0;
      let totalCount = 0;

      Object.values(contracts).forEach(perms => {
        totalCount += perms.length;
        selectedCount += perms.filter(p => selectedPermissions.includes(p.actionId)).length;
      });

      deploymentCounts[deployment] = { selected: selectedCount, total: totalCount };
    });

    return { grouped, counts: deploymentCounts };
  }, [permissions, selectedPermissions]);

  // Format deployment names - memoized for performance
  const formattedDeployments = useMemo(() => {
    const formatted: Record<string, FormattedDeployment> = {};
    Object.keys(groupedPermissionsData.grouped).forEach(deployment => {
      formatted[deployment] = formatDeploymentName(deployment);
    });
    return formatted;
  }, [groupedPermissionsData.grouped]);

  // Calculate default index for accordion
  const defaultIndex = useMemo(() => {
    if (searchTerm) {
      // Expand all sections when searching
      return Array.from(Array(Object.keys(groupedPermissionsData.grouped).length).keys());
    }
    // Only expand first section by default
    return [];
  }, [searchTerm, groupedPermissionsData.grouped]);

  const borderColor = useColorModeValue("gray.200", "gray.600");
  const headerBg = useColorModeValue("gray.50", "gray.700");

  if (loading) {
    return (
      <Flex justify="center" align="center" p={4} height="300px">
        <Spinner />
      </Flex>
    );
  }

  if (!permissions.length) {
    return (
      <Flex justify="center" align="center" p={4} height="300px">
        <Text>No matching permissions found</Text>
      </Flex>
    );
  }

  return (
    <Box overflowY="auto" height="500px" pr={2}>
      <Accordion allowMultiple defaultIndex={defaultIndex}>
        {Object.entries(groupedPermissionsData.grouped).map(([deployment, contracts]) => {
          const counts = groupedPermissionsData.counts[deployment];
          const formattedDeployment = formattedDeployments[deployment];

          return (
            <AccordionItem
              key={deployment}
              mb={2}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="md"
              overflow="hidden"
            >
              <AccordionButton py={2} bg={headerBg}>
                <Box flex="1" textAlign="left">
                  <HStack justifyContent="space-between">
                    <Text fontWeight="bold">{formattedDeployment.name}</Text>
                    <HStack spacing={2}>
                      {formattedDeployment.version && (
                        <Badge
                          variant="solid"
                          colorScheme={formattedDeployment.version === "v3" ? "purple" : "blue"}
                        >
                          {formattedDeployment.version}
                        </Badge>
                      )}
                      {formattedDeployment.date && (
                        <Badge variant="subtle" colorScheme="gray">
                          {formattedDeployment.date}
                        </Badge>
                      )}
                      <Badge variant="subtle" colorScheme={counts.selected > 0 ? "green" : "gray"}>
                        {counts.selected}/{counts.total} selected
                      </Badge>
                    </HStack>
                  </HStack>
                </Box>
                <AccordionIcon />
              </AccordionButton>

              <AccordionPanel p={0}>
                {Object.entries(contracts).map(([contract, perms]) => (
                  <ContractSection
                    key={`${deployment}-${contract}`}
                    contract={contract}
                    permissions={perms}
                    selectedPermissions={selectedPermissions}
                    onToggle={onToggle}
                  />
                ))}
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Box>
  );
};

GroupedPermissionsList.displayName = "GroupedPermissionsList";
PermissionRow.displayName = "PermissionRow";
VirtualizedPermissionList.displayName = "VirtualizedPermissionList";
ContractSection.displayName = "ContractSection";

export default React.memo(GroupedPermissionsList);
