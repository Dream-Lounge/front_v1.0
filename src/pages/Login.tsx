import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { validators, ERROR_MESSAGES } from "@/lib/validators";
import { useAuth } from "@/hooks/useAuth";

/**
 * 로그인 페이지 컴포넌트
 * - 학번, 비밀번호 입력 폼
 * - 필수 필드 유효성 검사 및 로그인 실패 에러 메시지
 * - 로그인 성공 후 navigate는 AuthLayout이 isAuthenticated 감지 시 처리
 */
export function Login() {
  const navigate = useNavigate();
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
  const [loginError, setLoginError] = useState(false);

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      studentId: validators.studentId(studentId),
      password: validators.password(password),
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error);
    if (hasErrors) {
      return;
    }

    setIsLoading(true);
    setLoginError(false);

    try {
      await login(parseInt(studentId, 10), password);
    } catch {
      setLoginError(true);
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
      setLoginError(false);
    }
    if (errors[field]) {
      const hasError = validators[field](value);
      if (!hasError) {
        setErrors((prev) => ({ ...prev, [field]: false }));
      }
    }
  };

  const handleBlur = (field: "studentId" | "password", value: string) => {
    const hasError = validators[field](value);
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
              <Field>
                <FieldLabel htmlFor="studentId">
                  학번
                </FieldLabel>
                <Input
                  id="studentId"
                  placeholder="학번을 입력해주세요"
                  value={studentId}
                  onChange={(e) =>
                    handleFieldChange("studentId", e.target.value, setStudentId)
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
                    {ERROR_MESSAGES.PASSWORD}
                  </p>
                )}
              </Field>

              {loginError && (
                <p className="text-sm text-destructive text-center">
                  학번 또는 비밀번호가 일치하지 않습니다
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full py-6 text-base font-bold shadow-lg hover:shadow-xl transition-all mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <LogIn className="h-5 w-5 mr-2" />
                )}
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
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
