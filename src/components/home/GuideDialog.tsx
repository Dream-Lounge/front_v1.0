import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuideSteps } from "@/components/common/GuideSteps";

const HIDE_UNTIL_KEY = "dl_guide_hidden_until";

/** '오늘 하루 보지 않기'를 누른 날이면 true */
function isHiddenToday(): boolean {
  try {
    return Number(localStorage.getItem(HIDE_UNTIL_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

/** 오늘 자정까지 팝업을 띄우지 않도록 기록합니다. */
function hideForToday() {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  try {
    localStorage.setItem(HIDE_UNTIL_KEY, String(midnight.getTime()));
  } catch {
    // 저장이 막힌 환경이면 이번 방문에서만 닫힌다.
  }
}

/**
 * 홈 화면 진입 시 띄우는 'Dream Lounge 이용 가이드' 팝업
 * - 소개 페이지의 STEP 1~5와 같은 내용을 보여 줍니다.
 * - '오늘 하루 보지 않기'를 누르면 그날 자정까지 다시 띄우지 않습니다.
 */
export function GuideDialog() {
  const [open, setOpen] = useState(() => !isHiddenToday());
  const closeRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-md"
        // 처음 포커스가 '오늘 하루 보지 않기'에 가면 Enter 한 번에 숨겨지므로 '닫기'에 둔다.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          closeRef.current?.focus();
        }}
      >
        <DialogHeader className="px-6 pt-7 pb-6 text-left">
          <DialogTitle className="text-xl font-bold">Dream Lounge 이용 가이드</DialogTitle>
          <DialogDescription className="sr-only">동아리 가입은 이렇게 진행돼요.</DialogDescription>
        </DialogHeader>

        {/* 단계 설명이 길어 작은 화면에서는 이 부분만 스크롤된다. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
          <GuideSteps />
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t px-6 py-4 sm:justify-between">
          <button
            type="button"
            onClick={() => {
              hideForToday();
              setOpen(false);
            }}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            오늘 하루 보지 않기
          </button>
          <Button ref={closeRef} onClick={() => setOpen(false)} className="px-6">
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
