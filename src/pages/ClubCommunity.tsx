import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { LoginAlertDialog } from "@/components/common/LoginAlertDialog";
import { toast } from "sonner";
import {
  MessageSquare,
  Search as SearchIcon,
} from "lucide-react";
import { api, type PostListItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type CommunityCategory = "전체글" | "공지사항" | "일반글";

function categoryBadgeVariant(isNotice: boolean) {
  if (isNotice) {
    return { variant: "secondary" as const, className: "bg-blue-50 text-primary border-blue-200" };
  }
  return { variant: "outline" as const, className: "border-primary/20 text-foreground" };
}

export function ClubCommunity() {
  const { id: clubId } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClubMember, setIsClubMember] = useState(false);
  const [isPresidentOfClub, setIsPresidentOfClub] = useState(false);

  const [activeCategory, setActiveCategory] = useState<CommunityCategory>("전체글");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [isLoginAlertOpen, setIsLoginAlertOpen] = useState(false);

  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!clubId) return;
    setIsLoading(true);
    try {
      const data = await api.getPosts(clubId);
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!isAuthenticated || !user || !clubId) {
      setIsClubMember(false);
      setIsPresidentOfClub(false);
      return;
    }

    const checkMembership = async () => {
      try {
        const myClubs = await api.getMyClubs();
        const membership = myClubs.find(c => String(c.club_id) === String(clubId));
        setIsClubMember(!!membership);
        setIsPresidentOfClub(membership?.role === "president");
      } catch {
        setIsClubMember(false);
        setIsPresidentOfClub(false);
      }
    };

    checkMembership();
  }, [isAuthenticated, user, clubId]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => {
        if (activeCategory === "공지사항") return p.is_notice;
        if (activeCategory === "일반글") return !p.is_notice;
        return true;
      })
      .filter((p) => (q ? p.title.toLowerCase().includes(q) : true));
  }, [posts, activeCategory, query]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedPosts = filteredPosts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const counts = useMemo(() => ({
    전체글: posts.length,
    공지사항: posts.filter(p => p.is_notice).length,
    일반글: posts.filter(p => !p.is_notice).length,
  }), [posts]);

  const categories: CommunityCategory[] = ["전체글", "공지사항", "일반글"];

  const handleWrite = () => {
    if (!isAuthenticated) {
      setIsLoginAlertOpen(true);
      return;
    }
    if (!isClubMember) {
      toast.error("동아리 가입 후 글쓰기를 할 수 있습니다.");
      return;
    }
    setNewTitle("");
    setNewContent("");
    setIsWriteOpen(true);
  };

  const handleSubmitPost = async () => {
    if (!clubId || !newTitle.trim() || !newContent.trim()) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createPost(clubId, {
        title: newTitle.trim(),
        content: newContent.trim(),
        is_notice: false,
      });
      toast.success("게시글이 등록되었습니다.");
      setIsWriteOpen(false);
      fetchPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "게시글 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-w-0 gap-6">
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 gap-6">
      <aside className="w-64 shrink-0 hidden md:block">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="bg-[#0B5CA8] px-4 py-3.5 text-center text-sm font-bold tracking-tight text-white">
            커뮤니티 메뉴
          </div>
          <nav className="bg-white px-2.5 py-3" aria-label="커뮤니티 게시판 분류">
            <ul className="flex flex-col gap-1">
              {categories.map((key) => {
                const isActive = activeCategory === key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory(key);
                        setPage(1);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        isActive
                          ? "bg-[#E8EEF6] font-semibold text-[#1a6fc4]"
                          : "font-normal text-neutral-700 hover:bg-slate-50",
                      )}
                    >
                      <span>{key}</span>
                      <span
                        className={cn(
                          "tabular-nums flex size-7 shrink-0 items-center justify-center text-xs font-medium",
                          isActive
                            ? "rounded-full bg-[#DDE3EA] text-neutral-600"
                            : "rounded-full text-neutral-500",
                        )}
                      >
                        {counts[key]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <Card className="border-border shadow-sm">
          <CardContent className="p-0">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div className="min-w-0 space-y-1">
                  <h1 className="text-xl font-bold text-foreground">
                    {activeCategory}
                  </h1>
                </div>

                <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                  <div className="relative w-full min-w-0 sm:w-[min(100%,22rem)]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                      className="bg-background pl-9"
                      placeholder="게시글 검색"
                    />
                  </div>
                  <Button
                    onClick={handleWrite}
                    className="h-10 w-full shrink-0 sm:w-auto"
                    variant="default"
                    disabled={isAuthenticated && !isClubMember}
                  >
                    글쓰기
                  </Button>
                </div>
              </div>

              <Separator className="mb-4" />

              {pagedPosts.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  게시글이 없습니다.
                </div>
              ) : (
                <>
                  <ul className="flex flex-col gap-3 lg:hidden">
                    {pagedPosts.map((p) => {
                      const { variant, className } = categoryBadgeVariant(p.is_notice);
                      return (
                        <li
                          key={p.id}
                          className="rounded-lg border border-border bg-card/40 px-4 py-3 transition-colors hover:bg-muted/25"
                        >
                          <div className="flex flex-wrap items-center gap-2 gap-y-2">
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {p.id}
                            </span>
                            <Badge variant={variant} className={className}>
                              {p.is_notice ? "공지사항" : "일반글"}
                            </Badge>
                          </div>
                          <Link
                            to={`/club/${clubId}/community/${p.id}`}
                            className="mt-2 block min-w-0 break-words text-left text-sm font-medium leading-snug hover:underline"
                          >
                            {p.title}
                          </Link>
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              {p.author_name}
                              {p.is_author_president && (
                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">관리자</span>
                              )}
                            </span>
                            <span className="whitespace-nowrap">
                              {p.created_at ? new Date(p.created_at).toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(/\.$/, "") : ""}
                            </span>
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <MessageSquare className="size-3.5 shrink-0" aria-hidden />
                              댓글 {p.comment_count ?? 0}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="hidden min-w-0 lg:block">
                    <div className="overflow-x-auto rounded-md border border-border">
                      <table className="w-full min-w-[640px] table-fixed text-sm">
                        <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                          <tr>
                            <th className="w-12 px-2 py-3 text-center font-medium">번호</th>
                            <th className="w-[7.5rem] px-2 py-3 text-left font-medium">분류</th>
                            <th className="min-w-0 px-2 py-3 text-left font-medium">제목</th>
                            <th className="w-24 px-2 py-3 text-center font-medium">작성자</th>
                            <th className="w-28 px-2 py-3 text-center font-medium">작성일</th>
                            <th className="w-16 px-1 py-3 text-center font-medium">댓글</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedPosts.map((p, idx) => {
                            const { variant, className } = categoryBadgeVariant(p.is_notice);
                            const rowNumber = (safePage - 1) * pageSize + idx + 1;
                            return (
                              <tr key={p.id} className="border-t hover:bg-muted/30">
                                <td className="px-2 py-3.5 text-center text-xs text-muted-foreground">
                                  {rowNumber}
                                </td>
                                <td className="px-2 py-3.5 align-top">
                                  <Badge
                                    variant={variant}
                                    className={cn(className, "max-w-full truncate align-bottom")}
                                  >
                                    {p.is_notice ? "공지사항" : "일반글"}
                                  </Badge>
                                </td>
                                <td className="min-w-0 px-2 py-3.5">
                                  <Link
                                    to={`/club/${clubId}/community/${p.id}`}
                                    className="flex min-w-0 items-start gap-2 hover:underline"
                                  >
                                    <span className="min-w-0 break-words font-medium leading-snug">
                                      {p.title}
                                    </span>
                                  </Link>
                                </td>
                                <td className="px-2 py-3.5 text-center text-xs text-muted-foreground">
                                  <span className="line-clamp-2 break-words">{p.author_name}</span>
                                  {p.is_author_president && (
                                    <span className="mt-0.5 block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">관리자</span>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-2 py-3.5 text-center text-xs text-muted-foreground">
                                  {p.created_at ? new Date(p.created_at).toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(/\.$/, "") : ""}
                                </td>
                                <td className="px-1 py-3.5 text-center text-xs text-muted-foreground">
                                  <span className="inline-flex items-center justify-center gap-1">
                                    <MessageSquare className="size-3.5 shrink-0" aria-hidden />
                                    {p.comment_count ?? 0}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-center gap-2">
              <Button
                variant="outline"
                className="h-9 px-3"
                onClick={() => setPage((v) => Math.max(1, v - 1))}
                disabled={safePage <= 1}
              >
                &lt;
              </Button>
              {[...Array(Math.min(totalPages, 3))].map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === safePage;
                return (
                  <Button
                    key={pageNum}
                    variant={isActive ? "default" : "outline"}
                    className="h-9 w-9 p-0"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                className="h-9 px-3"
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                disabled={safePage >= totalPages}
              >
                &gt;
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <LoginAlertDialog
        open={isLoginAlertOpen}
        onOpenChange={setIsLoginAlertOpen}
        reason="커뮤니티 글쓰기를 위해서는 로그인이 필요합니다."
      />

      <Dialog open={isWriteOpen} onOpenChange={setIsWriteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>게시글 작성</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input
              placeholder="제목을 입력해주세요"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="내용을 입력해주세요"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[160px] resize-none"
            />
            {isPresidentOfClub && (
              <p className="text-xs text-muted-foreground">
                회장 권한으로 공지로 등록하려면 게시 후 관리자 페이지에서 설정할 수 있습니다.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWriteOpen(false)} disabled={isSubmitting}>
              취소
            </Button>
            <Button onClick={handleSubmitPost} disabled={isSubmitting}>
              {isSubmitting ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
