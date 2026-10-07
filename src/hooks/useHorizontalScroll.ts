import { useCallback, useEffect, useState } from "react";

export type ScrollDirection = "prev" | "next";

/**
 * 가로 스크롤 영역에서 좌우로 가려진 내용이 있는지 추적합니다.
 * - 반환한 `ref`를 스크롤 컨테이너에 연결하면 크기·내용 변화에 맞춰 자동으로 다시 계산합니다.
 * - 조건부로 렌더링되는 요소에도 쓸 수 있도록 콜백 ref를 사용합니다.
 */
export function useHorizontalScroll<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!element) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const update = () => {
      setCanScrollPrev(element.scrollLeft > 4);
      setCanScrollNext(element.scrollLeft + element.clientWidth < element.scrollWidth - 4);
    };

    update();
    element.addEventListener("scroll", update, { passive: true });
    // 컨테이너 크기 변화(화면 회전·리사이즈)와 내용 변화(데이터 로딩·필터)를 모두 감지한다.
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(element, { childList: true, subtree: true });
    document.fonts?.ready.then(update);

    return () => {
      element.removeEventListener("scroll", update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [element]);

  /** 보이는 폭의 80%(최소 200px)만큼, 또는 지정한 거리만큼 이동합니다. */
  const scroll = useCallback(
    (direction: ScrollDirection, distance?: number) => {
      if (!element) return;
      const amount = distance ?? Math.max(element.clientWidth * 0.8, 200);
      element.scrollBy({ left: direction === "prev" ? -amount : amount, behavior: "smooth" });
    },
    [element],
  );

  return { ref: setElement, canScrollPrev, canScrollNext, scroll };
}
