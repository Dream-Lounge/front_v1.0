import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArrowButton } from "@/components/common/ScrollArrowButton";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";
import { formatEndDateLabel } from "@/lib/date";
import { cn } from "@/lib/utils";

export interface PosterClub {
  id: string;
  title: string;
  category: string;
  /** "2026.12.31" 형식이면 마감일 라벨로 바꿔 보여 주고, 아니면 그대로 표시합니다. */
  endDate: string;
  image: string;
  aiRecommended?: boolean;
}

interface ClubCardRailProps {
  clubs: PosterClub[];
  /** 카드가 없을 때 대신 보여 줄 안내 (불러오는 중, 오류, 결과 없음 등) */
  emptyState?: ReactNode;
}

/**
 * 홈 화면의 가로 스크롤 동아리 포스터 줄
 * - 모집중인 동아리와 AI 추천 동아리가 같은 모양을 쓰도록 공통으로 둡니다.
 */
export function ClubCardRail({ clubs, emptyState }: ClubCardRailProps) {
  const navigate = useNavigate();
  const clubScroll = useHorizontalScroll<HTMLDivElement>();

  return (
    <div className="relative min-w-0 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <div
        ref={clubScroll.ref}
        className="dream-club-track flex items-stretch gap-3 overflow-x-auto scroll-smooth lg:h-full [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {clubs.length === 0 && emptyState}
        {clubs.map((club) => (
          <Card
            key={club.id}
            className={cn(
              "dream-club-card relative aspect-[3/4] h-36 w-auto shrink-0 overflow-hidden border-none py-0 gap-0 text-white shadow-sm sm:h-56 lg:h-full",
              "group cursor-pointer",
              "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
            )}
            role="link"
            tabIndex={0}
            aria-label={`${club.title} 동아리 상세 보기`}
            onKeyDown={(event) => { if (event.key === "Enter") navigate(`/club/${club.id}`); }}
            onClick={() => navigate(`/club/${club.id}`)}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${club.image})` }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <CardContent className="relative z-10 flex h-full min-h-0 flex-col justify-between p-3.5">
              <div className="flex items-start justify-between gap-2">
                <Badge className="border-none bg-primary/90 font-semibold text-primary-foreground backdrop-blur-sm">
                  {club.category}
                </Badge>
                {club.aiRecommended && (
                  <Badge className="shrink-0 gap-1 border-none bg-white/85 px-1.5 font-semibold text-primary backdrop-blur-sm sm:px-2.5">
                    <Sparkles className="size-3" />
                    <span className="hidden sm:inline">AI추천</span>
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="mb-0.5 line-clamp-1 text-base font-bold drop-shadow-md">
                  {club.title}
                </h3>
                <p className="text-xs opacity-90 drop-shadow-sm">
                  {formatEndDateLabel(club.endDate)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clubScroll.canScrollPrev && (
        <ScrollArrowButton
          direction="prev"
          onClick={() => clubScroll.scroll("prev", 360)}
          label="이전 동아리"
          className="absolute left-0 top-1/2 size-10 -translate-y-1/2"
        />
      )}
      {clubScroll.canScrollNext && (
        <ScrollArrowButton
          direction="next"
          onClick={() => clubScroll.scroll("next", 360)}
          label="다음 동아리"
          className="absolute right-0 top-1/2 size-10 -translate-y-1/2"
        />
      )}
    </div>
  );
}
