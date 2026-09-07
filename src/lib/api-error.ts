import { toast } from "sonner";
import { isSessionExpiredError } from "@/lib/api";

/**
 * 세션 만료는 AuthProvider의 전역 다이얼로그에서 한 번만 안내한다.
 * 각 화면에서는 그 외 API 오류만 토스트로 표시한다.
 */
export function toastApiError(error: unknown, fallbackMessage: string): void {
  if (isSessionExpiredError(error)) return;
  toast.error(error instanceof Error ? error.message : fallbackMessage);
}
