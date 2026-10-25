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
  logout: () => Promise<void>;
  /** 회원탈퇴 후 로그인 상태를 비웁니다. */
  deleteAccount: () => Promise<void>;
  handleSessionExpired: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
