import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * 헤더와 푸터를 포함하는 기본 레이아웃
 * - 일반 페이지 (홈, 동아리 상세, 지원서 등)에 사용
 */
export function MainLayout() {
  return (
    <>
      <Header />
      <main className="dream-main w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
