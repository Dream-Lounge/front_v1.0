const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * Date 객체를 "~MM.DD(요일)" 형식 문자열로 변환합니다.
 */
export function formatDeadlineLabel(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `~${mm}.${dd}(${WEEKDAYS[date.getDay()]})`;
}

/**
 * (연, 월, 일) 값을 "~MM.DD(요일)" 형식으로 변환합니다.
 */
export function recruitDeadlineLabel(year: number, month: number, day: number): string {
  return formatDeadlineLabel(new Date(year, month - 1, day));
}

/**
 * "YYYY.MM.DD" 형식 문자열을 "~MM.DD(요일)"로 변환합니다.
 * - 날짜 형식이 아니면(예: "상시모집") 원본 문자열을 그대로 반환합니다.
 */
export function formatEndDateLabel(value: string): string {
  const m = value.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (!m) return value;
  return recruitDeadlineLabel(Number(m[1]), Number(m[2]), Number(m[3]));
}

/**
 * "~N월 N일" 형식 라벨을 "~MM.DD(요일)"로 변환합니다.
 * - 형식이 다르면(예: "상시모집") 원본 문자열을 그대로 반환합니다.
 * - 연도 정보가 없으므로 기준 연도(REFERENCE_YEAR)로 요일을 계산합니다.
 */
const REFERENCE_YEAR = 2026;

export function formatRecruitmentLabel(label: string): string {
  const m = label.match(/^~\s*(\d{1,2})월\s*(\d{1,2})일$/);
  if (!m) return label;
  return recruitDeadlineLabel(REFERENCE_YEAR, Number(m[1]), Number(m[2]));
}
