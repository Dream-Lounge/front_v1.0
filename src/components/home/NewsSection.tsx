import {
  Plus,
  Laptop,
  Palette,
  Music,
  BookOpen,
  Trophy,
  Utensils,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * 뉴스 카테고리별 뱃지 색상
 */
const NEWS_BADGE_CLASS: Record<string, string> = {
  공지사항: "bg-blue-100 text-blue-700",
  행사: "bg-violet-100 text-violet-700",
  공연: "bg-rose-100 text-rose-700",
  모집공고: "bg-orange-100 text-orange-700",
  뉴스: "bg-emerald-100 text-emerald-700",
  안내: "bg-gray-100 text-gray-600",
};

/**
 * 뉴스 아이템 데이터 인터페이스
 */
interface NewsItem {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  imageUrl: string;
  comments: number;
}

/**
 * 임시 뉴스 데이터
 */
const NEWS_ITEMS: NewsItem[] = [
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
];

/**
 * 인기 태그 데이터 및 아이콘
 */
const TAGS = [
  { name: "프로그래밍", count: 15, icon: Laptop },
  { name: "디자인", count: 12, icon: Palette },
  { name: "음악", count: 18, icon: Music },
  { name: "독서토론", count: 9, icon: BookOpen },
  { name: "운동", count: 22, icon: Trophy },
  { name: "요리", count: 8, icon: Utensils },
  { name: "사진", count: 14, icon: Camera },
  { name: "영상편집", count: 10, icon: Camera },
  { name: "웹개발", count: 16, icon: Laptop },
  { name: "댄스", count: 17, icon: Music },
];

/**
 * 뉴스 섹션 컴포넌트
 * - 상단: 동아리 뉴스 제목 리스트
 * - 하단: 인기 태그 모음
 */
export function NewsSection() {
  if (NEWS_ITEMS.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      {/* 상단: 동아리 뉴스 */}
      <div className="flex w-full flex-col gap-6 sm:gap-8">
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">동아리 뉴스</h2>
          <button
            type="button"
            aria-label="뉴스 전체보기"
            className="flex size-8 shrink-0 items-center justify-center text-gray-900 transition-colors hover:text-gray-500"
          >
            <Plus className="size-6" />
          </button>
        </div>

        {/* 뉴스 제목 리스트 */}
        <ul className="flex flex-col">
          {NEWS_ITEMS.map((item, index) => (
            <li
              key={item.id}
              className={cn(index !== NEWS_ITEMS.length - 1 && "border-b border-gray-100")}
            >
              <button
                type="button"
                className="group flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Badge
                    className={cn(
                      "shrink-0 border-0 px-2 py-0.5 text-xs font-bold",
                      NEWS_BADGE_CLASS[item.category] ?? "bg-gray-100 text-gray-600",
                    )}
                  >
                    {item.category}
                  </Badge>
                  <span className="line-clamp-1 text-gray-700 transition-colors group-hover:text-primary">
                    {item.title}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-gray-400">{item.date}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 하단: 인기 태그 */}
      <div className="flex w-full flex-col gap-6 sm:gap-8">
        {/* 섹션 헤더 */}
        <div className="flex items-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">태그</h2>
        </div>

        {/* 태그 칩 */}
        <div className="flex flex-wrap gap-2.5">
          {TAGS.map((tag) => (
            <button
              key={tag.name}
              type="button"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              <tag.icon className="size-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{tag.name}</span>
              <span className="text-xs text-gray-400">{tag.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
