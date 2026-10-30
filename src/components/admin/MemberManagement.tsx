import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Crown, Loader2, ShieldCheck, UserMinus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, type ClubMember } from "@/lib/api";
import { toastApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

export type ClubRole = "president" | "admin" | "member";

const PAGE_SIZE = 20;

const ROLE_LABEL: Record<ClubRole, string> = { president: "회장", admin: "관리자", member: "부원" };
const ROLE_BADGE: Record<ClubRole, string> = {
  president: "bg-primary text-primary-foreground",
  admin: "bg-[#EAF1FC] text-primary",
  member: "bg-slate-100 text-slate-600",
};

/** 백엔드가 아직 관리자 역할을 따로 주지 않아, 알 수 없는 값은 일반 부원으로 본다. */
function toRole(value: string): ClubRole {
  return value === "president" || value === "admin" ? value : "member";
}

type PendingAction = { type: "transfer" | "withdraw"; member: ClubMember } | null;

interface MemberManagementProps {
  clubId: string;
  /** 관리자 페이지를 보고 있는 사람의 역할 */
  myRole: ClubRole;
  currentUserId: string | undefined;
  /** 회장 권한을 위임한 직후 (내 관리자 권한이 사라짐) */
  onPresidentTransferred: () => void;
}

/**
 * 회원관리: 부원 목록과 권한 관리
 * - 회장: 관리자 지정, 회장 위임, 부원 탈퇴
 * - 관리자: 부원 탈퇴 (관리자 지정·회장 위임 불가)
 * - 회장은 탈퇴 대상이 아니며, 먼저 회장 권한을 위임해야 한다.
 */
export function MemberManagement({ clubId, myRole, currentUserId, onPresidentTransferred }: MemberManagementProps) {
  const [members, setMembers] = useState<ClubMember[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [isWorking, setIsWorking] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const data = await api.getClubMembers(clubId, page, PAGE_SIZE);
      setMembers(data.items);
      setTotal(data.total);
      setPages(Math.max(1, data.pages));
    } catch {
      setFailed(true);
    }
  }, [clubId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const isPresident = myRole === "president";

  const runPending = async () => {
    if (!pending) return;
    setIsWorking(true);
    try {
      if (pending.type === "transfer") {
        await api.transferClubRole(clubId, pending.member.user_id);
        toast.success(`${pending.member.name}님에게 회장 권한을 위임했습니다.`);
        setPending(null);
        onPresidentTransferred();
        return;
      }
      await api.withdrawClubMember(clubId, pending.member.user_id);
      toast.success(`${pending.member.name}님을 탈퇴시켰습니다.`);
      setPending(null);
      await load();
    } catch (error) {
      toastApiError(error, pending.type === "transfer" ? "회장 권한을 위임하지 못했습니다." : "탈퇴시키지 못했습니다.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-foreground">회원관리</h2>
        <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-lg font-extrabold tabular-nums text-[#1F4F95]">{total}명</span>
      </div>

      <ul className="mt-4 space-y-1 text-xs leading-relaxed text-muted-foreground">
        <li><strong className="text-foreground">회장</strong>: 모든 관리 기능, 관리자 지정, 회장 위임, 부원 탈퇴</li>
        <li><strong className="text-foreground">관리자</strong>: 동아리 정보·신청폼·신청서·회원·공지 관리, 부원 탈퇴</li>
        <li><strong className="text-foreground">부원</strong>: 동아리 게시판 이용</li>
      </ul>

      <div className="mt-5">
        {failed ? (
          <div className="dream-data-state" role="status">
            <p>부원 목록을 불러오지 못했습니다.</p>
            <button type="button" onClick={() => void load()}>다시 불러오기</button>
          </div>
        ) : members === null ? (
          <div className="flex min-h-40 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : members.length === 0 ? (
          <div className="dream-data-state" role="status"><p>아직 등록된 부원이 없습니다.</p></div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-slate-200">
            {members.map((member) => {
              const role = toRole(member.role);
              const isMe = member.user_id === currentUserId;
              const canManage = !isMe && role !== "president";
              return (
                <li key={member.user_id} className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800">{member.name}</span>
                      <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold", ROLE_BADGE[role])}>{ROLE_LABEL[role]}</span>
                      {isMe && <span className="text-xs font-semibold text-muted-foreground">(나)</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {member.student_id}
                      {member.department && <> · {member.department}</>}
                      {member.phone && <> · {member.phone}</>}
                      <span className="ml-2 whitespace-nowrap text-xs text-slate-400">가입 {member.joined_at.slice(0, 10).replaceAll("-", ".")}</span>
                    </p>
                  </div>

                  {canManage && (
                    <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
                      {isPresident && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            // TODO: 백엔드에 관리자 역할 API가 생기면 연결
                            onClick={() => toast.info("관리자 지정은 아직 준비 중인 기능입니다.")}
                          >
                            <ShieldCheck className="size-4" aria-hidden />
                            {role === "admin" ? "관리자 해제" : "관리자 지정"}
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setPending({ type: "transfer", member })}>
                            <Crown className="size-4" aria-hidden />
                            회장 위임
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => setPending({ type: "withdraw", member })}
                      >
                        <UserMinus className="size-4" aria-hidden />
                        탈퇴
                      </Button>
                    </div>
                  )}
                  {role === "president" && !isMe && (
                    <p className="text-xs text-muted-foreground sm:text-right">회장은 권한을 위임한 뒤에 탈퇴할 수 있어요.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>이전</Button>
          <span className="text-sm tabular-nums text-muted-foreground">{page} / {pages}</span>
          <Button type="button" variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>다음</Button>
        </div>
      )}

      <Dialog open={pending !== null} onOpenChange={(open) => { if (!open && !isWorking) setPending(null); }}>
        <DialogContent className="gap-6 px-6 py-8 sm:max-w-md sm:px-8">
          <DialogHeader className="gap-6">
            <DialogTitle>
              {pending?.type === "transfer" ? `${pending.member.name}님에게 회장을 위임할까요?` : `${pending?.member.name}님을 탈퇴시킬까요?`}
            </DialogTitle>
            <DialogDescription asChild>
              <ul className="list-disc space-y-2 pl-5 text-left text-sm leading-relaxed">
                {pending?.type === "transfer" ? (
                  <>
                    <li>선택한 부원이 새 회장이 되고, 나는 일반 부원이 됩니다.</li>
                    <li>위임 후에는 이 동아리의 관리자 페이지를 이용할 수 없습니다.</li>
                    <li>한 동아리에는 회장이 한 명만 있을 수 있습니다.</li>
                  </>
                ) : (
                  <>
                    <li>이 동아리의 부원 자격과 동아리 게시판 접근 권한이 사라집니다.</li>
                    <li>관리자였다면 관리자 권한도 함께 해제됩니다.</li>
                    <li>Dream Lounge 계정과 다른 동아리 자격은 그대로 유지됩니다.</li>
                  </>
                )}
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isWorking} onClick={() => setPending(null)}>취소</Button>
            <Button
              type="button"
              disabled={isWorking}
              onClick={() => void runPending()}
              className={cn(pending?.type === "withdraw" && "bg-destructive text-white hover:bg-destructive/90")}
            >
              {isWorking && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {pending?.type === "transfer" ? "회장 위임" : "탈퇴"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
