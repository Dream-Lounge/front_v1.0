import { useState, useCallback, useEffect, type ReactNode } from "react";
import { api, type User } from "@/lib/api";
import { AuthContext } from "./auth";
import { SessionExpiredDialog } from "@/components/common/SessionExpiredDialog";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [managedClubs, setManagedClubs] = useState<Awaited<ReturnType<typeof api.getMyClubs>>>([]);

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
        const clubs = currentUser ? await api.getMyClubs().catch(() => []) : [];
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
    const clubs = await api.getMyClubs().catch(() => []);
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
