"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import RewardsInjector from "./RewardsInjector";
import { AddressBook, AddressOption } from "@/types/interfaces";
import { getCategoryData, getNetworks } from "@/lib/data/maxis/addressBook";

type RewardsInjectorContainerProps = {
    addressBook: AddressBook;
};

export default function RewardsInjectorContainer({ addressBook }: RewardsInjectorContainerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(null);
    const [injectorData, setInjectorData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const findAddressOption = useCallback((address: string | undefined): AddressOption | null => {
        if (!address) return null;
        const networks = getNetworks(addressBook);
        for (const network of networks) {
            const maxiKeepers = getCategoryData(addressBook, network, "maxiKeepers");
            if (maxiKeepers) {
                const injectors = maxiKeepers.gaugeRewardsInjectors;
                for (const [token, injectorAddress] of Object.entries(injectors)) {
                    if (injectorAddress.toLowerCase() === address.toLowerCase()) {
                        return { network, address: injectorAddress, token };
                    }
                }
            }
        }
        return null;
    }, [addressBook]);

    const fetchInjectorData = useCallback(async (address: AddressOption) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/injector?address=${address.address}&network=${address.network}&token=${address.token}`);
            const data = await response.json();
            setInjectorData(data);
        } catch (error) {
            console.error("Error fetching injector data:", error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const addressFromPath = pathname.split('/').pop();
        if (addressFromPath) {
            const matchingAddress = findAddressOption(addressFromPath);
            if (matchingAddress && (!selectedAddress || matchingAddress.address !== selectedAddress.address)) {
                setSelectedAddress(matchingAddress);
                fetchInjectorData(matchingAddress);
            }
        }
    }, [pathname, addressBook, findAddressOption, fetchInjectorData, selectedAddress]);

    const handleAddressSelect = useCallback((address: AddressOption) => {
        router.push(`/rewards-injector/${address.address}`, { scroll: false });
    }, [router]);

    return (
        <RewardsInjector
            addressBook={addressBook}
            selectedAddress={selectedAddress}
            onAddressSelect={handleAddressSelect}
            injectorData={injectorData}
            isLoading={isLoading}
        />
    );
}
