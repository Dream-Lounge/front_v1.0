import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { Application } from "@/data/applications";
import { api, type ApplicationListResponseItem } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const STATUS_BADGE_CONFIG: Record<
  Application["status"],
  { children: string; className: string; variant?: "destructive" }
> = {
  pending: {
    children: "검토중",
    className: "bg-chart-3 text-white border-transparent hover:bg-chart-3/90 font-semibold",
  },
  accepted: {
    children: "합격",
    className: "bg-primary text-primary-foreground border-transparent hover:bg-primary/90 font-semibold",
  },
  rejected: {
    children: "불합격",
    variant: "destructive",
    className: "border-transparent font-semibold",
  },
  held: {
    children: "보류",
    className: "bg-amber-500 text-white border-transparent hover:bg-amber-500/90 font-semibold",
  },
};

interface StatItemProps {
  title: string;
  value: number;
  valueClass?: string;
}

function StatItem({ title, value, valueClass }: StatItemProps) {
  return (
    <div className="flex min-w-[92px] flex-1 flex-col items-center gap-1.5 px-3 py-4">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <span className={`text-xl font-extrabold leading-none ${valueClass ?? "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

interface ApplicationItemProps {
  application: Application;
}

function ApplicationItem({ application }: ApplicationItemProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row gap-4 sm:gap-5 p-5 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="shrink-0 md:self-stretch">
        <img
          src={application.clubImage}
          alt={application.clubName}
          className="w-full md:w-[130px] h-[160px] sm:h-[160px] md:h-full rounded-lg object-cover bg-muted"
        />
      </div>

      <div className="flex flex-col flex-1 gap-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="bg-blue-50 font-semibold text-primary border-blue-200 hover:bg-blue-50"
            >
              {application.category}
            </Badge>
            <Badge {...STATUS_BADGE_CONFIG[application.status]} />
          </div>

          <div className="flex flex-row gap-2 items-center shrink-0">
            <Button
              variant="default"
              className="justify-center"
              onClick={() => navigate(`/applications/${application.id}/view`)}
            >
              <FileText className="w-4 h-4 mr-2" />
              지원서 보기
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <h3 className="text-xl font-bold text-foreground">{application.clubName}</h3>
          <p className="text-sm text-muted-foreground">지원일: {application.appliedDate}</p>
        </div>

        {application.adminComment && (
          <div className="rounded-lg border bg-background/50 p-3">
            <p className="text-xs font-bold text-primary">관리자 코멘트</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{application.adminComment}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusMessage(status: ApplicationListResponseItem["status"]) {
  switch (status) {
    case "합격":
      return "축하합니다! 합격하셨습니다. OT 일정을 확인해주세요.";
    case "불합격":
      return "아쉽지만 이번 모집에서는 선발되지 못했습니다. 다음 기회에 다시 도전해주세요.";
    case "보류":
      return "지원서를 검토한 결과 추가 확인이 필요하여 보류 처리되었습니다. 결과가 확정되면 별도로 안내드리겠습니다.";
    case "제출됨":
    default:
      return "지원서를 검토중입니다. 곧 연락드리겠습니다.";
  }
}

export function ApplicationStatus() {
  const { studentId } = useParams<{ studentId: string }>();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      if (studentId && String(user.studentId) !== studentId) {
        navigate(`/users/${user.studentId}/applications`, { replace: true });
      }
    }
  }, [studentId, user, isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    if (isAuthLoading || !user || (studentId && String(user.studentId) !== studentId)) {
      return;
    }

    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const data = await api.getMyApplications();
        const mappedData: Application[] = data.map((item: ApplicationListResponseItem) => {
          let status: Application["status"] = "pending";
          if (item.status === "합격") status = "accepted";
          else if (item.status === "불합격") status = "rejected";
          else if (item.status === "보류") status = "held";

          const date = new Date(item.submitted_time);
          const appliedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

          return {
            id: String(item.id),
            studentId: user!.studentId,
            clubId: String(item.club_id),
            clubName: item.club_name,
            clubImage: item.club_image || "/logo.svg",
            category: item.category || "기타",
            status,
            rawStatus: item.status,
            appliedDate,
            message: getStatusMessage(item.status),
            adminComment: item.admin_comment ?? undefined,
          };
        });

        setApplications(mappedData);
      } catch (error) {
        console.error("Failed to fetch applications", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [studentId, user, isAuthLoading]);

  const stats = applications.reduce(
    (acc, app) => {
      acc.total++;
      if (app.status === "accepted") acc.accepted++;
      else if (app.status === "rejected") acc.rejected++;
      else if (app.status === "held") acc.held++;
      else if (app.status === "pending") acc.pending++;
      return acc;
    },
    { total: 0, accepted: 0, rejected: 0, held: 0, pending: 0 }
  );

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">지원 내역</h2>
      <div className="flex divide-x divide-border overflow-x-auto rounded-2xl border bg-card shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <StatItem title="전체" value={stats.total} />
        <StatItem title="합격" value={stats.accepted} valueClass="text-primary" />
        <StatItem
          title="불합격"
          value={stats.rejected}
          valueClass="text-destructive"
        />
        <StatItem title="보류" value={stats.held} valueClass="text-amber-600" />
        <StatItem
          title="검토중"
          value={stats.pending}
          valueClass="text-sky-600"
        />
      </div>

      <div className="flex flex-col gap-6">
        {applications.length > 0 ? (
          <div className="flex flex-col gap-4">
            {applications.map((app) => (
              <ApplicationItem key={app.id} application={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
            지원 내역이 없습니다.
          </div>
        )}
      </div>

    </div>
  );
}
