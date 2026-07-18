import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Profile, Application } from "../types";

interface ProfileStore {
  profiles: Profile[];
  activeProfileId: string | null;
  applications: Application[];
  addProfile: (profile: Profile) => Promise<void>;
  removeProfile: (profileId: string) => Promise<void>;
  setActiveProfile: (profileId: string) => Promise<void>;
  updateProfile: (profileId: string, updates: Partial<Profile>) => Promise<void>;
  addApplication: (application: Application) => Promise<void>;
  updateApplicationStatus: (applicationId: string, status: Application["status"]) => Promise<void>;
  loadProfiles: () => Promise<void>;
}

const PROFILE_STORAGE_KEY = "SahayakProfiles";

const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  applications: [],
  loadProfiles: async () => {
    const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as { profiles: Profile[]; activeProfileId: string | null; applications: Application[] };
      set({ ...stored });
    }
  },
  addProfile: async (profile) => {
    const next = [...get().profiles, profile];
    set({ profiles: next, activeProfileId: profile.id });
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...get() }));
  },
  removeProfile: async (profileId) => {
    const filtered = get().profiles.filter((profile) => profile.id !== profileId);
    const active = get().activeProfileId === profileId ? filtered[0]?.id || null : get().activeProfileId;
    set({ profiles: filtered, activeProfileId: active });
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...get() }));
  },
  setActiveProfile: async (profileId) => {
    set({ activeProfileId: profileId });
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...get() }));
  },
  updateProfile: async (profileId, updates) => {
    const next = get().profiles.map((profile) => (profile.id === profileId ? { ...profile, ...updates } : profile));
    set({ profiles: next });
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...get() }));
  },
  addApplication: async (application) => {
    const next = [...get().applications, application];
    set({ applications: next });
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...get() }));
  },
  updateApplicationStatus: async (applicationId, status) => {
    const next = get().applications.map((application) =>
      application.id === applicationId ? { ...application, status } : application,
    );
    set({ applications: next });
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...get() }));
  },
}));

export default useProfileStore;
