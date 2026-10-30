import { createContext } from "react";
import type { ActiveClubItem, User } from "@/lib/api";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionExpired: boolean;
  managedClubs: ActiveClubItem[];
  isClubAdmin: boolean;
  login: (studentId: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  /** 회원탈퇴 후 로그인 상태를 비웁니다. */
  deleteAccount: () => Promise<void>;
  /** 관리 가능한 동아리 목록(회장·관리자)을 다시 불러옵니다. */
  refreshManagedClubs: () => Promise<void>;
  handleSessionExpired: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
