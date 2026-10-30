import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { api, type ClubResponse } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { getStoredInterests } from "@/lib/interests";
import { recommendClubs } from "@/lib/recommend";
import { cn } from "@/lib/utils";

/**
 * AI 추천 동아리 섹션
 * - 좌측: 관심 분야와 겹치는 동아리를 리스트로 보여 줍니다. (모집중인 동아리의 포스터 카드와 구분)
 * - 우측: 내가 고른 관심 분야를 칩으로 보여 줍니다. 누르면 그 분야로 좁혀 보고, 다시 누르면 해제합니다.
 */
/** 리스트에 보여 줄 최대 동아리 수 */
const MAX_ROWS = 5;

export function RecommendedSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const interests = useMemo(() => (user ? getStoredInterests(user.studentId) ?? [] : []), [user]);

  const [clubs, setClubs] = useState<ClubResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    api.getClubs()
      .then((data) => { if (active) setClubs(data); })
      .catch((error) => {
        console.error("Failed to load clubs for recommendation", error);
        if (active) setFailed(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
    };
  }, [attempt]);

  const recommended = useMemo(() => recommendClubs(clubs, interests), [clubs, interests]);

  const rows = recommended
    .filter(({ matched }) => !focused || matched.includes(focused))
    .slice(0, MAX_ROWS);

  // 로그인 전이거나 관심 분야를 고르지 않았다면 카드 대신 안내만 한 칸 너비로 보여 준다.
  const needsSetup = !user || interests.length === 0;

  const emptyState = (
    <div className="dream-data-state" role="status">
      {!user ? (
        <>
          <p>로그인하면 관심 분야에 맞는 동아리를 추천해드려요.</p>
          <button type="button" onClick={() => navigate("/login")}>로그인하기</button>
        </>
      ) : interests.length === 0 ? (
        <>
          <p>관심 분야를 선택하면 나에게 맞는 동아리를 추천해드려요.</p>
          <button type="button" onClick={() => navigate("/onboarding/interests")}>관심 분야 선택하기</button>
        </>
      ) : loading ? (
        <p>추천 동아리를 찾는 중입니다.</p>
      ) : failed ? (
        <>
          <p>동아리 정보를 불러오지 못했습니다.</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>다시 불러오기</button>
        </>
      ) : (
        <>
          <p>관심 분야와 맞는 동아리를 아직 찾지 못했어요.</p>
          <button type="button" onClick={() => navigate("/onboarding/interests")}>관심 분야 다시 고르기</button>
        </>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "dream-recruiting dream-recommend grid grid-cols-1 gap-8 lg:gap-12",
        needsSetup ? "dream-recruiting--single" : "lg:grid-cols-[minmax(0,1fr)_24rem]",
      )}
    >
      {/* 좌측 컬럼: AI 추천 동아리 (타이틀 + 가로 스크롤 카드) */}
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            <Sparkles className="size-6 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="dream-ai-gradient">AI</span> 추천 동아리
            </span>
          </h2>
        </div>
        {needsSetup || rows.length === 0 ? (
          emptyState
        ) : (
          <ul className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card">
            {rows.map(({ club, matched }) => (
              <li key={club.id} className="border-b border-border/70 last:border-b-0">
                <Link
                  to={`/club/${club.id}`}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-5"
                >
                  <img
                    src={club.image_url || "/logo.svg"}
                    alt=""
                    className="size-14 shrink-0 rounded-xl bg-muted object-cover"
                    loading="lazy"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {club.division || club.club_type || "기타"}
                      </span>
                      <span className="min-w-0 truncate font-bold text-foreground transition-colors group-hover:text-primary">
                        {club.name}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 text-xs font-semibold text-primary">
                      {matched.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
                    </div>
                  </div>
                  <span className="hidden shrink-0 text-sm font-semibold tabular-nums text-muted-foreground sm:inline">
                    {club.is_recruiting ? (club.recruit_end ? `~${club.recruit_end.slice(5).replace("-", ".")}` : "상시 모집") : "모집 마감"}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 우측 컬럼: 내 관심 분야 */}
      {!needsSetup && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">내 관심 분야</h2>
            <button
              type="button"
              onClick={() => navigate("/onboarding/interests")}
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              수정
            </button>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="내 관심 분야">
            {interests.map((interest) => {
              const isFocused = focused === interest;
              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={isFocused}
                  onClick={() => setFocused(isFocused ? null : interest)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    isFocused
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground shadow-xs hover:bg-muted/60",
                  )}
                >
                  {isFocused && <Check className="size-4" aria-hidden />}
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
