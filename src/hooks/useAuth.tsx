import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ApprovalStatus = "pending" | "approved" | "rejected";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  profileCompleted: boolean;
  approvalStatus: ApprovalStatus | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);

  const fetchUserMeta = async (uid: string) => {
    const [{ data: roleData }, { data: profileData }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
      (supabase as any).from("profiles").select("profile_completed, approval_status").eq("user_id", uid).maybeSingle(),
    ]);
    setIsAdmin(!!roleData);
    setProfileCompleted(profileData?.profile_completed ?? false);
    setApprovalStatus((profileData?.approval_status as ApprovalStatus) ?? null);
  };

  const refreshProfile = async () => {
    if (user) await fetchUserMeta(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(() => fetchUserMeta(newSession.user.id), 0);
      } else {
        setIsAdmin(false);
        setProfileCompleted(true);
        setApprovalStatus(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        fetchUserMeta(existing.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, profileCompleted, approvalStatus, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
