import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export function useProfile(user: User | null) {
  const userId = user?.id ?? null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failedUserId, setFailedUserId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    if (!userId) return;

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (ignore) return;
        if (error) console.error('Failed to load profile:', error.message);
        setProfile(data);
        setFailedUserId(error ? userId : null);
      });

    return () => { ignore = true; };
  }, [userId]);

  const currentProfile = userId && profile?.id === userId ? profile : null;
  const loading = userId !== null && currentProfile === null && failedUserId !== userId;

  return { profile: currentProfile, loading };
}
