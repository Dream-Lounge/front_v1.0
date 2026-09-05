import { Link } from "react-router-dom";
import { ArrowRight, FileText, Newspaper, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FEATURES } from "@/config/features";

const ALL_FEATURE_CARDS = [
  {
    icon: Search,
    title: "동아리 찾기",
    description:
      "분과별로 동아리를 둘러보고, 카드형·리스트형 중 편한 방식으로 살펴보세요.",
    show: true,
  },
  {
    icon: FileText,
    title: "지원서 관리",
    description:
      "지원서를 작성·임시저장하고, 지원 내역과 진행 상태를 한곳에서 확인하세요.",
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

const ALL_STEPS = [
  { title: "회원가입", description: "학번과 숫자 4자리 비밀번호로 간편하게 가입하세요.", show: true },
  {
    title: "동아리 지원",
    description: "마음에 드는 동아리에 지원서를 제출하세요.",
    show: true,
  },
] as const;

const STEPS = ALL_STEPS.filter((step) => step.show);

/**
 * 서비스 소개 페이지
 * - 헤더의 "Dream Lounge" 메뉴, 푸터의 "서비스 소개" 링크가 연결됩니다.
 */
export function About() {
  return (
    <div className="mx-auto w-full max-w-4xl pb-16 sm:pb-20">
      <div className="flex flex-col gap-10 sm:gap-14">
        {/* 페이지 헤더 */}
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
            Dream Lounge
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            드림라운지는 대학생들의 꿈과 열정을 이어주는 동아리 플랫폼입니다.
            동아리를 찾고, 지원하고, 소식을 확인하는 과정을 한 곳에서 해결하세요.
          </p>
        </div>

        {/* 기능 소개 */}
        <section className="flex flex-col gap-5">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            이런 걸 할 수 있어요
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 이용 방법 */}
        <section className="flex flex-col gap-5">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            이렇게 시작하세요
          </h2>
          <ol className="flex flex-col gap-4 sm:flex-row sm:gap-5">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-1 flex-col gap-1.5 rounded-2xl border border-border/70 bg-card p-5"
              >
                <span className="text-sm font-bold text-primary">
                  STEP {index + 1}
                </span>
                <h3 className="font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/40 p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">
            지금 바로 둘러보세요
          </h2>
          <p className="text-sm text-muted-foreground">
            지금 활동 중인 동아리를 확인하고 나에게 맞는 곳을 찾아보세요.
          </p>
          <Button asChild size="lg" className="font-bold">
            <Link to="/clubs">
              동아리 둘러보기
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
