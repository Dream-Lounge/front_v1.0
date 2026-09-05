import { HeroCarousel } from "@/components/home/HeroCarousel";
import { RecruitingSection } from "@/components/home/RecruitingSection";

/**
 * 메인 홈 페이지 컴포넌트
 * - 서비스의 진입점으로 히어로 섹션, 검색, 추천 동아리 목록 등을 구성합니다.
 */
export function Home() {
  return (
    <div className="flex flex-col gap-8 sm:gap-14 pb-16 sm:pb-20">
      {/** 히어로 섹션: 주요 프로모션 및 동아리 홍보 슬라이드 */}
      <HeroCarousel />

      {/** 모집중인 동아리 및 분과별 섹션 (기존 검색 섹션 대체) */}
      <RecruitingSection />
    </div>
  );
}
