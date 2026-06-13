import { type ReactNode, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, XCircle, Clock, PauseCircle } from "lucide-react";
import { api, type ApplicationListResponseItem } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type DisplayStatus = "pending" | "accepted" | "rejected" | "held";

interface Application {
  id: string;
  clubName: string;
  clubImage: string;
  status: DisplayStatus;
  beStatus: string;
  appliedDate: string;
  message: string;
}

const STATUS_BADGE_CONFIG: Record<
  DisplayStatus,
  { children: string; className: string; variant?: "destructive" }
> = {
  pending: {
    children: "검토중",
    className: "bg-chart-3 text-white border-transparent hover:bg-chart-3/90",
  },
  accepted: {
    children: "합격",
    className: "bg-primary text-primary-foreground border-transparent hover:bg-primary/90",
  },
  rejected: {
    variant: "destructive",
    children: "불합격",
    className: "border-transparent",
  },
  held: {
    children: "보류",
    className: "bg-amber-500 text-white border-transparent hover:bg-amber-500/90",
  },
};

type FilterStatus = "all" | DisplayStatus;

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  iconWrapClass: string;
  valueClass?: string;
  isActive?: boolean;
  onClick?: () => void;
}

function StatCard({ title, value, icon, iconWrapClass, valueClass, isActive, onClick }: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`group flex flex-row items-center gap-2.5 p-3.5 shadow-sm border rounded-2xl bg-card transition-all hover:shadow-md hover:-translate-y-0.5 ${onClick ? "cursor-pointer" : ""} ${isActive ? "ring-2 ring-primary border-primary" : ""}`}
    >
      <div className={`shrink-0 flex items-center justify-center size-9 rounded-xl transition-transform group-hover:scale-105 ${iconWrapClass}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-medium text-muted-foreground truncate">{title}</span>
        <span className="flex items-baseline gap-0.5">
          <span className={`text-xl font-extrabold leading-none ${valueClass ?? "text-foreground"}`}>
            {value}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">개</span>
        </span>
      </div>
    </Card>
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

        <div className="p-3 border rounded-lg bg-background/50 text-sm text-foreground">
          {application.message}
        </div>
      </div>
    </div>
  );
}

function mapStatus(beStatus: string): DisplayStatus {
  if (beStatus === "passed") return "accepted";
  if (beStatus === "failed") return "rejected";
  if (beStatus === "pending") return "held";
  return "pending";
}

function getStatusMessage(beStatus: string): string {
  if (beStatus === "passed") return "축하합니다! 합격하셨습니다. OT 일정을 확인해주세요.";
  if (beStatus === "failed") return "아쉽지만 이번 모집에서는 선발되지 못했습니다. 다음 기회에 다시 도전해주세요.";
  if (beStatus === "pending") return "지원서를 검토한 결과 추가 확인이 필요하여 보류 처리되었습니다. 결과가 확정되면 별도로 안내드리겠습니다.";
  return "지원서를 검토중입니다. 곧 연락드리겠습니다.";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function ApplicationStatus() {
  const { studentId } = useParams<{ studentId: string }>();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      if (studentId && String(user.studentId) !== studentId) {
        navigate(`/users/${user.studentId}/applications`, { replace: true });
      }
    }
  }, [studentId, user, isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    if (studentId && String(user.studentId) !== studentId) return;

    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const data = await api.getMyApplications();
        const mapped: Application[] = data
          .filter((item: ApplicationListResponseItem) => !item.is_draft)
          .map((item: ApplicationListResponseItem) => ({
            id: item.id,
            clubName: item.club_name || "동아리",
            clubImage: "https://placehold.co/160x160/e2e8f0/1e293b?text=Club",
            status: mapStatus(item.status),
            beStatus: item.status,
            appliedDate: formatDate(item.submitted_at),
            message: getStatusMessage(item.status),
          }));
        setApplications(mapped);
      } catch (error) {
        console.error("Failed to fetch applications", error);
        setApplications([]);
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-3">
        <StatCard
          title="전체 지원"
          value={stats.total}
          icon={<FileText className="w-4 h-4" strokeWidth={2} />}
          iconWrapClass="bg-slate-100 text-slate-500"
          isActive={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />
        <StatCard
          title="합격"
          value={stats.accepted}
          icon={<CheckCircle2 className="w-4 h-4" strokeWidth={2} />}
          iconWrapClass="bg-primary/10 text-primary"
          valueClass="text-primary"
          isActive={activeFilter === "accepted"}
          onClick={() => setActiveFilter(activeFilter === "accepted" ? "all" : "accepted")}
        />
        <StatCard
          title="불합격"
          value={stats.rejected}
          icon={<XCircle className="w-4 h-4" strokeWidth={2} />}
          iconWrapClass="bg-destructive/10 text-destructive"
          valueClass="text-destructive"
          isActive={activeFilter === "rejected"}
          onClick={() => setActiveFilter(activeFilter === "rejected" ? "all" : "rejected")}
        />
        <StatCard
          title="보류"
          value={stats.held}
          icon={<PauseCircle className="w-4 h-4" strokeWidth={2} />}
          iconWrapClass="bg-amber-100 text-amber-600"
          valueClass="text-amber-600"
          isActive={activeFilter === "held"}
          onClick={() => setActiveFilter(activeFilter === "held" ? "all" : "held")}
        />
        <StatCard
          title="검토중"
          value={stats.pending}
          icon={<Clock className="w-4 h-4" strokeWidth={2} />}
          iconWrapClass="bg-sky-100 text-sky-600"
          valueClass="text-sky-600"
          isActive={activeFilter === "pending"}
          onClick={() => setActiveFilter(activeFilter === "pending" ? "all" : "pending")}
        />
      </div>

      <div className="flex flex-col gap-6">
        {(() => {
          const filtered = activeFilter === "all"
            ? applications
            : applications.filter((app) => app.status === activeFilter);
          return filtered.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filtered.map((app) => (
                <ApplicationItem
                  key={app.id}
                  application={app}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
              {activeFilter === "all" ? "지원 내역이 없습니다." : "해당 상태의 지원 내역이 없습니다."}
            </div>
          );
        })()}
      </div>

    </div>
  );
}
