import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 뉴스 아이템 데이터 인터페이스
 */
interface NewsItem {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  imageUrl: string;
  comments: number;
}

/**
 * 임시 뉴스 데이터
 */
const NEWS_ITEMS: NewsItem[] = [
  {
    id: 1,
    title: "2026년도 1학기 동아리 등록 기간 안내",
    description:
      "새로운 학기를 맞아 동아리 등록/재등록 기간이 시작되었습니다. 기간 내에 신청서를 제출해주세요.",
    date: "2026.03.02",
    category: "공지사항",
    imageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop",
    comments: 12,
  },
  {
    id: 2,
    title: "제5회 드림라운지 연합 해커톤 개최 결과 발표",
    description:
      "지난 주말 진행된 연합 해커톤의 수상팀을 발표합니다. 참여해주신 모든 분들께 감사드립니다.",
    date: "2026.02.28",
    category: "행사",
    imageUrl:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop",
    comments: 8,
  },
  {
    id: 3,
    title: "신규 동아리실 배정 결과 및 이용 수칙 안내",
    description:
      "2026년도 동아리실 배정 결과가 발표되었습니다. 각 동아리 대표자분들은 확인 부탁드립니다.",
    date: "2026.02.25",
    category: "공지사항",
    imageUrl:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop",
    comments: 5,
  },
  {
    id: 4,
    title: "봄맞이 동아리 거리 공연 일정 안내",
    description: "따뜻한 봄날 캠퍼스 곳곳에서 펼쳐지는 예쁜 선율을 즐겨보세요.",
    date: "2026.03.10",
    category: "공연",
    imageUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop",
    comments: 24,
  },
];

/**
 * 뉴스 섹션 컴포넌트
 * - 동아리 관련 최신 뉴스 및 공지사항을 그리드 형태로 노출합니다.
 * - 첫 번째 아이템은 크게 강조하고, 나머지는 리스트 형태로 보여줍니다.
 */
export function NewsSection() {
  const [mainNews] = NEWS_ITEMS;

  if (!mainNews) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-6 sm:gap-8">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">동아리 뉴스</h2>
        <button
          type="button"
          aria-label="뉴스 전체보기"
          className="flex size-8 shrink-0 items-center justify-center text-gray-900 transition-colors hover:text-gray-500"
        >
          <Plus className="size-6" />
        </button>
      </div>

      {/* 좌: 대표 뉴스 / 우: 뉴스 제목 리스트 */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2 lg:gap-10">
        {/* 대표 뉴스 (이미지 위 제목 오버레이) */}
        <div
          className="group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-2xl bg-gray-100"
          role="button"
          tabIndex={0}
          onKeyDown={() => {}}
        >
          <img
            src={mainNews.imageUrl}
            alt={mainNews.title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
            <p className="mb-2 text-sm text-white/80">{mainNews.date}</p>
            <h3 className="line-clamp-2 text-xl font-bold leading-snug drop-shadow-md sm:text-2xl">
              {mainNews.title}
            </h3>
          </div>
        </div>

        {/* 뉴스 제목 리스트 */}
        <ul className="flex h-full flex-col">
          {NEWS_ITEMS.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                "flex flex-1 items-center",
                index !== NEWS_ITEMS.length - 1 && "border-b border-gray-100",
              )}
            >
              <button
                type="button"
                className="group flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="line-clamp-1 text-gray-700 transition-colors group-hover:text-primary">
                  {item.title}
                </span>
                <span className="shrink-0 text-sm text-gray-400">{item.date}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
