import { type FormEvent, type KeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUp, LoaderCircle, Sparkles, X } from "lucide-react";
import { api, type RecommendationResult } from "@/lib/api";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "초보인데 영상 편집을 배우고 포트폴리오를 만들고 싶어",
  "주말에 부담 없이 참여할 수 있는 친목 동아리",
  "사진 촬영을 배우고 전시회도 해보고 싶어",
];

/** 작성·관리 화면에서는 입력을 가리지 않도록 버튼을 숨긴다. */
const HIDDEN_PATHS = [
  "/admin",
  "/club/:id/apply",
  "/applications/:id/edit",
  "/applications/:id/view",
  "/board/write",
  "/board/:scope/:postId/edit",
  "/board/club/:clubId/:postId/edit",
  "/onboarding/interests",
];

/** 첫 방문 안내 말풍선을 닫았는지 기억하는 키 (브라우저별) */
const TIP_CLOSED_KEY = "dl_ai_chatbot_tip_closed";

function readTipClosed() {
  try {
    return localStorage.getItem(TIP_CLOSED_KEY) === "1";
  } catch {
    return false;
  }
}

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "bot"; results: RecommendationResult[] }
  | { id: number; role: "error"; text: string };

/**
 * 화면 오른쪽 아래에 떠 있는 AI 동아리 추천 챗봇
 * - 하고 싶은 활동을 적으면 추천 API 결과를 대화 형태로 보여 준다.
 * - 페이지를 이동해도 대화가 남도록 레이아웃에 한 번만 둔다.
 * - 모바일에서는 화면 아래에서 올라오는 시트, 넓은 화면에서는 버튼 위 작은 창으로 연다.
 * - 버튼: 넓은 화면은 'AI 동아리 추천' 알약, 모바일과 대화창이 열린 동안은 아이콘만 있는 원형으로 줄인다.
 * - 처음 방문하면 버튼 위에 안내 말풍선을 띄우고, 닫거나 대화창을 열면 다시 띄우지 않는다.
 */
export function AiRecommendChatbot() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const nextId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [isTipVisible, setIsTipVisible] = useState(false);

  const isHidden = HIDDEN_PATHS.some((pattern) => matchPath(pattern, pathname));

  const close = useCallback(() => {
    setIsOpen(false);
    toggleRef.current?.focus();
  }, []);

  // 첫 방문이면 잠시 뒤 안내 말풍선을 띄운다.
  useEffect(() => {
    if (readTipClosed()) return;
    const timer = window.setTimeout(() => setIsTipVisible(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  const closeTip = useCallback(() => {
    setIsTipVisible(false);
    try {
      localStorage.setItem(TIP_CLOSED_KEY, "1");
    } catch {
      // 저장이 막힌 환경이면 이번 방문 동안만 숨긴다.
    }
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    closeTip();
  }, [closeTip]);

  // 새 메시지가 생기면 맨 아래로 스크롤
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // 열면 입력칸에 포커스, Esc로 닫기
  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (isHidden) return null;

  async function send(text: string) {
    const normalized = text.trim();
    if (!normalized || isLoading) return;
    setQuery("");
    setMessages((current) => [...current, { id: nextId.current++, role: "user", text: normalized }]);
    setIsLoading(true);
    try {
      const response = await api.recommendClubs(normalized);
      setMessages((current) => [...current, { id: nextId.current++, role: "bot", results: response.results }]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: nextId.current++, role: "error", text: "추천 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send(query);
  }

  // Enter로 보내고, Shift+Enter는 줄바꿈 (한글 조합 중에는 보내지 않음)
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(query);
    }
  }

  function openClub(clubId: string) {
    navigate(`/club/${clubId}`);
    // 모바일 시트는 화면을 거의 덮으므로 이동하면서 닫는다.
    if (window.matchMedia("(max-width: 639px)").matches) setIsOpen(false);
  }

  return (
    <>
      {/* 모바일: 시트 뒤 배경을 눌러 닫기 */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={close} aria-hidden />
      )}

      {isOpen && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="ai-chatbot-title"
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border border-border bg-card shadow-2xl",
            "inset-x-0 bottom-0 h-[85dvh] rounded-t-3xl",
            "sm:inset-x-auto sm:right-6 sm:bottom-24 sm:h-[min(600px,calc(100dvh-8rem))] sm:w-[380px] sm:rounded-3xl",
          )}
        >
          {/* 헤더 */}
          <header className="flex items-center gap-3 border-b border-border bg-gradient-to-br from-[#edf4fc] to-[#e3eefc] px-5 py-4">
            <span className="dream-ai-avatar size-10">
              <RobotIcon className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="ai-chatbot-title" className="font-bold text-foreground">AI 동아리 추천</h2>
              <p className="truncate text-xs text-muted-foreground">나에게 맞는 동아리를 찾아드려요</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="AI 동아리 추천 닫기"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/70 hover:text-foreground"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>

          {/* 대화 */}
          <div ref={listRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5" aria-live="polite">
            <BotBubble>
              <p>
                하고 싶은 활동, 가능한 시간, 선호하는 분위기를 자유롭게 적어주세요. 딱 맞는 동아리를 찾아드릴게요.
              </p>
            </BotBubble>
            {messages.length === 0 && (
              <div className="flex flex-col items-start gap-2 pl-10">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => void send(example)}
                    className="rounded-2xl border border-primary/25 bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message) =>
              message.role === "user" ? (
                <p
                  key={message.id}
                  className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                >
                  {message.text}
                </p>
              ) : message.role === "error" ? (
                <BotBubble key={message.id}>
                  <p className="text-destructive">{message.text}</p>
                </BotBubble>
              ) : (
                <BotBubble key={message.id}>
                  {message.results.length === 0 ? (
                    <p>조건에 맞는 동아리를 찾지 못했어요. 조금 다르게 적어볼까요?</p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <p>이런 동아리는 어떠세요?</p>
                      <ol className="flex flex-col gap-2">
                        {message.results.map((result) => (
                          <li key={result.club_id}>
                            <button
                              type="button"
                              onClick={() => openClub(result.club_id)}
                              className="group flex w-full flex-col gap-1.5 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                            >
                              <span className="flex w-full items-center gap-2">
                                <span className="min-w-0 flex-1 truncate font-bold text-foreground group-hover:text-primary">
                                  {result.name}
                                </span>
                                {result.is_recruiting && (
                                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                    모집중
                                  </span>
                                )}
                                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                              </span>
                              <span className="text-xs leading-relaxed text-muted-foreground">{result.reason}</span>
                              {result.matched_constraints.length > 0 && (
                                <span className="flex flex-wrap gap-x-2 text-xs font-semibold text-primary">
                                  {result.matched_constraints.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </BotBubble>
              ),
            )}

            {isLoading && (
              <BotBubble>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  추천을 찾는 중...
                </p>
              </BotBubble>
            )}
          </div>

          {/* 입력 */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border bg-card p-3">
            <textarea
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={1_000}
              rows={1}
              placeholder="원하는 동아리를 설명해주세요"
              aria-label="원하는 동아리 설명"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-base outline-none [field-sizing:content] placeholder:text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 sm:text-sm"
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              aria-label="보내기"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <ArrowUp className="size-5" aria-hidden />
            </button>
          </form>
        </section>
      )}

      {/* 첫 방문 안내 말풍선 */}
      {isTipVisible && !isOpen && (
        <div className="dream-ai-tip" role="status">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p>
            나에게 맞는 동아리를
            <br />
            <span className="text-primary">AI</span>가 추천해드려요!
          </p>
          <button type="button" onClick={closeTip} aria-label="안내 닫기" className="dream-ai-tip-close">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {/* 플로팅 버튼: 넓은 화면은 알약, 모바일과 대화창이 열린 동안은 원형 (모바일에서 시트가 열리면 시트의 닫기 버튼을 쓰므로 숨긴다) */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => (isOpen ? close() : open())}
        aria-label={isOpen ? "AI 동아리 추천 닫기" : "AI 동아리 추천 열기"}
        aria-expanded={isOpen}
        className={cn("dream-ai-fab", isOpen ? "dream-ai-fab--icon max-sm:hidden" : "dream-ai-fab--responsive")}
      >
        {isOpen ? (
          <X className="size-6" aria-hidden />
        ) : (
          <>
            <RobotIcon className="dream-ai-fab-robot" />
            <span className="dream-ai-fab-label">AI 동아리 추천</span>
            <ArrowRight className="dream-ai-fab-arrow" aria-hidden />
            <SignalMark />
          </>
        )}
      </button>
    </>
  );
}

function BotBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="dream-ai-avatar mt-0.5 size-8">
        <RobotIcon className="size-[22px]" />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-muted/70 px-4 py-3 text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </div>
  );
}

/** 흰 머리에 파란 눈과 입이 있는 챗봇 로봇 아이콘 */
function RobotIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <line x1="20" y1="5" x2="20" y2="10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="20" cy="4.5" r="2.6" fill="#fff" />
      <rect x="2.5" y="17" width="4.5" height="9" rx="2.2" fill="#fff" />
      <rect x="33" y="17" width="4.5" height="9" rx="2.2" fill="#fff" />
      <rect x="6" y="9.5" width="28" height="23" rx="9.5" fill="#fff" />
      <g fill="none" stroke="#1565d8" strokeWidth="2.3" strokeLinecap="round">
        <path d="M12.8 20.6q2.7-3.2 5.4 0" />
        <path d="M21.8 20.6q2.7-3.2 5.4 0" />
        <path d="M16.2 25q3.8 3.2 7.6 0" />
      </g>
    </svg>
  );
}

/** 원형 버튼 오른쪽 위의 말하는 중 표시 */
function SignalMark() {
  return (
    <svg viewBox="0 0 20 20" className="dream-ai-fab-signal" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M4 10l-2.5-1.5" />
        <path d="M8.5 6.5L8 3" />
        <path d="M12.5 8.5l3-2.5" />
      </g>
    </svg>
  );
}
