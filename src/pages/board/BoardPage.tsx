import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginAlertDialog } from "@/components/common/LoginAlertDialog";
import { BoardPostList } from "@/components/board/BoardPostList";
import { useAuth } from "@/hooks/useAuth";
import { api, isSessionExpiredError, type ActiveClubItem, type PostListItem } from "@/lib/api";
import { BOARD_TABS, parseBoardTab, sortByJoinedAt, sortPosts, type BoardTab } from "@/lib/board";
import { cn } from "@/lib/utils";

const TAB_DESCRIPTIONS: Record<BoardTab, string> = {
  all: "Dream Lounge 회원이라면 누구나 자유롭게 글을 남길 수 있어요.",
  notice: "서비스 점검, 업데이트, 정책, 전체 행사 소식을 알려드려요.",
  club: "가입한 동아리 부원끼리 소식과 공지를 나눠요.",
};

/**
 * 통합게시판 (헤더 '게시판')
 * - 전체게시판: 회원 자유 글 (API 준비 전까지 목록이 비어 있음)
 * - 서비스/공지: 전체 열람, 연합회·개발팀 작성 (API 준비 전까지 목록이 비어 있음)
 * - 동아리 게시판: 정식 부원만 접근, 가입한 동아리가 여럿이면 가입 순서대로 드롭다운
 */
export function BoardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseBoardTab(searchParams.get("tab"));
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isLoginAlertOpen, setIsLoginAlertOpen] = useState(false);

  const selectTab = (next: BoardTab) => setSearchParams({ tab: next }, { replace: true });

  const goWrite = () => {
    if (!isAuthenticated) {
      setIsLoginAlertOpen(true);
      return;
    }
    navigate(`/board/write?tab=${tab}${tab === "club" && searchParams.get("club") ? `&club=${searchParams.get("club")}` : ""}`);
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-6 pb-16">
      {/* 제목 옆에 탭별 설명, 오른쪽 끝에 글쓰기 (서비스/공지는 연합회·개발팀만 작성하므로 숨김) */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <h1 className="shrink-0 text-2xl font-bold text-foreground">{tab === "club" ? "동아리 게시판" : "게시판"}</h1>
          <p className="break-keep text-sm text-muted-foreground">{TAB_DESCRIPTIONS[tab]}</p>
        </div>
        {tab !== "notice" && <WriteButton onClick={goWrite} />}
      </div>

      {/* 세 칸이 폭을 나눠 가져 좁은 화면에서도 잘리지 않는다. */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/80 p-1" role="tablist" aria-label="게시판 종류">
        {BOARD_TABS.map(({ key, label, shortLabel }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-label={label}
            onClick={() => selectTab(key)}
            className={cn(
              "rounded-lg px-2 py-2.5 text-sm font-semibold transition-colors",
              tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <section role="tabpanel" className="flex flex-col gap-4">
        {tab === "club" ? (
          <ClubBoard />
        ) : (
          // TODO: 전체게시판·서비스/공지 API가 준비되면 목록 연결
          <BoardPostList posts={[]} getHref={() => "#"} emptyText="아직 등록된 글이 없습니다." />
        )}
      </section>

      <LoginAlertDialog
        open={isLoginAlertOpen}
        onOpenChange={setIsLoginAlertOpen}
        reason="글쓰기는 Dream Lounge 회원만 이용할 수 있습니다."
      />
    </div>
  );
}

function WriteButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick} className="h-9 shrink-0 gap-1.5 px-4">
      <PenLine className="size-4" aria-hidden />
      글쓰기
    </Button>
  );
}

function ClubBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [clubs, setClubs] = useState<ActiveClubItem[] | null>(null);
  const [posts, setPosts] = useState<PostListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  // 정식 부원으로 등록된 동아리 (가입한 순서대로)
  useEffect(() => {
    if (!user) return;
    let active = true;
    api.getMyClubs()
      .then((data) => { if (active) setClubs(sortByJoinedAt(data)); })
      .catch((error) => {
        if (active && !isSessionExpiredError(error)) setFailed(true);
      });
    return () => { active = false; };
  }, [user]);

  const requestedClubId = searchParams.get("club");
  const selectedClub = useMemo(
    () => clubs?.find((club) => club.club_id === requestedClubId) ?? clubs?.[0] ?? null,
    [clubs, requestedClubId],
  );

  useEffect(() => {
    if (!selectedClub) return;
    let active = true;
    setPosts(null);
    api.getClubPosts(selectedClub.club_id)
      .then((data) => { if (active) setPosts(sortPosts(data)); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [selectedClub]);

  if (isAuthLoading) return null;

  // 비회원은 동아리 게시판에 접근할 수 없다.
  if (!user) {
    return (
      <div className="dream-data-state" role="status">
        <p>동아리 게시판은 로그인한 동아리 부원만 이용할 수 있어요.</p>
        <button type="button" onClick={() => navigate("/login", { state: { from: location.pathname + location.search } })}>
          로그인하기
        </button>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="dream-data-state" role="status">
        <p>게시판을 불러오지 못했습니다.</p>
        <button type="button" onClick={() => window.location.reload()}>다시 불러오기</button>
      </div>
    );
  }

  if (!clubs) return <div className="dream-data-state" role="status"><p>가입한 동아리를 확인하는 중입니다.</p></div>;

  if (clubs.length === 0) {
    return (
      <div className="dream-data-state" role="status">
        <p>아직 가입한 동아리가 없어요.<br />최종 합격 후 정식 부원으로 등록되면 동아리 게시판을 이용할 수 있어요.</p>
        <button type="button" onClick={() => navigate("/clubs")}>동아리 찾아보기</button>
      </div>
    );
  }

  const club = selectedClub ?? clubs[0];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {clubs.length > 1 ? (
          <div className="relative w-full max-w-[260px]">
            <select
              aria-label="동아리 선택"
              value={club.club_id}
              onChange={(event) => setSearchParams({ tab: "club", club: event.target.value }, { replace: true })}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-sm font-semibold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {clubs.map((item) => (
                <option key={item.club_id} value={item.club_id}>{item.club_name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          </div>
        ) : (
          <p className="text-base font-bold text-foreground">{club.club_name}</p>
        )}
      </div>

      {posts === null ? (
        <div className="dream-data-state" role="status"><p>게시글을 불러오는 중입니다.</p></div>
      ) : (
        <BoardPostList
          posts={posts}
          getHref={(post) => `/board/club/${club.club_id}/${post.id}`}
          emptyText="아직 등록된 글이 없습니다. 첫 글을 남겨보세요."
        />
      )}
    </>
  );
}

