import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { api, type ActiveClubItem, type ClubResponse } from "@/lib/api";

export function MyClubs() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [clubs, setClubs] = useState<Array<{ membership: ActiveClubItem; club: ClubResponse }>>([]);

  useEffect(() => {
    if (isLoading || !user) return;

    // 로그인 상태에서만 "본인 페이지로 되돌림" 처리
    if (isAuthenticated && user && studentId) {
      if (String(user.studentId) !== studentId) {
        navigate(`/users/${user.studentId}/clubs`, { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, studentId, navigate]);

  useEffect(() => {
    if (isLoading || !user) return;

    let active = true;
    api.getMyClubs()
      .then(async (memberships) => {
        const resolved = await Promise.all(memberships.map(async (membership) => ({
          membership,
          club: await api.getClub(membership.club_id),
        })));
        if (active) setClubs(resolved);
      })
      .catch(() => { if (active) setClubs([]); });
    return () => { active = false; };
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">내 동아리</h2>
        <Separator />
      </div>

      {clubs.length > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clubs.map(({ membership, club }) => {
              const firstActivityImage = club.activity_images?.[0] ?? club.image_url;
              return (
                <Link
                  key={membership.club_id}
                  to={`/club/${membership.club_id}/community`}
                  className="group"
                >
                  <Card className="overflow-hidden border-border hover:shadow-md transition-shadow">
                    <div className="h-32 bg-muted/50 relative">
                      <img
                        src={firstActivityImage ?? "/logo.svg"}
                        alt={club.name}
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{club.name}</CardTitle>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="font-semibold">
                          {club.division ?? club.club_type ?? "동아리"}
                        </Badge>
                        {club.tags.slice(0, 3).map((tag) => (
                          <Badge key={`${tag.tag_key}-${tag.tag_value}`} variant="outline" className="font-normal">
                            {tag.tag_value}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {club.description}
                      </p>
                      <div className="mt-4 text-sm font-medium text-primary group-hover:underline">
                        커뮤니티
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
          등록된 내 동아리가 없습니다.
          <div className="mt-4">
            <Button variant="default" asChild>
              <Link to="/">동아리 둘러보기</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

