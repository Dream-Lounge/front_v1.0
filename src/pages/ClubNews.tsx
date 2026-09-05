import { useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  NEWS_BADGE_CLASS,
  NEWS_CATEGORY_FILTERS,
  NEWS_ITEMS,
  type NewsItem,
} from "@/data/news";

/**
 * 동아리 뉴스 페이지
 * - 카테고리 필터로 뉴스를 추려 볼 수 있습니다.
 * - 최신순으로 정렬하며, 가장 최근 소식은 상단에 크게 노출합니다.
 */
export function ClubNews() {
  const [category, setCategory] = useState<string>("전체");

  // 최신순 정렬
  const sorted = useMemo(
    () => [...NEWS_ITEMS].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );

  const filtered = useMemo(
    () =>
      category === "전체"
        ? sorted
        : sorted.filter((item) => item.category === category),
    [sorted, category],
  );

  return (
    <div className="mx-auto w-full max-w-7xl pb-16 sm:pb-20">
      <div className="flex flex-col gap-6 sm:gap-8">
        {/* 페이지 헤더 */}
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          동아리 뉴스
        </h1>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NEWS_CATEGORY_FILTERS.map((label) => {
            const isActive = category === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setCategory(label)}
                aria-pressed={isActive}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-foreground shadow-xs hover:bg-muted/60",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            해당 카테고리의 뉴스가 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col border-t border-border/60">
            {filtered.map((item) => (
              <li key={item.id}>
                <NewsRow item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** 카테고리 뱃지 */
function CategoryBadge({ category }: { category: string }) {
  return (
    <Badge
      className={cn(
        "shrink-0 border-0 font-semibold",
        NEWS_BADGE_CLASS[category] ?? "bg-gray-100 text-gray-600",
      )}
    >
      {category}
    </Badge>
  );
}

/** 댓글 수 + 날짜 */
function NewsMeta({ item }: { item: NewsItem }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span className="tabular-nums">{item.date}</span>
      <span className="inline-flex items-center gap-1.5">
        <MessageSquare className="size-4 opacity-80" aria-hidden />
        <span className="tabular-nums">{item.comments}</span>
      </span>
    </div>
  );
}

/** 목록 한 줄 — 제목·요약 */
function NewsRow({ item }: { item: NewsItem }) {
  return (
    <button
      type="button"
      className="group flex w-full items-start border-b border-border/60 py-5 text-left transition-colors hover:bg-muted/40 sm:py-6"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <CategoryBadge category={item.category} />
        </div>
        <h2 className="line-clamp-1 font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
          {item.title}
        </h2>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
        <NewsMeta item={item} />
      </div>
    </button>
  );
}
