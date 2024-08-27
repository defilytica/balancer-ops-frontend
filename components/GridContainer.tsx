'use client';

import { Grid } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface GridContainerProps {
    children: ReactNode;
}

const GridContainer: React.FC<GridContainerProps> = ({ children }) => {
    return (
        <Grid templateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap={6}>
            {children}
        </Grid>
    );
};

export default GridContainer;
