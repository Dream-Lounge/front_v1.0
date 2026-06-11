const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDeadlineLabel(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `~${mm}.${dd}(${WEEKDAYS[date.getDay()]})`;
}

export function recruitDeadlineLabel(year: number, month: number, day: number): string {
  return formatDeadlineLabel(new Date(year, month - 1, day));
}

export function formatEndDateLabel(value: string): string {
  const m = value.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (!m) return value;
  return recruitDeadlineLabel(Number(m[1]), Number(m[2]), Number(m[3]));
}

const REFERENCE_YEAR = 2026;

export function formatRecruitmentLabel(label: string): string {
  const m = label.match(/^~\s*(\d{1,2})월\s*(\d{1,2})일$/);
  if (!m) return label;
  return recruitDeadlineLabel(REFERENCE_YEAR, Number(m[1]), Number(m[2]));
}
