import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { api, type PostDetailResponse } from "@/lib/api";
import { toastApiError } from "@/lib/api-error";
import { boardListPath, formatPostDateTime } from "@/lib/board";

export function IntegratedBoardPostDetail() {
  const { tab = "all", postId = "" } = useParams<{ tab: "all" | "notice"; postId: string }>();
  const scope = tab === "notice" ? "service" : "global";
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [post, setPost] = useState<PostDetailResponse | null | undefined>(undefined);
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const listPath = boardListPath(tab);
  const isPlatformEditor = Boolean(user?.platformRoles.some((role) => ["union_admin", "developer", "super_admin"].includes(role)));

  const fetchPost = useCallback(async () => {
    try {
      setPost(await api.getBoardPost(scope, postId));
    } catch {
      setPost(null);
    }
  }, [scope, postId]);

  useEffect(() => {
    void fetchPost();
  }, [scope, user, fetchPost]);

  if (isLoading) return null;
  if (post === undefined) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>;
  if (post === null) return <div className="dream-data-state"><p>글을 찾을 수 없습니다.</p><button type="button" onClick={() => navigate(listPath)}>목록으로</button></div>;

  const canManage = Boolean(post.can_manage || isPlatformEditor);

  const submitComment = async () => {
    if (!comment.trim() || scope !== "global") return;
    setIsCommenting(true);
    try {
      await api.createGlobalComment(postId, comment.trim());
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
      await api.deleteGlobalComment(postId, commentId);
      await fetchPost();
      toast.success("댓글을 삭제했습니다.");
    } catch (error) {
      toastApiError(error, "댓글을 삭제하지 못했습니다.");
    }
  };

  const removePost = async () => {
    setIsDeleting(true);
    try {
      await api.deleteBoardPost(scope, postId);
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
        <ArrowLeft className="size-4" aria-hidden />{tab === "notice" ? "서비스/공지" : "전체게시판"}
      </Link>
      <article className="rounded-2xl border border-border bg-card">
        <header className="flex flex-col gap-3 border-b border-border p-5 sm:p-6">
          <div className="flex items-start gap-2">
            {post.is_notice && <span className="mt-1 rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">공지</span>}
            <h1 className="text-xl font-bold sm:text-2xl">{post.title}</h1>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{post.author_name}<span className="mx-1.5">·</span>{formatPostDateTime(post.created_at)}</p>
            {canManage && <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => navigate(`/board/${tab}/${postId}/edit`)}>수정</Button><Button variant="outline" size="sm" className="text-destructive" onClick={() => setIsDeleteOpen(true)}>삭제</Button></div>}
          </div>
        </header>
        <div className="whitespace-pre-wrap break-words p-5 leading-relaxed sm:p-6">{post.content}</div>
      </article>

      {scope === "global" && user && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">댓글 <span className="text-primary">{post.comments.length}</span></h2>
          {post.comments.length > 0 && <ul className="overflow-hidden rounded-2xl border bg-card">{post.comments.map((item) => <li key={item.id} className="flex justify-between gap-3 border-b px-4 py-3.5 last:border-0"><div><p className="text-sm font-semibold">{item.author_name}<span className="ml-2 text-xs font-normal text-muted-foreground">{formatPostDateTime(item.created_at)}</span></p><p className="mt-1 whitespace-pre-wrap text-sm">{item.content}</p></div>{(item.author_id === user.id || isPlatformEditor) && <button type="button" onClick={() => void removeComment(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label="댓글 삭제"><Trash2 className="size-4" /></button>}</li>)}</ul>}
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={5000} placeholder="댓글을 입력해주세요." className="min-h-24" />
          <Button onClick={() => void submitComment()} disabled={!comment.trim() || isCommenting} className="self-end">{isCommenting && <Loader2 className="size-4 animate-spin" />}댓글 등록</Button>
        </section>
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>글을 삭제할까요?</AlertDialogTitle><AlertDialogDescription>삭제한 글은 되돌릴 수 없습니다.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel><AlertDialogAction disabled={isDeleting} className="bg-destructive text-white" onClick={(event) => { event.preventDefault(); void removePost(); }}>삭제</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
