import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

/** 자동 재생 간격(ms) — 프로그레스 바가 차오르는 시간과 동일하게 쓴다. */
const AUTOPLAY_DELAY = 6500;

/** href가 있는 배너는 클릭하면 해당 주소로 이동합니다. */
const SLIDES: { image: string; alt: string; href?: string }[] = [
  { image: "/images/banner_test_open.png", alt: "동아리 가입부터 관리까지 한번에! 드림라운지 테스트 오픈 - 9월 15일부터 10월 10일 오후 11시 59분까지" },
  {
    image: "/images/banner_survey.png",
    alt: "서비스 만족도 설문조사 참여하기 - 기간 2026.9.15~10.18, 추첨을 통해 소정의 상품을 드립니다",
    href: "https://docs.google.com/forms/d/e/1FAIpQLSd0KzW-SAgVZMEOFX0ZKz8Zy1zVCN92S8HRFSdGXlILwakhEg/viewform",
  },
];

export function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  /**
   * 배너가 넘어간 방향 — 인디케이터 숫자를 같은 방향으로 전환시킨다.
   * 배너가 2장인 루프 캐러셀에서는 인덱스 차이만으로 앞/뒤를 구분할 수 없어
   * (마지막 → 처음과 처음 → 마지막이 같은 이동량) 버튼 조작을 기준으로 잡는다.
   * 자동 재생과 스와이프는 기본값인 '다음'으로 처리한다.
   */
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const pendingDirection = useRef<"next" | "prev">("next");
  const [playing, setPlaying] = useState(false);
  /**
   * 다음 배너까지의 진행률 표시.
   * 자동 재생 타이머가 새로 걸릴 때마다(timerset) key를 바꿔 프로그레스를
   * 0부터 다시 채우고, 타이머가 멈추면(timerstopped) 그 자리에서 멈춘다.
   * 호버·포커스·일시정지로 멈췄다가 다시 시작하면 embla가 타이머를 처음부터
   * 다시 걸기 때문에, 진행률도 자연스럽게 0부터 다시 시작한다.
   */
  const [timerCycle, setTimerCycle] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const autoplay = useRef(Autoplay({ delay: AUTOPLAY_DELAY, playOnInit: false, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true }));

  useEffect(() => {
    if (!api) return;
    const select = () => {
      setDirection(pendingDirection.current);
      pendingDirection.current = "next";
      setCurrent(api.selectedScrollSnap());
    };
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => { if (media.matches) autoplay.current.stop(); else autoplay.current.play(); };
    const onPlay = () => setPlaying(true);
    const onStop = () => setPlaying(false);
    const onTimerSet = () => { setTimerRunning(true); setTimerCycle((cycle) => cycle + 1); };
    const onTimerStopped = () => setTimerRunning(false);
    api.on("select", select);
    api.on("autoplay:play", onPlay);
    api.on("autoplay:stop", onStop);
    api.on("autoplay:timerset", onTimerSet);
    api.on("autoplay:timerstopped", onTimerStopped);
    media.addEventListener("change", motion);
    motion();
    return () => {
      api.off("select", select);
      api.off("autoplay:play", onPlay);
      api.off("autoplay:stop", onStop);
      api.off("autoplay:timerset", onTimerSet);
      api.off("autoplay:timerstopped", onTimerStopped);
      media.removeEventListener("change", motion);
    };
  }, [api]);

  return (
    <section className="dream-hero" aria-label="드림라운지 소식">
      <Carousel setApi={setApi} plugins={[autoplay.current]} opts={{ loop: true }}>
        <CarouselContent className="ml-0">
          {SLIDES.map((slide, index) => (
            <CarouselItem key={slide.image} className="pl-0" aria-hidden={index !== current}>
              <div className="dream-hero-slide">
                {slide.href ? (
                  <a
                    href={slide.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    /* 현재 보이지 않는 슬라이드는 aria-hidden이므로 탭 순서에서도 제외한다. */
                    tabIndex={index === current ? undefined : -1}
                  >
                    <img className="dream-hero-banner" src={slide.image} alt={slide.alt} draggable={false} />
                  </a>
                ) : (
                  <img className="dream-hero-banner" src={slide.image} alt={slide.alt} draggable={false} />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="dream-hero-controls">
        <button type="button" aria-label="이전 소식" onClick={() => { pendingDirection.current = "prev"; api?.scrollPrev(); }}><ChevronLeft size={16} /></button>
        <span aria-live="off">
          {/* key를 바꿔 슬라이드가 넘어갈 때마다 전환 애니메이션을 다시 실행한다. */}
          <strong key={current} className="dream-hero-count" data-direction={direction}>
            {String(current + 1).padStart(2, "0")}
          </strong>
          {/* 다음 배너까지 남은 시간을 채워 보여주는 프로그레스 바 */}
          <span className="dream-control-divider">
            <span
              key={timerCycle}
              className="dream-control-progress"
              data-running={timerRunning}
              style={{ animationDuration: `${AUTOPLAY_DELAY}ms` }}
            />
          </span>
          {String(SLIDES.length).padStart(2, "0")}
        </span>
        <button type="button" aria-label="다음 소식" onClick={() => api?.scrollNext()}><ChevronRight size={16} /></button>
        <button type="button" aria-label={playing ? "소식 자동 재생 일시정지" : "소식 자동 재생"} onClick={() => playing ? autoplay.current.stop() : autoplay.current.play()}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>
      </div>
    </section>
  );
}
