import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Hash, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ERROR_MESSAGES, validators } from "@/lib/validators";

/** 가두모집용 간편 회원가입: 학번과 숫자 4자리 비밀번호만 입력합니다. */
export function Signup() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState({ studentId: false, password: false, passwordConfirm: false, passwordMismatch: false });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      studentId: validators.studentId(studentId),
      password: validators.password(password),
      passwordConfirm: validators.passwordConfirm(passwordConfirm),
      passwordMismatch: password !== passwordConfirm,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setIsLoading(true);
    setApiError(null);
    try {
      await api.signup({ studentId, password });
      navigate("/login");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputWrap = "relative [&_input]:h-11 [&_input]:rounded-lg [&_input]:pl-10 [&_input]:pr-3";
  const numericValue = (value: string, length: number) => value.replace(/\D/g, "").slice(0, length);

  return (
    <>
      <div className="relative mb-8 flex min-h-[5rem] items-center justify-center">
        <Button type="button" variant="ghost" className="absolute left-0 top-1/2 h-auto -translate-y-1/2 gap-1 px-2 text-muted-foreground hover:text-foreground" onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/login")}>
          <ArrowLeft className="h-4 w-4" /> 뒤로가기
        </Button>
        <Link to="/" className="inline-flex"><img src="/logo.svg" alt="Dream Lounge" className="h-14 sm:h-16" draggable={false} /></Link>
      </div>

      <Card className="border-border/80 shadow-md">
        <CardHeader className="pb-2 text-center"><CardTitle className="text-2xl font-bold tracking-tight">회원가입</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="studentId">학번</FieldLabel>
                <div className={inputWrap}>
                  <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="studentId" inputMode="numeric" maxLength={10} placeholder="학번 10자리를 입력해주세요" value={studentId}
                    onChange={(event) => { setStudentId(numericValue(event.target.value, 10)); setErrors((previous) => ({ ...previous, studentId: false })); }}
                    onBlur={() => setErrors((previous) => ({ ...previous, studentId: validators.studentId(studentId) }))}
                    className={cn(errors.studentId && "border-destructive focus-visible:ring-destructive")} autoComplete="username" required />
                </div>
                {errors.studentId && <p className="mt-1 text-sm text-destructive">{ERROR_MESSAGES.STUDENT_ID}</p>}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <div className={cn(inputWrap, "[&_input]:pr-11")}>
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} inputMode="numeric" maxLength={4} placeholder="숫자 4자리를 입력해주세요" value={password}
                    onChange={(event) => { setPassword(numericValue(event.target.value, 4)); setErrors((previous) => ({ ...previous, password: false, passwordMismatch: false })); }}
                    onBlur={() => setErrors((previous) => ({ ...previous, password: validators.password(password) }))}
                    className={cn(errors.password && "border-destructive focus-visible:ring-destructive")} autoComplete="new-password" required />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-destructive">{ERROR_MESSAGES.PASSWORD}</p>}
              </Field>

              <Field>
                <FieldLabel htmlFor="passwordConfirm">비밀번호 확인</FieldLabel>
                <div className={inputWrap}>
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="passwordConfirm" type="password" inputMode="numeric" maxLength={4} placeholder="비밀번호 4자리를 다시 입력해주세요" value={passwordConfirm}
                    onChange={(event) => { const value = numericValue(event.target.value, 4); setPasswordConfirm(value); setErrors((previous) => ({ ...previous, passwordConfirm: false, passwordMismatch: password !== value })); }}
                    onBlur={() => setErrors((previous) => ({ ...previous, passwordConfirm: validators.passwordConfirm(passwordConfirm), passwordMismatch: Boolean(passwordConfirm) && password !== passwordConfirm }))}
                    className={cn((errors.passwordConfirm || errors.passwordMismatch) && "border-destructive focus-visible:ring-destructive")} autoComplete="new-password" required />
                </div>
                {errors.passwordConfirm && <p className="mt-1 text-sm text-destructive">{ERROR_MESSAGES.PASSWORD_CONFIRM}</p>}
                {!errors.passwordConfirm && errors.passwordMismatch && <p className="mt-1 text-sm text-destructive">{ERROR_MESSAGES.PASSWORD_MISMATCH}</p>}
              </Field>

              {apiError && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{apiError}</div>}
              <Button type="submit" size="lg" disabled={isLoading} className="mt-2 h-12 w-full rounded-lg text-base font-semibold shadow-sm">
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}{isLoading ? "회원가입 중..." : "회원가입"}
              </Button>
              <Button type="button" variant="outline" size="lg" className="h-12 w-full rounded-lg text-base font-medium" onClick={() => navigate("/login")}>로그인</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
