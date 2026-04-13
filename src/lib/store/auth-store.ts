import { create } from "zustand";
import { supabase } from "../supabase";
import { Profile } from "../types";
import { Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  partnerProfile: Profile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  fetchPartnerProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  partnerProfile: null,
  loading: true,

  setSession: (session) => set({ session, loading: false }),

  fetchProfile: async () => {
    const { session } = get();
    if (!session) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (data) {
      set({ profile: data });
      if (data.partner_id) {
        get().fetchPartnerProfile();
      }
    }
  },

  fetchPartnerProfile: async () => {
    const { profile } = get();
    if (!profile?.partner_id) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profile.partner_id)
      .single();

    if (data) set({ partnerProfile: data });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, partnerProfile: null });
  },
}));
