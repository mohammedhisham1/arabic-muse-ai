import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type AppRole = 'student' | 'teacher' | 'admin';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    try {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        // Ignore abort errors and table not found
        if (error.message?.includes('abort') || error.code === '42P01') {
          return null;
        }
        console.log('Role fetch info:', error.message);
        return null;
      }

      return (data?.role as AppRole) ?? null;
    } catch (err: any) {
      if (err?.name === 'AbortError') return null;
      console.log('Role fetch error:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mountedRef.current) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const r = await fetchRole(session.user.id);
        if (mountedRef.current) setRole(r);
      }

      if (mountedRef.current) setLoading(false);
    }).catch(() => {
      if (mountedRef.current) setLoading(false);
    });

    // Listen for auth changes - this is CRITICAL for login/logout to work
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (!mountedRef.current) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Small delay to ensure database trigger has completed
          setTimeout(async () => {
            if (!mountedRef.current) return;
            const r = await fetchRole(session.user.id);
            if (mountedRef.current) setRole(r);
            if (mountedRef.current) setLoading(false);
          }, 500);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  }, []);

  return { user, session, role, loading, signOut };
}
