import type { ActiveClubItem, PostListItem } from "@/lib/api";

/** 통합게시판 탭: 전체게시판 / 서비스·공지 / 동아리 게시판 */
export type BoardTab = "all" | "notice" | "club";

export const BOARD_TABS: { key: BoardTab; label: string; shortLabel: string }[] = [
  { key: "all", label: "전체게시판", shortLabel: "전체" },
  { key: "notice", label: "서비스/공지", shortLabel: "공지" },
  { key: "club", label: "동아리 게시판", shortLabel: "동아리" },
];

export function parseBoardTab(value: string | null): BoardTab {
  return BOARD_TABS.some((tab) => tab.key === value) ? (value as BoardTab) : "all";
}

/** 게시판 목록 주소 (동아리 게시판이면 선택한 동아리까지 포함) */
export function boardListPath(tab: BoardTab, clubId?: string): string {
  const params = new URLSearchParams({ tab });
  if (tab === "club" && clubId) params.set("club", clubId);
  return `/board?${params.toString()}`;
}

/** 가입한 동아리를 가입한 순서대로 정렬합니다. (가장 먼저 가입한 동아리가 기본 선택) */
export function sortByJoinedAt(clubs: ActiveClubItem[]): ActiveClubItem[] {
  return [...clubs].sort((a, b) => a.joined_at.localeCompare(b.joined_at));
}

/** 공지를 맨 위에, 나머지는 최신 글 순으로 정렬합니다. */
export function sortPosts(posts: PostListItem[]): PostListItem[] {
  return [...posts].sort(
    (a, b) => Number(b.is_notice) - Number(a.is_notice) || b.created_at.localeCompare(a.created_at),
  );
}

/** "2026.10.28" */
export function formatPostDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${mm}.${dd}`;
}

/** "2026.10.28 14:30" */
export function formatPostDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${formatPostDate(value)} ${hh}:${mi}`;
}
