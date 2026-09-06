import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * 동아리 등록 화면은 로그인 사용자에게 열되, 기존 동아리의 관리 작업은
 * 각 API에서 해당 동아리 회장인지 서버가 최종 검증합니다.
 */
export function AdminRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
