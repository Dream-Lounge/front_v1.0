import { useNavigate } from "react-router-dom";
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
import { NEWS_BADGE_CLASS, NEWS_ITEMS } from "@/data/news";

/** 홈에서는 최신 뉴스 일부만 노출합니다. */
const HOME_NEWS_COUNT = 4;

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
  const navigate = useNavigate();

  if (NEWS_ITEMS.length === 0) {
    return null;
  }

  const newsItems = NEWS_ITEMS.slice(0, HOME_NEWS_COUNT);

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
            onClick={() => navigate("/news")}
            className="flex size-8 shrink-0 items-center justify-center text-gray-900 transition-colors hover:text-gray-500"
          >
            <Plus className="size-6" />
          </button>
        </div>

        {/* 뉴스 제목 리스트 */}
        <ul className="flex flex-col">
          {newsItems.map((item, index) => (
            <li
              key={item.id}
              className={cn(index !== newsItems.length - 1 && "border-b border-gray-100")}
            >
              <button
                type="button"
                onClick={() => navigate("/news")}
                className="group flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Badge
                    className={cn(
                      "shrink-0 border-0 font-semibold",
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
