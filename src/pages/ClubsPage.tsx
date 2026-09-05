import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LayoutGrid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRecruitmentLabel } from "@/lib/date";
import { mapClubResponse, type ClubData } from "@/data/clubs";
import {
  CLUB_CATEGORY_FILTERS,
  CLUB_DIVISION_KEYS,
  type ClubDirectoryMeta,
  type ClubDivision,
} from "@/data/clubDirectoryMeta";
import { api, type ClubResponse } from "@/lib/api";

type ViewMode = "card" | "list";

type ClubRow = { id: string } & Omit<ClubData, "coverImage"> & ClubDirectoryMeta;

function toClubRow(club: ClubResponse): ClubRow {
  const data = mapClubResponse(club);
  const division = CLUB_DIVISION_KEYS.includes(club.division as ClubDivision)
    ? club.division as ClubDivision
    : "학과";
  const recruitmentLabel = club.recruit_end
    ? `~${Number(club.recruit_end.slice(5, 7))}월 ${Number(club.recruit_end.slice(8, 10))}일`
    : club.activity_period || "상시모집";
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: club.id,
    ...data,
    division,
    memberCount: club.member_count,
    recruitmentLabel,
    deadlineToday: club.recruit_end === today,
    coverImage: club.image_url,
  };
}

/** 카드·리스트 썸네일: 시안처럼 어두운 네이비 톤 베이스 */
const thumbShellClass =
  "relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-slate-950";

/** 모집 상태별 표시 색상 (포스터 위에 얹히는 점 + 텍스트) */
const RECRUITMENT_STATUS_DOT_CLASS: Record<string, string> = {
  모집중: "bg-emerald-400",
  모집예정: "bg-amber-400",
  모집마감: "bg-slate-400",
};

/**
 * 동아리 찾기 — 분과 필터, 카드/리스트 전환, 동아리 그리드
 */
export function ClubsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [division, setDivision] = useState<"all" | ClubDivision>("all");
  const [view, setView] = useState<ViewMode>("card");
  const [allRows, setAllRows] = useState<ClubRow[]>([]);

  useEffect(() => {
    let active = true;
    api.getClubs(searchParams.get("search") || undefined)
      .then((clubs) => {
        if (active) setAllRows(clubs.map(toClubRow));
      })
      .catch((error) => {
        console.error("Failed to load clubs", error);
        if (active) setAllRows([]);
      });
    return () => {
      active = false;
    };
  }, [searchParams]);

  const filtered = useMemo(() => {
    if (division === "all") return allRows;
    return allRows.filter((row) => row.division === division);
  }, [allRows, division]);

  const activeFilterLabel =
    CLUB_CATEGORY_FILTERS.find((f) => f.key === division)?.label ?? "전체";

  const sectionTitle =
    division === "all" ? "전체 동아리" : `${activeFilterLabel} 동아리`;

  return (
    <div className="mx-auto w-full max-w-7xl pb-16 sm:pb-20">
      <div className="flex flex-col gap-6 rounded-2xl bg-muted/45 px-3 py-6 sm:gap-8 sm:px-6 sm:py-8">
        {/* 섹션 헤더 + 뷰 전환 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {sectionTitle}
            </span>
            <span className="text-base font-semibold tabular-nums text-primary sm:text-lg">
              {filtered.length}
            </span>
          </h1>

          <div
            className="inline-flex self-start rounded-xl bg-muted/80 p-1 sm:self-auto"
            role="group"
            aria-label="보기 방식"
          >
            <button
              type="button"
              onClick={() => setView("card")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                view === "card"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              카드형
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                view === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-4 w-4" aria-hidden />
              리스트형
            </button>
          </div>
        </div>

        {/* 분과 필터 바 */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CLUB_CATEGORY_FILTERS.map(
            ({ key, label, icon: Icon, inactiveIconClass }) => {
              const isActive = division === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDivision(key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground shadow-xs hover:bg-muted/60",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive
                        ? "text-primary-foreground"
                        : inactiveIconClass,
                    )}
                    aria-hidden
                  />
                  {label}
                </button>
              );
            },
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            아직 {activeFilterLabel} 분과에 등록된 동아리가 없습니다.
          </p>
        ) : view === "card" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {filtered.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                onOpen={() => navigate(`/club/${club.id}`)}
              />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card">
            {filtered.map((club, index) => (
              <li
                key={club.id}
                className={cn(index !== 0 && "border-t border-border/60")}
              >
                <ClubListRow
                  club={club}
                  onOpen={() => navigate(`/club/${club.id}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ClubThumb({
  club,
  aspectClass,
  children,
}: {
  club: ClubRow;
  aspectClass: string;
  /** 포스터 하단 불투명 영역에 얹을 내용 (카드형 정보 오버레이) */
  children?: ReactNode;
}) {
  return (
    <div className={cn(thumbShellClass, aspectClass)}>
      {club.coverImage ? (
        <img
          src={club.coverImage}
          alt=""
          className="h-full w-full object-cover opacity-[0.88]"
          loading="lazy"
        />
      ) : (
        <div className="relative z-[1] flex h-full w-full items-center justify-center text-xs font-medium text-white/45">
          CLUB
        </div>
      )}

      {/* 상단 배지 대비용 얕은 그라디언트 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent"
        aria-hidden
      />

      <div className="absolute left-3 top-3 z-[2] flex flex-wrap items-start gap-2">
        <Badge className="border-0 bg-primary font-semibold text-primary-foreground shadow-sm">
          {club.division}
        </Badge>
      </div>
      {club.deadlineToday && (
        <div className="absolute right-3 top-3 z-[2]">
          <Badge className="border-0 bg-primary font-semibold text-primary-foreground shadow-sm">
            오늘까지
          </Badge>
        </div>
      )}

      {children && (
        <>
          {/* 하단 정보가 얹히는 불투명 배경 */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/95 via-black/70 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 z-[2] p-4">{children}</div>
        </>
      )}
    </div>
  );
}

function ClubCard({
  club,
  onOpen,
}: {
  club: ClubRow;
  onOpen: () => void;
}) {
  const visibleTags = club.tags.slice(0, 3);

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl border-none py-0 shadow-sm transition-shadow",
        "hover:shadow-md",
      )}
    >
      <ClubThumb club={club} aspectClass="aspect-[3/4] w-full">
        <div className="flex flex-col gap-2 text-white">
          <h2 className="line-clamp-1 text-lg font-bold leading-snug drop-shadow-md">
            {club.title}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Badge
                key={tag}
                className="border-0 bg-white/15 font-normal text-white backdrop-blur-sm"
              >
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1 text-sm">
            <span className="inline-flex items-center gap-1.5 text-white/85">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  RECRUITMENT_STATUS_DOT_CLASS[club.recruitment.status] ?? "bg-white/70",
                )}
                aria-hidden
              />
              {club.recruitment.status}
            </span>
            <span className="shrink-0 font-semibold drop-shadow-sm">
              {formatRecruitmentLabel(club.recruitmentLabel)}
            </span>
          </div>
        </div>
      </ClubThumb>
    </Card>
  );
}

function ClubListRow({
  club,
  onOpen,
}: {
  club: ClubRow;
  onOpen: () => void;
}) {
  const visibleTags = club.tags.slice(0, 3);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full flex-col gap-2 px-4 py-3.5 text-left transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* 분과 */}
        <Badge className="w-16 shrink-0 justify-center border-0 bg-muted font-semibold text-muted-foreground">
          {club.division}
        </Badge>

        {/* 동아리명 */}
        <span className="min-w-0 flex-1 truncate font-bold text-foreground transition-colors group-hover:text-primary">
          {club.title}
        </span>

        {/* 모집 상태 */}
        <span className="hidden shrink-0 items-center gap-1.5 text-sm text-muted-foreground sm:inline-flex">
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              RECRUITMENT_STATUS_DOT_CLASS[club.recruitment.status] ?? "bg-muted-foreground/50",
            )}
            aria-hidden
          />
          {club.recruitment.status}
        </span>

        {/* 마감 */}
        <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
          {club.deadlineToday
            ? "오늘까지"
            : formatRecruitmentLabel(club.recruitmentLabel)}
        </span>
      </div>

      {/* 태그 */}
      <div className="flex flex-wrap gap-1.5">
        {visibleTags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="font-normal text-secondary-foreground"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </button>
  );
}
