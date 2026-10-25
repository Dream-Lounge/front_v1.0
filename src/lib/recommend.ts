import type { ClubResponse } from "@/lib/api";

export interface RecommendedClub {
  club: ClubResponse;
  /** 이 동아리와 겹친 관심 분야 */
  matched: string[];
  score: number;
}

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");

/**
 * 관심 분야와 동아리 정보를 비교해 추천 순위를 매깁니다.
 * - 추천 API가 준비되기 전까지 쓰는 임시 방식으로, 분과·분야·태그·소개 문구에
 *   관심 분야 단어가 들어 있는지를 봅니다. 분과가 정확히 같으면 가중치를 더 줍니다.
 * - 하나도 겹치지 않는 동아리는 제외하고, 점수가 같으면 모집 중인 동아리를 앞에 둡니다.
 */
export function recommendClubs(clubs: ClubResponse[], interests: string[], limit = 10): RecommendedClub[] {
  const keywords = interests.map((interest) => ({ raw: interest, key: normalize(interest) })).filter(({ key }) => key);
  if (keywords.length === 0) return [];

  return clubs
    .map((club) => {
      const division = normalize(club.division ?? club.club_type ?? "");
      const haystack = normalize(
        [
          club.division,
          club.club_type,
          club.field,
          club.name,
          club.tagline,
          club.description,
          club.activity_purpose,
          ...(club.tags ?? []).flatMap((tag) => [tag.tag_key, tag.tag_value]),
        ]
          .filter(Boolean)
          .join(" "),
      );
      let score = 0;
      const matched: string[] = [];
      for (const { raw, key } of keywords) {
        if (division === key) {
          score += 3;
          matched.push(raw);
        } else if (haystack.includes(key)) {
          score += 1;
          matched.push(raw);
        }
      }
      return { club, matched, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.club.is_recruiting) - Number(a.club.is_recruiting))
    .slice(0, limit);
}
