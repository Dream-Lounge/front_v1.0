/**
 * 동아리 뉴스 데이터
 * - 홈 화면 뉴스 섹션과 동아리 뉴스 페이지에서 공용으로 사용합니다.
 */

/** 뉴스 카테고리별 뱃지 색상 */
export const NEWS_BADGE_CLASS: Record<string, string> = {
  공지사항: "bg-blue-100 text-blue-700",
  행사: "bg-violet-100 text-violet-700",
  공연: "bg-rose-100 text-rose-700",
  모집공고: "bg-orange-100 text-orange-700",
  뉴스: "bg-emerald-100 text-emerald-700",
  안내: "bg-gray-100 text-gray-600",
};

/** 뉴스 아이템 데이터 인터페이스 */
export interface NewsItem {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  imageUrl: string;
  comments: number;
}

/** 임시 뉴스 데이터 */
export const NEWS_ITEMS: NewsItem[] = [
  {
    id: 1,
    title: "2026년도 1학기 동아리 등록 기간 안내",
    description:
      "새로운 학기를 맞아 동아리 등록/재등록 기간이 시작되었습니다. 기간 내에 신청서를 제출해주세요.",
    date: "2026.03.02",
    category: "공지사항",
    imageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop",
    comments: 12,
  },
  {
    id: 2,
    title: "제5회 드림라운지 연합 해커톤 개최 결과 발표",
    description:
      "지난 주말 진행된 연합 해커톤의 수상팀을 발표합니다. 참여해주신 모든 분들께 감사드립니다.",
    date: "2026.02.28",
    category: "행사",
    imageUrl:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop",
    comments: 8,
  },
  {
    id: 3,
    title: "신규 동아리실 배정 결과 및 이용 수칙 안내",
    description:
      "2026년도 동아리실 배정 결과가 발표되었습니다. 각 동아리 대표자분들은 확인 부탁드립니다.",
    date: "2026.02.25",
    category: "공지사항",
    imageUrl:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop",
    comments: 5,
  },
  {
    id: 4,
    title: "봄맞이 동아리 거리 공연 일정 안내",
    description: "따뜻한 봄날 캠퍼스 곳곳에서 펼쳐지는 예쁜 선율을 즐겨보세요.",
    date: "2026.03.10",
    category: "공연",
    imageUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop",
    comments: 24,
  },
  {
    id: 5,
    title: "2026 상반기 신입 부원 모집 동아리 통합 공고",
    description:
      "밴드, 사진, 봉사 등 32개 동아리가 신입 부원을 모집합니다. 관심 있는 동아리에 지원해보세요.",
    date: "2026.03.08",
    category: "모집공고",
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop",
    comments: 31,
  },
  {
    id: 6,
    title: "동아리 지원금 신청 방법이 변경되었습니다",
    description:
      "올해부터 지원금 신청이 온라인으로 전환됩니다. 변경된 절차를 확인해주세요.",
    date: "2026.03.05",
    category: "안내",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop",
    comments: 3,
  },
  {
    id: 7,
    title: "사진예술연구회, 교내 사진전 '봄의 기록' 개최",
    description:
      "학생회관 1층 전시실에서 3월 한 달간 진행됩니다. 누구나 자유롭게 관람할 수 있습니다.",
    date: "2026.03.03",
    category: "행사",
    imageUrl:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=2070&auto=format&fit=crop",
    comments: 17,
  },
  {
    id: 8,
    title: "동아리 연합회 정기총회 결과 공유",
    description:
      "2026년도 사업 계획 및 예산안이 의결되었습니다. 자세한 내용은 첨부 자료를 참고해주세요.",
    date: "2026.02.20",
    category: "뉴스",
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop",
    comments: 6,
  },
];

/** 뉴스 카테고리 필터 목록 (전체 + 실제 사용 중인 카테고리) */
export const NEWS_CATEGORY_FILTERS = [
  "전체",
  ...Array.from(new Set(NEWS_ITEMS.map((item) => item.category))),
] as const;
