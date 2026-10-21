import { type FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, type RecommendationResult } from "@/lib/api";

const EXAMPLES = [
  "초보인데 영상 편집을 배우고 포트폴리오를 만들고 싶어",
  "주말에 부담 없이 참여할 수 있는 친목 동아리",
  "사진 촬영을 배우고 전시회도 해보고 싶어",
];

export function AiRecommendationPanel({ onOpenClub }: { onOpenClub: (clubId: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecommendationResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.recommendClubs(normalizedQuery);
      setResults(response.results);
    } catch {
      setResults(null);
      setError("추천 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="gap-4 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="size-5 text-primary" aria-hidden />
          AI로 나에게 맞는 동아리 찾기
        </CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          하고 싶은 활동, 가능한 시간, 선호하는 분위기를 자유롭게 적어주세요.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="space-y-3">
          <Textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={1_000}
            rows={3}
            placeholder="예: 주 1회 저녁에 모이고 초보도 영상 편집을 배울 수 있는 동아리를 찾고 있어요."
            aria-label="원하는 동아리 설명"
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {example}
              </button>
            ))}
          </div>
          <Button type="submit" disabled={!query.trim() || isLoading} className="w-full sm:w-auto">
            {isLoading ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {isLoading ? "추천을 찾는 중..." : "동아리 추천받기"}
          </Button>
        </form>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        {results && (
          <div className="space-y-3" aria-live="polite">
            <p className="text-sm font-semibold">추천 결과 {results.length}개</p>
            {results.length === 0 ? (
              <p className="rounded-xl bg-muted/60 px-4 py-5 text-sm text-muted-foreground">
                추천할 수 있는 동아리 정보가 아직 없습니다.
              </p>
            ) : (
              <ol className="grid gap-3 md:grid-cols-2">
                {results.map((result, index) => (
                  <li key={result.club_id}>
                    <button
                      type="button"
                      onClick={() => onOpenClub(result.club_id)}
                      className="group flex h-full w-full flex-col gap-3 rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-primary">추천 {index + 1}</span>
                          <h3 className="mt-0.5 font-bold text-foreground">{result.name}</h3>
                        </div>
                        <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.is_recruiting && <Badge>모집중</Badge>}
                        <Badge variant="outline">
                          {result.confidence === "high" ? "높은 관련도" : result.confidence === "medium" ? "관련 있음" : "낮은 관련도"}
                        </Badge>
                        {result.matched_constraints.slice(0, 3).map((constraint) => (
                          <Badge key={constraint} variant="secondary">{constraint}</Badge>
                        ))}
                      </div>
                      <p className="text-xs font-medium text-foreground/80">{result.reason}</p>
                      {result.evidence[0] && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {result.evidence[0]}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
