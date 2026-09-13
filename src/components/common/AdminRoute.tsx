import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * 관리자 화면은 운영자가 지정한 동아리 관리자만 표시합니다.
 * 실제 권한은 각 백엔드 API에서도 별도로 검증합니다.
 */
export function AdminRoute() {
  const { isAuthenticated, isClubAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isClubAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
