import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";

const SOCIAL_LINKS = [
    { Icon: Facebook, href: "#", label: "Facebook" },
    { Icon: Instagram, href: "#", label: "Instagram" },
    { Icon: Youtube, href: "#", label: "Youtube" },
    { Icon: Twitter, href: "#", label: "Twitter" },
];

const FOOTER_SECTIONS = [
    {
        title: "소개",
        links: [
            { to: "/about", text: "서비스 소개" },
            { to: "/team", text: "팀 소개" },
        ],
    },
    {
        title: "고객지원",
        links: [
            { to: "/notice", text: "공지사항" },
            { to: "/faq", text: "자주 묻는 질문" },
            { to: "/report", text: "신고하기" },
            { to: "/developers", text: "개발자 센터" },
        ],
    },
    {
        title: "정책",
        links: [
            { to: "/terms", text: "이용약관" },
            { to: "/privacy", text: "개인정보처리방침" },
            { to: "/cookies", text: "쿠키정책" },
        ],
    },
];

/**
 * 푸터 컴포넌트
 * - 사이트 하단에 위치하며 로고, 소셜 링크, 사이트맵, 저작권 정보를 포함합니다.
 * - 주요 정보 접근성을 높이기 위해 구조화된 링크를 제공합니다.
 */
export function Footer() {
    return (
        <footer className="dream-footer w-full flex justify-center bg-stone-900 text-stone-100">
            <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 items-start relative box-border">
                {/** 상단 영역: 로고, 서비스 소개, 소셜 링크 및 사이트맵 */}
                <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-13 items-start relative shrink-0">

                    {/** 좌측 열: 브랜드 로고 및 서비스 간단 소개 */}
                    <div className="flex flex-col gap-4 items-start relative shrink-0 w-full sm:w-80">
                        {/** 로고: 클릭 시 메인 페이지로 이동 */}
                        <Link to="/" className="h-24">
                            <img src="/logo.svg" alt="Dream Lounge Logo" className="h-full w-auto" draggable={false} />
                        </Link>

                        {/** 서비스 설명: 플랫폼의 비전/슬로건 표시 */}
                        <div className="relative shrink-0 w-full h-10 font-kr text-sm text-stone-400">
                            <p className="leading-5">대학생들의 꿈과 열정을 이어주는</p>
                            <p className="leading-5">동아리 신청·관리 웹 서비스</p>
                        </div>

                        {/** 소셜 미디어 링크: 외부 SNS 페이지로 연결 */}
                        <div className="flex gap-4 mt-2">
                            {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="size-8 bg-stone-400 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white transition-colors text-stone-900"
                                >
                                    <Icon className="size-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/** 우측 열: 사이트맵 네비게이션 (소개, 고객지원, 정책 등) */}
                    <div className="w-full lg:flex-1 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10 pt-2">
                        {FOOTER_SECTIONS.map(({ title, links }) => (
                            <div key={title} className="flex flex-col gap-3">
                                <h3 className="font-kr font-bold text-base text-white">{title}</h3>
                                <ul className="flex flex-col gap-2">
                                    {links.map(({ to, text }) => (
                                        <li key={text}>
                                            <Link to={to} className="font-kr text-sm text-stone-400 hover:text-white transition-colors">
                                                {text}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                </div>

                {/** 하단 영역: 저작권(Copyright) 표시 */}
                <div className="w-full pt-8 border-t border-stone-800 mt-auto">
                    <p className="font-kr text-xs text-stone-600 text-center">
                        © 2026 Dream Lounge. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
