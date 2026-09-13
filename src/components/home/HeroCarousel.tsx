import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

const SLIDES = [
  { image: "/images/banner_test_open.png", alt: "동아리 가입부터 관리까지 한번에! 드림라운지 테스트 오픈 - 9월 15일부터 10월 10일 오후 11시 59분까지" },
  { image: "/images/banner_survey.png", alt: "서비스 만족도 설문조사 - 기간 2026.9.15~10.18, 추첨을 통해 소정의 상품을 드립니다" },
];

export function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const autoplay = useRef(Autoplay({ delay: 6500, playOnInit: false, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true }));

  useEffect(() => {
    if (!api) return;
    const select = () => setCurrent(api.selectedScrollSnap());
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => { if (media.matches) autoplay.current.stop(); else autoplay.current.play(); };
    const onPlay = () => setPlaying(true);
    const onStop = () => setPlaying(false);
    api.on("select", select);
    api.on("autoplay:play", onPlay);
    api.on("autoplay:stop", onStop);
    media.addEventListener("change", motion);
    motion();
    return () => { api.off("select", select); api.off("autoplay:play", onPlay); api.off("autoplay:stop", onStop); media.removeEventListener("change", motion); };
  }, [api]);

  return (
    <section className="dream-hero" aria-label="드림라운지 소식">
      <Carousel setApi={setApi} plugins={[autoplay.current]} opts={{ loop: true }}>
        <CarouselContent className="ml-0">
          {SLIDES.map((slide, index) => (
            <CarouselItem key={slide.image} className="pl-0" aria-hidden={index !== current}>
              <div className="dream-hero-slide">
                <img className="dream-hero-banner" src={slide.image} alt={slide.alt} draggable={false} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="dream-hero-controls">
        <button type="button" aria-label="이전 소식" onClick={() => api?.scrollPrev()}><ChevronLeft size={16} /></button>
        <span aria-live="off"><strong>{String(current + 1).padStart(2, "0")}</strong><span className="dream-control-divider" />{String(SLIDES.length).padStart(2, "0")}</span>
        <button type="button" aria-label="다음 소식" onClick={() => api?.scrollNext()}><ChevronRight size={16} /></button>
        <button type="button" aria-label={playing ? "소식 자동 재생 일시정지" : "소식 자동 재생"} onClick={() => playing ? autoplay.current.stop() : autoplay.current.play()}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>
      </div>
    </section>
  );
}
