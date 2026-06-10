import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type Club } from "@/lib/api";
import { CLUB_DIVISION_KEYS } from "@/data/clubDirectoryMeta";

export function RecruitingSection() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    api.getClubs()
      .then((data) => setAllClubs(data))
      .catch(() => setAllClubs([]));
  }, []);

  const recruitingClubs = allClubs.filter((c) => c.is_recruiting).slice(0, 6);

  const divisionCounts = CLUB_DIVISION_KEYS.map((key) => ({
    name: key,
    count: allClubs.filter((c) => (c.division || "기타") === key).length,
  }));

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [recruitingClubs]);

  const scrollPrev = () => scrollRef.current?.scrollBy({ left: -360, behavior: "smooth" });
  const scrollNext = () => scrollRef.current?.scrollBy({ left: 360, behavior: "smooth" });

  return (
    <div className="flex flex-col">
      {/* 섹션 헤더 */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            모집중인 동아리
          </h2>
          <button
            type="button"
            aria-label="분과 전체보기"
            className="flex size-8 shrink-0 items-center justify-center text-gray-900 transition-colors hover:text-gray-500"
          >
            <Plus className="size-6" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            분과별 모아보기
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        {/* 좌측: 가로 스크롤 동아리 카드 */}
        <div className="relative min-w-0">
          {recruitingClubs.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              현재 모집중인 동아리가 없습니다.
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex h-full items-stretch gap-3 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {recruitingClubs.map((club) => (
                <Card
                  key={club.id}
                  className={cn(
                    "text-white",
                    "relative aspect-[3/4] h-full w-auto shrink-0 overflow-hidden border-none py-0 gap-0 shadow-sm",
                    "group cursor-pointer",
                    "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                  )}
                  onClick={() => navigate(`/club/${club.id}`)}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110 bg-slate-800"
                    style={club.image_url ? { backgroundImage: `url(${club.image_url})` } : undefined}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <CardContent className="relative z-10 flex h-full min-h-0 flex-col justify-between p-3.5">
                    <div className="flex items-start justify-between">
                      {club.division && (
                        <Badge className="border-none bg-primary/90 px-2.5 py-0.5 text-xs text-primary-foreground backdrop-blur-sm">
                          {club.division}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="mb-0.5 line-clamp-1 text-base font-bold drop-shadow-md">
                        {club.name}
                      </h3>
                      <p className="text-xs opacity-90 drop-shadow-sm">
                        {club.recruit_end
                          ? `~ ${new Date(club.recruit_end).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}`
                          : "상시모집"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {canScrollPrev && (
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="이전 동아리"
              className="absolute left-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-colors hover:bg-gray-50"
            >
              <ChevronLeft className="size-5 text-gray-600" />
            </button>
          )}

          {canScrollNext && (
            <button
              type="button"
              onClick={scrollNext}
              aria-label="다음 동아리"
              className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-colors hover:bg-gray-50"
            >
              <ChevronRight className="size-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* 우측: 분과별 모아보기 */}
        <aside className="flex w-full shrink-0 flex-col lg:w-96">
          {divisionCounts.map((division) => (
            <button
              key={division.name}
              type="button"
              className="group flex items-center justify-between border-b border-gray-100 py-4 text-left transition-colors hover:bg-gray-50/60"
              onClick={() => navigate("/clubs")}
            >
              <span className="font-bold text-gray-800 group-hover:text-gray-900">
                {division.name}
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-400">
                {division.count}개 동아리
                <ChevronRight className="size-4 group-hover:text-gray-600" />
              </span>
            </button>
          ))}

          <Button
            variant="outline"
            className={cn(
              "w-full h-12 shrink-0 mt-4",
              "text-gray-700 border-border",
              "hover:bg-gray-50 hover:text-gray-900",
              "cursor-pointer",
            )}
            asChild
          >
            <Link to="/clubs">전체 동아리</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
