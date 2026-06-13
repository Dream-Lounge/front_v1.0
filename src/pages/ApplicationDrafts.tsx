import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Clock, FileText, Trash2, Loader2 } from "lucide-react";
import { api, type ApplicationListResponseItem } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface DraftItem {
  id: string;
  clubName: string;
  updatedAt: string;
}

function formatSavedAt(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "저장 시간 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ApplicationDrafts() {
  const { studentId } = useParams<{ studentId: string }>();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user && studentId && String(user.studentId) !== studentId) {
      navigate(`/users/${user.studentId}/drafts`, { replace: true });
    }
  }, [studentId, user, isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      setDrafts([]);
      setIsLoading(false);
      return;
    }
    if (studentId && String(user.studentId) !== studentId) return;

    setIsLoading(true);
    api.getMyDrafts()
      .then((data: ApplicationListResponseItem[]) => {
        setDrafts(
          data.map((item) => ({
            id: item.id,
            clubName: item.club_name || "동아리 지원서",
            updatedAt: item.updated_at,
          }))
        );
      })
      .catch(() => {
        toast.error("임시저장 목록을 불러오지 못했습니다.");
        setDrafts([]);
      })
      .finally(() => setIsLoading(false));
  }, [studentId, user, isAuthLoading]);

  const handleDelete = async (id: string, clubName: string) => {
    setDeletingId(id);
    try {
      await api.deleteApplication(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      toast.success(`"${clubName}" 임시저장이 삭제되었습니다.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">임시저장함</h2>
      </div>

      {drafts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {drafts.map((draft) => (
            <Card key={draft.id} className="shadow-sm">
              <CardContent className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">임시저장</Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-foreground truncate">
                      {draft.clubName}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>마지막 저장: {formatSavedAt(draft.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 md:shrink-0">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === draft.id}
                      >
                        {deletingId === draft.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        삭제
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>임시저장을 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          <strong>{draft.clubName}</strong>의 임시저장 내용이 삭제됩니다.
                          삭제된 내용은 복구할 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(draft.id, draft.clubName)}
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    type="button"
                    onClick={() => navigate(`/applications/${draft.id}/edit`)}
                    className="cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    계속 작성
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <h2 className="font-semibold text-foreground">임시저장된 지원서가 없습니다.</h2>
              <p className="text-sm text-muted-foreground">
                신청서 화면에서 임시저장 버튼을 누르면 이곳에 표시됩니다.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => navigate("/clubs")} className="mt-2">
              동아리 찾기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
