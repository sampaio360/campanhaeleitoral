import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Profile {
  id: string;
  name: string;
  candidate_id: string | null;
  campanha_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRoles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isCoordinator: boolean;
  isMaster: boolean;
  campanhaId: string | null;
  selectedCampanhaId: string | null;
  setSelectedCampanhaId: (id: string | null) => void;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refetchRoles: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedCampanhaId, setSelectedCampanhaIdState] = useState<string | null>(() => {
    try { return localStorage.getItem('selectedCampanhaId'); } catch { return null; }
  });

  const setSelectedCampanhaId = useCallback((id: string | null) => {
    setSelectedCampanhaIdState(id);
    try {
      if (id) localStorage.setItem('selectedCampanhaId', id);
      else localStorage.removeItem('selectedCampanhaId');
    } catch {}
  }, []);
  const [adminCampanhaIds, setAdminCampanhaIds] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      const roles = data?.map(r => r.role) || [];
      setUserRoles(roles);
      return roles;
    } catch (error) {
      console.error('Erro ao buscar roles:', error);
      setUserRoles([]);
      return [];
    }
  };

  const fetchAdminCampanhas = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_campanhas')
        .select('campanha_id')
        .eq('user_id', userId);
      if (error) throw error;
      const ids = data?.map(d => d.campanha_id) || [];
      setAdminCampanhaIds(ids);
      return ids;
    } catch {
      setAdminCampanhaIds([]);
      return [];
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const initUser = useCallback(async (userId: string) => {
    const [profileData, roles] = await Promise.all([
      fetchProfile(userId),
      fetchUserRoles(userId),
    ]);

    const isAdminRole = roles.includes('admin');
    const isMasterRole = roles.includes('master');

    // Read current stored value directly from localStorage
    let currentSelected: string | null = null;
    try { currentSelected = localStorage.getItem('selectedCampanhaId'); } catch {}

    if (isMasterRole) {
      // Master: no restriction, just auto-select if only 1 campanha
      if (!currentSelected) {
        const { data } = await supabase.from('campanhas').select('id').is('deleted_at', null);
        const ids = data?.map(d => d.id) || [];
        if (ids.length === 1) setSelectedCampanhaId(ids[0]);
      }
    } else if (isAdminRole) {
      // Admin: validate against allowed campanhas
      const campIds = await fetchAdminCampanhas(userId);
      const allowedIds = [...campIds];
      if (profileData?.campanha_id && !allowedIds.includes(profileData.campanha_id)) {
        allowedIds.push(profileData.campanha_id);
      }

      if (currentSelected && !allowedIds.includes(currentSelected)) {
        // Stored campanha not allowed for this user — clear it
        setSelectedCampanhaId(null);
        currentSelected = null;
      }

      if (!currentSelected && allowedIds.length === 1) {
        setSelectedCampanhaId(allowedIds[0]);
      }
    } else {
      // Regular user: only their profile campanha is allowed
      if (currentSelected && currentSelected !== profileData?.campanha_id) {
        setSelectedCampanhaId(null);
      }
    }
  }, [fetchProfile, fetchAdminCampanhas, setSelectedCampanhaId]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          setTimeout(() => {
            initUser(currentUser.id).finally(() => setLoading(false));
          }, 0);
        } else {
          setProfile(null);
          setUserRoles([]);
          setAdminCampanhaIds([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        initUser(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [initUser]);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });

    if (error) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada!", description: "Verifique seu email para confirmar sua conta." });
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Erro no login", description: "E-mail ou senha incorretos.", variant: "destructive" });
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUserRoles([]);
    setSelectedCampanhaId(null);
  };

  const isMaster = userRoles.includes('master');
  const isAdmin = userRoles.includes('admin') || isMaster;
  const isCoordinator = userRoles.includes('coordinator') || isAdmin;
  const isSupervisor = userRoles.includes('supervisor') || isCoordinator;
  const campanhaId = profile?.campanha_id ?? null;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      userRoles,
      loading: loading || profileLoading,
      isAdmin,
      isCoordinator,
      isMaster,
      campanhaId,
      selectedCampanhaId,
      setSelectedCampanhaId,
      signUp,
      signIn,
      signOut,
      refetchRoles: () => user ? fetchUserRoles(user.id).then(() => {}) : Promise.resolve(),
      refetchProfile: () => user ? fetchProfile(user.id).then(() => {}) : Promise.resolve(),
    }}>
      {children}
    </AuthContext.Provider>
  );
};