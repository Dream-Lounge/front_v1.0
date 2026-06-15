import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasCompletedInterests } from "@/lib/interests";

/**
 * 헤더와 푸터 없는 인증 페이지 전용 레이아웃
 * - 회원가입, 로그인 등 인증 관련 페이지에 사용
 */
export function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <p>인증 정보를 확인하는 중입니다...</p>
      </main>
    );
  }

  if (isAuthenticated) {
    if (user && !hasCompletedInterests(user.studentId)) {
      return <Navigate to="/onboarding/interests" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen flex items-start sm:items-center justify-center bg-muted/50 px-4 py-6 sm:py-10">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </main>
  );
}
