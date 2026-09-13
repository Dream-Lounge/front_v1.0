import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

const SLIDES = [
  { eyebrow: "동아리 가입부터 관리까지 한 번에!", title: "드림라운지", emphasis: "테스트 오픈", image: "/images/banner_test_open.png", alt: "드림라운지 테스트 오픈 2026.06.12~06.30" },
  { eyebrow: "동아리에 대해 궁금한 모든 것들", title: "어떤 질문이든", emphasis: "답변해드려요!", image: "/images/banner_ai_chat.png", alt: "AI 챗봇 드림 컨시어지에서 필요한 정보를 물어보세요" },
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
                <p className="dream-hero-eyebrow">{slide.eyebrow}</p>
                <h1 className="dream-hero-title">{slide.title}<br /><span>{slide.emphasis}</span></h1>
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
