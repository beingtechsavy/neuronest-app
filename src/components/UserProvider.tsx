'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { User } from '@supabase/supabase-js';

// Define the shape of the context data
interface UserContextType {
    user: User | null;
    username: string | null;
    loading: boolean;
}

// Create the context
export const UserContext = createContext<UserContextType | undefined>(undefined);

// Create the Provider component
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const supabase = useSupabaseClient();
    const user = useUser(); // Gets the authenticated user from SupabaseProvider

    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            // If we have a user, fetch their profile from the 'profiles' table
            setLoading(true);
            supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        console.error('Error fetching username:', error);
                    }
                    if (data) {
                        setUsername(data.username);
                    }
                    setLoading(false);
                });
        } else {
            // If there's no user, we're not loading anything
            setUsername(null);
            setLoading(false);
        }
    }, [user, supabase]);

    const value = {
        user,
        username,
        loading,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Create a custom hook to easily access the context
export const useUserContext = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
};