import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Clock, FileText, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api, type ApiApplicationListItem } from "@/lib/api";

function formatSavedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "저장 시간 없음" : new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export function ApplicationDrafts() {
  const { studentId } = useParams<{ studentId: string }>();
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<ApiApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && user && studentId !== user.studentId) {
      navigate(`/users/${user.studentId}/drafts`, { replace: true });
    }
  }, [isAuthLoading, navigate, studentId, user]);

  useEffect(() => {
    if (isAuthLoading || !user) return;
    let active = true;
    api.getDraftApplications()
      .then((items) => { if (active) setDrafts(items); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "임시저장 목록을 불러오지 못했습니다."))
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [isAuthLoading, user]);

  const handleDelete = async (applicationId: string) => {
    try {
      await api.deleteApplication(applicationId);
      setDrafts((prev) => prev.filter((draft) => draft.id !== applicationId));
      toast.success("임시저장 지원서를 삭제했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    }
  };

  if (isLoading || isAuthLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <h2 className="text-2xl font-bold text-foreground sm:text-3xl">임시저장함</h2>
      {drafts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {drafts.map((draft) => (
            <Card key={draft.id} className="shadow-sm">
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary" className="font-semibold">임시저장</Badge></div>
                  <h2 className="truncate text-lg font-bold text-foreground">{draft.club_name ?? "동아리 지원서"}</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="size-4" />마지막 저장: {formatSavedAt(draft.updated_at)}</div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
                  <Button variant="outline" onClick={() => void handleDelete(draft.id)}><Trash2 className="size-4" />삭제</Button>
                  <Button onClick={() => navigate(`/applications/${draft.id}/edit`)}><FileText className="size-4" />계속 작성</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center"><FileText className="size-10 text-muted-foreground" /><h2 className="font-semibold">임시저장된 지원서가 없습니다.</h2><p className="text-sm text-muted-foreground">신청서 화면에서 임시저장 버튼을 누르면 이곳에 표시됩니다.</p><Button variant="outline" onClick={() => navigate("/clubs")}>동아리 찾기</Button></CardContent></Card>
      )}
    </div>
  );
}
