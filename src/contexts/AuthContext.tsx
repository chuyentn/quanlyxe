import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type UserRole = 'admin' | 'manager' | 'dispatcher' | 'accountant' | 'driver' | 'viewer';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: UserRole;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: 'viewer',
    signOut: async () => { },
    loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(() => {
        // Try to get role from localStorage first
        const savedRole = localStorage.getItem('user_role');
        return (savedRole as UserRole) || 'viewer';
    });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Fetch user role from user_roles table
    const fetchUserRole = async (userId: string): Promise<UserRole> => {
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .single();

            if (error || !data) return 'viewer'; // Default for new users
            return data.role as UserRole;
        } catch (error) {
            console.error("Error fetching role:", error);
            return 'viewer';
        }
    };

    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth check timed out, forcing loading to false");
                setLoading(false);
            }
        }, 5000); // 5 seconds max wait

        // 1. Get initial session
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    if (session) {
                        setSession(session);
                        setUser(session.user);
                        const userRole = await fetchUserRole(session.user.id);
                        setRole(userRole);
                        localStorage.setItem('user_role', userRole);
                    } else {
                        setRole('viewer');
                        localStorage.removeItem('user_role');
                    }
                }
            } catch (error) {
                console.error("Auth init error:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initSession();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (mounted) {
                try {
                    setSession(session);
                    setUser(session?.user ?? null);

                    // Set loading true while switching auth state
                    setLoading(true);

                    // Re-start safety timeout for auth change events
                    const changeTimeout = setTimeout(() => {
                        if (mounted) setLoading(false);
                    }, 5000);

                    if (session?.user) {
                        const userRole = await fetchUserRole(session.user.id);
                        setRole(userRole);
                        localStorage.setItem('user_role', userRole);
                    } else {
                        setRole('viewer');
                        localStorage.removeItem('user_role');
                    }

                    clearTimeout(changeTimeout); // Clear if successful
                } catch (error) {
                    console.error("Auth change error:", error);
                    setRole('viewer');
                } finally {
                    if (mounted) setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        // Clear local state immediately to force UI update
        const previousRole = role;
        setRole('viewer');
        setSession(null);
        setUser(null);
        localStorage.removeItem('user_role');

        try {
            await supabase.auth.signOut();
            toast({
                title: "Đăng xuất thành công",
                description: "Hẹn gặp lại bạn!",
            });
        } catch (error) {
            console.error("Logout error details:", error);
            // Even if API fails, we enforce client-side logout
            if (previousRole !== 'viewer') {
                window.location.reload(); // Hard refresh if state is messy
            }
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, role, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
