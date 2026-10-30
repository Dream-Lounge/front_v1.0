import { HeroCarousel } from "@/components/home/HeroCarousel";
import { RecruitingSection } from "@/components/home/RecruitingSection";
import { RecommendedSection } from "@/components/home/RecommendedSection";
import { FEATURES } from "@/config/features";
import { GuideDialog } from "@/components/home/GuideDialog";

/**
 * 메인 홈 페이지 컴포넌트
 * - 서비스의 진입점으로 히어로 섹션, 검색, 추천 동아리 목록 등을 구성합니다.
 */
export function Home() {
  return (
    <div className="dream-home flex flex-col gap-8 sm:gap-14 pb-16 sm:pb-20">
      {/** 히어로 섹션: 주요 프로모션 및 동아리 홍보 슬라이드 */}
      <HeroCarousel />

      {/** 모집중인 동아리 및 분과별 섹션 (기존 검색 섹션 대체) */}
      <RecruitingSection />

      {/** 관심 분야 기반 AI 추천 동아리 (배포 범위는 기능 플래그로 조절) */}
      {FEATURES.aiRecommend && <RecommendedSection />}

      {/** 진입 시 이용 가이드 팝업 ('오늘 하루 보지 않기' 지원) */}
      <GuideDialog />
    </div>
  );
}
