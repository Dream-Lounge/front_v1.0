import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { DepartmentCombobox } from "@/components/common/DepartmentCombobox";
import {
  User,
  Phone,
  Hash,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { validators, ERROR_MESSAGES } from "@/lib/validators";
import { api } from "@/lib/api";


type EmailVerificationStage = "idle" | "pending" | "verified";

/**
 * 회원가입 페이지
 * - 시안 순서: 이름 → 전화번호 → 학과 → 학번 → 학교 이메일(인증 플로우) → 비밀번호 → 비밀번호 확인
 * - 학교 이메일은 청주대 @cju.ac.kr, 인증요청 → 인증번호(테스트 123456) 확인 → 인증완료
 */
export function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [emailStage, setEmailStage] = useState<EmailVerificationStage>("idle");
  const [emailRequestedFor, setEmailRequestedFor] = useState<string | null>(
    null,
  );
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyCodeError, setVerifyCodeError] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const [privacyOptional, setPrivacyOptional] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    name: boolean;
    phone: boolean;
    studentId: boolean;
    department: boolean;
    schoolEmail: boolean;
    password: boolean;
    passwordConfirm: boolean;
    passwordMismatch: boolean;
    emailVerification: boolean;
    privacyConsent: boolean;
  }>({
    name: false,
    phone: false,
    studentId: false,
    department: false,
    schoolEmail: false,
    password: false,
    passwordConfirm: false,
    passwordMismatch: false,
    emailVerification: false,
    privacyConsent: false,
  });

  useEffect(() => {
    if (
      emailStage === "pending" &&
      emailRequestedFor &&
      schoolEmail.trim().toLowerCase() !== emailRequestedFor.toLowerCase()
    ) {
      setEmailStage("idle");
      setVerifyCode("");
      setVerifyCodeError(false);
    }
  }, [schoolEmail, emailStage, emailRequestedFor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const schoolEmailInvalid = validators.schoolEmail(schoolEmail);
    const newErrors = {
      name: validators.name(name),
      phone: validators.phone(phone),
      studentId: validators.studentId(studentId),
      department: validators.department(selectedDepartment),
      schoolEmail: schoolEmailInvalid,
      password: validators.password(password),
      passwordConfirm: validators.passwordConfirm(passwordConfirm),
      passwordMismatch: password !== passwordConfirm,
      emailVerification:
        !schoolEmailInvalid && emailStage !== "verified",
      privacyConsent: !privacyRequired,
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error);
    if (hasErrors) {
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      await api.signup({
        studentId,
        name,
        department: selectedDepartment,
        phone,
        password,
        passwordConfirm,
        email: schoolEmail.trim(),
        verificationCode: verifyCode.trim(),
        privacyConsentRequired: privacyRequired,
        privacyConsentOptional: privacyOptional,
      });

      navigate("/login");
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (
    field: "name" | "phone" | "studentId" | "password",
    value: string,
    setter: (value: string) => void,
  ) => {
    setter(value);
    if (errors[field]) {
      const hasError = validators[field](value);
      if (!hasError) {
        setErrors((prev) => ({ ...prev, [field]: false }));
      }
    }
  };

  const handlePasswordConfirmChange = (value: string) => {
    setPasswordConfirm(value);
    if (errors.passwordConfirm || errors.passwordMismatch) {
      if (value.trim()) {
        setErrors((prev) => ({
          ...prev,
          passwordConfirm: false,
          passwordMismatch: password !== value,
        }));
      }
    }
  };

  const handleBlur = (
    field: "name" | "phone" | "studentId" | "password",
    value: string,
  ) => {
    const hasError = validators[field](value);
    setErrors((prev) => ({ ...prev, [field]: hasError }));
  };

  const handlePasswordConfirmBlur = () => {
    setErrors((prev) => ({
      ...prev,
      passwordConfirm: validators.passwordConfirm(passwordConfirm),
      passwordMismatch: passwordConfirm.trim()
        ? password !== passwordConfirm
        : false,
    }));
  };

  const handleSchoolEmailBlur = () => {
    const hasError = validators.schoolEmail(schoolEmail);
    setErrors((prev) => ({ ...prev, schoolEmail: hasError }));
  };

  const handleRequestVerification = async () => {
    const invalid = validators.schoolEmail(schoolEmail);
    setErrors((prev) => ({ ...prev, schoolEmail: invalid }));
    if (invalid) return;

    try {
      await api.sendEmailVerification(schoolEmail.trim());
      setEmailRequestedFor(schoolEmail.trim());
      setEmailStage("pending");
      setVerifyCode("");
      setVerifyCodeError(false);
      toast.success("인증번호를 발송했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "인증번호 발송에 실패했습니다.");
    }
  };

  const handleResend = async () => {
    if (validators.schoolEmail(schoolEmail)) {
      setErrors((prev) => ({ ...prev, schoolEmail: true }));
      return;
    }
    try {
      await api.sendEmailVerification(schoolEmail.trim());
      toast.success("인증번호를 다시 발송했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "인증번호 발송에 실패했습니다.");
    }
  };

  const handleConfirmVerificationCode = async () => {
    try {
      await api.confirmEmailVerification(schoolEmail.trim(), verifyCode.trim());
      setEmailStage("verified");
      setVerifyCodeError(false);
      setErrors((prev) => ({ ...prev, emailVerification: false }));
      toast.success("이메일 인증이 완료되었습니다.");
    } catch {
      setVerifyCodeError(true);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/login");
    }
  };

  const inputIconWrap =
    "relative [&_input]:h-11 [&_input]:rounded-lg [&_input]:pl-10 [&_input]:pr-3";

  return (
    <>
      <div className="relative mb-8 flex min-h-[5rem] items-center justify-center">
        <Button
          type="button"
          variant="ghost"
          className="absolute left-0 top-1/2 h-auto -translate-y-1/2 gap-1 px-2 text-muted-foreground hover:text-foreground"
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </Button>
        <Link to="/" className="inline-flex">
          <img
            src="/logo.svg"
            alt="Dream Lounge"
            className="h-14 sm:h-16"
            draggable={false}
          />
        </Link>
      </div>

      <Card className="border-border/80 shadow-md">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            회원가입
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="name">이름</FieldLabel>
                <div className={inputIconWrap}>
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="이름을 입력해주세요"
                    value={name}
                    onChange={(e) =>
                      handleFieldChange("name", e.target.value, setName)
                    }
                    onBlur={(e) => handleBlur("name", e.target.value)}
                    className={cn(
                      errors.name &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                    autoComplete="name"
                    required
                  />
                </div>
                {errors.name && name && (
                  <p className="text-sm text-destructive mt-1">
                    {ERROR_MESSAGES.NAME}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">전화번호</FieldLabel>
                <div className={inputIconWrap}>
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="전화번호를 입력해주세요"
                    value={phone}
                    onChange={(e) =>
                      handleFieldChange("phone", e.target.value, setPhone)
                    }
                    onBlur={(e) => handleBlur("phone", e.target.value)}
                    className={cn(
                      errors.phone &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                    autoComplete="tel"
                    required
                  />
                </div>
                {errors.phone && phone && (
                  <p className="text-sm text-destructive mt-1">
                    {ERROR_MESSAGES.PHONE}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="department">학과</FieldLabel>
                <DepartmentCombobox
                  variant="signup"
                  placeholder="학과를 입력해주세요"
                  value={selectedDepartment}
                  onValueChange={(value) => {
                    setSelectedDepartment(value);
                    if (value && errors.department) {
                      setErrors((prev) => ({
                        ...prev,
                        department: false,
                      }));
                    }
                  }}
                  hasError={errors.department}
                />
                {errors.department && (
                  <p className="text-sm text-destructive mt-1">
                    {ERROR_MESSAGES.DEPARTMENT}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="studentId">학번</FieldLabel>
                <div className={inputIconWrap}>
                  <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="studentId"
                    inputMode="numeric"
                    placeholder="학번을 입력해주세요"
                    value={studentId}
                    onChange={(e) =>
                      handleFieldChange(
                        "studentId",
                        e.target.value,
                        setStudentId,
                      )
                    }
                    onBlur={(e) => handleBlur("studentId", e.target.value)}
                    className={cn(
                      errors.studentId &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                    required
                  />
                </div>
                {errors.studentId && studentId && (
                  <p className="text-sm text-destructive mt-1">
                    {ERROR_MESSAGES.STUDENT_ID}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel htmlFor="schoolEmail">학교 이메일</FieldLabel>
                <div className="flex gap-2">
                  <div
                    className={cn(
                      inputIconWrap,
                      "min-w-0 flex-1",
                      "[&_input]:pr-3",
                    )}
                  >
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="schoolEmail"
                      type="email"
                      placeholder="학교 이메일을 입력해주세요 (@cju.ac.kr)"
                      value={schoolEmail}
                      onChange={(e) => {
                        setSchoolEmail(e.target.value);
                        if (errors.schoolEmail) {
                          setErrors((prev) => ({
                            ...prev,
                            schoolEmail: false,
                          }));
                        }
                      }}
                      onBlur={handleSchoolEmailBlur}
                      disabled={emailStage === "verified"}
                      className={cn(
                        errors.schoolEmail &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                      autoComplete="email"
                    />
                  </div>
                  {emailStage === "idle" && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 shrink-0 px-3 font-medium"
                      onClick={handleRequestVerification}
                    >
                      인증요청
                    </Button>
                  )}
                  {emailStage === "pending" && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 shrink-0 px-3 font-medium"
                      onClick={handleResend}
                    >
                      재전송
                    </Button>
                  )}
                  {emailStage === "verified" && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className="h-11 shrink-0 border-emerald-200 bg-emerald-50 px-3 font-medium text-emerald-800 opacity-100 hover:bg-emerald-50"
                    >
                      인증완료
                    </Button>
                  )}
                </div>
                {errors.schoolEmail && schoolEmail && (
                  <p className="text-sm text-destructive mt-1">
                    {ERROR_MESSAGES.SCHOOL_EMAIL}
                  </p>
                )}

                {emailStage === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="인증번호 6자리 입력 (테스트: 123456)"
                      value={verifyCode}
                      onChange={(e) => {
                        setVerifyCode(e.target.value.replace(/\D/g, ""));
                        if (verifyCodeError) setVerifyCodeError(false);
                      }}
                      inputMode="numeric"
                      maxLength={6}
                      className={cn(
                        "h-11 flex-1 rounded-lg",
                        verifyCodeError &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                    <Button
                      type="button"
                      className="h-11 shrink-0 px-4"
                      onClick={handleConfirmVerificationCode}
                    >
                      확인
                    </Button>
                  </div>
                )}
                {verifyCodeError && (
                  <p className="text-sm text-destructive">
                    인증번호가 올바르지 않습니다. 테스트 코드는 123456 입니다.
                  </p>
                )}
                {errors.emailVerification && (
                  <p className="text-sm text-destructive">
                    학교 이메일 인증을 완료해주세요.
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <div className={cn(inputIconWrap, "[&_input]:pr-11")}>
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                      errors.password &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && password && (
                  <p className="text-sm text-destructive mt-1">
                    {ERROR_MESSAGES.PASSWORD}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="passwordConfirm">비밀번호 확인</FieldLabel>
                <div className={inputIconWrap}>
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="passwordConfirm"
                    type="password"
                    value={passwordConfirm}
                    placeholder="비밀번호를 다시 입력해주세요"
                    onChange={(e) => handlePasswordConfirmChange(e.target.value)}
                    onBlur={handlePasswordConfirmBlur}
                    className={cn(
                      (errors.passwordConfirm || errors.passwordMismatch) &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                    autoComplete="new-password"
                    required
                  />
                </div>
                {errors.passwordMismatch && passwordConfirm && (
                  <p className="text-sm text-destructive mt-1">
                    비밀번호가 일치하지 않습니다.
                  </p>
                )}
              </Field>

              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground mb-3">개인정보 수집·이용 동의</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyRequired}
                    onChange={(e) => {
                      setPrivacyRequired(e.target.checked);
                      if (e.target.checked && errors.privacyConsent) {
                        setErrors((prev) => ({ ...prev, privacyConsent: false }));
                      }
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="text-sm leading-snug">
                    <span className="font-medium">[필수]</span> 개인정보 수집·이용에 동의합니다.
                    <span className="ml-1 text-xs text-muted-foreground">(이름, 학번, 학과, 연락처, 이메일)</span>
                  </span>
                </label>
                {errors.privacyConsent && (
                  <p className="text-sm text-destructive pl-7">개인정보 수집·이용 동의(필수)를 체크해주세요.</p>
                )}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyOptional}
                    onChange={(e) => setPrivacyOptional(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="text-sm leading-snug">
                    <span className="font-medium">[선택]</span> 마케팅·홍보 목적의 개인정보 이용에 동의합니다.
                  </span>
                </label>
              </div>

              {apiError && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {apiError}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="mt-2 h-12 w-full rounded-lg text-base font-semibold shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    회원가입 중...
                  </>
                ) : (
                  "회원가입"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-lg text-base font-medium"
                onClick={() => navigate("/login")}
              >
                로그인
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
