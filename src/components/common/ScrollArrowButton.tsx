import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScrollDirection } from "@/hooks/useHorizontalScroll";

interface ScrollArrowButtonProps {
  direction: ScrollDirection;
  onClick: () => void;
  label: string;
  /** 위치(absolute 좌표)와 크기를 지정합니다. */
  className?: string;
}

/** 가로로 잘린 내용이 있음을 알려 주고 그쪽으로 넘겨 주는 원형 버튼 */
export function ScrollArrowButton({ direction, onClick, label, className }: ScrollArrowButtonProps) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "z-10 flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 shadow-md backdrop-blur-sm transition-colors hover:bg-slate-50",
        className,
      )}
    >
      <Icon className="size-4 text-slate-600" aria-hidden />
    </button>
  );
}
