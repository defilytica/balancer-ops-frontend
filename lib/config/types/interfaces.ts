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
