/**
 * 배포 단계에서 노출 여부를 조절하는 기능 플래그.
 * 코드는 지우지 않고 VITE_FEATURE_* 환경변수로 노출만 켜고 끕니다.
 * 값을 지정하지 않으면 기본값은 true(노출)이며, .env.production에서
 * 이번 배포 범위에 맞춰 개별적으로 false 처리합니다.
 */
export const FEATURES = {
  /** 동아리 뉴스 (헤더 메뉴, 홈 뉴스 섹션, /news) */
  clubNews: import.meta.env.VITE_FEATURE_CLUB_NEWS !== "false",
  /** 내 동아리 (/users/:studentId/clubs) */
  myClubs: import.meta.env.VITE_FEATURE_MY_CLUBS !== "false",
  /** AI 추천 태그 (모집중인 동아리 AI추천 뱃지, 관심사 기반 추천 안내) */
  aiRecommend: import.meta.env.VITE_FEATURE_AI_RECOMMEND !== "false",
  /** 동아리 커뮤니티 (/club/:id/community, 관리자 게시판 관리) */
  clubCommunity: import.meta.env.VITE_FEATURE_CLUB_COMMUNITY !== "false",
} as const;
