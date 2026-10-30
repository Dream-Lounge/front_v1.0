import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { api, type ActiveClubItem, type PostDetailResponse } from "@/lib/api";
import { toastApiError } from "@/lib/api-error";
import { boardListPath, formatPostDateTime } from "@/lib/board";

/** 동아리 게시판 글 상세: 본문, 댓글, 작성자 본인의 수정·삭제 */
export function BoardPostDetail() {
  const { clubId = "", postId = "" } = useParams<{ clubId: string; postId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [membership, setMembership] = useState<ActiveClubItem | null | undefined>(undefined);
  const [post, setPost] = useState<PostDetailResponse | null | undefined>(undefined);
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const listPath = boardListPath("club", clubId);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api.getMyClubs()
      .then((clubs) => { if (active) setMembership(clubs.find((club) => club.club_id === clubId) ?? null); })
      .catch(() => { if (active) setMembership(null); });
    return () => { active = false; };
  }, [user, clubId]);

  const fetchPost = useCallback(async () => {
    try {
      setPost(await api.getClubPost(clubId, postId));
    } catch {
      setPost(null);
    }
  }, [clubId, postId]);

  useEffect(() => {
    if (membership) void fetchPost();
  }, [membership, fetchPost]);

  if (isAuthLoading) return null;

  // 동아리 게시판은 해당 동아리 정식 부원만 볼 수 있다.
  if (!user || membership === null) {
    return (
      <div className="mx-auto w-full">
        <div className="dream-data-state" role="status">
          <p>{!user ? "동아리 게시판은 로그인한 동아리 부원만 이용할 수 있어요." : "이 동아리의 부원만 볼 수 있는 글이에요."}</p>
          <button type="button" onClick={() => navigate(!user ? "/login" : boardListPath("club"))}>
            {!user ? "로그인하기" : "내 동아리 게시판으로"}
          </button>
        </div>
      </div>
    );
  }

  if (membership === undefined || post === undefined) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>;
  }

  if (post === null) {
    return (
      <div className="mx-auto w-full">
        <div className="dream-data-state" role="status">
          <p>글을 찾을 수 없습니다. 삭제되었을 수 있어요.</p>
          <button type="button" onClick={() => navigate(listPath)}>목록으로</button>
        </div>
      </div>
    );
  }

  const isAuthor = post.author_id === user.id;

  const submitComment = async () => {
    if (!comment.trim()) return;
    setIsCommenting(true);
    try {
      await api.createComment(clubId, postId, comment.trim());
      setComment("");
      await fetchPost();
    } catch (error) {
      toastApiError(error, "댓글을 등록하지 못했습니다.");
    } finally {
      setIsCommenting(false);
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await api.deleteComment(clubId, postId, commentId);
      await fetchPost();
      toast.success("댓글을 삭제했습니다.");
    } catch (error) {
      toastApiError(error, "댓글을 삭제하지 못했습니다.");
    }
  };

  const removePost = async () => {
    setIsDeleting(true);
    try {
      await api.deleteClubPost(clubId, postId);
      toast.success("글을 삭제했습니다.");
      navigate(listPath, { replace: true });
    } catch (error) {
      toastApiError(error, "글을 삭제하지 못했습니다.");
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-6 pb-16">
      <Link to={listPath} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        {membership.club_name} 게시판
      </Link>

      <article className="rounded-2xl border border-border bg-card">
        <header className="flex flex-col gap-3 border-b border-border p-5 sm:p-6">
          <div className="flex items-start gap-2">
            {post.is_notice && (
              <span className="mt-1 shrink-0 rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">공지</span>
            )}
            <h1 className="break-keep text-xl font-bold text-foreground sm:text-2xl">{post.title}</h1>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {post.author_name}
              {post.is_author_president && <span className="ml-1 font-semibold text-primary">회장</span>}
              <span className="mx-1.5" aria-hidden>·</span>
              {formatPostDateTime(post.created_at)}
            </p>
            {isAuthor && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/board/club/${clubId}/${postId}/edit`)}>수정</Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setIsDeleteOpen(true)}>삭제</Button>
              </div>
            )}
          </div>
        </header>
        <div className="whitespace-pre-wrap break-words p-5 text-base leading-relaxed text-foreground sm:p-6">{post.content}</div>
      </article>

      <section className="flex flex-col gap-4" aria-labelledby="board-comments-title">
        <h2 id="board-comments-title" className="text-lg font-bold text-foreground">
          댓글 <span className="text-primary">{post.comments.length}</span>
        </h2>

        {post.comments.length > 0 && (
          <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            {post.comments.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {item.author_name}
                    {item.is_author_president && <span className="ml-1 text-primary">회장</span>}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{formatPostDateTime(item.created_at)}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{item.content}</p>
                </div>
                {item.author_id === user.id && (
                  <button
                    type="button"
                    onClick={() => void removeComment(item.id)}
                    aria-label="댓글 삭제"
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="댓글을 입력해주세요."
            maxLength={1000}
            className="min-h-24 bg-card"
            aria-label="댓글 입력"
          />
          <Button onClick={() => void submitComment()} disabled={!comment.trim() || isCommenting} className="self-end px-5">
            {isCommenting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            댓글 등록
          </Button>
        </div>
      </section>

      <AlertDialog open={isDeleteOpen} onOpenChange={(open) => { if (!isDeleting) setIsDeleteOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>글을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>삭제한 글과 댓글은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void removePost();
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
