type RecruitmentWindow = {
  is_recruiting: boolean;
  recruit_end: string | null;
};

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getKstDateString(now = new Date()): string {
  const parts = Object.fromEntries(
    KST_DATE_FORMATTER.formatToParts(now).map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/**
 * 백엔드 응답이 짧은 공개 캐시에 남아 있어도 종료일 다음 한국 날짜부터
 * 화면에서는 즉시 모집 마감으로 취급한다. 종료일 당일은 모집 가능하다.
 */
export function withEffectiveRecruitmentStatus<T extends RecruitmentWindow>(
  club: T,
  today = getKstDateString(),
): T {
  if (
    club.is_recruiting
    && club.recruit_end
    && /^\d{4}-\d{2}-\d{2}$/.test(club.recruit_end)
    && club.recruit_end < today
  ) {
    return { ...club, is_recruiting: false };
  }
  return club;
}
