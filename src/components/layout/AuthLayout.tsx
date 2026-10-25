import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasCompletedInterests } from "@/lib/interests";

/**
 * 헤더와 푸터 없는 인증 페이지 전용 레이아웃
 * - 회원가입, 로그인 등 인증 관련 페이지에 사용
 */
export function AuthLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <p>인증 정보를 확인하는 중입니다...</p>
      </main>
    );
  }

  // 로그인되면 이 레이아웃이 먼저 다시 그려져 Login 페이지의 navigate()보다 앞서 이동시킨다.
  // 그래서 첫 로그인(관심 분야 미선택) 분기도 여기서 함께 처리한다.
  if (isAuthenticated) {
    const firstLogin = user !== null && !hasCompletedInterests(user.studentId);
    return <Navigate to={firstLogin ? "/onboarding/interests" : "/"} replace />;
  }

  return (
    <main className="dream-auth min-h-screen flex items-start sm:items-center justify-center bg-muted/50 px-4 py-6 sm:py-10">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </main>
  );
}
