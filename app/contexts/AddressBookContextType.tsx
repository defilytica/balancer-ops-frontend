import React, { createContext, useContext, useEffect, useState } from 'react'
import {fetchAddressBook} from "@/lib/shared/data/maxis/addressBook";
import { AddressBook } from '@/lib/config/types/interfaces';

interface AddressBookContextType {
    addressBook: AddressBook | null
    isLoading: boolean
    error: Error | null
}

const AddressBookContext = createContext<AddressBookContextType | undefined>(undefined)

export function AddressBookProvider({ children }: { children: React.ReactNode }) {
    const [addressBook, setAddressBook] = useState<AddressBook | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        fetchAddressBook()
            .then((data) => {
                setAddressBook(data)
                setIsLoading(false)
            })
            .catch((err) => {
                setError(err)
                setIsLoading(false)
            })
    }, [])

    return (
        <AddressBookContext.Provider value={{ addressBook, isLoading, error }}>
            {children}
        </AddressBookContext.Provider>
    )
}

export function useAddressBook() {
    const context = useContext(AddressBookContext)
    if (context === undefined) {
        throw new Error('useAddressBook must be used within an AddressBookProvider')
    }
    return context
}
