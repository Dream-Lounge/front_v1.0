import { useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { isAuthenticated } from "@/lib/auth";
import { DEFAULT_INTEREST_TAGS, saveInterests } from "@/lib/interests";

/**
 * 관심사 선택(온보딩) 페이지
 * - 최초 로그인 후 사용자 기반 동아리 추천을 위해 관심사를 수집합니다.
 * - 기본 태그를 토글로 선택하고, 원하는 태그가 없으면 직접 추가할 수 있습니다.
 */
export function InterestSelection() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 기본 태그 + 사용자가 추가한 태그 (중복 제거)
  const tags = useMemo(() => {
    const seen = new Set<string>();
    return [...DEFAULT_INTEREST_TAGS, ...customTags].filter((tag) => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
  }, [customTags]);

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-muted-foreground">불러오는 중...</p>
      </main>
    );
  }

  // React state 업데이트 타이밍 이슈로 user가 아직 null일 수 있으므로
  // localStorage 토큰을 직접 확인해 비로그인 여부를 판단
  if (!user && !isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const toggle = (tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const openAdder = () => {
    setIsAdding(true);
    setInput("");
  };

  const closeAdder = () => {
    setIsAdding(false);
    setInput("");
  };

  const addCustomTag = () => {
    const value = input.trim().replace(/^#+/, "").trim();
    if (!value) return;
    if (!tags.includes(value)) {
      setCustomTags((prev) => [...prev, value]);
    }
    setSelected((prev) => new Set(prev).add(value));
    setInput("");
    // 연속 입력을 위해 입력창은 열어둔 채 포커스 유지
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeAdder();
    }
  };

  const handleInputBlur = () => {
    // 입력값이 있으면 추가하고, 비어 있으면 입력창을 닫습니다.
    if (input.trim()) {
      addCustomTag();
    }
    setIsAdding(false);
  };

  const complete = () => {
    if (user) saveInterests(user.studentId, [...selected]);
    navigate("/", { replace: true });
  };

  const count = selected.size;

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center bg-background px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-2xl flex-1 flex-col">
        {/* 헤더 */}
        <div className="flex flex-col items-start">
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
            어떤 동아리에 관심있으신가요?
          </h1>
          <p className="mt-2 text-xs font-bold text-foreground sm:text-sm">
            관심사를 선택하면 AI가 취향에 맞는 동아리를 추천해드려요 !
          </p>
        </div>

        {/* 선택 개수 */}
        <p className="mt-12 text-sm font-medium text-foreground">
          선택한 관심사{" "}
          <span className="font-bold text-primary tabular-nums">{count}</span>개
          <span className="ml-1.5 text-muted-foreground">/ 최소 5개 선택</span>
        </p>

        {/* 태그 칩 (마지막에 추가(+) 칩) */}
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
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/60",
                )}
              >
                {isSelected && <Check className="size-3.5" />}
                {tag}
              </button>
            );
          })}

          {/* 항상 마지막: 추가(+) 칩 → 클릭 시 인라인 입력창 */}
          {isAdding ? (
            <input
              ref={inputRef}
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              placeholder="입력 후 Enter"
              maxLength={20}
              aria-label="관심사 직접 입력"
              className="w-40 rounded-full border border-primary bg-card px-4 py-2 text-sm font-medium text-foreground outline-none ring-2 ring-primary/30 placeholder:font-normal placeholder:text-muted-foreground"
            />
          ) : (
            <button
              type="button"
              onClick={openAdder}
              aria-label="관심사 추가"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-muted/60"
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>

        {/* 하단 액션 */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-12">
          <Button variant="ghost" onClick={complete}>
            건너뛰기
          </Button>
          <Button
            size="lg"
            onClick={complete}
            disabled={count < 5}
            className="px-8 font-bold"
          >
            시작하기
          </Button>
        </div>
      </div>
      </main>
    </>
  );
}
