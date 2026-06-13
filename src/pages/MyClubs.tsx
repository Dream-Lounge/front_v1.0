import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { api, type ActiveClubItem } from "@/lib/api";

export function MyClubs() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [clubs, setClubs] = useState<ActiveClubItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user && studentId) {
      if (String(user.studentId) !== studentId) {
        navigate(`/users/${user.studentId}/clubs`, { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, studentId, navigate]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (studentId && String(user.studentId) !== studentId) return;

    const fetchClubs = async () => {
      setIsFetching(true);
      try {
        const data = await api.getMyClubs();
        setClubs(data);
      } catch (error) {
        console.error("Failed to fetch my clubs", error);
        setClubs([]);
      } finally {
        setIsFetching(false);
      }
    };

    fetchClubs();
  }, [isLoading, isAuthenticated, user, studentId]);

  if (isLoading || isFetching) {
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
            {clubs.map((item) => (
              <Link
                key={item.club_id}
                to={`/club/${item.club_id}/community`}
                className="group"
              >
                <Card className="overflow-hidden border-border hover:shadow-md transition-shadow">
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{item.club_name}</CardTitle>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={item.role === "president" ? "default" : "secondary"}>
                        {item.role === "president" ? "회장" : "부원"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="mt-4 text-sm font-medium text-primary group-hover:underline">
                      커뮤니티
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
