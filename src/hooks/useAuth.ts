import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from './useTelegramAuth';

export type AuthMethod = 'email' | 'telegram';

export interface AuthUser {
  id: string;
  email?: string;
  telegramId?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  authMethod: AuthMethod;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: telegramUser, isLoading: isTelegramLoading, webApp } = useTelegramAuth();

  // Check if running in Telegram Mini App
  const isTelegramApp = !!webApp;

  // Handle Telegram auth
  useEffect(() => {
    if (isTelegramApp && telegramUser && !isTelegramLoading) {
      console.log('🔐 Telegram user detected, setting auth user');
      setUser({
        id: telegramUser.id.toString(),
        telegramId: telegramUser.id,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        photoUrl: telegramUser.photo_url,
        authMethod: 'telegram',
      });
      setIsLoading(false);
    }
  }, [isTelegramApp, telegramUser, isTelegramLoading]);

  // Handle Supabase email auth
  useEffect(() => {
    if (isTelegramApp) return; // Skip if in Telegram

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event);
        setSession(session);
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            firstName: session.user.user_metadata?.first_name,
            lastName: session.user.user_metadata?.last_name,
            authMethod: 'email',
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.user_metadata?.first_name,
          lastName: session.user.user_metadata?.last_name,
          authMethod: 'email',
        });
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isTelegramApp]);

  const signUp = useCallback(async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    
    return { data, error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
    }
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    return { error };
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isTelegramApp,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
};
