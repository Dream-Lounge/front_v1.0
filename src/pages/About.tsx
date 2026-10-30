import {
  ClipboardCheck,
  FileText,
  Megaphone,
  Newspaper,
  Search,
  Sparkles,
} from "lucide-react";
import { FEATURES } from "@/config/features";
import { GuideSteps } from "@/components/common/GuideSteps";

const ALL_FEATURE_CARDS = [
  {
    icon: Search,
    title: "동아리 찾기",
    description:
      "다양한 동아리의 소개와 활동 내용을 살펴보고, 나의 관심사와 잘 맞는 동아리를 발견해 보세요.",
    show: true,
  },
  {
    icon: Megaphone,
    title: "모집 정보 확인하기",
    description:
      "관심 있는 동아리의 모집 내용과 지원 전에 알아야 할 정보를 한눈에 확인할 수 있어요.",
    show: true,
  },
  {
    icon: FileText,
    title: "지원서 작성하기",
    description:
      "온라인으로 바로 지원하고, 답변을 더 고민하고 싶다면 임시 저장한 뒤 이어서 작성할 수 있어요.",
    show: true,
  },
  {
    icon: ClipboardCheck,
    title: "지원 현황 확인하기",
    description:
      "제출한 지원서와 진행 상태를 마이페이지에서 편리하게 확인하고 한곳에서 관리하세요.",
    show: true,
  },
  {
    icon: Sparkles,
    title: "관심사 기반 추천",
    description: "관심 있는 분야를 선택하면 취향에 맞는 동아리를 추천해드려요.",
    show: FEATURES.aiRecommend,
  },
  {
    icon: Newspaper,
    title: "동아리 뉴스",
    description: "공지사항부터 행사 소식까지, 동아리 관련 소식을 놓치지 마세요.",
    show: FEATURES.clubNews,
  },
] as const;

const FEATURE_CARDS = ALL_FEATURE_CARDS.filter((feature) => feature.show);

/**
 * 서비스 소개 페이지
 * - 헤더의 "Dream Lounge" 메뉴, 푸터의 "서비스 소개" 링크가 연결됩니다.
 * - 한글 본문은 break-keep(word-break: keep-all)으로 단어 중간 줄바꿈을 막아
 *   좁은 화면에서도 읽기 흐름이 끊기지 않도록 합니다.
 */
export function About() {
  return (
    <div className="mx-auto w-full pb-16 sm:pb-20">
      <div className="flex flex-col gap-12 sm:gap-16">
        {/* 페이지 헤더 */}
        <header className="flex flex-col gap-4">
          <span className="text-sm font-bold tracking-wide text-primary">
            Dream Lounge
          </span>
          <h1 className="break-keep text-2xl font-extrabold leading-snug text-foreground sm:text-[28px]">
            우리, 어느 동아리에서 만나게 될까요,,?
          </h1>
          <div className="flex flex-col gap-2">
            <p className="break-keep text-base font-bold leading-snug text-foreground sm:text-lg">
              새로운 사람과 경험을 만나는 가장 쉬운 방법
            </p>
            <p className="break-keep text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              Dream Lounge에서 다양한 동아리를 둘러보고, 마음에 드는 동아리에
              간편하게 지원해보세요
            </p>
          </div>
        </header>

        {/* 기능 소개 */}
        <section className="flex flex-col gap-5">
          <h2 className="break-keep text-xl font-bold text-foreground sm:text-2xl">
            Dream Lounge에서는 이런 걸 할 수 있어요
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="break-keep font-bold text-foreground">
                    {title}
                  </h3>
                </div>
                <p className="break-keep text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 이용 방법 */}
        <section className="flex flex-col gap-5">
          <h2 className="break-keep text-xl font-bold text-foreground sm:text-2xl">
            동아리 가입, 이렇게 진행돼요
          </h2>
          <GuideSteps />
        </section>
      </div>
    </div>
  );
}
