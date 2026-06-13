import type { LucideIcon } from "lucide-react";
import {
  Star,
  Drama,
  BookOpen,
  HeartHandshake,
  Church,
  Volleyball,
  GraduationCap,
  Palette,
  MoreHorizontal,
} from "lucide-react";

/** 동아리 목록·필터에 쓰는 분과 키 (전체 제외) */
export const CLUB_DIVISION_KEYS = [
  "공연",
  "교양",
  "봉사",
  "종교사회",
  "체육",
  "학술",
  "문화예술",
  "기타",
] as const;

export type ClubDivision = (typeof CLUB_DIVISION_KEYS)[number];

export interface ClubDirectoryMeta {
  division: ClubDivision;
  memberCount: number;
  /** 카드 우측 하단 모집 기간 문구 */
  recruitmentLabel: string;
  deadlineToday?: boolean;
  /** null이면 플레이스홀더 배경 */
  coverImage: string | null;
}

export const CLUB_CATEGORY_FILTERS: {
  key: "all" | ClubDivision;
  label: string;
  icon: LucideIcon;
  /** 비선택 탭: 시안처럼 아이콘만 분과 포인트 컬러 */
  inactiveIconClass: string;
}[] = [
  { key: "all", label: "전체", icon: Star, inactiveIconClass: "text-amber-500" },
  { key: "공연", label: "공연", icon: Drama, inactiveIconClass: "text-violet-600" },
  { key: "교양", label: "교양", icon: BookOpen, inactiveIconClass: "text-sky-600" },
  { key: "봉사", label: "봉사", icon: HeartHandshake, inactiveIconClass: "text-rose-500" },
  { key: "종교사회", label: "종교사회", icon: Church, inactiveIconClass: "text-indigo-600" },
  { key: "체육", label: "체육", icon: Volleyball, inactiveIconClass: "text-emerald-600" },
  { key: "학술", label: "학술", icon: GraduationCap, inactiveIconClass: "text-slate-600" },
  { key: "문화예술", label: "문화예술", icon: Palette, inactiveIconClass: "text-fuchsia-600" },
  { key: "기타", label: "기타", icon: MoreHorizontal, inactiveIconClass: "text-gray-500" },
];

/**
 * 목록 카드 전용 메타 (인원·모집 문구·커버 등)
 * — MOCK_CLUB_DATA 키와 일치해야 함
 */
export const MOCK_CLUB_DIRECTORY_META: Record<string, ClubDirectoryMeta> = {
  "1": {
    division: "공연",
    memberCount: 32,
    recruitmentLabel: "~12월 30일",
    deadlineToday: true,
    coverImage: "/images/performence.jpg",
  },
  "2": {
    division: "봉사",
    memberCount: 48,
    recruitmentLabel: "상시모집",
    coverImage: "/images/rcy_v1.jpg",
  },
  "3": {
    division: "교양",
    memberCount: 22,
    recruitmentLabel: "~9월 26일",
    coverImage: "/images/photo_exhibition_v1.png",
  },
  "4": {
    division: "체육",
    memberCount: 24,
    recruitmentLabel: "~9월 28일",
    coverImage: "/images/smash.jpg",
  },
  "5": {
    division: "체육",
    memberCount: 45,
    recruitmentLabel: "상시모집",
    coverImage: null,
  },
  "6": {
    division: "학술",
    memberCount: 28,
    recruitmentLabel: "상시모집",
    coverImage: "/images/cpr_v1.png",
  },
  "7": {
    division: "학술",
    memberCount: 24,
    recruitmentLabel: "~12월 30일",
    deadlineToday: true,
    coverImage: "/images/coding_test_study.jpg",
  },
  "8": {
    division: "문화예술",
    memberCount: 31,
    recruitmentLabel: "~1월 15일",
    coverImage: null,
  },
  "9": {
    division: "종교사회",
    memberCount: 40,
    recruitmentLabel: "상시모집",
    coverImage: null,
  },
  "10": {
    division: "체육",
    memberCount: 36,
    recruitmentLabel: "~11월 20일",
    coverImage: null,
  },
  "11": {
    division: "학술",
    memberCount: 10,
    recruitmentLabel: "~12월 29일",
    deadlineToday: true,
    coverImage: null,
  },
};
