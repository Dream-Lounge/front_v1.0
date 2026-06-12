/**
 * 사용자 관심사(온보딩) 저장/조회 유틸
 * - mock 백엔드 환경이므로 학번별 localStorage 키로 관리합니다.
 * - 관심사 키가 존재하면(빈 배열 포함) "온보딩 완료"로 간주합니다.
 */
const STORAGE_PREFIX = "dl_interests_";

/** 온보딩에서 기본 제공하는 관심사 태그 (분과 + 활동 키워드) */
export const DEFAULT_INTEREST_TAGS = [
  "공연",
  "밴드",
  "음악",
  "댄스",
  "교양",
  "독서토론",
  "외국어",
  "사진",
  "봉사",
  "나눔",
  "환경",
  "체육",
  "축구",
  "농구",
  "헬스",
  "학술",
  "프로그래밍",
  "웹개발",
  "AI",
  "문화예술",
  "디자인",
  "영상편집",
  "그림",
  "요리",
  "여행",
  "게임",
  "창업",
  "재테크",
] as const;

function storageKey(studentId: number): string {
  return `${STORAGE_PREFIX}${studentId}`;
}

/** 저장된 관심사 목록을 반환합니다. 저장된 적이 없으면 null. */
export function getStoredInterests(studentId: number): string[] | null {
  const raw = localStorage.getItem(storageKey(studentId));
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : null;
  } catch {
    return null;
  }
}

/** 관심사 목록을 저장합니다. (온보딩 완료로 기록됨) */
export function saveInterests(studentId: number, tags: string[]): void {
  localStorage.setItem(storageKey(studentId), JSON.stringify(tags));
}

/** 해당 사용자가 온보딩(관심사 선택)을 완료했는지 여부 */
export function hasCompletedInterests(studentId: number): boolean {
  return localStorage.getItem(storageKey(studentId)) !== null;
}
