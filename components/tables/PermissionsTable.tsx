import React from "react";
import {
  Box,
  Text,
  Badge,
  Flex,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tooltip,
  HStack,
  Select,
  Button,
} from "@chakra-ui/react";

interface PermissionsTableProps {
  loading: boolean;
  permissions: string[]; // Paginated permissions
  totalPermissionsCount: number; // Total count of permissions across all pages
  getPermissionDescription: (actionId: string) => string;
  currentPage: number;
  totalPages: number;
  handlePageChange: (newPage: number) => void;
  permissionsPerPage: number;
  handlePermissionsPerPageChange: (value: number) => void;
  copyToClipboard: (text: string) => void;
  permissionsToRevoke: string[];
  togglePermissionRevocation: (actionId: string) => void;
}

export const PermissionsTable: React.FC<PermissionsTableProps> = ({
  loading,
  permissions,
  totalPermissionsCount,
  getPermissionDescription,
  currentPage,
  totalPages,
  handlePageChange,
  permissionsPerPage,
  handlePermissionsPerPageChange,
  copyToClipboard,
  permissionsToRevoke,
  togglePermissionRevocation,
}) => {
  // Pagination controls component
  const PaginationControls = () => {
    return (
      <Flex justifyContent="space-between" alignItems="center" width="100%" mt={2}>
        <HStack spacing={2}>
          <Text fontSize="sm">Show:</Text>
          <Select
            size="sm"
            width="70px"
            value={permissionsPerPage}
            onChange={e => handlePermissionsPerPageChange(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </Select>
          <Text fontSize="sm">entries</Text>
        </HStack>

        <HStack spacing={2}>
          <Button
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            isDisabled={currentPage === 1}
          >
            Previous
          </Button>
          <Text fontSize="sm">
            Page {currentPage} of {totalPages || 1}
          </Text>
          <Button
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            isDisabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </HStack>
      </Flex>
    );
  };

  return (
    <Box w="full">
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="xl" fontWeight="bold">
          Current Permissions
        </Text>
        {/* Display the total count independent of pagination */}
        <Badge colorScheme="blue" fontSize="md">
          {totalPermissionsCount} permissions
        </Badge>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" p={4}>
          <Spinner />
        </Flex>
      ) : (
        <>
          <TableContainer
            w="full"
            borderColor="transparent"
            maxHeight="500px"
            borderRadius="xl"
            borderWidth="1px"
            shadow="md"
            p={2}
            sx={{
              // Custom scrollbar styling
              "&::-webkit-scrollbar": {
                height: "8px",
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                borderRadius: "4px",
                "&:hover": {
                  background: "rgba(0, 0, 0, 0.3)",
                },
              },
              // Ensure Firefox has similar styling
              scrollbarWidth: "thin",
            }}
          >
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Permission</Th>
                  <Th>Action ID</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {permissions.length > 0 ? (
                  permissions.map((permission, index) => (
                    <Tr
                      key={`current-${index}-${permission.substring(0, 8)}`}
                      _hover={{ bg: "whiteAlpha.50" }}
                      bg={permissionsToRevoke.includes(permission) ? "red.50" : undefined}
                    >
                      <Td>
                        <Flex>{getPermissionDescription(permission)}</Flex>
                      </Td>
                      <Td>
                        <Tooltip label="Click to copy" placement="top">
                          <Text
                            as="span"
                            fontSize="xs"
                            fontFamily="monospace"
                            cursor="pointer"
                            onClick={() => copyToClipboard(permission)}
                            textDecoration={
                              permissionsToRevoke.includes(permission) ? "line-through" : undefined
                            }
                            color={permissionsToRevoke.includes(permission) ? "red.500" : undefined}
                          >
                            {permission}
                          </Text>
                        </Tooltip>
                      </Td>
                      <Td>
                        <Button
                          size="xs"
                          colorScheme={permissionsToRevoke.includes(permission) ? "green" : "red"}
                          onClick={() => togglePermissionRevocation(permission)}
                        >
                          {permissionsToRevoke.includes(permission) ? "Keep" : "Revoke"}
                        </Button>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={3} textAlign="center">
                      No permissions found for this wallet
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>

          {totalPermissionsCount > 0 && <PaginationControls />}
        </>
      )}
    </Box>
  );
};

export default PermissionsTable;
