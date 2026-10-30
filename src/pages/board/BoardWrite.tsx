import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { api, type ActiveClubItem } from "@/lib/api";
import { toastApiError } from "@/lib/api-error";
import { BOARD_TABS, boardListPath, parseBoardTab, sortByJoinedAt } from "@/lib/board";

const TITLE_MAX = 100;
const CONTENT_MAX = 5000;

/**
 * 게시판 글쓰기 / 수정
 * - /board/write?tab=all|club(&club=ID): 새 글
 * - /board/club/:clubId/:postId/edit: 동아리 게시판 글 수정 (작성자 본인)
 * - 전체게시판은 API가 준비되기 전까지 등록 시 '준비 중' 안내만 띄운다.
 */
export function BoardWrite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clubId: editClubId, postId } = useParams<{ clubId: string; postId: string }>();
  const isEdit = Boolean(postId);
  const tab = isEdit ? "club" : parseBoardTab(searchParams.get("tab"));
  const { user } = useAuth();

  const [clubs, setClubs] = useState<ActiveClubItem[] | null>(null);
  const [clubId, setClubId] = useState(editClubId ?? searchParams.get("club") ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(!isEdit);

  // 동아리 게시판이면 가입한 동아리 목록을 불러와 기본값(가장 먼저 가입한 동아리)을 정한다.
  useEffect(() => {
    if (tab !== "club" || !user) return;
    let active = true;
    api.getMyClubs()
      .then((data) => {
        if (!active) return;
        const sorted = sortByJoinedAt(data);
        setClubs(sorted);
        setClubId((current) => (sorted.some((club) => club.club_id === current) ? current : sorted[0]?.club_id ?? ""));
      })
      .catch(() => { if (active) setClubs([]); });
    return () => { active = false; };
  }, [tab, user]);

  // 수정이면 기존 글을 채운다. (작성자 본인이 아니면 상세로 돌려보낸다)
  useEffect(() => {
    if (!isEdit || !editClubId || !postId || !user) return;
    let active = true;
    api.getClubPost(editClubId, postId)
      .then((post) => {
        if (!active) return;
        if (post.author_id !== user.id) {
          toast.error("본인이 작성한 글만 수정할 수 있습니다.");
          navigate(`/board/club/${editClubId}/${postId}`, { replace: true });
          return;
        }
        setTitle(post.title);
        setContent(post.content);
        setIsLoaded(true);
      })
      .catch((error) => {
        toastApiError(error, "글을 불러오지 못했습니다.");
        navigate(boardListPath("club", editClubId), { replace: true });
      });
    return () => { active = false; };
  }, [isEdit, editClubId, postId, user, navigate]);

  const tabLabel = useMemo(() => BOARD_TABS.find((item) => item.key === tab)?.label ?? "게시판", [tab]);
  const backPath = isEdit ? `/board/club/${editClubId}/${postId}` : boardListPath(tab, clubId);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = {
      title: title.trim() ? undefined : "제목을 입력해주세요.",
      content: content.trim() ? undefined : "내용을 입력해주세요.",
    };
    setErrors(next);
    if (next.title || next.content) return;

    if (tab !== "club") {
      // TODO: 전체게시판 API가 준비되면 연결
      toast.info("아직 준비 중인 기능입니다. 조금만 기다려주세요.");
      return;
    }
    if (!clubId) {
      toast.error("글을 올릴 동아리를 선택해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const saved = isEdit && postId
        ? await api.updateClubPost(clubId, postId, { title: title.trim(), content: content.trim() })
        : await api.createClubPost(clubId, title.trim(), content.trim());
      toast.success(isEdit ? "글을 수정했습니다." : "글을 등록했습니다.");
      navigate(`/board/club/${clubId}/${saved.id}`, { replace: true });
    } catch (error) {
      toastApiError(error, isEdit ? "글을 수정하지 못했습니다." : "글을 등록하지 못했습니다.");
      setIsSaving(false);
    }
  };

  // 서비스/공지는 연합회·개발팀만 작성한다.
  if (tab === "notice") {
    return (
      <div className="mx-auto w-full">
        <div className="dream-data-state" role="status">
          <p>서비스/공지는 동아리 연합회와 개발팀만 작성할 수 있어요.</p>
          <button type="button" onClick={() => navigate(boardListPath("notice"))}>목록으로</button>
        </div>
      </div>
    );
  }

  if (tab === "club" && clubs !== null && clubs.length === 0) {
    return (
      <div className="mx-auto w-full">
        <div className="dream-data-state" role="status">
          <p>가입한 동아리가 없어 동아리 게시판에 글을 쓸 수 없어요.</p>
          <button type="button" onClick={() => navigate(boardListPath("club"))}>목록으로</button>
        </div>
      </div>
    );
  }

  if (!isLoaded || (tab === "club" && clubs === null)) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto flex w-full flex-col gap-6 pb-16">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-primary">{tabLabel}</p>
        <h1 className="text-2xl font-bold text-foreground">{isEdit ? "글 수정" : "글쓰기"}</h1>
      </div>

      {tab === "club" && clubs && clubs.length > 1 && !isEdit && (
        <div className="flex flex-col gap-2">
          <label htmlFor="board-write-club" className="text-sm font-semibold text-foreground">동아리</label>
          <div className="relative w-full max-w-[260px]">
            <select
              id="board-write-club"
              value={clubId}
              onChange={(event) => setClubId(event.target.value)}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-sm font-semibold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {clubs.map((club) => <option key={club.club_id} value={club.club_id}>{club.club_name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="board-write-title" className="text-sm font-semibold text-foreground">제목</label>
        <Input
          id="board-write-title"
          value={title}
          maxLength={TITLE_MAX}
          onChange={(event) => { setTitle(event.target.value); setErrors((prev) => ({ ...prev, title: undefined })); }}
          placeholder="제목을 입력해주세요."
          aria-invalid={Boolean(errors.title)}
          className="h-11 bg-card"
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="board-write-content" className="text-sm font-semibold text-foreground">내용</label>
        <Textarea
          id="board-write-content"
          value={content}
          maxLength={CONTENT_MAX}
          onChange={(event) => { setContent(event.target.value); setErrors((prev) => ({ ...prev, content: undefined })); }}
          placeholder="내용을 입력해주세요."
          aria-invalid={Boolean(errors.content)}
          className="min-h-64 bg-card"
        />
        <div className="flex justify-between gap-2">
          {errors.content ? <p className="text-sm text-destructive">{errors.content}</p> : <span />}
          <span className="text-xs text-muted-foreground tabular-nums">{content.length} / {CONTENT_MAX}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(backPath)} disabled={isSaving}>취소</Button>
        <Button type="submit" disabled={isSaving} className="px-6">
          {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {isEdit ? "수정하기" : "등록하기"}
        </Button>
      </div>
    </form>
  );
}
