import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { MoreLink } from "@/components/common/MoreLink";
import { api, type Club } from "@/lib/api";
import { CLUB_DIVISION_KEYS } from "@/data/clubDirectoryMeta";

export function RecruitingSection() {
  const navigate = useNavigate();
  const [allClubs, setAllClubs] = useState<Club[]>([]);

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

  return (
    <div className="flex flex-col">
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          모집중인 동아리
        </h2>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          분과별 모아보기
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-stretch gap-8 lg:gap-12 w-full mx-auto">
        {/* 좌측 영역 */}
        <div className="flex-1 min-w-0">
          {recruitingClubs.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              현재 모집중인 동아리가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {recruitingClubs.map((club) => (
                <Card
                  key={club.id}
                  className={cn(
                    "text-white",
                    "relative aspect-[4/5] w-full overflow-hidden border-none py-0 gap-0 shadow-sm",
                    "group cursor-pointer",
                    "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                  )}
                  onClick={() => navigate(`/club/${club.id}`)}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110 bg-slate-800"
                    style={club.image_url ? { backgroundImage: `url(${club.image_url})` } : undefined}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  <CardContent className="relative z-10 flex h-full min-h-0 flex-col justify-between p-4">
                    <div className="flex justify-between items-start">
                      {club.division && (
                        <Badge className="bg-primary/90 text-primary-foreground border-none py-1 px-3 backdrop-blur-sm">
                          {club.division}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1 drop-shadow-md">
                        {club.name}
                      </h3>
                      <p className="text-sm opacity-90 drop-shadow-sm">
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
        </div>

        {/* 우측 사이드바 */}
        <aside className="flex w-full shrink-0 flex-col gap-6 sm:gap-8 lg:w-96 lg:self-stretch lg:min-h-0">
          <div className="space-y-4">
            {divisionCounts.map((division) => (
              <div
                key={division.name}
                className="flex justify-between items-center group cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/clubs`)}
                onKeyDown={(e) => { if (e.key === "Enter") navigate("/clubs"); }}
              >
                <span className="text-gray-700 font-medium group-hover:text-gray-900">
                  {division.name}
                </span>
                <MoreLink className="text-gray-400 group-hover:text-gray-600">
                  {division.count}개 동아리
                </MoreLink>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className={cn(
              "w-full h-12 shrink-0",
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
