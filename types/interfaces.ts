export interface AddressBook {
    active: {
        [network: string]: {
            [category: string]: {
                [subcategory: string]: string | {
                    [key: string]: string;
                };
            };
        };
    };
}


export interface ChainlinkData {
    blockchain: string;
    upkeep_name: string;
    upkeep_status: string;
    upkeep_balance: number;
    total_link_payments: number;
    total_performs: number;
    link_per_perform: number;
    upkeep_url: string;
    estimated_actions_left: number;
}

