import { useEffect, useMemo, useState } from "react";
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
  Clock,
  MessageSquare,
  Search as SearchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type PostListItem } from "@/lib/api";
import { toastApiError } from "@/lib/api-error";

type CommunityCategory =
  | "전체글"
  | "공지사항"
  | "자유게시판"
  | "질문/답변"
  | "팀모집";

type CommunityPost = {
  id: string;
  category: Exclude<CommunityCategory, "전체글">;
  title: string;
  author: string;
  createdAt: string; // yyyy.MM.dd
  comments: number;
};

function mapPost(post: PostListItem): CommunityPost {
  return {
    id: post.id,
    category: post.is_notice ? "공지사항" : "자유게시판",
    title: post.title,
    author: post.author_name,
    createdAt: new Intl.DateTimeFormat("ko-KR").format(new Date(post.created_at)),
    comments: post.comment_count,
  };
}

function categoryBadgeVariant(category: CommunityPost["category"]) {
  switch (category) {
    case "공지사항":
      return { variant: "secondary" as const, className: "bg-blue-50 text-primary border-blue-200 font-semibold" };
    case "자유게시판":
      return { variant: "outline" as const, className: "border-primary/20 text-foreground font-semibold" };
    case "질문/답변":
      return { variant: "outline" as const, className: "border-chart-3/40 text-foreground font-semibold" };
    case "팀모집":
      return { variant: "outline" as const, className: "border-chart-2/40 text-foreground font-semibold" };
    default:
      return { variant: "secondary" as const, className: "font-semibold" };
  }
}

export function ClubCommunity() {
  const { id: clubId } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();

  const [isClubMember, setIsClubMember] = useState(false);
  const [postsForClub, setPostsForClub] = useState<CommunityPost[]>([]);

  const [activeCategory, setActiveCategory] =
    useState<CommunityCategory>("전체글");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [isLoginAlertOpen, setIsLoginAlertOpen] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    let active = true;
    Promise.all([
      api.getClubPosts(clubId),
      isAuthenticated ? api.getMyClubs() : Promise.resolve([]),
    ]).then(([posts, clubs]) => {
      if (!active) return;
      setPostsForClub(posts.map(mapPost));
      setIsClubMember(clubs.some((club) => club.club_id === clubId));
    }).catch((error) => toastApiError(error, "게시글을 불러오지 못했습니다."));
    return () => { active = false; };
  }, [clubId, isAuthenticated, user]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return postsForClub
      .filter((p) => (activeCategory === "전체글" ? true : p.category === activeCategory))
      .filter((p) => (q ? p.title.toLowerCase().includes(q) : true));
  }, [postsForClub, activeCategory, query]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedPosts = filteredPosts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const countsByCategory = useMemo(() => {
    const counts: Record<Exclude<CommunityCategory, "전체글">, number> = {
      "공지사항": 0,
      "자유게시판": 0,
      "질문/답변": 0,
      "팀모집": 0,
    };
    for (const p of postsForClub) counts[p.category] += 1;
    return counts;
  }, [postsForClub]);

  const categories = useMemo(() => {
    return [
      { key: "전체글" as const, count: postsForClub.length },
      { key: "공지사항" as const, count: countsByCategory["공지사항"] },
      { key: "자유게시판" as const, count: countsByCategory["자유게시판"] },
      { key: "질문/답변" as const, count: countsByCategory["질문/답변"] },
      { key: "팀모집" as const, count: countsByCategory["팀모집"] },
    ];
  }, [postsForClub.length, countsByCategory]);

  const handleWrite = () => {
    if (!isAuthenticated) {
      setIsLoginAlertOpen(true);
      return;
    }
    if (!isClubMember) {
      toast.error("동아리 가입 후 글쓰기를 할 수 있습니다.");
      return;
    }
    toast.info("게시글 작성은 관리자 화면의 게시판 관리에서 이용해주세요.");
  };

  return (
    <div className="flex min-w-0 gap-6">
      <aside className="w-64 shrink-0 hidden md:block">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="bg-[#0B5CA8] px-4 py-3.5 text-center text-sm font-bold tracking-tight text-white">
            커뮤니티 메뉴
          </div>
          <nav className="bg-white px-2.5 py-3" aria-label="커뮤니티 게시판 분류">
            <ul className="flex flex-col gap-1">
              {categories.map(({ key, count }) => {
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
                        {count}
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
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-foreground">
                    {activeCategory === "전체글" ? "전체글" : activeCategory}
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
                    disabled={!isClubMember && isAuthenticated}
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
                      const { variant, className } = categoryBadgeVariant(p.category);
                      return (
                        <li
                          key={p.id}
                          className="rounded-lg border border-border bg-card/40 px-4 py-3 transition-colors hover:bg-muted/25"
                        >
                          <div className="flex flex-wrap items-center gap-2 gap-y-2">
                            <Badge variant={variant} className={className}>
                              {p.category}
                            </Badge>
                          </div>
                          <Link
                            to="#"
                            className="mt-2 block min-w-0 break-words text-left text-sm font-medium leading-snug hover:underline"
                            onClick={(e) => e.preventDefault()}
                          >
                            {p.title}
                          </Link>
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <span className="whitespace-nowrap">{p.author}</span>
                            <span className="whitespace-nowrap">{p.createdAt}</span>
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <Clock className="size-3.5 shrink-0" aria-hidden />
                              조회 —
                            </span>
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <MessageSquare className="size-3.5 shrink-0" aria-hidden />
                              댓글 {p.comments}
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
                            <th className="w-16 px-1 py-3 text-center font-medium">조회</th>
                            <th className="w-16 px-1 py-3 text-center font-medium">댓글</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedPosts.map((p, index) => {
                            const { variant, className } = categoryBadgeVariant(p.category);
                            return (
                              <tr key={p.id} className="border-t hover:bg-muted/30">
                                <td className="px-2 py-3.5 text-center text-xs text-muted-foreground">
                                  {(safePage - 1) * pageSize + index + 1}
                                </td>
                                <td className="px-2 py-3.5 align-top">
                                  <Badge
                                    variant={variant}
                                    className={cn(className, "max-w-full truncate align-bottom")}
                                  >
                                    {p.category}
                                  </Badge>
                                </td>
                                <td className="min-w-0 px-2 py-3.5">
                                  <Link
                                    to="#"
                                    className="flex min-w-0 items-start gap-2 hover:underline"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      void 0;
                                    }}
                                  >
                                    <span className="min-w-0 break-words font-medium leading-snug">
                                      {p.title}
                                    </span>
                                  </Link>
                                </td>
                                <td className="px-2 py-3.5 text-center text-xs text-muted-foreground">
                                  <span className="line-clamp-2 break-words">{p.author}</span>
                                </td>
                                <td className="whitespace-nowrap px-2 py-3.5 text-center text-xs text-muted-foreground">
                                  {p.createdAt}
                                </td>
                                <td className="px-1 py-3.5 text-center text-xs text-muted-foreground">
                                  <span className="inline-flex items-center justify-center gap-1">
                                    <Clock className="size-3.5 shrink-0" aria-hidden />
                                    —
                                  </span>
                                </td>
                                <td className="px-1 py-3.5 text-center text-xs text-muted-foreground">
                                  <span className="inline-flex items-center justify-center gap-1">
                                    <MessageSquare className="size-3.5 shrink-0" aria-hidden />
                                    {p.comments}
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
    </div>
  );
}

