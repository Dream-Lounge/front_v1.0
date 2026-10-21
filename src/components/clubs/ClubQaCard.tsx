import { type FormEvent, useState } from "react";
import { LoaderCircle, MessageCircleQuestion, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, type RecommendationQAResponse } from "@/lib/api";

export function ClubQaCard({ clubId }: { clubId: string }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ question: string; response: RecommendationQAResponse }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const previousQuestion = messages.at(-1)?.question;
      const response = await api.askClubQuestion(normalizedQuestion, clubId, previousQuestion);
      setMessages((current) => [...current, { question: normalizedQuestion, response }]);
      setQuestion("");
    } catch {
      setError("답변을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircleQuestion className="size-5 text-primary" aria-hidden />
          동아리 정보에 질문하기
        </CardTitle>
        <p className="text-sm text-muted-foreground">등록된 소개와 모집글을 근거로 답변합니다.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="space-y-3">
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={1_000}
            rows={2}
            placeholder="예: 초보도 지원할 수 있나요? 회비는 얼마인가요?"
            aria-label="동아리 질문"
          />
          <Button type="submit" disabled={!question.trim() || isLoading}>
            {isLoading ? <LoaderCircle className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            {isLoading ? "근거를 찾는 중..." : "질문하기"}
          </Button>
        </form>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {messages.length > 0 && (
          <div className="space-y-3" aria-live="polite">
            {messages.map(({ question: askedQuestion, response }, index) => <div key={`${askedQuestion}-${index}`} className="space-y-2">
              <p className="ml-auto w-fit max-w-[85%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground">{askedQuestion}</p>
              <div className="rounded-xl bg-muted/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={response.supported ? "secondary" : "outline"}>
                    {response.supported ? "등록 정보 기반" : "정보 없음"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">신뢰도 {Math.round(response.confidence * 100)}%</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground">{response.answer}</p>
                {response.supported && response.evidence.length > 0 && (
              <div className="mt-3 border-t border-border/70 pt-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">답변 근거</p>
                <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                  {response.evidence.map((evidence) => <li key={evidence}>• {evidence}</li>)}
                </ul>
              </div>
                )}
              </div>
            </div>)}
            <div className="flex flex-wrap gap-2">
              {messages.at(-1)?.response.suggested_questions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)} className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
