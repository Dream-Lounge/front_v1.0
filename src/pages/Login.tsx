import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { validators, ERROR_MESSAGES } from "@/lib/validators";
import { useAuth } from "@/hooks/useAuth";
import { ApiRequestError, isSessionExpiredError } from "@/lib/api";

/**
 * 로그인 페이지 컴포넌트
 * - 학번, 비밀번호 입력 폼
 * - 필수 필드 유효성 검사 및 로그인 실패 에러 메시지
 */
export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  // 지원서 작성 중 로그인 화면으로 왔다면 '비회원으로 지원하기', 아니면 '비회원으로 둘러보기'를 보여 준다.
  const from = (location.state as { from?: string } | null)?.from;
  const applyPath = from && /^\/club\/[^/]+\/apply$/.test(from) ? from : null;
  const [isGuestNoticeOpen, setIsGuestNoticeOpen] = useState(false);

  const continueAsGuest = () => {
    if (applyPath) {
      setIsGuestNoticeOpen(true);
    } else if ((window.history.state as { idx?: number } | null)?.idx) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const confirmGuestApplication = () => {
    if (!applyPath) return;
    navigate(applyPath, { state: { guest: true, guestNoticeConsent: true } });
  };
  const { login } = useAuth();

  // 폼 필드 상태
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");

  // 비밀번호 표시 상태
  const [showPassword, setShowPassword] = useState(false);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 에러 상태
  const [errors, setErrors] = useState<{
    studentId: boolean;
    password: boolean;
  }>({
    studentId: false,
    password: false,
  });

  // 로그인 실패 에러 상태
  const [loginError, setLoginError] = useState<string | null>(null);

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      studentId: validators.studentId(studentId),
      password: validators.loginPassword(password),
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error);
    if (hasErrors) {
      return;
    }

    setIsLoading(true);
    setLoginError(null);

    try {
      const loggedInUser = await login(studentId, password);
      // 회원가입 후 첫 로그인이면 관심 분야 선택 화면을 먼저 보여 준다.
      navigate(loggedInUser.onboardingCompleted ? "/" : "/onboarding/interests");
    } catch (error) {
      // 세션 만료는 전역 다이얼로그가 안내하므로 로그인 정보 오류로
      // 중복 표시하지 않는다.
      if (!isSessionExpiredError(error)) {
        setLoginError(
          error instanceof ApiRequestError && error.status === 429
            ? error.message
            : "학번 또는 비밀번호가 일치하지 않습니다",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 실시간 검증 핸들러
  const handleFieldChange = (
    field: "studentId" | "password",
    value: string,
    setter: (value: string) => void,
  ) => {
    setter(value);
    if (loginError) {
      setLoginError(null);
    }
    if (errors[field]) {
      const hasError = field === "password"
        ? validators.loginPassword(value)
        : validators.studentId(value);
      if (!hasError) {
        setErrors((prev) => ({ ...prev, [field]: false }));
      }
    }
  };

  const handleBlur = (field: "studentId" | "password", value: string) => {
    const hasError = field === "password"
      ? validators.loginPassword(value)
      : validators.studentId(value);
    setErrors((prev) => ({ ...prev, [field]: hasError }));
  };

  return (
    <>
      <div className="flex justify-center mb-6">
        <Link to="/">
          <img src="/logo.svg" alt="Dream Lounge" className="h-20" draggable={false} />
        </Link>
      </div>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-3">
              {location.state?.signupComplete && (
                <p className="rounded-lg bg-primary/10 p-3 text-center text-sm text-primary">
                  회원가입과 이메일 인증이 완료되었습니다. 로그인해주세요.
                  {Number(location.state?.linkedGuestApplications ?? 0) > 0 && (
                    <span className="mt-1 block font-semibold">
                      비회원 지원서 {Number(location.state.linkedGuestApplications)}건이 계정에 연결되었습니다.
                    </span>
                  )}
                </p>
              )}
              <Field>
                <FieldLabel htmlFor="studentId">
                  학번
                </FieldLabel>
                <Input
                  id="studentId"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="학번 10자리를 입력해주세요"
                  value={studentId}
                  onChange={(e) =>
                    handleFieldChange("studentId", e.target.value.replace(/\D/g, ""), setStudentId)
                  }
                  onBlur={(e) => handleBlur("studentId", e.target.value)}
                  className={cn(
                    (errors.studentId || loginError) &&
                    "border-destructive focus-visible:ring-destructive",
                  )}
                  required
                />
                {errors.studentId && studentId && !loginError && (
                  <p className="text-sm text-destructive mt-1">
                    {ERROR_MESSAGES.STUDENT_ID}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">
                  비밀번호
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    maxLength={128}
                    value={password}
                    placeholder="비밀번호를 입력해주세요"
                    onChange={(e) =>
                      handleFieldChange("password", e.target.value, setPassword)
                    }
                    onBlur={(e) => handleBlur("password", e.target.value)}
                    className={cn(
                      "pr-10",
                      (errors.password || loginError) &&
                      "border-destructive focus-visible:ring-destructive",
                    )}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && password && !loginError && (
                  <p className="text-sm text-destructive mt-1">
                    {ERROR_MESSAGES.LOGIN_PASSWORD}
                  </p>
                )}
              </Field>

              {loginError && (
                <p className="text-sm text-destructive text-center">
                  {loginError}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full py-6 text-base font-bold shadow-lg hover:shadow-xl transition-all mt-6"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                계정이 없으신가요?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold"
                  onClick={() => navigate("/signup")}
                >
                  회원가입
                </Button>
              </p>

              <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
                <span className="h-px flex-1 bg-border" />
                또는
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full py-6 text-base font-semibold"
                  onClick={continueAsGuest}
                >
                  {applyPath ? "비회원으로 지원하기" : "비회원으로 둘러보기"}
                </Button>
                {applyPath && (
                  <p className="text-center text-xs text-muted-foreground">
                    비회원은 제출 후 수정·삭제·임시저장·지원 상태 확인을 할 수 없어요.
                  </p>
                )}
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <AlertDialog open={isGuestNoticeOpen} onOpenChange={setIsGuestNoticeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>비회원으로 지원하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>비회원 지원은 아래 제한사항에 동의한 경우에만 이용할 수 있습니다.</p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>현재 로그인되지 않은 상태로 신청합니다.</li>
                  <li>지원서를 임시저장할 수 없습니다.</li>
                  <li>제출 이후 지원 상태와 심사 결과를 확인할 수 없습니다.</li>
                  <li>제출한 신청서를 직접 수정하거나 삭제할 수 없습니다.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGuestApplication}>동의하고 지원하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
