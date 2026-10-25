import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_INTEREST_TAGS, MIN_INTERESTS, saveInterests } from "@/lib/interests";

/**
 * 관심 분야 선택(온보딩) 페이지
 * - 회원가입 후 첫 로그인 때 한 번 보여 줍니다.
 * - 기본 태그를 눌러 고르고, 원하는 태그가 없으면 직접 추가할 수 있습니다.
 * - 건너뛰어도 완료로 기록되어 다시 나타나지 않습니다.
 */
export function InterestSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 기본 태그 + 사용자가 추가한 태그 (중복 제거)
  const tags = useMemo(
    () => Array.from(new Set<string>([...DEFAULT_INTEREST_TAGS, ...customTags])),
    [customTags],
  );

  const toggle = (tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const closeAdder = () => {
    setIsAdding(false);
    setInput("");
  };

  const addCustomTag = () => {
    const value = input.trim().replace(/^#+/, "").trim();
    if (!value) return;
    if (!tags.includes(value)) setCustomTags((prev) => [...prev, value]);
    setSelected((prev) => new Set(prev).add(value));
    setInput("");
    // 연속으로 입력할 수 있도록 입력창은 열어 둔 채 포커스를 유지한다.
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중 Enter는 조합 확정용이므로 무시한다.
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomTag();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAdder();
    }
  };

  const handleInputBlur = () => {
    if (input.trim()) addCustomTag();
    setIsAdding(false);
  };

  const finish = (tags: string[]) => {
    if (user) saveInterests(user.studentId, tags);
    navigate("/", { replace: true });
  };

  const count = selected.size;
  const remaining = Math.max(MIN_INTERESTS - count, 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col py-4 sm:py-8">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">어떤 분야에 관심있으신가요?</h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        관심 분야를 알려주시면 나에게 맞는 동아리를 찾는 데 활용할게요.
      </p>

      <p className="mt-10 text-sm font-medium text-foreground" aria-live="polite">
        선택한 관심 분야 <span className="font-bold tabular-nums text-primary">{count}</span>개
        <span className="ml-1.5 text-muted-foreground">/ 최소 {MIN_INTERESTS}개 선택</span>
      </p>

      {/* 줄바꿈으로 펼쳐 좁은 화면에서도 가려지는 태그가 없다. 마지막은 직접 추가(+) 칩 */}
      <div className="mt-3 flex flex-wrap gap-2.5">
        {tags.map((tag) => {
          const isSelected = selected.has(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              aria-pressed={isSelected}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/60",
              )}
            >
              {isSelected && <Check className="size-3.5" aria-hidden />}
              {tag}
            </button>
          );
        })}

        {isAdding ? (
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            placeholder="입력 후 Enter"
            maxLength={20}
            aria-label="관심 분야 직접 입력"
            className="w-40 rounded-full border border-primary bg-card px-4 py-2 text-sm font-medium text-foreground outline-none ring-2 ring-primary/30 placeholder:font-normal placeholder:text-muted-foreground"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            aria-label="관심 분야 직접 추가"
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60 hover:text-foreground"
          >
            <Plus className="size-4" aria-hidden />
            직접 추가
          </button>
        )}
      </div>

      {/* 모바일은 태그 목록이 길어 버튼이 화면 밖으로 밀리므로 하단에 붙여 둔다. */}
      <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mt-12 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button variant="ghost" onClick={() => finish([])} className="text-muted-foreground">
          건너뛰기
        </Button>
        <Button
          size="lg"
          onClick={() => finish([...selected])}
          disabled={remaining > 0}
          className="h-11 px-8 font-bold"
        >
          {remaining > 0 ? `${remaining}개 더 선택해주세요` : "시작하기"}
        </Button>
      </div>
    </div>
  );
}
