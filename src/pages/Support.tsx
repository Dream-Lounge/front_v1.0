import { ExternalLink, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SUPPORT_EMAIL = "jwhong48@gmail.com";
const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd0KzW-SAgVZMEOFX0ZKz8Zy1zVCN92S8HRFSdGXlILwakhEg/viewform?usp=dialog";

/** 테스트 운영 안내와 문의 수단을 제공하는 페이지입니다. */
export function Support() {
  return (
    <div className="mx-auto w-full max-w-4xl pb-16 sm:pb-20">
      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-8 p-6 leading-relaxed sm:p-10">
          <header className="space-y-3">
            <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
              DreamLounge를 이용해 주셔서 감사합니다! 🙌
            </h1>
          </header>

          <div className="space-y-5 text-[15px] text-muted-foreground sm:text-base">
            <p>
              안녕하세요. <strong className="text-foreground">Dream Lounge</strong>는 동아리 신청과 관리 과정을 더욱 편리하게 만들기 위해 <strong className="text-foreground">인공지능소프트웨어학과 학생들로 구성된 ‘왕꿈틀이’ 팀</strong>이 졸업작품으로 개발한 플랫폼입니다.
            </p>

            <p>
              소중한 테스트 기회를 제공해 주신 동아리 관계자분들과 실제로 서비스를 이용해 주시는 모든 분께 진심으로 감사드립니다.
            </p>

            <p>
              Dream Lounge는 현재 테스트 운영 중이므로 이용 과정에서 예상하지 못한 오류나 불편한 점이 발생할 수 있습니다. 문제가 발생하거나 도움이 필요한 경우, 아래 이메일을 통해 알려주시면 최대한 빠르게 확인하겠습니다.
            </p>
          </div>

          <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h2 className="font-bold text-foreground">문의 및 오류 제보</h2>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 inline-block break-all text-primary underline underline-offset-4 hover:text-primary/80">
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </section>

          <div className="space-y-5 text-[15px] text-muted-foreground sm:text-base">
            <p>
              또한, 서비스를 이용하며 불편했던 점이나 개선되었으면 하는 부분, 새롭게 추가되기를 원하는 기능이 있다면 아래 설문을 통해 자유롭게 의견을 남겨 주세요.
            </p>
          </div>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <ExternalLink className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h2 className="font-bold text-foreground">서비스 개선 의견 남기기</h2>
                <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-start gap-1 break-all text-primary underline underline-offset-4 hover:text-primary/80">
                  {FEEDBACK_FORM_URL}
                  <ExternalLink className="mt-1 size-3.5 shrink-0" aria-hidden />
                </a>
              </div>
            </div>
          </section>

          <div className="space-y-5 text-[15px] text-muted-foreground sm:text-base">
            <p>
              여러분이 보내주시는 관심과 의견은 DreamLounge를 더욱 편리하고 완성도 높은 서비스로 발전시키는 데 큰 도움이 됩니다.
            </p>
            <p>
              소중한 가두모집 기간에 DreamLounge를 이용해 주셔서 다시 한번 감사드립니다.
            </p>
            <p className="pt-2 font-bold text-foreground">왕꿈틀이팀 드림</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
