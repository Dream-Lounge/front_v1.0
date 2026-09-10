import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, FileText, HelpCircle, Loader2, Save, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DepartmentCombobox } from "@/components/common/DepartmentCombobox";
import { useAuth } from "@/hooks/useAuth";
import { api, isSessionExpiredError, type ApplicantInfoInput, type ApplicationFormResponse, type FormQuestionResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

type ApplicationMode = "create" | "edit" | "view";
type ApplicantField = "studentId" | "name" | "department" | "phone" | "grade";

interface ApplicantInfo {
  studentId: string;
  name: string;
  department: string;
  phone: string;
  grade: string;
}

function getMode(pathname: string): ApplicationMode {
  if (pathname.endsWith("/view")) return "view";
  if (pathname.endsWith("/edit")) return "edit";
  return "create";
}

function parseMultiValue(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

export function ClubApplication() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const mode = getMode(location.pathname);

  const [clubId, setClubId] = useState("");
  const [clubName, setClubName] = useState("");
  const [clubCategory, setClubCategory] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [form, setForm] = useState<ApplicationFormResponse | null>(null);
  const [applicantInfo, setApplicantInfo] = useState<ApplicantInfo>({
    studentId: "",
    name: "",
    department: "",
    phone: "",
    grade: "",
  });
  const [applicantErrors, setApplicantErrors] = useState<Partial<Record<ApplicantField, string>>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [privacyConsentError, setPrivacyConsentError] = useState(false);

  useEffect(() => {
    if (isAuthLoading || !id) return;
    let active = true;

    const load = async () => {
      setIsDataLoading(true);
      setSubmitError(null);
      try {
        let resolvedClubId = id;
        let initialAnswers: Record<string, string> = {};
        let submittedForm: ApplicationFormResponse | null = null;
        let initialApplicantInfo: ApplicantInfo = {
          studentId: user?.studentId ?? "",
          // 간편가입은 별도 이름을 받지 않아 프로필 이름에 학번이 들어갈
          // 수 있다. 지원서에서는 실제 이름을 직접 입력하도록 비워 둔다.
          name: user?.name && user.name !== user.studentId ? user.name : "",
          department: user?.department === "미입력" ? "" : (user?.department ?? ""),
          phone: (user?.phone ?? "").replace(/\D/g, ""),
          grade: "",
        };

        if (mode === "create") {
          const [hasSubmitted, drafts] = await Promise.all([
            api.checkApplicationStatus(id),
            api.getDraftApplications(),
          ]);
          const existingDraft = drafts.find((draft) => draft.club_id === id);
          if (existingDraft) {
            toast.info("임시저장한 지원서를 불러옵니다.");
            navigate(`/applications/${existingDraft.id}/edit`, { replace: true });
            return;
          }
          if (hasSubmitted) {
            toast.error("이미 지원서를 제출한 동아리입니다.", { id: "already-applied" });
            navigate(user ? `/users/${user.studentId}/applications` : "/", { replace: true });
            return;
          }
        } else {
          const application = mode === "edit"
            ? await api.getDraftApplication(id)
            : await api.getSubmittedApplication(id);
          resolvedClubId = application.club_id ?? "";
          initialAnswers = Object.fromEntries(
            application.answers.map((answer) => [answer.question_id, answer.answer_text ?? ""]),
          );
          if (mode === "view" && application.form_snapshot) {
            submittedForm = {
              id: application.form_snapshot.id,
              club_id: resolvedClubId,
              title: application.form_snapshot.title,
              is_active: false,
              questions: application.form_snapshot.questions,
            };
          }
          initialApplicantInfo = {
            studentId: application.applicant_student_id ?? initialApplicantInfo.studentId,
            name: application.applicant_name ?? initialApplicantInfo.name,
            department: application.applicant_department ?? initialApplicantInfo.department,
            phone: (application.applicant_phone ?? initialApplicantInfo.phone).replace(/\D/g, ""),
            grade: application.applicant_grade ?? "",
          };
        }

        const [club, applicationForm] = await Promise.all([
          api.getClub(resolvedClubId),
          submittedForm ? Promise.resolve(submittedForm) : api.getClubForm(resolvedClubId),
        ]);
        if (!active) return;
        setClubId(resolvedClubId);
        setClubName(club.name);
        const savedCategory = club.division ?? club.club_type;
        setClubCategory(!savedCategory || savedCategory === "기타" ? "중앙동아리" : savedCategory);
        setClubDescription(club.description ?? "동아리 지원서를 작성합니다.");
        setForm(applicationForm);
        setApplicantInfo(initialApplicantInfo);
        setAnswers(initialAnswers);
      } catch (error) {
        if (active && !isSessionExpiredError(error)) {
          setSubmitError(error instanceof Error ? error.message : "지원서 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (active) setIsDataLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [id, isAuthLoading, mode, navigate, user]);

  const orderedQuestions = useMemo(
    () => [...(form?.questions ?? [])].sort((a, b) => a.order_index - b.order_index),
    [form],
  );

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (value.trim()) setErrors((prev) => ({ ...prev, [questionId]: false }));
  };

  const toggleMultiAnswer = (questionId: string, option: string) => {
    const selected = parseMultiValue(answers[questionId]);
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    setAnswer(questionId, JSON.stringify(next));
  };

  const buildAnswers = () => orderedQuestions.map((question) => ({
    question_id: question.id,
    answer_text: answers[question.id] ?? "",
  }));

  const buildApplicantInfo = (): ApplicantInfoInput => ({
    applicant_student_id: applicantInfo.studentId.trim(),
    applicant_name: applicantInfo.name.trim(),
    applicant_department: applicantInfo.department.trim(),
    applicant_phone: applicantInfo.phone.trim(),
    applicant_grade: applicantInfo.grade.trim(),
  });

  const setApplicantField = (field: ApplicantField, value: string) => {
    setApplicantInfo((previous) => ({ ...previous, [field]: value }));
    setApplicantErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const validateApplicantInfo = () => {
    const next: Partial<Record<ApplicantField, string>> = {};
    if (!/^\d{10}$/.test(applicantInfo.studentId)) next.studentId = "학번은 10자리 숫자로 입력해주세요.";
    if (!applicantInfo.name.trim()) next.name = "이름을 입력해주세요.";
    if (!applicantInfo.department.trim()) next.department = "학과를 입력해주세요.";
    if (!/^\d{10,11}$/.test(applicantInfo.phone)) next.phone = "전화번호는 하이픈 없이 10~11자리 숫자로 입력해주세요.";
    if (!/^[1-6]$/.test(applicantInfo.grade)) next.grade = "학년은 1~6 사이의 숫자로 입력해주세요.";
    setApplicantErrors(next);
    return Object.keys(next).length === 0;
  };

  const validate = () => {
    const next = Object.fromEntries(orderedQuestions.map((question) => [
      question.id,
      question.is_required && !(answers[question.id] ?? "").trim(),
    ]));
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async () => {
    const isApplicantInfoValid = validateApplicantInfo();
    const areAnswersValid = validate();
    setPrivacyConsentError(!privacyConsent);
    if (!id || !form || mode === "view" || !isApplicantInfoValid || !areAnswersValid || !privacyConsent) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (mode === "create") await api.createApplication(form.id, buildAnswers(), false, buildApplicantInfo(), true);
      else await api.patchApplication(id, buildAnswers(), buildApplicantInfo(), false, true);
      toast.success("지원서가 성공적으로 제출되었습니다.");
      navigate(user ? `/users/${user.studentId}/applications` : `/club/${clubId}`);
    } catch (error) {
      if (!isSessionExpiredError(error)) {
        setSubmitError(error instanceof Error ? error.message : "지원서 제출에 실패했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!id || !form || mode === "view") return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (mode === "create") {
        await api.createApplication(form.id, buildAnswers(), true, buildApplicantInfo());
      } else {
        await api.patchApplication(id, buildAnswers(), buildApplicantInfo(), true);
      }
      setApplicantErrors({});
      setErrors({});
      toast.success("지원서가 임시저장되었습니다.");
      navigate(user ? `/users/${user.studentId}/drafts` : "/", { replace: true });
    } catch (error) {
      if (!isSessionExpiredError(error)) {
        setSubmitError(error instanceof Error ? error.message : "임시저장에 실패했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isDataLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  if (!form) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-medium text-destructive">{submitError ?? "활성화된 신청폼이 없습니다."}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>뒤로 가기</Button>
      </div>
    );
  }

  const isReadOnly = mode === "view";
  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-4xl px-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6 gap-2 text-muted-foreground">
          <ArrowLeft className="size-4" /> 이전 화면으로 돌아가기
        </Button>
        <div className="flex flex-col gap-8">
          <Card>
            <CardContent>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="rounded-xl bg-primary/10 p-3"><Users className="size-8 text-primary" /></div>
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">{clubName}</h2>
                    <Badge variant="secondary" className="font-semibold">{clubCategory}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{clubDescription}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-3 text-lg"><div className="rounded-lg bg-primary/10 p-2"><FileText className="size-5 text-primary" /></div>기본 정보</CardTitle></CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ApplicantFieldInput label="학번" field="studentId" value={applicantInfo.studentId} error={applicantErrors.studentId} readOnly={isReadOnly} inputMode="numeric" maxLength={10} placeholder="학번 10자리" onChange={(value) => setApplicantField("studentId", value.replace(/\D/g, ""))} />
                <ApplicantFieldInput label="이름" field="name" value={applicantInfo.name} error={applicantErrors.name} readOnly={isReadOnly} maxLength={50} placeholder="이름" onChange={(value) => setApplicantField("name", value)} />
                {isReadOnly ? (
                  <ApplicantFieldInput label="학과" field="department" value={applicantInfo.department} error={applicantErrors.department} readOnly maxLength={100} placeholder="학과" onChange={(value) => setApplicantField("department", value)} />
                ) : (
                  <Field>
                    <FieldLabel>학과<span className="text-destructive">*</span></FieldLabel>
                    <DepartmentCombobox
                      value={applicantInfo.department}
                      onValueChange={(value) => setApplicantField("department", value)}
                      hasError={Boolean(applicantErrors.department)}
                      allowCustomValue
                      searchPlaceholder="학과 검색 또는 직접 입력..."
                      emptyText="입력한 학과명을 직접 등록할 수 있습니다."
                    />
                    <p className="text-xs text-muted-foreground">목록에 없는 학과는 검색창에 직접 작성한 뒤 ‘직접 입력’을 선택해주세요.</p>
                    {applicantErrors.department && <p className="text-sm text-destructive">{applicantErrors.department}</p>}
                  </Field>
                )}
                <ApplicantFieldInput label="전화번호" field="phone" value={applicantInfo.phone} error={applicantErrors.phone} readOnly={isReadOnly} inputMode="numeric" maxLength={11} placeholder="하이픈 없이 입력" onChange={(value) => setApplicantField("phone", value.replace(/\D/g, ""))} />
                <ApplicantFieldInput label="학년" field="grade" value={applicantInfo.grade} error={applicantErrors.grade} readOnly={isReadOnly} inputMode="numeric" maxLength={1} placeholder="예: 2" onChange={(value) => setApplicantField("grade", value.replace(/\D/g, ""))} />
              </FieldGroup>
              {!isReadOnly && (
                <div className="mt-6">
                  <label className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm", privacyConsentError && "border-destructive bg-destructive/5")}>
                    <input
                      type="checkbox"
                      checked={privacyConsent}
                      onChange={(event) => {
                        setPrivacyConsent(event.target.checked);
                        if (event.target.checked) setPrivacyConsentError(false);
                      }}
                      className="mt-0.5 size-4 accent-primary"
                    />
                    <span>개인정보 수집 및 이용에 동의합니다. 해당 데이터는 동아리원 모집 종료 후 파기됩니다.</span>
                  </label>
                  {privacyConsentError && <p className="mt-2 text-sm text-destructive">지원서를 제출하려면 개인정보 수집 및 이용에 동의해주세요.</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-3 text-lg"><div className="rounded-lg bg-primary/10 p-2"><HelpCircle className="size-5 text-primary" /></div>{form.title}</CardTitle></CardHeader>
            <CardContent>
              {orderedQuestions.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">등록된 질문이 없습니다.</p> : (
                <FieldGroup>{orderedQuestions.map((question, index) => (
                  <QuestionField key={question.id} question={question} index={index} value={answers[question.id] ?? ""} readOnly={isReadOnly} hasError={Boolean(errors[question.id])} onChange={(value) => setAnswer(question.id, value)} onToggle={(option) => toggleMultiAnswer(question.id, option)} />
                ))}</FieldGroup>
              )}
            </CardContent>
          </Card>

          {submitError && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{submitError}</div>}
          {!isReadOnly && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button variant="outline" size="lg" className="w-full py-6 text-base font-bold" onClick={handleSaveDraft} disabled={isSubmitting}><Save className="mr-2 size-5" /> 임시저장</Button>
              <Button size="lg" className="w-full py-6 text-base font-bold" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Send className="mr-2 size-5" />} 지원서 제출</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicantFieldInput({ label, field, value, error, readOnly, onChange, ...inputProps }: {
  label: string;
  field: ApplicantField;
  value: string;
  error?: string;
  readOnly: boolean;
  onChange: (value: string) => void;
} & Pick<React.ComponentProps<typeof Input>, "inputMode" | "maxLength" | "placeholder">) {
  const inputId = `applicant-${field}`;
  return (
    <Field>
      <FieldLabel htmlFor={inputId}>{label}{!readOnly && <span className="text-destructive">*</span>}</FieldLabel>
      <Input id={inputId} value={value} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} className={cn(readOnly && "cursor-not-allowed bg-muted", error && "border-destructive")} {...inputProps} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </Field>
  );
}

function QuestionField({ question, index, value, readOnly, hasError, onChange, onToggle }: {
  question: FormQuestionResponse;
  index: number;
  value: string;
  readOnly: boolean;
  hasError: boolean;
  onChange: (value: string) => void;
  onToggle: (option: string) => void;
}) {
  const inputId = `application-question-${question.id}`;
  const options = question.options ?? [];
  return (
    <Field>
      <FieldLabel htmlFor={inputId} className="gap-1"><span className="text-muted-foreground">{index + 1}.</span> {question.question_text}{question.is_required && <span className="text-destructive">*</span>}</FieldLabel>
      {question.question_type === "textarea" ? (
        <Textarea id={inputId} value={value} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} className={cn("min-h-32 resize-none", readOnly && "cursor-not-allowed bg-muted", hasError && "border-destructive")} />
      ) : question.question_type === "choice" ? (
        <div id={inputId} className={cn("flex flex-col gap-2 rounded-lg border p-3", hasError && "border-destructive")}>{options.map((option) => {
          const selected = value === option;
          return <label key={option} className={cn("flex items-center gap-2 px-1 py-1 text-sm", readOnly ? "cursor-default" : "cursor-pointer")}>
            <input className="sr-only" type="radio" name={inputId} value={option} checked={selected} onChange={() => onChange(option)} disabled={readOnly} />
            <span aria-hidden className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary" : "border-input bg-background")}>
              {selected && <span className="size-2 rounded-full bg-primary" />}
            </span>
            {option}
          </label>;
        })}</div>
      ) : question.question_type === "multiselect" ? (
        <div id={inputId} className={cn("flex flex-col gap-2 rounded-lg border p-3", hasError && "border-destructive")}>{options.map((option) => {
          const selected = parseMultiValue(value).includes(option);
          return <label key={option} className={cn("flex items-center gap-2 px-1 py-1 text-sm", readOnly ? "cursor-default" : "cursor-pointer")}>
            <input className="sr-only" type="checkbox" checked={selected} onChange={() => onToggle(option)} disabled={readOnly} />
            <span aria-hidden className={cn("flex size-4 shrink-0 items-center justify-center rounded border", selected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background")}>
              {selected && <Check className="size-3" strokeWidth={3} />}
            </span>
            {option}
          </label>;
        })}</div>
      ) : (
        <Input id={inputId} value={value} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} className={cn(readOnly && "cursor-not-allowed bg-muted", hasError && "border-destructive")} />
      )}
      {hasError && <p className="text-sm text-destructive">필수 문항에 답변해주세요.</p>}
    </Field>
  );
}
