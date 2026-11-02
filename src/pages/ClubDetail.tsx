import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Link2, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { mapClubResponse, type ClubData } from "@/data/clubs";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { NotFound } from "@/pages/error/NotFound";

/** 관리자가 등록한 핵심 동아리 정보만 보여주는 상세 페이지입니다. */
export function ClubDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { managedClubs, isLoading: isAuthLoading } = useAuth();
  const [clubData, setClubData] = useState<ClubData | null | undefined>(undefined);
  // 크게 보고 있는 활동 사진 순서 (null이면 닫힘)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    if (!id) {
      setClubData(null);
      return;
    }
    api.getClub(id)
      .then((club) => { if (active) setClubData(mapClubResponse(club)); })
      .catch(() => { if (active) setClubData(null); });
    return () => { active = false; };
  }, [id]);

  if (clubData === undefined) return null;
  if (!clubData) return <NotFound />;

  const isRecruiting = clubData.recruitment.status === "모집중";
  const activities = clubData.activities;
  const viewing = viewerIndex === null ? null : activities[viewerIndex];
  const moveViewer = (step: number) =>
    setViewerIndex((current) => (current === null ? null : (current + step + activities.length) % activities.length));
  const isOwnClub = managedClubs.some((club) => club.club_id === id && club.role === "president");

  return (
    <div className="mx-auto flex w-full flex-col gap-8 pb-20">
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(280px,460px)_minmax(0,1fr)]">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
          {clubData.coverImage ? (
            <img src={clubData.coverImage} alt={`${clubData.title} 대표 포스터`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">등록된 대표 포스터가 없습니다.</div>
          )}
          <Badge size="detail" className="absolute right-4 top-4 bg-primary font-semibold text-primary-foreground">
            {clubData.recruitment.status}
          </Badge>
        </div>

        <main className="space-y-5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{clubData.title}</h1>
          <section className="space-y-3">
            <h2 className="text-xl font-bold">동아리 소개</h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              {clubData.description}
            </p>
          </section>
          <aside className="space-y-5 pt-2">
          <Card className="border-border shadow-sm">
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center">
                <span className="text-sm font-semibold text-muted-foreground">모집 기간</span>
                <span className="text-base font-bold text-foreground">
                  {clubData.recruitment.period || (isRecruiting ? "상시 모집" : "-")}
                </span>
              </div>
              <Button
                onClick={() => navigate(`/club/${id}/apply`)}
                disabled={!isRecruiting || isOwnClub || isAuthLoading}
                className="w-full py-6 font-bold"
              >
                {isOwnClub ? "내 동아리에는 지원할 수 없습니다" : isRecruiting ? "지원하기" : "모집이 마감되었습니다"}
              </Button>
            </CardContent>
          </Card>

          {clubData.contacts.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle className="text-lg">문의</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                {clubData.contacts.map((contact, index) => {
                  const href = contact.type === "email" ? `mailto:${contact.value}` : contact.type === "phone" ? `tel:${contact.value.replace(/[^\d+]/g, "")}` : contact.value;
                  const Icon = contact.type === "email" ? Mail : contact.type === "phone" ? Phone : Link2;
                  return (
                    <a key={`${contact.type}-${contact.label}-${index}`} href={href} {...(contact.type === "url" ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-start gap-3 text-sm text-primary underline-offset-4 hover:underline">
                      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <span className="break-all">{contact.label}: {contact.value}</span>
                    </a>
                  );
                })}
              </CardContent>
            </Card>
          )}
          </aside>
        </main>
      </div>

      {/* 활동 사진: 관리자 페이지 '추가 정보'에서 올린 사진. 누르면 크게 본다. */}
      {activities.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="club-activities-title">
          <h2 id="club-activities-title" className="text-xl font-bold">
            활동 사진 <span className="text-base font-semibold text-muted-foreground">{activities.length}</span>
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {activities.map((activity, index) => (
              <li key={activity.id}>
                <button
                  type="button"
                  onClick={() => setViewerIndex(index)}
                  className="group flex w-full flex-col gap-2 text-left"
                  aria-label={`${activity.title} 크게 보기`}
                >
                  <span className="block aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
                    <img
                      src={activity.image}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </span>
                  {activity.caption && (
                    <span className="line-clamp-1 text-sm text-muted-foreground">{activity.caption}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog open={viewing !== null} onOpenChange={(open) => { if (!open) setViewerIndex(null); }}>
        <DialogContent
          className="gap-4 p-4 sm:max-w-3xl sm:p-6"
          onKeyDown={(event) => {
            if (activities.length < 2) return;
            if (event.key === "ArrowLeft") moveViewer(-1);
            if (event.key === "ArrowRight") moveViewer(1);
          }}
        >
          <DialogTitle className="pr-8">{viewing?.caption || "활동 사진"}</DialogTitle>
          <DialogDescription className="sr-only">
            {viewerIndex !== null ? `${activities.length}장 중 ${viewerIndex + 1}번째 사진` : ""}
          </DialogDescription>
          {viewing && (
            <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-muted">
              <img src={viewing.image} alt={viewing.title} className="max-h-[70vh] w-full object-contain" />
              {activities.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => moveViewer(-1)}
                    aria-label="이전 사진"
                    className="absolute top-1/2 left-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md transition-colors hover:bg-background"
                  >
                    <ChevronLeft className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveViewer(1)}
                    aria-label="다음 사진"
                    className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md transition-colors hover:bg-background"
                  >
                    <ChevronRight className="size-5" aria-hidden />
                  </button>
                </>
              )}
            </div>
          )}
          {activities.length > 1 && viewerIndex !== null && (
            <p className="text-center text-sm tabular-nums text-muted-foreground">
              {viewerIndex + 1} / {activities.length}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
