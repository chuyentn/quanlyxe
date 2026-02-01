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

        // 1. Get initial session
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted && session) {
                    setSession(session);
                    setUser(session.user);
                    const userRole = await fetchUserRole(session.user.id);
                    setRole(userRole);
                    localStorage.setItem('user_role', userRole); // Cache role
                }
            } catch (error) {
                console.error("Auth init error:", error);
            }
        };

        initSession();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    const userRole = await fetchUserRole(session.user.id);
                    setRole(userRole);
                    localStorage.setItem('user_role', userRole); // Cache role
                } else {
                    setRole('viewer');
                    localStorage.removeItem('user_role'); // Clear cache
                }
                setLoading(false);
            }
        });

        // Set loading to false after initial check
        const timer = setTimeout(() => {
            if (mounted) setLoading(false);
        }, 3000);

        return () => {
            mounted = false;
            clearTimeout(timer);
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
