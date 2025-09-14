import { getCurrentUserData, restoreSession } from '@/lib/appwrite';
import { User } from '@/type';
import { create } from 'zustand';

type AuthState = {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;

    setIsAuthenticated: (value: boolean) => void;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;

    fetchAuthenticatedUser: () => Promise<void>;
};

const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    isLoading: true,

    setIsAuthenticated: (value) => set({ isAuthenticated: value }),

    setUser: (user) => set({ user }),

    setLoading: (loading) => set({ isLoading: loading }),

    fetchAuthenticatedUser: async () => {
        set({ isLoading: true });

        try {
            const hasSession = await restoreSession(); // check if session exists
            if (!hasSession) {
                set({ isAuthenticated: false, user: null });
                return;
            }

            const user = await getCurrentUserData();
            set({ isAuthenticated: true, user: user as unknown as User });
        } catch (e) {
            console.log("fetchAuthenticatedUser error", e);
            set({ isAuthenticated: false, user: null });
        } finally {
            set({ isLoading: false });
        }
    },
}))

export default useAuthStore;