import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Hash, Loader2, Lock, Mail, Phone, UserRound } from "lucide-react";
import { DepartmentCombobox } from "@/components/common/DepartmentCombobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ERROR_MESSAGES, getPasswordError, validators } from "@/lib/validators";

type SignupErrors = {
  studentId: boolean; name: boolean; department: boolean; phone: boolean;
  email: boolean; password: boolean; passwordConfirm: boolean;
  passwordMismatch: boolean; privacyConsent: boolean;
};

const EMPTY_ERRORS: SignupErrors = {
  studentId: false, name: false, department: false, phone: false,
  email: false, password: false, passwordConfirm: false,
  passwordMismatch: false, privacyConsent: false,
};

const PENDING_EMAIL_KEY = "dreamlounge.signup.pendingEmail";
const PENDING_GUEST_LINK_KEY = "dreamlounge.signup.linkGuestApplications";
const EMAIL_VERIFIED_KEY = "dreamlounge.signup.emailVerified";
const EMAIL_VERIFICATION_TOKEN_KEY = "dreamlounge.signup.emailVerificationToken";
const LINKED_APPLICATIONS_KEY = "dreamlounge.signup.linkedGuestApplications";
let signupVisitedInCurrentDocument = false;

function readSignupSession(key: string) {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(key);
}

function clearSignupSessionStorage() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_EMAIL_KEY);
  window.sessionStorage.removeItem(PENDING_GUEST_LINK_KEY);
  window.sessionStorage.removeItem(EMAIL_VERIFIED_KEY);
  window.sessionStorage.removeItem(EMAIL_VERIFICATION_TOKEN_KEY);
  window.sessionStorage.removeItem(LINKED_APPLICATIONS_KEY);
}

function isStudentEmail(value: string) {
  return /^[^\s@]+@cju\.ac\.kr$/i.test(value.trim());
}

export function Signup() {
  const navigate = useNavigate();
  const [restoreSignupSession] = useState(() => !signupVisitedInCurrentDocument);
  const readRestorableSignupSession = (key: string) => (
    restoreSignupSession ? readSignupSession(key) : null
  );
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(
    () => readRestorableSignupSession(PENDING_EMAIL_KEY) ?? "",
  );
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const [privacyOptional, setPrivacyOptional] = useState(false);
  const [linkGuestApplications, setLinkGuestApplications] = useState(
    () => readRestorableSignupSession(PENDING_GUEST_LINK_KEY) === "true",
  );
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    () => readRestorableSignupSession(PENDING_EMAIL_KEY),
  );
  const [emailVerified, setEmailVerified] = useState(
    () => readRestorableSignupSession(EMAIL_VERIFIED_KEY) === "true",
  );
  const [emailVerificationToken, setEmailVerificationToken] = useState(
    () => readRestorableSignupSession(EMAIL_VERIFICATION_TOKEN_KEY) ?? "",
  );
  const [linkedGuestApplications, setLinkedGuestApplications] = useState(
    () => Number(readRestorableSignupSession(LINKED_APPLICATIONS_KEY) ?? 0),
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<SignupErrors>(EMPTY_ERRORS);

  const inputWrap = "relative [&_input]:h-11 [&_input]:rounded-lg [&_input]:pl-10 [&_input]:pr-3";
  const digitsOnly = (value: string, length: number) => value.replace(/\D/g, "").slice(0, length);

  useEffect(() => {
    signupVisitedInCurrentDocument = true;
    if (!restoreSignupSession) clearSignupSessionStorage();
  }, [restoreSignupSession]);

  useEffect(() => {
    if (!verificationEmail) return;
    window.sessionStorage.setItem(PENDING_EMAIL_KEY, verificationEmail);
    window.sessionStorage.setItem(PENDING_GUEST_LINK_KEY, String(linkGuestApplications));
    window.sessionStorage.setItem(EMAIL_VERIFIED_KEY, String(emailVerified));
    if (emailVerificationToken) {
      window.sessionStorage.setItem(EMAIL_VERIFICATION_TOKEN_KEY, emailVerificationToken);
    } else {
      window.sessionStorage.removeItem(EMAIL_VERIFICATION_TOKEN_KEY);
    }
    window.sessionStorage.setItem(LINKED_APPLICATIONS_KEY, String(linkedGuestApplications));
  }, [verificationEmail, linkGuestApplications, emailVerified, emailVerificationToken, linkedGuestApplications]);

  const clearSignupSession = () => {
    clearSignupSessionStorage();
  };

  const requestEmailVerification = async () => {
    if (!isStudentEmail(email)) {
      setErrors((prev) => ({ ...prev, email: true }));
      setApiError("청주대학교 학생 이메일을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setApiError(null);
    try {
      await api.requestSignupEmail(email.trim().toLowerCase());
      setVerificationEmail(email.trim().toLowerCase());
      setVerificationCode("");
      setEmailVerified(false);
      setEmailVerificationToken("");
      toast.success("학교 이메일로 6자리 인증번호를 발송했습니다.");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "인증번호 발송 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!verificationEmail || verificationCode.length !== 6) {
      setApiError("이메일로 받은 6자리 인증번호를 입력해주세요.");
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      const result = await api.verifySignupEmail(verificationEmail, verificationCode, linkGuestApplications);
      if (!result.verification_token) throw new Error("이메일 인증 정보를 발급받지 못했습니다.");
      setEmailVerified(true);
      setEmailVerificationToken(result.verification_token);
      setLinkedGuestApplications(result.linked_guest_applications);
      toast.success("학교 이메일 인증이 완료되었습니다.");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "이메일 인증에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmail = async () => {
    if (!verificationEmail) return;
    setIsLoading(true);
    setApiError(null);
    try {
      await api.requestSignupEmail(verificationEmail);
      toast.success("인증번호를 다시 발송했습니다.");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "인증번호 재발송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const completeSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: SignupErrors = {
      studentId: validators.studentId(studentId), name: validators.name(name),
      department: validators.department(department), phone: validators.phone(phone),
      email: !isStudentEmail(email), password: validators.password(password),
      passwordConfirm: validators.passwordConfirm(passwordConfirm),
      passwordMismatch: password !== passwordConfirm, privacyConsent: !privacyRequired,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setApiError("회원정보와 필수 동의 항목을 모두 확인해주세요.");
      return;
    }
    if (!emailVerified || !emailVerificationToken) {
      setApiError("학교 이메일 인증을 완료해야 회원가입할 수 있습니다.");
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      await api.signup({
        studentId, name: name.trim(), department, phone,
        email: email.trim().toLowerCase(), password,
        privacyConsentRequired: privacyRequired,
        privacyConsentOptional: privacyOptional,
        linkGuestApplications,
        emailVerificationToken,
      });
      clearSignupSession();
      navigate("/login", {
        replace: true,
        state: { signupComplete: true, linkedGuestApplications },
      });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <form onSubmit={completeSignup}>
            <FieldGroup className="gap-4">
              <SignupFields
                  values={{ studentId, name, department, phone, email, password, passwordConfirm, showPassword, privacyRequired, privacyOptional, linkGuestApplications }}
                  errors={errors}
                  isLoading={isLoading}
                  inputWrap={inputWrap}
                  onStudentId={(value) => { setStudentId(digitsOnly(value, 10)); setErrors((prev) => ({ ...prev, studentId: false })); }}
                  onName={(value) => { setName(value); setErrors((prev) => ({ ...prev, name: false })); }}
                  onDepartment={(value) => { setDepartment(value); setErrors((prev) => ({ ...prev, department: false })); }}
                  onPhone={(value) => { setPhone(digitsOnly(value, 11)); setErrors((prev) => ({ ...prev, phone: false })); }}
                  onEmail={(value) => {
                    setEmail(value);
                    setErrors((prev) => ({ ...prev, email: false }));
                    if (verificationEmail && value.trim().toLowerCase() !== verificationEmail) {
                      setVerificationEmail(null);
                      setEmailVerified(false);
                      setEmailVerificationToken("");
                      setVerificationCode("");
                    }
                  }}
                  onPassword={(value) => { setPassword(value); setErrors((prev) => ({ ...prev, password: false, passwordMismatch: false })); }}
                  onPasswordConfirm={(value) => { setPasswordConfirm(value); setErrors((prev) => ({ ...prev, passwordConfirm: false, passwordMismatch: false })); }}
                  onTogglePassword={() => setShowPassword((value) => !value)}
                  onGuestLink={setLinkGuestApplications}
                  onPrivacyRequired={(value) => { setPrivacyRequired(value); setErrors((prev) => ({ ...prev, privacyConsent: false })); }}
                  onPrivacyOptional={setPrivacyOptional}
                  onRequestVerification={() => void requestEmailVerification()}
                  verificationEmail={verificationEmail}
                  verificationCode={verificationCode}
                  emailVerified={emailVerified}
                  onVerificationCode={(value) => setVerificationCode(digitsOnly(value, 6))}
                  onVerifyEmail={() => void verifyEmail()}
                  onResendEmail={() => void resendEmail()}
                />

              {apiError && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{apiError}</div>}
              <Button type="submit" size="lg" disabled={!emailVerified || isLoading} className="mt-2 h-12 w-full rounded-lg text-base font-semibold shadow-sm">회원가입</Button>
              {!emailVerified && <p className="-mt-2 text-center text-xs text-muted-foreground">학교 이메일 인증을 완료하면 회원가입 버튼이 활성화됩니다.</p>}
              <Button type="button" variant="outline" size="lg" className="h-12 w-full rounded-lg text-base font-medium" onClick={() => navigate("/login")}>로그인</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

type SignupFieldValues = {
  studentId: string; name: string; department: string; phone: string; email: string;
  password: string; passwordConfirm: string; showPassword: boolean;
  privacyRequired: boolean; privacyOptional: boolean; linkGuestApplications: boolean;
};

function SignupFields({
  values, errors, isLoading, inputWrap, onStudentId, onName, onDepartment, onPhone,
  onEmail, onPassword, onPasswordConfirm, onTogglePassword, onGuestLink,
  onPrivacyRequired, onPrivacyOptional, onRequestVerification,
  verificationEmail, verificationCode, emailVerified, onVerificationCode,
  onVerifyEmail, onResendEmail,
}: {
  values: SignupFieldValues; errors: SignupErrors; isLoading: boolean; inputWrap: string;
  onStudentId: (value: string) => void; onName: (value: string) => void;
  onDepartment: (value: string) => void; onPhone: (value: string) => void;
  onEmail: (value: string) => void; onPassword: (value: string) => void;
  onPasswordConfirm: (value: string) => void; onTogglePassword: () => void;
  onGuestLink: (value: boolean) => void; onPrivacyRequired: (value: boolean) => void;
  onPrivacyOptional: (value: boolean) => void; onRequestVerification: () => void;
  verificationEmail: string | null; verificationCode: string; emailVerified: boolean;
  onVerificationCode: (value: string) => void; onVerifyEmail: () => void;
  onResendEmail: () => void;
}) {
  return <>
    <Field><FieldLabel htmlFor="studentId">학번</FieldLabel><div className={inputWrap}><Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="studentId" inputMode="numeric" maxLength={10} placeholder="학번 10자리를 입력해주세요" value={values.studentId} onChange={(event) => onStudentId(event.target.value)} className={cn(errors.studentId && "border-destructive")} autoComplete="username" required /></div>{errors.studentId && <p className="mt-1 text-sm text-destructive">{ERROR_MESSAGES.STUDENT_ID}</p>}</Field>
    <Field><FieldLabel htmlFor="name">이름</FieldLabel><div className={inputWrap}><UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="name" maxLength={50} placeholder="이름을 입력해주세요" value={values.name} onChange={(event) => onName(event.target.value)} className={cn(errors.name && "border-destructive")} autoComplete="name" required /></div>{errors.name && <p className="mt-1 text-sm text-destructive">{ERROR_MESSAGES.NAME}</p>}</Field>
    <Field><FieldLabel>학과</FieldLabel><DepartmentCombobox value={values.department} onValueChange={onDepartment} hasError={errors.department} variant="signup" allowCustomValue placeholder="학과를 선택하거나 검색해주세요" />{errors.department && <p className="mt-1 text-sm text-destructive">{ERROR_MESSAGES.DEPARTMENT}</p>}</Field>
    <Field><FieldLabel htmlFor="phone">전화번호</FieldLabel><div className={inputWrap}><Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="phone" type="tel" inputMode="numeric" maxLength={11} placeholder="하이픈 없이 입력해주세요" value={values.phone} onChange={(event) => onPhone(event.target.value)} className={cn(errors.phone && "border-destructive")} autoComplete="tel" required /></div>{errors.phone && <p className="mt-1 text-sm text-destructive">{ERROR_MESSAGES.PHONE}</p>}</Field>
    <Field><FieldLabel htmlFor="email">학교 이메일</FieldLabel><div className="flex flex-col gap-2 sm:flex-row"><div className={cn(inputWrap, "min-w-0 flex-1")}><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" maxLength={255} placeholder="example@cju.ac.kr" value={values.email} onChange={(event) => onEmail(event.target.value)} className={cn(errors.email && "border-destructive")} autoComplete="email" required /></div><Button type="button" disabled={isLoading || emailVerified} onClick={onRequestVerification} className="h-11 shrink-0 bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90">{isLoading && <Loader2 className="size-4 animate-spin" />}{emailVerified ? "인증 완료" : "인증번호 받기"}</Button></div>{errors.email ? <p className="mt-1 text-sm text-destructive">청주대학교 학생 이메일(@cju.ac.kr)을 입력해주세요.</p> : <p className="mt-1 text-xs text-muted-foreground">학교 이메일만 입력하면 인증번호를 받을 수 있습니다.</p>}{verificationEmail && !emailVerified && <div className="mt-3 rounded-xl border border-primary/20 bg-white p-3"><div className="flex flex-col gap-2 sm:flex-row"><div className={cn(inputWrap, "min-w-0 flex-1")}><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="verificationCode" inputMode="numeric" maxLength={6} value={verificationCode} onChange={(event) => onVerificationCode(event.target.value)} placeholder="6자리 인증번호" autoComplete="one-time-code" /></div><Button type="button" disabled={isLoading || verificationCode.length !== 6} onClick={onVerifyEmail} className="h-11 shrink-0 px-5">확인</Button></div><Button type="button" variant="link" className="mt-2 h-auto w-fit p-0 text-xs" disabled={isLoading} onClick={onResendEmail}>인증번호 다시 받기</Button></div>}{emailVerified && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 className="size-4" />이메일 인증이 완료되었습니다.</p>}</Field>
    <Field><FieldLabel htmlFor="password">비밀번호</FieldLabel><div className={cn(inputWrap, "[&_input]:pr-11")}><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" type={values.showPassword ? "text" : "password"} maxLength={128} placeholder="최소 8자리 이상 입력해주세요" value={values.password} onChange={(event) => onPassword(event.target.value)} className={cn(errors.password && "border-destructive")} autoComplete="new-password" required /><Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent" onClick={onTogglePassword} aria-label={values.showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}>{values.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div>{errors.password ? <p className="mt-1 text-sm text-destructive">{getPasswordError(values.password) ?? ERROR_MESSAGES.PASSWORD}</p> : <p className="mt-1 text-xs text-muted-foreground">최소 8자리 이상, 특수문자를 1개 이상 포함해주세요.</p>}</Field>
    <Field><FieldLabel htmlFor="passwordConfirm">비밀번호 확인</FieldLabel><div className={inputWrap}><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="passwordConfirm" type="password" maxLength={128} placeholder="비밀번호를 다시 입력해주세요" value={values.passwordConfirm} onChange={(event) => onPasswordConfirm(event.target.value)} className={cn((errors.passwordConfirm || errors.passwordMismatch) && "border-destructive")} autoComplete="new-password" required /></div>{(errors.passwordConfirm || errors.passwordMismatch) && <p className="mt-1 text-sm text-destructive">{errors.passwordMismatch ? ERROR_MESSAGES.PASSWORD_MISMATCH : ERROR_MESSAGES.PASSWORD_CONFIRM}</p>}</Field>
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"><input type="checkbox" checked={values.linkGuestApplications} onChange={(event) => onGuestLink(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-red-600" /><span className="text-sm font-bold leading-snug">비회원으로 제출한 지원서가 있습니다.<span className="mt-1 block text-xs font-normal text-red-600">비회원 신청서의 학번·이름·전화번호가 모두 같으면 이메일 인증 후 내 지원내역에 연결됩니다. 합격 신청서는 합격 후 4개월 이내에만 연결됩니다.</span></span></label>
    <div className="space-y-3 rounded-xl border bg-muted/40 p-4"><label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={values.privacyRequired} onChange={(event) => onPrivacyRequired(event.target.checked)} className="mt-0.5 size-4 accent-primary" /><span><strong>[필수]</strong> 개인정보 수집·이용에 동의합니다.</span></label><label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={values.privacyOptional} onChange={(event) => onPrivacyOptional(event.target.checked)} className="mt-0.5 size-4 accent-primary" /><span><strong>[선택]</strong> 마케팅·홍보 목적의 개인정보 이용에 동의합니다.</span></label>{errors.privacyConsent && <p className="pl-7 text-sm text-destructive">필수 개인정보 수집·이용에 동의해주세요.</p>}</div>
  </>;
}
