import { startTransition, useState, useCallback, useEffect, type ReactNode } from "react";
import { api, isSessionExpiredError, type User } from "@/lib/api";
import { AuthContext } from "./auth";
import { SessionExpiredDialog } from "@/components/common/SessionExpiredDialog";

/** 관리자 페이지를 쓸 수 있는 동아리 역할 (회장, 관리자) */
const isManagerRole = (club: { role: string }) => club.role === "president" || club.role === "admin";

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
        let clubs: Awaited<ReturnType<typeof api.getMyClubs>> = [];
        if (currentUser?.isClubAdmin) {
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
          setManagedClubs(clubs.filter(isManagerRole));
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
      if (response.user.isClubAdmin) clubs = await api.getMyClubs();
    } catch (error) {
      // 로그인 직후 쿠키가 전달되지 않는 경우 전역 만료 처리가 이미
      // 실행된다. 이 오류를 삼킨 뒤 사용자를 다시 설정하지 않는다.
      if (isSessionExpiredError(error)) throw error;
    }
    setUser(response.user);
    setManagedClubs(clubs.filter(isManagerRole));
    return response.user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (!isSessionExpiredError(error)) setUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setManagedClubs([]);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.deleteAccount();
    // 탈퇴한 계정으로는 로그아웃 요청도 실패하므로 서버를 거치지 않고 상태만 비운다.
    api.clearTokens();
    // 라우터 이동과 같은 전환(transition)으로 묶어, 호출한 쪽의 navigate()와 한 번에 반영되게 한다.
    // 그렇지 않으면 로그인 상태가 먼저 비워져 보호된 페이지가 /login으로 튕겨 낸다.
    startTransition(() => {
      setUser(null);
      setManagedClubs([]);
    });
  }, []);

  /** 회장 위임·탈퇴 처리처럼 내 동아리 역할이 바뀐 뒤 관리 가능한 동아리 목록을 다시 불러온다. */
  const refreshManagedClubs = useCallback(async () => {
    try {
      setManagedClubs((await api.getMyClubs()).filter(isManagerRole));
    } catch (error) {
      if (!isSessionExpiredError(error)) setManagedClubs([]);
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
        isClubAdmin: user?.isClubAdmin ?? false,
        login,
        logout,
        refreshUser,
        deleteAccount,
        refreshManagedClubs,
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
