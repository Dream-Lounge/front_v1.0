import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Link2, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const isOwnClub = managedClubs.some((club) => club.club_id === id && club.role === "president");

  return (
    <div className="container mx-auto flex w-full max-w-5xl flex-col gap-8 pb-20">
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
            <CardContent className="pt-6">
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
    </div>
  );
}
