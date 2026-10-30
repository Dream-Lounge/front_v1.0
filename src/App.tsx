import { Navigate, Routes, Route, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Home } from "@/pages/Home";
import { ClubDetail } from "@/pages/ClubDetail";
import { ClubApplication } from "@/pages/ClubApplication";
import { ApplicationDrafts } from "@/pages/ApplicationDrafts";
import { ApplicationStatus } from "@/pages/ApplicationStatus";
import { Signup } from "@/pages/Signup";
import { Login } from "@/pages/Login";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { MyClubs } from "@/pages/MyClubs";
import { BoardPage } from "@/pages/board/BoardPage";
import { BoardPostDetail } from "@/pages/board/BoardPostDetail";
import { BoardWrite } from "@/pages/board/BoardWrite";
import { AdminRoute } from "@/components/common/AdminRoute";
import { AdminPage } from "@/pages/AdminPage";
import { ClubsPage } from "@/pages/ClubsPage";
import { ClubNews } from "@/pages/ClubNews";
import { Support } from "@/pages/Support";
import { About } from "@/pages/About";
import { AccountPage } from "@/pages/AccountPage";
import { InterestSelection } from "@/pages/InterestSelection";
import { NotFound } from "@/pages/error/NotFound";
import { FEATURES } from "@/config/features";

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

        {/* 헤더/푸터 있는 일반 페이지 */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/clubs" element={<ClubsPage />} />
          {FEATURES.clubNews && <Route path="/news" element={<ClubNews />} />}
          <Route path="/support" element={<Support />} />
          <Route path="/about" element={<About />} />
          <Route path="/club/:id" element={<ClubDetail />} />
          {FEATURES.clubCommunity && (
            <Route path="/club/:id/community" element={<CommunityRedirect />} />
          )}
          {/* 비회원 지원을 허용하므로 보호 라우트 밖에 둔다. 비회원 모드가 아니면 페이지가 로그인으로 보낸다. */}
          <Route path="/club/:id/apply" element={<ClubApplication />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          {FEATURES.clubCommunity && <Route path="/board" element={<BoardPage />} />}
          <Route element={<ProtectedRoute />}>
            {FEATURES.clubCommunity && (
              <>
                <Route path="/board/write" element={<BoardWrite />} />
                <Route path="/board/club/:clubId/:postId" element={<BoardPostDetail />} />
                <Route path="/board/club/:clubId/:postId/edit" element={<BoardWrite />} />
              </>
            )}
            {FEATURES.myClubs && (
              <Route path="/users/:studentId/clubs" element={<MyClubs />} />
            )}
            <Route
              path="/applications/:id/edit"
              element={<ClubApplication />}
            />
            <Route
              path="/applications/:id/view"
              element={<ClubApplication />}
            />
            <Route path="/users/:studentId/drafts" element={<ApplicationDrafts />} />
            <Route path="/users/:studentId/applications" element={<ApplicationStatus />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/onboarding/interests" element={<InterestSelection />} />
          </Route>

          {/* 배포에서 제외된 경로 등 매칭되지 않는 경로 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;

/** 예전 동아리 커뮤니티 주소는 통합게시판의 해당 동아리 게시판으로 보낸다. */
function CommunityRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/board?tab=club${id ? `&club=${id}` : ""}`} replace />;
}
