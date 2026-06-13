import { Link } from "react-router-dom";
import { Search, User } from "lucide-react";
import { Input } from "../ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";


const NAV_ITEMS = [
    { label: "동아리 찾기", to: "/clubs" },
    { label: "커뮤니티", to: "/community" },
    { label: "이벤트", to: "/events" },
    { label: "고객센터", to: "/support" },
];

/**
 * 헤더 컴포넌트
 * - 사이트 전반의 네비게이션 및 주요 액션(검색, 알림 등)을 담당합니다.
 * - 반응형 디자인을 고려하여 제작되었습니다.
 */
export function Header() {
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <header className="w-full flex justify-center bg-background shadow-sm sticky top-0 z-50">
            {/** 한 줄 헤더: 로고 | 카테고리(네비) | 검색·유저 */}
            <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 sm:gap-4 min-h-12">
                {/** 로고 */}
                <Link to="/" className="h-10 sm:h-12 shrink-0 flex items-center">
                    <img src="/logo.svg" alt="Dream Lounge Logo" className="h-full w-auto" draggable={false} />
                </Link>

                {/** 메인 네비게이션: 검색 Input(h-9)과 동일 높이로 하단선 정렬 */}
                <nav
                    className="flex-1 min-w-0 h-9 flex items-center gap-1 sm:gap-2 md:gap-4 overflow-x-auto overflow-y-hidden whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    aria-label="주요 메뉴"
                >
                    {NAV_ITEMS.map(({ label, to }) => (
                        <Link
                            key={label}
                            to={to}
                            className="font-kr text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors shrink-0 box-border h-9 inline-flex items-center px-2 sm:px-3 border-b-2 border-transparent hover:border-primary"
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/** 검색 + 사용자 (높이 h-9로 네비와 맞춤) */}
                <div className="shrink-0 flex items-center gap-2 sm:gap-3 h-9">
                    {/** 검색 바 (sm 이상) */}
                    <div className="hidden sm:block w-[min(100%,14rem)] md:w-56 lg:max-w-sm">
                        <div className="relative h-9">
                            <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
                            <Input
                                className="bg-background pl-9 h-full rounded-2xl w-full"
                                id="search-input"
                                placeholder="동아리 검색"
                                type="search"
                            />
                        </div>
                    </div>

                    {/** 사용자 메뉴 */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer">
                                <User className="size-5 text-foreground" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-40 p-1">
                            <div className="flex flex-col">
                                {isAuthenticated ? (
                                    <>
                                        <div className="w-full px-3 py-2 text-sm font-medium text-foreground text-left cursor-default">
                                            {user?.name}님 반갑습니다.
                                        </div>
                                        <Separator className="my-1" />
                                        <Link
                                            to={`/users/${user?.studentId}/applications`}
                                            className="w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-sm transition-colors text-left"
                                        >
                                            지원 내역
                                        </Link>
                                        <Link
                                            to={`/users/${user?.studentId}/drafts`}
                                            className="w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-sm transition-colors text-left"
                                        >
                                            임시저장함
                                        </Link>
                                        <Link
                                            to={`/users/${user?.studentId}/clubs`}
                                            className="w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-sm transition-colors text-left"
                                        >
                                            내 동아리
                                        </Link>
                                        <Link
                                            to="/admin"
                                            className="w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-sm transition-colors text-left"
                                        >
                                            관리자 페이지
                                        </Link>
                                        <Separator className="my-1" />
                                        <button
                                            onClick={logout}
                                            className="w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-muted rounded-sm transition-colors text-left"
                                        >
                                            로그아웃
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            className="w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-sm transition-colors text-left"
                                        >
                                            로그인
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-sm transition-colors text-left"
                                        >
                                            회원가입
                                        </Link>
                                    </>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </header>
    );
}
