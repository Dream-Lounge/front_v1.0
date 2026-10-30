import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, Eye, EyeOff, KeyRound, Loader2, UserRound, UserX } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DepartmentCombobox } from "@/components/common/DepartmentCombobox";
import { useAuth } from "@/hooks/useAuth";
import { toastApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { ERROR_MESSAGES, validators } from "@/lib/validators";

type AccountTab = "profile" | "password" | "withdraw";

/** shortLabel: 좁은 화면(640px 미만)에서 잘리지 않도록 쓰는 짧은 이름 */
const ACCOUNT_TABS: { key: AccountTab; label: string; shortLabel: string; icon: typeof UserRound }[] = [
  { key: "profile", label: "개인정보 수정", shortLabel: "개인정보", icon: UserRound },
  { key: "password", label: "비밀번호 변경", shortLabel: "비밀번호", icon: KeyRound },
  { key: "withdraw", label: "회원탈퇴", shortLabel: "회원탈퇴", icon: UserX },
];

/** 백엔드 API가 준비되기 전까지 저장 시 보여 주는 안내 */
const NOT_READY_MESSAGE = "아직 준비 중인 기능입니다. 조금만 기다려주세요.";

const numericValue = (value: string, length: number) => value.replace(/\D/g, "").slice(0, length);

/**
 * 계정 관리 — 개인정보 수정, 비밀번호 변경, 회원탈퇴
 * - 선택한 탭은 주소(?tab=)에 남겨 새로고침·공유 시에도 유지합니다.
 */
export function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const activeTab: AccountTab = ACCOUNT_TABS.some((tab) => tab.key === requested)
    ? (requested as AccountTab)
    : "profile";

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <h2 className="text-xl font-bold text-foreground sm:text-2xl">계정 관리</h2>

      {/* 세 칸이 폭을 나눠 가져 좁은 화면에서도 잘리지 않는다. */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/80 p-1" role="tablist" aria-label="계정 관리 메뉴">
        {ACCOUNT_TABS.map(({ key, label, shortLabel, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            aria-label={label}
            onClick={() => setSearchParams(key === "profile" ? {} : { tab: key }, { replace: true })}
            className={cn(
              "inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-semibold transition-colors",
              activeTab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="hidden size-4 shrink-0 sm:block" aria-hidden />
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <Card className="rounded-2xl border border-border bg-card p-5 shadow-none sm:p-8" role="tabpanel">
        {activeTab === "profile" && <ProfileForm />}
        {activeTab === "password" && <PasswordForm />}
        {activeTab === "withdraw" && <WithdrawSection />}
      </Card>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FormField({ label, htmlFor, error, children }: { label: string; htmlFor?: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function ProfileForm() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [department, setDepartment] = useState(user?.department === "미입력" ? "" : (user?.department ?? ""));
  const [phone, setPhone] = useState((user?.phone ?? "").replace(/\D/g, ""));
  const [errors, setErrors] = useState<{ name?: string; department?: string; phone?: string }>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = {
      name: validators.name(name) ? ERROR_MESSAGES.NAME : undefined,
      department: validators.department(department) ? ERROR_MESSAGES.DEPARTMENT : undefined,
      phone: validators.phone(phone) ? ERROR_MESSAGES.PHONE : undefined,
    };
    setErrors(next);
    if (next.name || next.department || next.phone) return;
    // TODO: 개인정보 수정 API가 준비되면 연결
    toast.info(NOT_READY_MESSAGE);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <SectionHeader title="개인정보 수정" description="동아리 지원서에 기본으로 채워지는 정보입니다." />
      <div className="flex flex-col gap-5">
        <FormField label="학번" htmlFor="account-student-id">
          <Input id="account-student-id" value={user?.studentId ?? ""} readOnly disabled className="h-11" />
          <p className="text-xs text-muted-foreground">학번은 변경할 수 없습니다.</p>
        </FormField>
        <FormField label="이름" htmlFor="account-name" error={errors.name}>
          <Input
            id="account-name"
            value={name}
            onChange={(event) => { setName(event.target.value); setErrors((prev) => ({ ...prev, name: undefined })); }}
            placeholder="이름을 입력해주세요"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className="h-11"
          />
        </FormField>
        <FormField label="학과" error={errors.department}>
          <DepartmentCombobox
            value={department}
            onValueChange={(value) => { setDepartment(value); setErrors((prev) => ({ ...prev, department: undefined })); }}
            hasError={Boolean(errors.department)}
            className="h-11"
          />
        </FormField>
        <FormField label="전화번호" htmlFor="account-phone" error={errors.phone}>
          <Input
            id="account-phone"
            value={phone}
            onChange={(event) => { setPhone(numericValue(event.target.value, 11)); setErrors((prev) => ({ ...prev, phone: undefined })); }}
            inputMode="numeric"
            maxLength={11}
            placeholder="하이픈 없이 입력"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            className="h-11"
          />
        </FormField>
      </div>
      <Button type="submit" className="mt-8 h-11 w-full sm:w-auto sm:px-8">
        저장
      </Button>
    </form>
  );
}

function PasswordInput({ id, value, onChange, placeholder, autoComplete, invalid }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  invalid: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        inputMode="numeric"
        maxLength={4}
        value={value}
        onChange={(event) => onChange(numericValue(event.target.value, 4))}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        className="h-11 pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = {
      current: validators.password(current) ? "현재 비밀번호를 숫자 4자리로 입력해주세요." : undefined,
      next: validators.password(next)
        ? ERROR_MESSAGES.PASSWORD
        : next === current
          ? "현재 비밀번호와 다른 번호를 입력해주세요."
          : undefined,
      confirm: !confirm
        ? ERROR_MESSAGES.PASSWORD_CONFIRM
        : confirm !== next
          ? ERROR_MESSAGES.PASSWORD_MISMATCH
          : undefined,
    };
    setErrors(result);
    if (result.current || result.next || result.confirm) return;
    // TODO: 비밀번호 변경 API가 준비되면 연결
    toast.info(NOT_READY_MESSAGE);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <SectionHeader title="비밀번호 변경" description="비밀번호는 숫자 4자리로 설정합니다." />
      <div className="flex flex-col gap-5">
        <FormField label="현재 비밀번호" htmlFor="account-current-password" error={errors.current}>
          <PasswordInput
            id="account-current-password"
            value={current}
            onChange={(value) => { setCurrent(value); setErrors((prev) => ({ ...prev, current: undefined })); }}
            placeholder="현재 비밀번호 4자리"
            autoComplete="current-password"
            invalid={Boolean(errors.current)}
          />
        </FormField>
        <FormField label="새 비밀번호" htmlFor="account-new-password" error={errors.next}>
          <PasswordInput
            id="account-new-password"
            value={next}
            onChange={(value) => { setNext(value); setErrors((prev) => ({ ...prev, next: undefined })); }}
            placeholder="새 비밀번호 4자리"
            autoComplete="new-password"
            invalid={Boolean(errors.next)}
          />
        </FormField>
        <FormField label="새 비밀번호 확인" htmlFor="account-confirm-password" error={errors.confirm}>
          <PasswordInput
            id="account-confirm-password"
            value={confirm}
            onChange={(value) => { setConfirm(value); setErrors((prev) => ({ ...prev, confirm: undefined })); }}
            placeholder="새 비밀번호를 한 번 더 입력해주세요"
            autoComplete="new-password"
            invalid={Boolean(errors.confirm)}
          />
        </FormField>
      </div>
      <Button type="submit" className="mt-8 h-11 w-full sm:w-auto sm:px-8">
        비밀번호 변경
      </Button>
    </form>
  );
}

function WithdrawSection() {
  const { deleteAccount, managedClubs } = useAuth();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleWithdraw = async () => {
    setSubmitting(true);
    try {
      await deleteAccount();
      toast.success("회원탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.");
      navigate("/", { replace: true });
    } catch (error) {
      toastApiError(error, "회원탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
      setDialogOpen(false);
    }
  };

  return (
    <div>
      <SectionHeader title="회원탈퇴" description="탈퇴하기 전에 아래 내용을 꼭 확인해주세요." />

      <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 sm:p-5">
        <div className="flex items-center gap-2 font-semibold text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          탈퇴 시 유의사항
        </div>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground/80">
          <li>탈퇴하면 이 계정으로 더 이상 로그인할 수 없습니다.</li>
          <li>지원 내역과 임시저장한 지원서를 다시 확인할 수 없습니다.</li>
          <li>같은 학번으로 다시 가입하더라도 이전 기록은 복구되지 않습니다.</li>
          {managedClubs.length > 0 && (
            <li className="font-semibold text-destructive">
              현재 {managedClubs.map((club) => club.club_name).join(", ")} 동아리의 회장입니다. 탈퇴하면 관리자 페이지를 이용할 수 없으니, 필요하면 먼저 회장 권한을 넘겨주세요.
            </li>
          )}
        </ul>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-2.5 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-destructive"
        />
        위 내용을 모두 확인했으며, 회원탈퇴에 동의합니다.
      </label>

      <Button
        type="button"
        variant="destructive"
        disabled={!agreed}
        onClick={() => setDialogOpen(true)}
        className="mt-6 h-11 w-full sm:w-auto sm:px-8"
      >
        회원탈퇴
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={(open) => { if (!submitting) setDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 탈퇴하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>탈퇴한 계정은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // 요청이 끝날 때까지 대화상자를 닫지 않는다.
                event.preventDefault();
                void handleWithdraw();
              }}
              disabled={submitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
              탈퇴하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
