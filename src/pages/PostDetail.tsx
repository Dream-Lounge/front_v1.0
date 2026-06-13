import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, type PostDetail as PostDetailType, type ActiveClubItem } from "@/lib/api";
import { toast } from "sonner";

export function PostDetail() {
  const { id: clubId, postId } = useParams<{ id: string; postId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState<PostDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [membership, setMembership] = useState<ActiveClubItem | null>(null);

  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchPost = useCallback(async () => {
    if (!clubId || !postId) return;
    setIsLoading(true);
    try {
      const data = await api.getPost(clubId, postId);
      setPost(data);
    } catch {
      toast.error("게시글을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [clubId, postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    if (!isAuthenticated || !user || !clubId) {
      setMembership(null);
      return;
    }
    api.getMyClubs()
      .then(clubs => {
        const m = clubs.find(c => String(c.club_id) === String(clubId));
        setMembership(m || null);
      })
      .catch(() => setMembership(null));
  }, [isAuthenticated, user, clubId]);

  const handleCommentSubmit = async () => {
    if (!clubId || !postId || !comment.trim()) return;
    setIsSubmittingComment(true);
    try {
      await api.createComment(clubId, postId, comment.trim());
      setComment("");
      fetchPost();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "댓글 등록에 실패했습니다.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!clubId || !postId) return;
    try {
      await api.deleteComment(clubId, postId, commentId);
      fetchPost();
      toast.success("댓글이 삭제되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "댓글 삭제에 실패했습니다.");
    }
  };

  const handleDeletePost = async () => {
    if (!clubId || !postId) return;
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    try {
      await api.deletePost(clubId, postId);
      toast.success("게시글이 삭제되었습니다.");
      navigate(`/club/${clubId}/community`, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "게시글 삭제에 실패했습니다.");
    }
  };

  const canDeletePost = post && user && (
    post.author_id === user.id ||
    membership?.role === "president"
  );

  const canDeleteComment = (commentAuthorId: number) => {
    if (!user) return false;
    return commentAuthorId === user.id || membership?.role === "president";
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-muted-foreground">게시글을 찾을 수 없습니다.</div>
        <Button variant="outline" asChild>
          <Link to={`/club/${clubId}/community`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            커뮤니티로 돌아가기
          </Link>
        </Button>
      </div>
    );
  }

  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
          <Link to={`/club/${clubId}/community`}>
            <ArrowLeft className="h-4 w-4" />
            커뮤니티로 돌아가기
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {post.is_notice && (
                  <Badge variant="secondary" className="bg-blue-50 text-primary border-blue-200">
                    공지
                  </Badge>
                )}
                <CardTitle className="text-xl leading-snug">{post.title}</CardTitle>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  {post.author_name}
                  {post.is_author_president && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">관리자</span>
                  )}
                </span>
                <span>{formattedDate}</span>
              </div>
            </div>
            {canDeletePost && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDeletePost}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            댓글 {post.comments.length > 0 ? `(${post.comments.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {post.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              첫 댓글을 작성해보세요.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {post.comments.map((c) => {
                const cDate = c.created_at
                  ? new Date(c.created_at).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <li key={c.id} className="flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          {c.author_name}
                          {c.is_author_president && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">관리자</span>
                          )}
                        </span>
                        <span className="text-muted-foreground text-xs">{cDate}</span>
                      </div>
                      {canDeleteComment(c.author_id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteComment(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
                  </li>
                );
              })}
            </ul>
          )}

          {isAuthenticated && membership && (
            <div className="flex flex-col gap-2 pt-2">
              <Textarea
                ref={textareaRef}
                placeholder="댓글을 입력하세요 (Ctrl+Enter로 제출)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleCommentSubmit();
                  }
                }}
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleCommentSubmit}
                  disabled={isSubmittingComment || !comment.trim()}
                >
                  {isSubmittingComment ? "등록 중..." : "댓글 등록"}
                </Button>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground text-center py-2">
              댓글을 작성하려면 로그인이 필요합니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
