import { createContext } from "react";
import type { ActiveClubItem, User } from "@/lib/api";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionExpired: boolean;
  managedClubs: ActiveClubItem[];
  isClubAdmin: boolean;
  login: (studentId: string, password: string) => Promise<void>;
  logout: () => void;
  handleSessionExpired: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
