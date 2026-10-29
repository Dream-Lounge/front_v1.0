import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { api, type ClubResponse } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { getStoredInterests } from "@/lib/interests";
import { recommendClubs } from "@/lib/recommend";
import { cn } from "@/lib/utils";
import { ClubCardRail, type PosterClub } from "@/components/home/ClubCardRail";

/**
 * AI 추천 동아리 섹션 (모집중인 동아리 섹션과 같은 구성)
 * - 좌측: 관심 분야와 겹치는 동아리를 가로 스크롤 한 줄로 표시합니다.
 * - 우측: 내가 고른 관심 분야 목록. 누르면 그 분야로 좁혀 보고, 다시 누르면 해제합니다.
 */
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
  const countByInterest = useMemo(() => {
    const counts = new Map<string, number>();
    recommended.forEach(({ matched }) => matched.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return counts;
  }, [recommended]);

  const posters: PosterClub[] = recommended
    .filter(({ matched }) => !focused || matched.includes(focused))
    .map(({ club, matched }) => ({
      id: club.id,
      title: club.name,
      category: club.division || club.club_type || "기타",
      endDate: club.is_recruiting ? club.recruit_end?.replaceAll("-", ".") || "상시모집" : "모집 마감",
      image: club.image_url || "/logo.svg",
      // 추천 이유가 된 관심 분야를 카드에 #태그로 보여 준다. (공간상 최대 2개)
      tags: matched.slice(0, 2),
    }));

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
        <ClubCardRail clubs={needsSetup ? [] : posters} emptyState={emptyState} />
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
          <aside className="dream-divisions flex w-full shrink-0 flex-col lg:w-96">
            {interests.map((interest) => {
              const isFocused = focused === interest;
              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={isFocused}
                  onClick={() => setFocused(isFocused ? null : interest)}
                  className={cn(
                    "group flex items-center justify-between border-b border-gray-100 py-4 text-left transition-colors hover:bg-gray-50/60",
                    isFocused && "bg-accent/60",
                  )}
                >
                  <span className={cn("flex items-center gap-1.5 font-bold text-gray-800 group-hover:text-gray-900", isFocused && "text-primary")}>
                    {isFocused && <Check className="size-4" aria-hidden />}
                    {interest}
                  </span>
                  <span className="text-sm text-gray-400">{countByInterest.get(interest) ?? 0}개 동아리</span>
                </button>
              );
            })}
          </aside>
        </div>
      )}
    </div>
  );
}
