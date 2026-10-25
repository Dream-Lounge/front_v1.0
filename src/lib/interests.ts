/**
 * 사용자 관심 분야(온보딩) 저장/조회 유틸
 * - 관심 분야 API가 준비되기 전까지 학번별 localStorage 키로 관리합니다.
 * - 키가 존재하면(건너뛰어 빈 배열인 경우 포함) "온보딩 완료"로 간주합니다.
 */
const STORAGE_PREFIX = "dl_interests_";

/** 이 개수 이상 골라야 '시작하기'를 누를 수 있습니다. */
export const MIN_INTERESTS = 5;

/** 온보딩에서 기본 제공하는 관심 분야 태그 (분과 + 활동 키워드) */
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

function storageKey(studentId: string): string {
  return `${STORAGE_PREFIX}${studentId}`;
}

/** 저장된 관심 분야 목록을 반환합니다. 저장된 적이 없으면 null. */
export function getStoredInterests(studentId: string): string[] | null {
  try {
    const raw = localStorage.getItem(storageKey(studentId));
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : null;
  } catch {
    return null;
  }
}

/** 관심 분야 목록을 저장합니다. (온보딩 완료로 기록됨) */
export function saveInterests(studentId: string, tags: string[]): void {
  try {
    localStorage.setItem(storageKey(studentId), JSON.stringify(tags));
  } catch {
    // 사생활 보호 모드 등에서 저장이 막혀도 흐름은 계속 진행한다.
  }
}

/** 해당 사용자가 온보딩(관심 분야 선택)을 마쳤는지 여부 */
export function hasCompletedInterests(studentId: string): boolean {
  return getStoredInterests(studentId) !== null;
}
