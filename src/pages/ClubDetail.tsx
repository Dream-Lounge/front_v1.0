import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, CheckCircle2 } from "lucide-react";
import { NotFound } from "@/pages/error/NotFound";
import { api, type Club } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

function formatDateRange(start: string | null, end: string | null): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };
  if (start && end) return `${fmt(start)} ~ ${fmt(end)}`;
  if (end) return `~ ${fmt(end)}`;
  if (start) return `${fmt(start)} ~`;
  return "상시모집";
}

export function ClubDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.getClub(id)
      .then((data) => setClub(data))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    api.checkApplicationStatus(id).then(setHasApplied).catch(() => {});
  }, [id, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (notFound || !club) {
    return <NotFound />;
  }

  const recruitmentStatus = club.is_recruiting ? "모집중" : "모집 마감";
  const recruitmentPeriod = formatDateRange(club.recruit_start, club.recruit_end);
  const tags = club.tags.map((t) => t.tag_value || t.tag_key);

  return (
    <div className="container flex flex-col gap-8 pb-20 mx-auto w-full">
      {/* 히어로 섹션 */}
      <div className="relative h-[220px] sm:h-[300px] w-full rounded-2xl overflow-hidden bg-muted">
        {club.image_url ? (
          <img
            src={club.image_url}
            alt={club.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <img
            src={`https://placehold.co/1200x400/e2e8f0/1e293b?text=${encodeURIComponent(club.name)}`}
            alt="Club Cover"
            className="object-cover w-full h-full"
          />
        )}
        <div className="absolute top-4 right-4">
          <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
            {recruitmentStatus}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            {club.division && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="font-semibold text-primary">{club.division}</span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {club.name}
            </h1>
            {club.description && (
              <p className="text-base sm:text-lg text-muted-foreground">
                {club.description}
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-3 py-1 text-secondary-foreground text-sm font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* 동아리 소개 */}
          {(club.activity_purpose || club.description) && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">동아리 소개</h2>
              <div className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                {club.activity_purpose || club.description}
              </div>
            </section>
          )}

          {/* 활동 분야 */}
          {(club.field || club.atmosphere || club.activity_period) && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold">활동 정보</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                {club.field && (
                  <div>
                    <span className="font-semibold text-foreground">활동 분야: </span>
                    {club.field}
                  </div>
                )}
                {club.atmosphere && (
                  <div>
                    <span className="font-semibold text-foreground">분위기: </span>
                    {club.atmosphere}
                  </div>
                )}
                {club.activity_period && (
                  <div>
                    <span className="font-semibold text-foreground">활동 기간: </span>
                    {club.activity_period}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 활동 사진 */}
          {club.activity_images && club.activity_images.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold">활동 사진</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {club.activity_images.map((url, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-xl overflow-hidden bg-muted"
                  >
                    <img
                      src={url}
                      alt={`활동 사진 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 사이드 모집 정보 */}
        <div className="lg:col-span-1">
          <div className="space-y-6 lg:sticky lg:top-24">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">모집 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">모집 기간</p>
                    <p className="text-sm text-muted-foreground">{recruitmentPeriod}</p>
                  </div>
                </div>
                {(club.contact_email || club.contact_phone) && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">연락처</p>
                      {club.contact_email && (
                        <p className="text-sm text-muted-foreground">{club.contact_email}</p>
                      )}
                      {club.contact_phone && (
                        <p className="text-sm text-muted-foreground">{club.contact_phone}</p>
                      )}
                    </div>
                  </div>
                )}
                {club.open_chat_url && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">오픈채팅</p>
                      <a
                        href={club.open_chat_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        링크 열기
                      </a>
                    </div>
                  </div>
                )}

                <Separator className="my-2" />

                <Button
                  onClick={() => navigate(`/club/${id}/apply`)}
                  className="w-full font-bold py-6 shadow-md transition-all"
                  disabled={!club.is_recruiting || hasApplied}
                  variant={hasApplied ? "outline" : "default"}
                >
                  {hasApplied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                      <span className="text-emerald-700">지원 완료</span>
                    </>
                  ) : club.is_recruiting ? (
                    "지원하기"
                  ) : (
                    "모집 마감"
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="bg-muted/50 p-4 rounded-lg text-xs text-muted-foreground">
              * 동아리 지원 관련 문의는 해당 동아리 회장에게 직접 문의 바랍니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
