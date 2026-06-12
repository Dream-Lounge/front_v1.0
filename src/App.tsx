import { Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Home } from "@/pages/Home";
import { ClubDetail } from "@/pages/ClubDetail";
import { ClubApplication } from "@/pages/ClubApplication";
import { ApplicationDrafts } from "@/pages/ApplicationDrafts";
import { ApplicationStatus } from "@/pages/ApplicationStatus";
import { Signup } from "@/pages/Signup";
import { Login } from "@/pages/Login";
import { InterestSelection } from "@/pages/InterestSelection";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { MyClubs } from "@/pages/MyClubs";
import { ClubCommunity } from "@/pages/ClubCommunity";
import { PostDetail } from "@/pages/PostDetail";
import { AdminRoute } from "@/components/common/AdminRoute";
import { AdminPage } from "@/pages/AdminPage";
import { ClubsPage } from "@/pages/ClubsPage";

/**
 * 앱의 메인 진입점 컴포넌트
 * - MainLayout: 헤더/푸터가 있는 일반 페이지용 레이아웃
 * - AuthLayout: 헤더/푸터 없는 인증 페이지용 레이아웃
 */
function App() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <ScrollToTop />
      <Routes>
        {/* 헤더/푸터 없는 인증 페이지 */}
        <Route element={<AuthLayout />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* 최초 로그인 후 관심사 선택(온보딩) — 전체화면 */}
        <Route path="/onboarding/interests" element={<InterestSelection />} />

        {/* 헤더/푸터 있는 일반 페이지 */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/club/:id" element={<ClubDetail />} />
          <Route path="/club/:id/community" element={<ClubCommunity />} />
          <Route path="/club/:id/community/:postId" element={<PostDetail />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/club/:id/apply" element={<ClubApplication />} />
            <Route path="/applications/:id/edit" element={<ClubApplication />} />
            <Route path="/applications/:id/view" element={<ClubApplication />} />
            <Route path="/users/:studentId/drafts" element={<ApplicationDrafts />} />
            <Route path="/users/:studentId/applications" element={<ApplicationStatus />} />
            <Route path="/users/:studentId/clubs" element={<MyClubs />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
