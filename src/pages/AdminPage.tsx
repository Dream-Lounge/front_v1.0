import { useState, useEffect, useCallback, useRef } from "react";
import {
  PlusCircle,
  Settings,
  FileText,
  Tag,
  MessageSquare,
  Image as ImageIcon,
  Trash2,
  Save,
  CirclePlus,
  Search,
  SlidersHorizontal,
  Bold,
  Italic,
  Underline,
  ImagePlus,
  Plus,
  X,
  SquarePen,
  Pencil,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { CLUB_DIVISION_KEYS } from "@/data/clubDirectoryMeta";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type Club, type FormQuestion, type AdminApplicationListItem, type PostListItem, type AdminApplicationDetail } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type AdminTab =
  | "club-register"
  | "application-form"
  | "submitted-applications"
  | "page-tags"
  | "community-board";

const ADMIN_MENU: {
  section: string;
  items: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tab: AdminTab;
  }[];
}[] = [
  {
    section: "동아리 관리",
    items: [
      { label: "동아리 정보", icon: PlusCircle, tab: "club-register" },
      { label: "상세페이지 설정", icon: Tag, tab: "page-tags" },
    ],
  },
  {
    section: "신청서 관리",
    items: [
      { label: "신청폼 설정", icon: Settings, tab: "application-form" },
      {
        label: "신청서 관리",
        icon: FileText,
        tab: "submitted-applications",
      },
    ],
  },
  {
    section: "커뮤니티",
    items: [
      {
        label: "게시판 관리",
        icon: MessageSquare,
        tab: "community-board",
      },
    ],
  },
];

const STATUS_LABEL: Record<string, string> = {
  draft: "임시저장",
  submitted: "검토중",
  pending: "보류",
  passed: "합격",
  failed: "불합격",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  submitted: "bg-[#FFF9E8] text-[#B48319]",
  pending: "bg-[#EEF1F6] text-[#5A6B86]",
  passed: "bg-[#E8FAEE] text-[#14863F]",
  failed: "bg-[#FDECEE] text-[#D7263D]",
};

const STATUS_SELECT_CLASS: Record<string, string> = {
  submitted: "bg-[#FFF9E8] text-[#B48319]",
  pending: "bg-[#EEF1F6] text-[#5A6B86]",
  passed: "bg-[#E8FAEE] text-[#14863F]",
  failed: "bg-[#FDECEE] text-[#D7263D]",
};

const CLUB_DETAIL_DESCRIPTION_PLACEHOLDER =
  "예: 코딩 스터디, 프로젝트, 세미나 등을 통해 함께 성장하는 학술 동아리입니다.";

export function AdminPage() {
  useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("club-register");

  // Club state
  const [presidentClub, setPresidentClub] = useState<Club | null>(null);
  const [isClubLoading, setIsClubLoading] = useState(true);
  const [clubName, setClubName] = useState("");
  const [clubType, setClubType] = useState<"central" | "department" | "">("");
  const [clubDivision, setClubDivision] = useState("");
  const [divisionOpen, setDivisionOpen] = useState(false);
  const [questionTypeOpen, setQuestionTypeOpen] = useState(false);
  const [recruitmentTarget, setRecruitmentTarget] = useState("");
  const [isRecruiting, setIsRecruiting] = useState(false);
  const [recruitStart, setRecruitStart] = useState("");
  const [recruitEnd, setRecruitEnd] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isTagInputVisible, setIsTagInputVisible] = useState(false);
  const [isSavingClub, setIsSavingClub] = useState(false);

  // Image state
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverLocalPreview, setCoverLocalPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [activityPhotos, setActivityPhotos] = useState<string[]>([]);
  const [isUploadingActivity, setIsUploadingActivity] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const activityInputRef = useRef<HTMLInputElement>(null);
  const replacingPhotoIdxRef = useRef<number | null>(null);

  // Application form state
  const [formId, setFormId] = useState<string | null>(null);
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>([]);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("단답형");
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);
  const [isSavingForm, setIsSavingForm] = useState(false);

  // Applications state
  const [applications, setApplications] = useState<AdminApplicationListItem[]>([]);
  const [isAppsLoading, setIsAppsLoading] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<AdminApplicationDetail | null>(null);
  const [isAppDetailOpen, setIsAppDetailOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Page/description state
  const [clubDetailDescription, setClubDetailDescription] = useState("");
  const [isSavingPage, setIsSavingPage] = useState(false);

  // Community state
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [isWritePostOpen, setIsWritePostOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Load president's club on mount
  useEffect(() => {
    const loadClub = async () => {
      setIsClubLoading(true);
      try {
        const myClubs = await api.getMyClubs();
        const presidentEntry = myClubs.find(c => c.role === "president");
        if (presidentEntry) {
          const club = await api.getClub(presidentEntry.club_id);
          setPresidentClub(club);
          setClubName(club.name);
          setClubType((club.club_type as "central" | "department" | "") || "");
          setClubDivision(club.division || "");
          setRecruitmentTarget(club.activity_purpose || "");
          setTags(club.tags.map((t) => t.tag_value || t.tag_key));
          setClubDetailDescription(club.description || "");
          setCoverImageUrl(club.image_url || null);
          setCoverLocalPreview(club.image_url || null);
          setActivityPhotos(club.activity_images || []);
          setIsRecruiting(club.is_recruiting);
          setRecruitStart(club.recruit_start || "");
          setRecruitEnd(club.recruit_end || "");
        } else {
          setPresidentClub(null);
        }
      } catch {
        setPresidentClub(null);
      } finally {
        setIsClubLoading(false);
      }
    };
    loadClub();
  }, []);

  // Load form when switching to application-form tab
  const loadForm = useCallback(async (clubId: string) => {
    setIsFormLoading(true);
    try {
      const form = await api.getClubForm(clubId);
      setFormId(form.id);
      setFormQuestions(form.questions);
    } catch {
      setFormId(null);
      setFormQuestions([]);
    } finally {
      setIsFormLoading(false);
    }
  }, []);

  // Load applications when switching to submitted-applications tab
  const loadApplications = useCallback(async (clubId: string) => {
    setIsAppsLoading(true);
    try {
      const data = await api.getClubApplications(clubId);
      setApplications(data);
    } catch {
      setApplications([]);
    } finally {
      setIsAppsLoading(false);
    }
  }, []);

  // Load posts when switching to community-board tab
  const loadPosts = useCallback(async (clubId: string) => {
    setIsPostsLoading(true);
    try {
      const data = await api.getPosts(clubId);
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setIsPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!presidentClub) return;
    if (activeTab === "application-form") loadForm(presidentClub.id);
    else if (activeTab === "submitted-applications") loadApplications(presidentClub.id);
    else if (activeTab === "community-board") loadPosts(presidentClub.id);
  }, [activeTab, presidentClub, loadForm, loadApplications, loadPosts]);

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCoverLocalPreview(URL.createObjectURL(file));
    setIsUploadingCover(true);
    try {
      const { image_url } = await api.uploadClubImage(file);
      setCoverImageUrl(image_url);
      setCoverLocalPreview(image_url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.");
      setCoverLocalPreview(coverImageUrl);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleActivityFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const localUrl = URL.createObjectURL(file);
    const idx = replacingPhotoIdxRef.current;
    if (idx !== null) {
      setActivityPhotos((prev) => prev.map((p, i) => (i === idx ? localUrl : p)));
    } else {
      setActivityPhotos((prev) => [...prev, localUrl]);
    }
    setIsUploadingActivity(true);
    try {
      const { image_url } = await api.uploadClubImage(file);
      if (idx !== null) {
        setActivityPhotos((prev) => prev.map((p, i) => (i === idx ? image_url : p)));
      } else {
        setActivityPhotos((prev) => {
          const next = [...prev];
          next[next.length - 1] = image_url;
          return next;
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.");
      if (idx !== null) {
        setActivityPhotos((prev) => prev.filter((_, i) => i !== idx));
      } else {
        setActivityPhotos((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsUploadingActivity(false);
      replacingPhotoIdxRef.current = null;
    }
  };

  const handleSaveClub = async () => {
    if (!clubName.trim()) {
      toast.error("동아리명을 입력해주세요.");
      return;
    }
    setIsSavingClub(true);
    try {
      const tagObjects = tags.map((t) => ({ tag_key: t.replace(/^#/, ""), tag_value: t }));
      if (presidentClub) {
        const updated = await api.updateClub(presidentClub.id, {
          name: clubName.trim(),
          club_type: clubType || undefined,
          division: clubDivision || undefined,
          activity_purpose: recruitmentTarget || undefined,
          tags: tagObjects,
          image_url: coverImageUrl || undefined,
          is_recruiting: isRecruiting,
          recruit_start: recruitStart || undefined,
          recruit_end: recruitEnd || undefined,
        });
        setPresidentClub(updated);
        toast.success("동아리 정보가 저장되었습니다.");
      } else {
        const created = await api.createClub({
          name: clubName.trim(),
          club_type: clubType || undefined,
          division: clubDivision || undefined,
          tags: tagObjects,
        });
        setPresidentClub(created);
        toast.success("동아리가 등록되었습니다.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSavingClub(false);
    }
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    const formatted = t.startsWith("#") ? t : `#${t}`;
    if (tags.length >= 5) {
      toast.error("태그는 최대 5개까지 추가할 수 있습니다.");
      return;
    }
    if (!tags.includes(formatted)) {
      setTags(prev => [...prev, formatted]);
    }
    setTagInput("");
    setIsTagInputVisible(false);
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleCreateForm = async () => {
    if (!presidentClub) return;
    setIsSavingForm(true);
    try {
      const form = await api.createClubForm(presidentClub.id, `${presidentClub.name} 신청폼`);
      setFormId(form.id);
      setFormQuestions(form.questions);
      toast.success("신청폼이 생성되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "폼 생성에 실패했습니다.");
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!presidentClub || !newQuestionText.trim()) {
      toast.error("문항 내용을 입력해주세요.");
      return;
    }
    if (!formId) {
      toast.error("먼저 신청폼을 생성해주세요.");
      return;
    }
    setIsSavingForm(true);
    try {
      const q = await api.addFormQuestion(presidentClub.id, {
        question_text: newQuestionText.trim(),
        question_type: newQuestionType,
        is_required: newQuestionRequired,
      });
      setFormQuestions(prev => [...prev, q]);
      setNewQuestionText("");
      setNewQuestionType("단답형");
      setNewQuestionRequired(true);
      setIsAddQuestionOpen(false);
      toast.success("문항이 추가되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "문항 추가에 실패했습니다.");
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!presidentClub) return;
    try {
      await api.deleteFormQuestion(presidentClub.id, questionId);
      setFormQuestions(prev => prev.filter(q => q.id !== questionId));
      toast.success("문항이 삭제되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "문항 삭제에 실패했습니다.");
    }
  };

  const handleToggleRequired = async (questionId: string, currentValue: boolean) => {
    if (!presidentClub) return;
    try {
      const updated = await api.updateFormQuestion(presidentClub.id, questionId, {
        is_required: !currentValue,
      });
      setFormQuestions(prev => prev.map(q => q.id === questionId ? updated : q));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "수정에 실패했습니다.");
    }
  };

  const handleStatusUpdate = async (appId: string, status: "pending" | "passed" | "failed") => {
    if (!presidentClub) return;
    setUpdatingStatusId(appId);
    try {
      const updated = await api.updateApplicationStatus(presidentClub.id, appId, status);
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: updated.status } : a)));
      if (selectedApp?.id === appId) {
        setSelectedApp((prev) => prev ? { ...prev, status: updated.status } : prev);
      }
      toast.success(`상태가 "${STATUS_LABEL[status]}"(으)로 변경되었습니다.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "상태 변경에 실패했습니다.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleViewApplication = async (appId: string) => {
    if (!presidentClub) return;
    try {
      const detail = await api.getClubApplication(presidentClub.id, appId);
      setSelectedApp(detail);
      setIsAppDetailOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "지원서를 불러오는데 실패했습니다.");
    }
  };

  const handleSavePage = async () => {
    if (!presidentClub) return;
    setIsSavingPage(true);
    try {
      const updated = await api.updateClub(presidentClub.id, {
        description: clubDetailDescription,
        activity_images: activityPhotos,
      });
      setPresidentClub(updated);
      toast.success("페이지 설정이 저장되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSavingPage(false);
    }
  };

  const handleCreatePost = async () => {
    if (!presidentClub || !newPostTitle.trim() || !newPostContent.trim()) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }
    setIsSubmittingPost(true);
    try {
      await api.createPost(presidentClub.id, {
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
      });
      toast.success("게시글이 등록되었습니다.");
      setIsWritePostOpen(false);
      setNewPostTitle("");
      setNewPostContent("");
      loadPosts(presidentClub.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "게시글 등록에 실패했습니다.");
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId: number | string) => {
    if (!presidentClub) return;
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    try {
      await api.deletePost(presidentClub.id, postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success("게시글이 삭제되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    }
  };

  const handleToggleNotice = async (postId: number | string) => {
    if (!presidentClub) return;
    try {
      const updated = await api.toggleNotice(presidentClub.id, postId);
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "공지 설정에 실패했습니다.");
    }
  };

  const filteredApplications = applications.filter(app => {
    const q = appSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      app.user_name?.toLowerCase().includes(q) ||
      String(app.user_student_id).includes(q)
    );
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(/\.$/, "");
    } catch {
      return dateStr;
    }
  };

  const renderMainContent = () => {
    if (isClubLoading) {
      return (
        <Card className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex items-center justify-center">
          <div className="text-muted-foreground">로딩 중...</div>
        </Card>
      );
    }

    if (activeTab === "club-register") {
      return (
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-2xl align-bottom font-bold text-foreground">
            동아리 정보
          </h2>
          <div className="mt-0 border-t border-slate-200 pt-5">
            {/* Row 1: 동아리명 + 분과 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  동아리명 <span className="text-red-500">*</span>
                </h3>
                <Input
                  placeholder="예: CPR"
                  className="mt-3 h-10 bg-white"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">분과</h3>
                <Popover open={divisionOpen} onOpenChange={setDivisionOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={divisionOpen}
                      className={cn(
                        "mt-3 h-10 w-full justify-between bg-white font-normal",
                        !clubDivision && "text-muted-foreground",
                      )}
                    >
                      {clubDivision || "기타"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-1" align="start">
                    {CLUB_DIVISION_KEYS.map((division) => (
                      <button
                        key={division}
                        type="button"
                        onClick={() => {
                          setClubDivision(division);
                          setDivisionOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          clubDivision === division && "bg-accent text-accent-foreground font-medium",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            clubDivision === division ? "opacity-100 text-primary" : "opacity-0",
                          )}
                        />
                        {division}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Row 2: 동아리 구분 + 모집 기간 */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">동아리 구분</h3>
                <div className="mt-3 flex gap-3">
                  {(["central", "department"] as const).map((type) => {
                    const label = type === "central" ? "중앙동아리" : "학과동아리";
                    const selected = clubType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setClubType(type)}
                        className={cn(
                          "flex h-10 flex-1 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
                          selected
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors",
                            selected ? "border-primary" : "border-muted-foreground/50",
                          )}
                        >
                          {selected && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">모집 기간</h3>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setIsRecruiting(v => !v)}
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
                        isRecruiting ? "bg-primary" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                          isRecruiting ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </div>
                    <span className="text-sm text-slate-600">
                      {isRecruiting ? "모집 중" : "마감"}
                    </span>
                  </label>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="date"
                    value={recruitStart}
                    onChange={(e) => setRecruitStart(e.target.value)}
                    className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary min-w-0"
                  />
                  <span className="text-slate-400 shrink-0">~</span>
                  <input
                    type="date"
                    value={recruitEnd}
                    onChange={(e) => setRecruitEnd(e.target.value)}
                    className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary min-w-0"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-base font-bold text-slate-800">
                대표 이미지{" "}
                <span className="text-sm font-medium text-slate-400">(권장: 1920×1080px · jpg/png/webp/gif · 최대 5MB)</span>
              </h3>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleCoverFileChange}
              />
              <button
                type="button"
                disabled={isUploadingCover}
                onClick={() => coverInputRef.current?.click()}
                className="relative mt-3 flex h-44 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-60"
              >
                {coverLocalPreview ? (
                  <>
                    <img
                      src={coverLocalPreview}
                      alt="대표 이미지 미리보기"
                      className="absolute inset-0 h-full w-full object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                      {isUploadingCover ? (
                        <Loader2 className="size-6 animate-spin text-white" />
                      ) : (
                        <>
                          <ImageIcon className="mb-1 size-6 text-white" />
                          <span className="text-xs font-medium text-white">클릭하여 변경</span>
                        </>
                      )}
                    </div>
                  </>
                ) : isUploadingCover ? (
                  <Loader2 className="size-8 animate-spin text-slate-400" />
                ) : (
                  <>
                    <ImageIcon className="mb-2 size-8 text-slate-400" />
                    <span className="text-sm font-medium">클릭하여 이미지 업로드</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-5">
              <h3 className="text-base font-bold text-slate-800">
                모집 대상 및 자격 요건 <span className="text-red-500">*</span>
              </h3>
              <Textarea
                placeholder="지원 가능한 대상과 자격 요건을 입력해주세요."
                className="mt-3 min-h-[84px] resize-none bg-white"
                value={recruitmentTarget}
                onChange={(e) => setRecruitmentTarget(e.target.value)}
              />
            </div>

            <section className="mt-5">
              <h3 className="text-base font-bold text-slate-800">
                태그 설정 <span className="text-sm font-medium text-slate-400">(최대 5개)</span>
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-[#EAF1FC] px-3 py-1.5 text-sm font-semibold text-[#1B4A8F]"
                  >
                    {tag}
                    <button
                      type="button"
                      className="inline-flex size-4 items-center justify-center rounded-full bg-[#D9E6FB] text-[#1B4A8F]"
                      aria-label={`${tag} 삭제`}
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {isTagInputVisible ? (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }
                        if (e.key === "Escape") { setIsTagInputVisible(false); setTagInput(""); }
                      }}
                      placeholder="#태그"
                      className="h-8 w-24 rounded-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-white"
                    >
                      추가
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                    onClick={() => setIsTagInputVisible(true)}
                  >
                    <Plus className="size-3.5" />
                    태그 추가
                  </button>
                )}
              </div>
            </section>

            <div className="mt-8 flex justify-end">
              <Button
                className="h-10 w-full rounded-lg px-5 sm:w-auto"
                onClick={handleSaveClub}
                disabled={isSavingClub}
              >
                <Save className="mr-1 size-4" />
                {isSavingClub ? "저장 중..." : presidentClub ? "저장" : "동아리 등록"}
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    if (activeTab === "application-form") {
      if (!presidentClub) {
        return (
          <Card className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <p className="text-muted-foreground">먼저 동아리를 등록해주세요.</p>
          </Card>
        );
      }
      return (
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl align-bottom font-bold text-foreground">
              신청폼 설정
            </h2>
            {formId ? (
              <Button
                className="h-9 w-full rounded-lg bg-slate-900 px-4 text-white hover:bg-slate-800 sm:w-auto"
                onClick={() => setIsAddQuestionOpen(true)}
              >
                <CirclePlus className="mr-1 size-4" />새 문항 추가
              </Button>
            ) : (
              <Button
                className="h-9 w-full rounded-lg bg-slate-900 px-4 text-white hover:bg-slate-800 sm:w-auto"
                onClick={handleCreateForm}
                disabled={isSavingForm}
              >
                {isSavingForm ? "생성 중..." : "신청폼 생성"}
              </Button>
            )}
          </div>

          <div className="mt-0 border-t border-slate-200 pt-5">
            {isFormLoading ? (
              <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
            ) : formQuestions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                {formId ? "등록된 문항이 없습니다. 새 문항을 추가해주세요." : "신청폼을 먼저 생성해주세요."}
              </div>
            ) : (
              <ul className="space-y-4">
                {formQuestions.map((question, index) => (
                  <li
                    key={question.id}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex items-center gap-3">
                        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                          {index + 1}
                        </span>
                        <p className="text-sm font-semibold text-foreground">
                          {question.question_text}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-1 sm:justify-end shrink-0">
                        <span className="inline-flex rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                          {question.question_type}
                        </span>
                        <label className="inline-flex cursor-pointer items-center gap-2 align-bottom text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            className="size-4 rounded border-slate-300"
                            checked={question.is_required}
                            onChange={() => handleToggleRequired(question.id, question.is_required)}
                          />
                          필수 응답
                        </label>
                        <button
                          type="button"
                          className="text-slate-400 transition-colors hover:text-slate-600"
                          aria-label="문항 삭제"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {formId && (
              <div className="mt-8 flex justify-end">
                <Button className="h-10 w-full rounded-lg px-5 sm:w-auto">
                  <Save className="mr-1 size-4" />
                  변경사항 저장
                </Button>
              </div>
            )}
          </div>
        </Card>
      );
    }

    if (activeTab === "submitted-applications") {
      if (!presidentClub) {
        return (
          <Card className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <p className="text-muted-foreground">먼저 동아리를 등록해주세요.</p>
          </Card>
        );
      }
      return (
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl align-bottom font-bold text-foreground">
                신청서 관리
              </h2>
              <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-lg font-extrabold text-[#1F4F95]">
                총 {filteredApplications.length}명
              </span>
              <span className="text-sm text-slate-400">{presidentClub.name}</span>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
              <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 sm:flex-1 xl:w-[280px] xl:flex-none">
                <Search className="size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="이름, 학번 검색"
                  className="h-full w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => loadApplications(presidentClub.id)}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 sm:w-11"
                aria-label="새로고침"
              >
                <SlidersHorizontal className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            {isAppsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-6 animate-spin text-slate-400" />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                {appSearchQuery ? "검색 결과가 없습니다." : "제출된 신청서가 없습니다."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[560px] w-full table-fixed">
                  <thead className="bg-[#F8FAFD]">
                    <tr className="h-12 text-left text-sm font-semibold text-slate-500">
                      <th className="w-[56px] px-4">NO.</th>
                      <th className="w-[180px] px-4">이름 / 학번</th>
                      <th className="w-[130px] px-4">지원일시</th>
                      <th className="w-[140px] px-4">상태</th>
                      <th className="w-[100px] px-4 text-center">상세보기</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredApplications.map((applicant, idx) => (
                      <tr
                        key={applicant.id}
                        className="h-[72px] border-t border-slate-100 text-sm text-slate-700 first:border-t-0"
                      >
                        <td className="px-4 text-sm font-semibold text-slate-600">{idx + 1}</td>
                        <td className="px-4">
                          <div className="text-sm font-bold leading-tight text-slate-900">
                            {applicant.user_name}
                          </div>
                          <div className="mt-1 text-xs font-medium text-slate-500">
                            {applicant.user_student_id}
                          </div>
                        </td>
                        <td className="px-4 text-sm font-semibold text-slate-500">
                          {formatDate(applicant.submitted_at || "")}
                        </td>
                        <td className="px-4">
                          {applicant.status === "passed" || applicant.status === "failed" ? (
                            <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold", STATUS_CLASS[applicant.status])}>
                              {STATUS_LABEL[applicant.status]}
                            </span>
                          ) : (
                            <div className="relative inline-flex">
                              <select
                                value={applicant.status}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val !== "submitted") {
                                    handleStatusUpdate(applicant.id, val as "pending" | "passed" | "failed");
                                  }
                                }}
                                disabled={updatingStatusId === applicant.id}
                                aria-label={`${applicant.user_name} 상태 변경`}
                                className={cn(
                                  "h-7 cursor-pointer appearance-none rounded-full border-transparent pl-3 pr-7 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60",
                                  STATUS_SELECT_CLASS[applicant.status] ?? "bg-slate-100 text-slate-600",
                                )}
                              >
                                <option value="submitted">{STATUS_LABEL.submitted}</option>
                                <option value="pending">{STATUS_LABEL.pending}</option>
                                <option value="passed">{STATUS_LABEL.passed}</option>
                                <option value="failed">{STATUS_LABEL.failed}</option>
                              </select>
                              {updatingStatusId === applicant.id ? (
                                <Loader2 className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin" />
                              ) : (
                                <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2" aria-hidden />
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 text-center">
                          <button
                            type="button"
                            className="inline-flex h-9 w-full items-center justify-center whitespace-nowrap rounded-lg bg-[#EDF3FF] px-3 text-sm font-semibold text-[#2B63B4] transition-colors hover:bg-[#E2EDFF]"
                            onClick={() => handleViewApplication(applicant.id)}
                          >
                            보기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      );
    }

    if (activeTab === "page-tags") {
      if (!presidentClub) {
        return (
          <Card className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <p className="text-muted-foreground">먼저 동아리를 등록해주세요.</p>
          </Card>
        );
      }
      return (
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-2xl align-bottom font-bold text-foreground">
            상세페이지 설정
          </h2>

          <div className="mt-0 border-t border-slate-200 pt-6">
            <section>
              <h3 className="text-base font-bold text-slate-800">
                동아리 상세 설명
              </h3>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <div className="flex h-11 items-center gap-1 border-b border-slate-200 bg-[#F8FAFD] px-3">
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-200"
                    aria-label="굵게"
                  >
                    <Bold className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-200"
                    aria-label="기울임"
                  >
                    <Italic className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-200"
                    aria-label="밑줄"
                  >
                    <Underline className="size-4" />
                  </button>
                  <div className="mx-1 h-4 w-px bg-slate-300" />
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-200"
                    aria-label="이미지 삽입"
                  >
                    <ImagePlus className="size-4" />
                  </button>
                </div>
                <Textarea
                  id="club-detail-description"
                  value={clubDetailDescription}
                  onChange={(e) => setClubDetailDescription(e.target.value)}
                  placeholder={CLUB_DETAIL_DESCRIPTION_PLACEHOLDER}
                  className="min-h-[170px] w-full resize-y rounded-none border-0 bg-white p-4 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label="동아리 상세 설명"
                />
              </div>
            </section>

            <section className="mt-6">
              <h3 className="text-base font-bold text-slate-800">
                활동 사진 추가
                <span className="ml-2 text-sm font-medium text-slate-400">(최대 5장)</span>
              </h3>
              <input
                ref={activityInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleActivityFileChange}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {activityPhotos.map((url, idx) => (
                  <div
                    key={idx}
                    className="group relative h-[96px] w-[96px] overflow-hidden rounded-xl border border-slate-200 sm:h-[116px] sm:w-[116px]"
                  >
                    <img src={url} alt={`활동 사진 ${idx + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          replacingPhotoIdxRef.current = idx;
                          activityInputRef.current?.click();
                        }}
                        className="inline-flex size-8 items-center justify-center rounded-full bg-white/80 text-slate-700 hover:bg-white"
                        aria-label="사진 교체"
                      >
                        <ImageIcon className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="inline-flex size-8 items-center justify-center rounded-full bg-white/80 text-destructive hover:bg-white"
                        aria-label="사진 삭제"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {activityPhotos.length < 5 && (
                  <button
                    type="button"
                    disabled={isUploadingActivity}
                    onClick={() => {
                      replacingPhotoIdxRef.current = null;
                      activityInputRef.current?.click();
                    }}
                    className="flex h-[96px] w-[96px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-60 sm:h-[116px] sm:w-[116px]"
                  >
                    {isUploadingActivity ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <>
                        <div className="inline-flex size-8 items-center justify-center rounded-full border border-slate-300">
                          <Plus className="size-4" />
                        </div>
                        <span className="mt-2 text-sm font-semibold">사진 추가</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>

            <div className="mt-8 flex justify-end">
              <Button
                className="h-10 w-full rounded-lg bg-[#0A5CB5] px-6 text-white hover:bg-[#0A4F9D] sm:w-auto"
                onClick={handleSavePage}
                disabled={isSavingPage}
              >
                <Save className="mr-1.5 size-4" />
                {isSavingPage ? "저장 중..." : "페이지 설정 저장"}
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    if (activeTab === "community-board") {
      if (!presidentClub) {
        return (
          <Card className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <p className="text-muted-foreground">먼저 동아리를 등록해주세요.</p>
          </Card>
        );
      }
      return (
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl align-bottom font-bold text-foreground">
              게시판 관리
            </h2>
            <Button
              className="h-11 w-full rounded-xl bg-[#0F1B33] px-5 text-sm font-semibold text-white hover:bg-[#111f3b] sm:w-auto"
              onClick={() => {
                setNewPostTitle("");
                setNewPostContent("");
                setIsWritePostOpen(true);
              }}
            >
              <SquarePen className="mr-2 size-4" />
              게시글 작성
            </Button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full table-fixed">
              <thead className="bg-[#F8FAFD]">
                <tr className="h-12 border-b border-slate-200 text-left text-sm font-semibold text-slate-500">
                  <th className="w-[72px] px-4">선택</th>
                  <th className="px-4">제목</th>
                  <th className="w-[96px] px-4">작성자</th>
                  <th className="w-[108px] px-4">작성일</th>
                  <th className="w-[72px] px-4">댓글</th>
                  <th className="w-[88px] px-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {isPostsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">로딩 중...</td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">게시글이 없습니다.</td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr
                      key={post.id}
                      className="h-[56px] border-t border-slate-100 text-sm font-medium text-slate-700 first:border-t-0"
                    >
                      <td className="px-4">
                        <input
                          type="checkbox"
                          className="size-5 rounded border-slate-300 align-middle"
                          aria-label={`${post.title} 선택`}
                        />
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          {post.is_notice ? (
                            <Badge className="px-2 py-0.5 text-[11px] font-semibold">공지</Badge>
                          ) : null}
                          <span className="truncate text-[15px] font-semibold text-slate-800">
                            {post.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 text-sm text-slate-600">{post.author_name}</td>
                      <td className="px-4 text-sm text-slate-500">{formatDate(post.created_at)}</td>
                      <td className="px-4 text-sm text-slate-500">{post.comment_count ?? 0}</td>
                      <td className="px-4">
                        <div className="flex items-center justify-center gap-3 text-slate-400">
                          <button
                            type="button"
                            className="transition-colors hover:text-slate-600"
                            aria-label={`${post.title} 공지 토글`}
                            onClick={() => handleToggleNotice(post.id)}
                            title={post.is_notice ? "공지 해제" : "공지로 등록"}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="transition-colors hover:text-destructive"
                            aria-label={`${post.title} 삭제`}
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-3 py-3">
              <button
                type="button"
                className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                선택 삭제
              </button>
              <button
                type="button"
                className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                공지로 등록
              </button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-2xl align-bottom font-bold text-foreground">준비 중인 메뉴</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          현재 탭은 다음 화면에서 구현 예정입니다.
        </p>
      </Card>
    );
  };

  return (
    <>
      <section className="w-full rounded-xl border border-border bg-[#F6F8FB]">
        <div className="flex min-h-[760px] flex-col lg:flex-row">
          <aside className="w-full shrink-0 border-b border-border bg-[#F3F5F8] lg:w-[248px] lg:border-r lg:border-b-0">
            <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5">
              <div className="text-2xl font-extrabold tracking-tight text-[#1B4A8F]">
                Dream Lounge
              </div>
              <div className="mt-1 text-xs font-semibold tracking-[0.2em] text-slate-400">
                ADMINISTRATOR
              </div>
            </div>

            <nav className="space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-5" aria-label="관리자 메뉴">
              {ADMIN_MENU.map((group) => (
                <div key={group.section}>
                  <p className="mb-2 px-2 text-xs font-semibold text-slate-400">
                    {group.section}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.tab;
                      return (
                        <li key={item.label}>
                          <button
                            type="button"
                            onClick={() => setActiveTab(item.tab)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                              isActive
                                ? "border-r-2 border-primary bg-[#EAF1FC] text-primary"
                                : "text-slate-600 hover:bg-slate-100",
                            )}
                          >
                            <Icon className="size-4" />
                            <span>{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 bg-[#F6F8FB]">
            <div className="p-3 sm:p-5 lg:p-8">{renderMainContent()}</div>
          </div>
        </div>
      </section>

      {/* 새 문항 추가 Dialog */}
      <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 문항 추가</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700">문항 내용</label>
              <Input
                className="mt-1"
                placeholder="질문을 입력해주세요"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">유형</label>
              <Popover open={questionTypeOpen} onOpenChange={setQuestionTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={questionTypeOpen}
                    className="mt-1 h-10 w-full justify-between bg-white font-normal"
                  >
                    {newQuestionType}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-1" align="start">
                  {["단답형", "장문형", "객관식 (단일선택)"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setNewQuestionType(type);
                        setQuestionTypeOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        newQuestionType === type && "bg-accent text-accent-foreground font-medium",
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          newQuestionType === type ? "opacity-100 text-primary" : "opacity-0",
                        )}
                      />
                      {type}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="size-4 rounded border-slate-300"
                checked={newQuestionRequired}
                onChange={(e) => setNewQuestionRequired(e.target.checked)}
              />
              필수 응답
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddQuestionOpen(false)} disabled={isSavingForm}>
              취소
            </Button>
            <Button onClick={handleAddQuestion} disabled={isSavingForm}>
              {isSavingForm ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 지원서 상세 Dialog */}
      <Dialog open={isAppDetailOpen} onOpenChange={setIsAppDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>지원서 상세</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">{selectedApp.user_name}</span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      STATUS_CLASS[selectedApp.status] ?? "bg-slate-100 text-slate-500",
                    )}
                  >
                    {STATUS_LABEL[selectedApp.status] ?? selectedApp.status}
                  </span>
                </div>
                <span className="text-sm text-slate-500">학번: {selectedApp.user_student_id}</span>
                <span className="text-sm text-slate-500">지원일: {formatDate(selectedApp.submitted_at)}</span>
              </div>

              <div className="flex flex-col gap-4">
                {selectedApp.answers?.map((a, i) => (
                  <div key={a.question_id ?? i} className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-slate-700">Q{i + 1}.</p>
                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 whitespace-pre-wrap">
                      {a.answer_text || <span className="text-slate-400">답변 없음</span>}
                    </div>
                  </div>
                ))}
              </div>

              {selectedApp.status !== "passed" && selectedApp.status !== "failed" && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-slate-600">심사 결과 변경</p>
                  <div className="flex gap-2">
                    {(["pending", "passed", "failed"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={updatingStatusId === selectedApp.id || selectedApp.status === s}
                        onClick={() => handleStatusUpdate(selectedApp.id, s)}
                        className={cn(
                          "flex-1 h-9 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50",
                          s === "passed"
                            ? "bg-[#E8FAEE] text-[#14863F] hover:bg-[#d0f5dc]"
                            : s === "failed"
                              ? "bg-[#FDECEE] text-[#D7263D] hover:bg-[#fbd9dc]"
                              : "bg-[#FFF0E8] text-[#B45B19] hover:bg-[#fde1cc]",
                        )}
                      >
                        {updatingStatusId === selectedApp.id ? (
                          <Loader2 className="size-4 animate-spin mx-auto" />
                        ) : (
                          STATUS_LABEL[s]
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 게시글 작성 Dialog */}
      <Dialog open={isWritePostOpen} onOpenChange={setIsWritePostOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>게시글 작성</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input
              placeholder="제목을 입력해주세요"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
            />
            <Textarea
              placeholder="내용을 입력해주세요"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[160px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWritePostOpen(false)} disabled={isSubmittingPost}>
              취소
            </Button>
            <Button onClick={handleCreatePost} disabled={isSubmittingPost}>
              {isSubmittingPost ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
