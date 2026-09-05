import { Outlet } from "react-router-dom";

/**
 * 프론트엔드 검수 중에는 로그인 여부와 관계없이 관리자 페이지를 노출합니다.
 * 실제 배포 전에는 서버 권한과 연동된 접근 제어를 복구해야 합니다.
 */
export function AdminRoute() {
  return <Outlet />;
}
