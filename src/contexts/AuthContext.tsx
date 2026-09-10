import { useState, useCallback, useEffect, type ReactNode } from "react";
import { api, isSessionExpiredError, type User } from "@/lib/api";
import { AuthContext } from "./auth";
import { SessionExpiredDialog } from "@/components/common/SessionExpiredDialog";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [managedClubs, setManagedClubs] = useState<Awaited<ReturnType<typeof api.getMyClubs>>>([]);

  const refreshManagedClubs = useCallback(async () => {
    const clubs = (await api.getMyClubs()).filter((club) => club.role === "president");
    setManagedClubs(clubs);
    return clubs;
  }, []);

  useEffect(() => {
    let active = true;

    api.setSessionExpiredHandler(() => {
      if (!active) return;
      setUser(null);
      setManagedClubs([]);
      setIsSessionExpired(true);
    });

    api.restoreSession()
      .then(async (currentUser) => {
        let clubs: Awaited<ReturnType<typeof api.getMyClubs>> = [];
        if (currentUser) {
          try {
            clubs = await api.getMyClubs();
          } catch (error) {
            // 세션 만료를 빈 관리자 목록으로 숨기면 아래에서 사용자를 다시
            // 로그인 상태로 덮어쓸 수 있으므로 반드시 바깥 catch로 전달한다.
            if (isSessionExpiredError(error)) throw error;
          }
        }
        if (active) {
          setUser(currentUser);
          setManagedClubs(clubs.filter((club) => club.role === "president"));
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setManagedClubs([]);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      api.setSessionExpiredHandler(null);
    };
  }, []);

  const login = useCallback(async (studentId: string, password: string) => {
    const response = await api.login(studentId, password);
    let clubs: Awaited<ReturnType<typeof api.getMyClubs>> = [];
    try {
      clubs = await api.getMyClubs();
    } catch (error) {
      // 로그인 직후 쿠키가 전달되지 않는 경우 전역 만료 처리가 이미
      // 실행된다. 이 오류를 삼킨 뒤 사용자를 다시 설정하지 않는다.
      if (isSessionExpiredError(error)) throw error;
    }
    setUser(response.user);
    setManagedClubs(clubs.filter((club) => club.role === "president"));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setManagedClubs([]);
    }
  }, []);

  const handleSessionExpired = useCallback(() => {
    api.clearTokens();
    setUser(null);
    setManagedClubs([]);
    setIsSessionExpired(true);
  }, []);

  const handleSessionExpiredConfirm = useCallback(() => {
    setIsSessionExpired(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        isSessionExpired,
        managedClubs,
        isClubAdmin: managedClubs.length > 0,
        refreshManagedClubs,
        login,
        logout,
        handleSessionExpired,
      }}
    >
      {children}
      <SessionExpiredDialog
        open={isSessionExpired}
        onConfirm={handleSessionExpiredConfirm}
      />
    </AuthContext.Provider>
  );
}
