import { useState, useRef, useEffect } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface HeroSlide {
    id: number;
    image: string;
    alt: string;
}

const SLIDES: HeroSlide[] = [
    {
        id: 1,
        image: "/images/banner_test_open.png",
        alt: "드림라운지 테스트 오픈 2026.06.12~06.30",
    },
    {
        id: 2,
        image: "/images/banner_ai_chat.png",
        alt: "어떤 질문이든 답변해드려요 - AI 챗봇 드림 컨시어지",
    },
];

/**
 * 히어로 캐러셀 컴포넌트
 * - 메인 페이지 상단에 위치하여 주요 프로모션이나 인기 동아리 정보를 슬라이드 형태로 제공합니다.
 * - 자동 재생 기능과 페이지네이션 도트를 포함합니다.
 */
export function HeroCarousel() {
    const [api, setApi] = useState<CarouselApi>();
    const plugin = useRef(
        Autoplay({ delay: 4000, stopOnInteraction: false })
    );

    return (
        <section className="w-full rounded-2xl overflow-hidden shadow-lg relative group">
            <Carousel
                setApi={setApi}
                plugins={[plugin.current]}
                className="w-full"
                opts={{
                    loop: true,
                }}
            >
                <CarouselContent className="ml-0">
                    {SLIDES.map((slide) => (
                        <CarouselItem key={slide.id} className="pl-0">
                            <img
                                src={slide.image}
                                alt={slide.alt}
                                className="w-full h-auto block"
                                draggable={false}
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/** 페이지네이션: 현재 슬라이드 위치 표시 (우측 하단) */}
            <CarouselDots api={api} count={SLIDES.length} />
        </section>
    );
}

/**
 * 캐러셀 페이지네이션 도트 컴포넌트
 * - 현재 활성화된 슬라이드를 시각적으로 표시합니다.
 */
function CarouselDots({ api, count }: { api: CarouselApi | undefined, count: number }) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!api) return;
        const onSelect = () => {
            setCurrent(api.selectedScrollSnap());
        };
        api.on("select", onSelect);
        onSelect();
        return () => {
            api.off("select", onSelect);
        };
    }, [api]);

    return (
        <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-20 flex gap-1.5">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        current === index ? "w-8 bg-white" : "w-2 bg-white/50"
                    )}
                />
            ))}
        </div>
    )
}
