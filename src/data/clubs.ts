import type { ClubContactLink, ClubResponse } from "@/lib/api";

/**
 * 동아리 데이터 타입 정의
 * - 백엔드 API 응답을 시뮬레이션하기 위한 공유 타입
 */
export interface ClubData {
  title: string;
  category: string;
  tags: string[];
  description: string;
  longDescription: string;
  coverImage?: string;
  activities: { id: number; title: string; image: string }[];
  contacts: ClubContactLink[];
  recruitment: {
    status: string;
    period: string;
    target: string;
    process: string;
  };
}

/**
 * 동아리 지원 페이지에서 사용하는 축소된 타입
 * - ClubData에서 title, category, description만 추출
 */
export type ClubApplicationData = Pick<
  ClubData,
  "title" | "category" | "description"
>;

export function mapClubResponse(club: ClubResponse): ClubData {
  const period = club.recruit_start && club.recruit_end
    ? `${club.recruit_start} ~ ${club.recruit_end}`
    : club.activity_period || "상시";

  return {
    title: club.name,
    category: club.division || club.club_type || "기타",
    tags: club.tags.map((tag) => `#${tag.tag_value.replace(/^#/, "")}`),
    description: club.tagline || club.description || `${club.name} 동아리입니다.`,
    longDescription: club.description || `${club.name} 활동을 소개합니다.`,
    coverImage: club.image_url ?? undefined,
    activities: club.activity_image_details?.length
      ? [...club.activity_image_details]
          .sort((a, b) => a.order_index - b.order_index)
          .map((item, index) => ({
            id: index + 1,
            title: item.caption || `${club.name} 활동 ${index + 1}`,
            image: item.image_url,
          }))
      : club.activity_images.map((image, index) => ({
          id: index + 1,
          title: `${club.name} 활동 ${index + 1}`,
          image,
        })),
    contacts: club.contact_links?.length
      ? club.contact_links
      : [
          ...(club.contact_email ? [{ type: "email" as const, label: "이메일", value: club.contact_email }] : []),
          ...(club.contact_phone ? [{ type: "phone" as const, label: "전화번호", value: club.contact_phone }] : []),
          ...(club.open_chat_url ? [{ type: "url" as const, label: "오픈채팅", value: club.open_chat_url }] : []),
        ],
    recruitment: {
      status: club.is_recruiting ? "모집중" : "모집마감",
      period,
      target: "재학생",
      process: club.activity_purpose || "서류 심사",
    },
  };
}

function stubClub(
  title: string,
  category: string,
  tags: string[],
  recruitment: ClubData["recruitment"],
): ClubData {
  return {
    title,
    category,
    tags,
    description: `${title} 동아리입니다.`,
    longDescription: `${title} 활동에 관심 있는 학우들의 참여를 기다립니다.`,
    activities: [],
    contacts: [],
    recruitment,
  };
}

/**
 * 동아리 목업 데이터 상수
 * - 성능 최적화를 위해 컴포넌트 외부에 정의
 * - ID를 키로 사용하여 O(1) 조회가 가능하도록 구성
 * - 백엔드 API 응답을 시뮬레이션
 */
export const MOCK_CLUB_DATA: Record<string, ClubData> = {
  "1": stubClub(
    "디스토션",
    "공연",
    ["#밴드", "#라이브", "#버스킹"],
    {
      status: "모집중",
      period: "~2025.09.26",
      target: "재학생",
      process: "서류 심사",
    },
  ),
  "2": stubClub(
    "RCY",
    "봉사",
    ["#봉사", "#RCY", "#나눔"],
    {
      status: "모집중",
      period: "상시",
      target: "재학생",
      process: "간단 면담",
    },
  ),
  "3": stubClub(
    "사진예술연구회",
    "교양",
    ["#사진", "#전시", "#아날로그"],
    {
      status: "모집중",
      period: "~2025.09.26",
      target: "재학생",
      process: "포트폴리오 제출",
    },
  ),
  "4": stubClub(
    "스매시",
    "체육",
    ["#배드민턴", "#운동", "#친목"],
    {
      status: "모집중",
      period: "~2025.09.28",
      target: "재학생",
      process: "체험 세션",
    },
  ),
  "5": stubClub(
    "FC 드림 (축구)",
    "체육",
    ["#축구", "#친목", "#기초운동"],
    {
      status: "모집중",
      period: "상시",
      target: "재학생",
      process: "체험 참가",
    },
  ),
  "6": {
    title: "CPR",
    category: "학술",
    tags: ["#코딩", "#취준", "#대학원", "#인공지능"],
    description:
      "프로그래밍과 AI에 대한 열정을 실현하며 미래를 준비하는 동아리 입니다.",
    longDescription: `
      우리 동아리는 학생들이 자신의 꿈과 목표를 찾고, 그것을 실현하기 위한 실질적인 지식과 경험을 쌓을 수 있는 동아리 활동을 제공하는 것이 CPR의 목표입니다!
우리는 취업과 진학이라는 두 가지 주요 진로 방향에 맞춰 체계적인 지원 시스템을 구축하여, 부원들이 각자의 길을 찾고 성장할 수 있도록 서포트하는 동아리입니다.
    `,
    activities: [
      {
        id: 1,
        title: "코딩테스트 스터디",
        image: "/images/coding_test_study.jpg",
      },
      {
        id: 2,
        title: "AI 논문 리뷰",
        image: "/images/paper_review.png",
      },
      {
        id: 3,
        title: "미래 준비에 대한 교수님 초청 강연",
        image: "/images/lecture.png",
      },
    ],
    contacts: [],
    recruitment: {
      status: "모집예정",
      period: "2026.03.01 ~ 2026.03.14",
      target: "코딩과 인공지능에 열정 있는 모든 재학생 (전공 무관)",
      process: "서류 심사 > 면접 > 최종 합격",
    },
  },
  "7": stubClub(
    "코딩 마스터즈",
    "학술",
    ["#웹개발", "#AI", "#스터디"],
    {
      status: "모집중",
      period: "~2025.12.30",
      target: "재학생",
      process: "서류 심사",
    },
  ),
  "8": stubClub(
    "디지털 아트 크리에이터",
    "문화예술",
    ["#UI", "#그래픽", "#크리에이티브"],
    {
      status: "모집중",
      period: "~2026.01.15",
      target: "재학생",
      process: "작품 제출",
    },
  ),
  "9": stubClub(
    "CCM찬양팀",
    "종교사회",
    ["#CCM", "#찬양", "#예배"],
    {
      status: "모집중",
      period: "상시",
      target: "재학생",
      process: "오디션",
    },
  ),
  "10": stubClub(
    "드림풋살",
    "체육",
    ["#풋살", "#친목", "#리그"],
    {
      status: "모집중",
      period: "~2025.11.20",
      target: "재학생",
      process: "체험 참가",
    },
  ),
  "11": stubClub(
    "인공지능 연구회",
    "학술",
    ["#머신러닝", "#딥러닝", "#프로젝트"],
    {
      status: "모집중",
      period: "~2025.12.29",
      target: "재학생",
      process: "서류 심사",
    },
  ),
};

/**
 * 동아리 지원 페이지용 데이터 가져오기 함수
 * - API에서 전체 데이터를 받아온 후 필요한 필드만 추출하는 시나리오 시뮬레이션
 * @param id 동아리 ID
 * @returns title, category, description만 포함된 데이터 또는 null
 */
export function getClubApplicationData(
  id: string,
): ClubApplicationData | null {
  const fullData = MOCK_CLUB_DATA[id];
  if (!fullData) return null;

  return {
    title: fullData.title,
    category: fullData.category,
    description: fullData.description,
  };
}
