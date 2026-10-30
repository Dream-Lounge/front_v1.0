import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import type { PostListItem } from "@/lib/api";
import { formatPostDate } from "@/lib/board";
import { cn } from "@/lib/utils";

interface BoardPostListProps {
  posts: PostListItem[];
  /** 글 상세 주소 */
  getHref: (post: PostListItem) => string;
  emptyText: string;
}

/** 게시판 글 목록: 공지는 강조해서 맨 위에 둡니다. (정렬은 호출하는 쪽에서) */
export function BoardPostList({ posts, getHref, emptyText }: BoardPostListProps) {
  if (posts.length === 0) {
    return (
      <div className="dream-data-state" role="status">
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {posts.map((post) => (
        <li key={post.id} className="border-b border-border last:border-b-0">
          <Link
            to={getHref(post)}
            className={cn(
              "flex flex-col gap-1.5 px-4 py-4 transition-colors hover:bg-muted/50 sm:px-5",
              post.is_notice && "bg-accent/40",
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              {post.is_notice && (
                <span className="shrink-0 rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  공지
                </span>
              )}
              <span className="min-w-0 truncate font-semibold text-foreground">{post.title}</span>
              {post.comment_count > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
                  <MessageSquare className="size-3.5" aria-hidden />
                  {post.comment_count}
                  <span className="sr-only">개의 댓글</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {post.author_name}
                {post.is_author_president && <span className="ml-1 font-semibold text-primary">회장</span>}
              </span>
              <span aria-hidden>·</span>
              <span>{formatPostDate(post.created_at)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
