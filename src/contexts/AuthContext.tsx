import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            console.log('🔍 Fetching profile for user:', userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('❌ Error fetching profile:', error);
                throw error;
            }
            console.log('✅ Profile loaded:', data);
            console.log('📋 is_registered:', data?.is_registered);
            setProfile(data);
        } catch (error) {
            console.error('❌ Error fetching profile:', error);
            setProfile(null);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        console.log('🔄 [AUTH CONTEXT] useEffect appelé - Initialisation...');

        // Check for quick login first
        const checkQuickLogin = async () => {
            console.log('🔍 [AUTH CONTEXT] Vérification quick login...');
            const quickLoginUserId = sessionStorage.getItem('quick_login_user_id');
            const quickLoginTimestamp = sessionStorage.getItem('quick_login_timestamp');

            console.log('🔍 [AUTH CONTEXT] quick_login_user_id:', quickLoginUserId);
            console.log('🔍 [AUTH CONTEXT] quick_login_timestamp:', quickLoginTimestamp);

            if (quickLoginUserId && quickLoginTimestamp) {
                // Vérifier que la session n'est pas expirée (24h)
                const timestamp = parseInt(quickLoginTimestamp);
                const now = Date.now();
                const twentyFourHours = 24 * 60 * 60 * 1000;

                if (now - timestamp < twentyFourHours) {
                    console.log('🔑 [AUTH CONTEXT] Quick login session found');
                    // Charger le profil depuis la base de données
                    try {
                        const { data, error } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', quickLoginUserId)
                            .single();

                        if (!error && data) {
                            console.log('✅ [AUTH CONTEXT] Quick login profile loaded:', data);
                            setProfile(data);
                            // Créer un user object minimal pour compatibilité
                            setUser({ id: data.id, email: data.email } as User);
                            setLoading(false);
                            return true;
                        }
                    } catch (err) {
                        console.error('❌ [AUTH CONTEXT] Error loading quick login profile:', err);
                        // Nettoyer la session invalide
                        sessionStorage.removeItem('quick_login_user_id');
                        sessionStorage.removeItem('quick_login_timestamp');
                    }
                } else {
                    // Session expirée
                    console.log('⏰ [AUTH CONTEXT] Quick login session expired');
                    sessionStorage.removeItem('quick_login_user_id');
                    sessionStorage.removeItem('quick_login_timestamp');
                }
            } else {
                console.log('❌ [AUTH CONTEXT] Pas de quick login session trouvée');
            }
            return false;
        };

        // Vérifier d'abord la connexion rapide
        checkQuickLogin().then((hasQuickLogin) => {
            if (hasQuickLogin) {
                return; // On a déjà chargé le profil via quick login
            }

            // Sinon, vérifier la session Supabase normale
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchProfile(session.user.id);
                }
                setLoading(false);
            });
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            // Si on a une session Supabase, elle a priorité sur quick login
            if (session) {
                sessionStorage.removeItem('quick_login_user_id');
                sessionStorage.removeItem('quick_login_timestamp');
            }

            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/login`,
                },
            });
            if (error) {
                console.error('❌ Error signing in:', error);
                throw error;
            }
        } catch (error) {
            console.error('❌ Sign in failed:', error);
            throw error;
        }
    };

    const signOut = async () => {
        // Nettoyer la session rapide
        sessionStorage.removeItem('quick_login_user_id');
        sessionStorage.removeItem('quick_login_timestamp');

        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const value = {
        user,
        profile,
        session,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
