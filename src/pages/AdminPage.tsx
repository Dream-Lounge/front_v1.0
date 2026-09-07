import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  PlusCircle,
  Settings,
  FileText,
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
  ChevronDown,
  Eye,
  Info,
  Mail,
  Phone,
  Link2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  api,
  ApiRequestError,
  type AdminApplicationDetail,
  type ClubContactLink,
  type ClubContactLinkType,
  type PostListItem,
} from "@/lib/api";
import { toastApiError } from "@/lib/api-error";

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
];

const QUESTION_TYPES = [
  "단답형",
  "장문형",
  "객관식",
  "체크박스",
] as const;
type QuestionType = (typeof QUESTION_TYPES)[number];

const BUILT_IN_APPLICANT_FIELDS = ["학번", "이름", "학과", "전화번호", "학년"] as const;

const QUESTION_TYPE_TO_API: Record<QuestionType, string> = {
  단답형: "text",
  장문형: "textarea",
  객관식: "choice",
  체크박스: "multiselect",
};

function questionTypeFromApi(type: string): QuestionType {
  if (type === "textarea") return "장문형";
  if (type === "choice") return "객관식";
  if (type === "multiselect") return "체크박스";
  return "단답형";
}

/** 선택지를 입력받아야 하는 유형 */
function hasOptions(type: QuestionType) {
  return type === "객관식" || type === "체크박스";
}

interface ApplicationQuestion {
  id: string;
  title: string;
  type: QuestionType;
  required: boolean;
  /** 객관식일 때 보여줄 선택지 */
  options?: string[];
}

const APPLICATION_STATUSES = ["검토중", "합격", "불합격", "보류"] as const;
type ApplicationStatusValue = (typeof APPLICATION_STATUSES)[number];

function statusFromApi(status: string): ApplicationStatusValue {
  if (status === "passed") return "합격";
  if (status === "failed") return "불합격";
  if (status === "pending") return "보류";
  return "검토중";
}

function statusToApi(status: ApplicationStatusValue): "pending" | "passed" | "failed" | null {
  if (status === "합격") return "passed";
  if (status === "불합격") return "failed";
  if (status === "보류") return "pending";
  return null;
}

interface SubmittedApplication {
  id: string;
  name: string;
  studentId: string;
  major: string;
  submittedAt: string;
  status: ApplicationStatusValue;
}

const STATUS_SELECT_CLASS: Record<ApplicationStatusValue, string> = {
  합격: "bg-[#E8FAEE] text-[#14863F]",
  불합격: "bg-[#FDECEE] text-[#D7263D]",
  보류: "bg-[#EEF1F6] text-[#5A6B86]",
  검토중: "bg-[#FFF9E8] text-[#B48319]",
};

const APPLICANTS_PER_PAGE = 8;

const CLUB_DETAIL_DESCRIPTION_PLACEHOLDER =
  "예: 코딩 스터디, 프로젝트, 세미나 등을 통해 함께 성장하는 학술 동아리입니다.";

type EditableContactLink = ClubContactLink & { id: number };

function detectContactType(value: string): ClubContactLinkType {
  const trimmed = value.trim();
  if (/^mailto:/i.test(trimmed) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "email";
  if (/^tel:/i.test(trimmed)) return "phone";
  if (/^\+?[\d\s().-]+$/.test(trimmed) && trimmed.replace(/\D/g, "").length >= 7) return "phone";
  return "url";
}

function normalizeContactValue(value: string, type = detectContactType(value)): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (type === "email") return trimmed.replace(/^mailto:/i, "");
  if (type === "phone") return trimmed.replace(/^tel:/i, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function defaultContactLabel(type: ClubContactLinkType): string {
  if (type === "email") return "이메일";
  if (type === "phone") return "전화번호";
  return "SNS 링크";
}

function contactHref(link: ClubContactLink): string {
  if (link.type === "email") return `mailto:${link.value}`;
  if (link.type === "phone") return `tel:${link.value.replace(/[^\d+]/g, "")}`;
  return normalizeContactValue(link.value, "url");
}

export function AdminPage() {
  const { managedClubs } = useAuth();
  const [selectedClubId, setSelectedClubId] = useState(managedClubs[0]?.club_id ?? "");
  const [activeTab, setActiveTab] = useState<AdminTab>("club-register");
  const [clubName, setClubName] = useState("");
  const [clubCategory, setClubCategory] = useState("");
  const [clubTagline, setClubTagline] = useState("");
  const [clubDetailDescription, setClubDetailDescription] = useState("");
  const [newContactValue, setNewContactValue] = useState("");
  const [clubImageUrl, setClubImageUrl] = useState("");
  const [clubIsRecruiting, setClubIsRecruiting] = useState(false);
  const [formExists, setFormExists] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const activityInputRef = useRef<HTMLInputElement>(null);

  /** 연락처·SNS 링크 (유형 + 라벨 + 값) */
  const [contactLinks, setContactLinks] = useState<EditableContactLink[]>([]);

  const addContactLink = () => {
    const rawValue = newContactValue.trim();
    if (!rawValue) {
      toast.error("추가할 연락처 또는 링크를 입력해주세요.");
      return;
    }
    if (contactLinks.length >= 10) {
      toast.error("연락처와 SNS 링크는 최대 10개까지 추가할 수 있습니다.");
      return;
    }
    const type = detectContactType(rawValue);
    setContactLinks((prev) => [
      ...prev,
      {
        id: prev.reduce((max, link) => Math.max(max, link.id), 0) + 1,
        type,
        label: defaultContactLabel(type),
        value: normalizeContactValue(rawValue, type),
      },
    ]);
    setNewContactValue("");
  };

  const updateContactLink = (
    id: number,
    field: "label" | "value",
    value: string,
  ) => {
    setContactLinks((prev) =>
      prev.map((link) =>
        link.id === id
          ? { ...link, [field]: value, ...(field === "value" ? { type: detectContactType(value) } : {}) }
          : link,
      ),
    );
  };

  const normalizeContactLink = (id: number) => {
    setContactLinks((prev) =>
      prev.map((link) => {
        if (link.id !== id) return link;
        const type = detectContactType(link.value);
        return { ...link, type, value: normalizeContactValue(link.value, type) };
      }),
    );
  };

  const removeContactLink = (id: number) => {
    setContactLinks((prev) => prev.filter((link) => link.id !== id));
  };

  /** 활동 사진 — 설명은 선택 입력 */
  const [activityPhotos, setActivityPhotos] = useState<
    { id: number; caption: string; url: string }[]
  >([]);

  const updatePhotoCaption = (id: number, caption: string) => {
    setActivityPhotos((prev) =>
      prev.map((photo) => (photo.id === id ? { ...photo, caption } : photo)),
    );
  };

  const removeActivityPhoto = (id: number) => {
    setActivityPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };

  /** 상세페이지 태그 (최대 MAX_TAGS개) */
  const [tags, setTags] = useState<string[]>([]);
  const [applicants, setApplicants] = useState<SubmittedApplication[]>([]);
  const [applicantQuery, setApplicantQuery] = useState("");
  const [applicantPage, setApplicantPage] = useState(1);
  const [applicantTotal, setApplicantTotal] = useState(0);
  const [applicantTotalPages, setApplicantTotalPages] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<AdminApplicationDetail | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [communityPosts, setCommunityPosts] = useState<PostListItem[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");

  /** 신청폼 문항 (필수 여부를 여기서 관리) */
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailPreviewOpen, setIsDetailPreviewOpen] = useState(false);

  /** 새 문항 추가 다이얼로그 */
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<QuestionType>("단답형");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState<string[]>(["", ""]);
  const [addSubmitted, setAddSubmitted] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [draggingQuestionId, setDraggingQuestionId] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pressStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const draggingQuestionIdRef = useRef<string | null>(null);
  const dragStartQuestionsRef = useRef<ApplicationQuestion[]>([]);
  const latestQuestionsRef = useRef<ApplicationQuestion[]>([]);
  const suppressQuestionClickRef = useRef(false);

  const isChoice = hasOptions(newType);
  const filledOptions = newOptions.map((o) => o.trim()).filter(Boolean);
  const titleError = !newTitle.trim();
  const optionsError = isChoice && filledOptions.length < 2;

  useEffect(() => {
    if (!selectedClubId && managedClubs[0]) setSelectedClubId(managedClubs[0].club_id);
  }, [managedClubs, selectedClubId]);

  useEffect(() => {
    if (!selectedClubId) return;
    let active = true;
    const load = async () => {
      try {
        // 동아리 정보 복원은 사용하지 않는 게시판 API의 성공 여부에
        // 의존하지 않아야 한다. 회장 정보는 먼저 독립적으로 불러온다.
        const club = await api.getClub(selectedClubId);
        if (!active) return;
        setClubName(club.name);
        setClubCategory(club.division ?? "");
        setClubTagline(club.tagline ?? "");
        setClubDetailDescription(club.description ?? "");
        setClubImageUrl(club.image_url ?? "");
        setClubIsRecruiting(club.is_recruiting);
        const savedContactLinks = club.contact_links?.length
          ? club.contact_links
          : [
              ...(club.contact_email ? [{ type: "email" as const, label: "이메일", value: club.contact_email }] : []),
              ...(club.contact_phone ? [{ type: "phone" as const, label: "전화번호", value: club.contact_phone }] : []),
              ...(club.open_chat_url ? [{ type: "url" as const, label: "오픈채팅", value: club.open_chat_url }] : []),
            ];
        setContactLinks(savedContactLinks.map((link, index) => ({ ...link, id: index + 1 })));
        setTags(club.tags.map((tag) => `#${tag.tag_value.replace(/^#/, "")}`));
        const savedActivityPhotos = club.activity_image_details?.length
          ? [...club.activity_image_details]
              .sort((a, b) => a.order_index - b.order_index)
              .map((image, index) => ({ id: index + 1, caption: image.caption ?? "", url: image.image_url }))
          : club.activity_images.map((url, index) => ({ id: index + 1, caption: "", url }));
        setActivityPhotos(savedActivityPhotos);
        setCommunityPosts([]);
        setSelectedPostIds([]);
        try {
          const applicationForm = await api.getClubForm(selectedClubId);
          if (!active) return;
          setFormExists(true);
          setQuestions([...applicationForm.questions]
            .sort((a, b) => a.order_index - b.order_index)
            .map((question) => ({
              id: question.id,
              title: question.question_text,
              type: questionTypeFromApi(question.question_type),
              required: question.is_required,
              options: question.options ?? undefined,
            })));
        } catch (error) {
          if (error instanceof ApiRequestError && error.status === 404) {
            setFormExists(false);
            setQuestions([]);
          } else throw error;
        }
      } catch (error) {
        toastApiError(error, "관리자 데이터를 불러오지 못했습니다.");
      }
    };
    void load();
    return () => { active = false; };
  }, [selectedClubId]);

  useEffect(() => {
    if (!selectedClubId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      api.getClubApplications(
        selectedClubId,
        applicantPage,
        APPLICANTS_PER_PAGE,
        applicantQuery,
      ).then((result) => {
        if (!active) return;
        setApplicants(result.items.map((row) => ({
          id: row.id,
          name: row.user_name,
          studentId: row.user_student_id,
          major: row.applicant_department ?? "—",
          submittedAt: row.submitted_at ? new Intl.DateTimeFormat("ko-KR").format(new Date(row.submitted_at)) : "—",
          status: statusFromApi(row.status),
        })));
        setApplicantTotal(result.total);
        setApplicantTotalPages(Math.max(1, result.pages));
      }).catch((error) => {
        if (active) toastApiError(error, "신청서 목록을 불러오지 못했습니다.");
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [applicantPage, applicantQuery, selectedClubId]);

  const safeApplicantPage = Math.min(applicantPage, applicantTotalPages);
  const pagedApplicants = applicants;
  const applicantPageNumbers = useMemo(() => {
    const visibleCount = Math.min(applicantTotalPages, 5);
    const start = Math.max(
      1,
      Math.min(safeApplicantPage - 2, applicantTotalPages - visibleCount + 1),
    );
    return Array.from({ length: visibleCount }, (_, index) => start + index);
  }, [applicantTotalPages, safeApplicantPage]);

  const openAddQuestion = () => {
    setEditingQuestionId(null);
    setNewTitle("");
    setNewType("단답형");
    setNewRequired(false);
    setNewOptions(["", ""]);
    setAddSubmitted(false);
    setIsAddOpen(true);
  };

  const openEditQuestion = (question: ApplicationQuestion) => {
    setEditingQuestionId(question.id);
    setNewTitle(question.title);
    setNewType(question.type);
    setNewRequired(question.required);
    setNewOptions(question.options?.length ? [...question.options] : ["", ""]);
    setAddSubmitted(false);
    setIsAddOpen(true);
  };

  const updateOption = (index: number, value: string) => {
    setNewOptions((prev) =>
      prev.map((option, i) => (i === index ? value : option)),
    );
  };

  const addOption = () => setNewOptions((prev) => [...prev, ""]);

  const removeOption = (index: number) => {
    setNewOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const submitQuestion = async () => {
    setAddSubmitted(true);
    if (titleError || optionsError || !selectedClubId) return;
    try {
      if (editingQuestionId) {
        const updated = await api.updateFormQuestion(selectedClubId, editingQuestionId, {
          question_text: newTitle.trim(),
          question_type: QUESTION_TYPE_TO_API[newType],
          is_required: newRequired,
          options: isChoice ? filledOptions : null,
        });
        setQuestions((prev) => prev.map((question) => question.id === editingQuestionId ? {
          id: updated.id,
          title: updated.question_text,
          type: questionTypeFromApi(updated.question_type),
          required: updated.is_required,
          options: updated.options ?? undefined,
        } : question));
        setIsAddOpen(false);
        toast.success("문항을 수정했습니다.");
        return;
      }
      if (!formExists) {
        await api.createClubForm(selectedClubId, `${clubName || "동아리"} 지원서`);
        setFormExists(true);
      }
      const created = await api.addFormQuestion(selectedClubId, {
        question_text: newTitle.trim(),
        question_type: QUESTION_TYPE_TO_API[newType],
        is_required: newRequired,
        order_index: questions.length,
        options: isChoice ? filledOptions : null,
      });
      setQuestions((prev) => [...prev, {
        id: created.id,
        title: created.question_text,
        type: questionTypeFromApi(created.question_type),
        required: created.is_required,
        options: created.options ?? undefined,
      }]);
      setIsAddOpen(false);
      toast.success("문항을 추가했습니다.");
    } catch (error) {
      toastApiError(error, editingQuestionId ? "문항 수정에 실패했습니다." : "문항 추가에 실패했습니다.");
    }
  };

  const clearQuestionLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleQuestionPointerDown = (event: React.PointerEvent<HTMLLIElement>, questionId: string) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button, input, label, select, textarea")) return;
    clearQuestionLongPress();
    suppressQuestionClickRef.current = false;
    pressStartPointRef.current = { x: event.clientX, y: event.clientY };
    dragStartQuestionsRef.current = questions;
    latestQuestionsRef.current = questions;
    event.currentTarget.setPointerCapture(event.pointerId);
    longPressTimerRef.current = window.setTimeout(() => {
      draggingQuestionIdRef.current = questionId;
      suppressQuestionClickRef.current = true;
      setDraggingQuestionId(questionId);
      longPressTimerRef.current = null;
    }, 300);
  };

  const handleQuestionPointerMove = (event: React.PointerEvent<HTMLLIElement>) => {
    const start = pressStartPointRef.current;
    if (!draggingQuestionIdRef.current) {
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) clearQuestionLongPress();
      return;
    }
    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-question-id]");
    const targetId = target?.dataset.questionId;
    const draggedId = draggingQuestionIdRef.current;
    if (!targetId || targetId === draggedId) return;
    setQuestions((prev) => {
      const fromIndex = prev.findIndex((question) => question.id === draggedId);
      const toIndex = prev.findIndex((question) => question.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      latestQuestionsRef.current = next;
      return next;
    });
  };

  const handleQuestionPointerEnd = async (event: React.PointerEvent<HTMLLIElement>) => {
    clearQuestionLongPress();
    pressStartPointRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!draggingQuestionIdRef.current) return;
    draggingQuestionIdRef.current = null;
    setDraggingQuestionId(null);
    if (!selectedClubId) return;
    try {
      await api.reorderFormQuestions(selectedClubId, latestQuestionsRef.current.map((question) => question.id));
      toast.success("문항 순서를 변경했습니다.");
    } catch (error) {
      setQuestions(dragStartQuestionsRef.current);
      toastApiError(error, "문항 순서 변경에 실패했습니다.");
    }
  };

  const removeQuestion = async (id: string) => {
    if (!selectedClubId) return;
    try {
      await api.deleteFormQuestion(selectedClubId, id);
      setQuestions((prev) => prev.filter((question) => question.id !== id));
      toast.success("문항을 삭제했습니다.");
    } catch (error) {
      toastApiError(error, "문항 삭제에 실패했습니다.");
    }
  };

  const toggleRequired = async (id: string) => {
    if (!selectedClubId) return;
    const question = questions.find((item) => item.id === id);
    if (!question) return;
    try {
      const updated = await api.updateFormQuestion(selectedClubId, id, { is_required: !question.required });
      setQuestions((prev) => prev.map((item) => item.id === id ? { ...item, required: updated.is_required } : item));
    } catch (error) {
      toastApiError(error, "문항 수정에 실패했습니다.");
    }
  };

  /** 상태 변경 확인 다이얼로그 대상 (null이면 닫힘) */
  const [statusEdit, setStatusEdit] = useState<{
    applicant: SubmittedApplication;
    nextStatus: ApplicationStatusValue;
  } | null>(null);

  const openStatusEdit = (
    applicant: SubmittedApplication,
    nextStatus: ApplicationStatusValue,
  ) => {
    setStatusEdit({ applicant, nextStatus });
  };

  const closeStatusEdit = () => {
    setStatusEdit(null);
  };

  const confirmStatusChange = async () => {
    if (!statusEdit) return;
    const { applicant, nextStatus } = statusEdit;
    const apiStatus = statusToApi(nextStatus);
    if (!selectedClubId || !apiStatus) {
      closeStatusEdit();
      return;
    }
    try {
      await api.updateClubApplicationStatus(selectedClubId, applicant.id, apiStatus);
      setApplicants((prev) => prev.map((row) => row.id === applicant.id ? { ...row, status: nextStatus } : row));
      closeStatusEdit();
      toast.success("신청서 상태를 변경했습니다.");
    } catch (error) {
      toastApiError(error, "상태 변경에 실패했습니다.");
    }
  };

  const saveClub = async () => {
    if (!clubName.trim()) {
      toast.error("동아리 이름을 입력해주세요.");
      return;
    }
    const normalizedContactLinks = contactLinks.map(({ label, value }) => ({
      type: detectContactType(value),
      label: label.trim(),
      value: normalizeContactValue(value),
    }));
    if (normalizedContactLinks.some((link) => !link.label || !link.value)) {
      toast.error("연락처와 SNS 링크의 이름과 내용을 모두 입력해주세요.");
      return;
    }
    const firstEmail = normalizedContactLinks.find((link) => link.type === "email")?.value ?? null;
    const firstPhone = normalizedContactLinks.find((link) => link.type === "phone")?.value ?? null;
    const firstUrl = normalizedContactLinks.find((link) => link.type === "url")?.value ?? null;
    try {
      const payload = {
        name: clubName.trim(),
        tagline: clubTagline.trim() || null,
        description: clubDetailDescription.trim() || null,
        division: clubCategory.trim() || null,
        contact_email: firstEmail,
        contact_phone: firstPhone,
        open_chat_url: firstUrl,
        contact_links: normalizedContactLinks,
        image_url: clubImageUrl || null,
        activity_images: activityPhotos.map((photo) => photo.url),
        activity_image_details: activityPhotos.map((photo) => ({
          image_url: photo.url,
          caption: photo.caption.trim() || null,
        })),
        is_recruiting: clubIsRecruiting,
        tags: tags.map((tag) => ({
          tag_key: "custom",
          tag_value: tag.replace(/^#/, "").trim(),
        })).filter((tag) => tag.tag_value),
      };
      const isNewClub = !selectedClubId;
      const updatedClub = isNewClub
        ? await api.createClub(payload)
        : await api.updateClub(selectedClubId, payload);
      if (isNewClub) setSelectedClubId(updatedClub.id);
      setClubImageUrl(updatedClub.image_url ?? "");
      const persistedContactLinks = updatedClub.contact_links?.length
        ? updatedClub.contact_links
        : normalizedContactLinks;
      setContactLinks(persistedContactLinks.map((link, index) => ({ ...link, id: index + 1 })));
      toast.success(isNewClub ? "동아리를 등록했습니다." : "동아리 정보를 저장했습니다.");
    } catch (error) {
      toastApiError(error, "동아리 정보 저장에 실패했습니다.");
    }
  };

  const uploadImage = async (file: File, target: "cover" | "activity") => {
    if (!selectedClubId) {
      toast.error("이미지를 올리기 전에 동아리 기본 정보를 먼저 저장해주세요.");
      return;
    }
    try {
      const url = await api.uploadClubImage(selectedClubId, file);
      if (target === "cover") setClubImageUrl(url);
      else setActivityPhotos((prev) => [...prev, { id: prev.reduce((max, item) => Math.max(max, item.id), 0) + 1, caption: "", url }]);
      toast.success("이미지를 업로드했습니다.");
    } catch (error) {
      toastApiError(error, "이미지 업로드에 실패했습니다.");
    }
  };

  const openApplicationDetail = async (applicationId: string) => {
    if (!selectedClubId) return;
    try {
      const application = await api.getClubApplication(selectedClubId, applicationId);
      setSelectedApplication(application);
      setReviewComment(application.admin_comment ?? "");
    } catch (error) {
      toastApiError(error, "신청서 상세를 불러오지 못했습니다.");
    }
  };

  const saveReviewComment = async () => {
    if (!selectedApplication || !selectedClubId) return;
    try {
      const saved = await api.updateClubApplicationComment(selectedClubId, selectedApplication.id, reviewComment);
      setReviewComment(saved.admin_comment ?? "");
      setSelectedApplication((previous) => previous ? { ...previous, admin_comment: saved.admin_comment } : previous);
      toast.success("관리자 코멘트를 저장했습니다.");
    } catch (error) {
      toastApiError(error, "관리자 코멘트 저장에 실패했습니다.");
    }
  };

  const createCommunityPost = async () => {
    if (!selectedClubId || !postTitle.trim() || !postContent.trim()) return;
    try {
      await api.createClubPost(selectedClubId, postTitle.trim(), postContent.trim());
      setCommunityPosts(await api.getClubPosts(selectedClubId));
      setPostTitle("");
      setPostContent("");
      setIsPostDialogOpen(false);
      toast.success("게시글을 등록했습니다.");
    } catch (error) {
      toastApiError(error, "게시글 등록에 실패했습니다.");
    }
  };

  const deleteCommunityPosts = async (postIds: string[]) => {
    if (!selectedClubId || postIds.length === 0) return;
    try {
      await Promise.all(postIds.map((postId) => api.deleteClubPost(selectedClubId, postId)));
      setCommunityPosts((prev) => prev.filter((post) => !postIds.includes(post.id)));
      setSelectedPostIds([]);
      toast.success("게시글을 삭제했습니다.");
    } catch (error) {
      toastApiError(error, "게시글 삭제에 실패했습니다.");
    }
  };

  const toggleSelectedNotices = async () => {
    if (!selectedClubId || selectedPostIds.length === 0) return;
    try {
      await Promise.all(selectedPostIds.map((postId) => api.toggleClubPostNotice(selectedClubId, postId)));
      setCommunityPosts(await api.getClubPosts(selectedClubId));
      setSelectedPostIds([]);
      toast.success("공지 상태를 변경했습니다.");
    } catch (error) {
      toastApiError(error, "공지 상태 변경에 실패했습니다.");
    }
  };

  const renderMainContent = () => {
    if (activeTab === "club-register") {
      return (
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-2xl align-bottom font-bold text-foreground">
            동아리 정보
          </h2>
          <div className="mt-0 border-t border-slate-200 pt-5">
            <div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  동아리 이름 <span className="text-red-500">*</span>
                </h3>
                <Input
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="예: CPR"
                  className="mt-3 h-10 bg-white"
                />
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-base font-bold text-slate-800">
                대표 포스터 한 장{" "}
                <span className="text-sm font-medium text-slate-400">(권장: 1920×1080px)</span>
              </h3>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="mt-3 flex aspect-[3/4] w-full max-w-[280px] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100"
              >
                {clubImageUrl ? <img src={clubImageUrl} alt="동아리 대표" className="h-full w-full rounded-xl object-cover" /> : <><ImageIcon className="mb-2 size-8 text-slate-400" /><span className="text-sm font-medium">클릭하여 이미지 업로드</span></>}
              </button>
              <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file, "cover"); event.target.value = ""; }} />
            </div>

            <div className="mt-5">
              <h3 className="text-base font-bold text-slate-800">
                동아리 소개글
              </h3>
              <Textarea
                value={clubTagline}
                onChange={(e) => setClubTagline(e.target.value)}
                placeholder="동아리를 소개하는 글을 입력해주세요."
                className="mt-3 min-h-[120px] resize-y bg-white"
              />
            </div>

            <section className="mt-5">
              <h3 className="text-base font-bold text-slate-800">모집 상태</h3>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={clubIsRecruiting}
                  onChange={(event) => setClubIsRecruiting(event.target.checked)}
                  className="size-4 accent-primary"
                />
                <span className="text-sm font-semibold text-slate-700">모집중</span>
              </label>
            </section>

            <section className="mt-5">
              <h3 className="text-base font-bold text-slate-800">
                문의 링크 또는 번호
              </h3>

              <div className="mt-3 flex items-center gap-2">
                <Input
                  value={newContactValue}
                  onChange={(e) => setNewContactValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addContactLink();
                    }
                  }}
                  placeholder="이메일, 전화번호 또는 SNS 주소"
                  className="h-10 flex-1 bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addContactLink}
                  className="h-10 shrink-0"
                >
                  <Plus className="mr-1 size-4" />
                  링크 추가
                </Button>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {contactLinks.map((link) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) =>
                        updateContactLink(link.id, "label", e.target.value)
                      }
                      placeholder="예: 인스타그램 또는 회장 연락처"
                      aria-label="연락처 이름"
                      className="h-10 w-32 shrink-0 bg-white sm:w-40"
                    />
                    <Input
                      value={link.value}
                      onChange={(e) =>
                        updateContactLink(link.id, "value", e.target.value)
                      }
                      onBlur={() => normalizeContactLink(link.id)}
                      placeholder="이메일, 전화번호 또는 링크"
                      aria-label="연락처 내용"
                      className="h-10 flex-1 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeContactLink(link.id)}
                      aria-label="연락처 삭제"
                      className="shrink-0 rounded-md p-2 text-slate-400 transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-8 flex justify-end">
              <Button onClick={() => void saveClub()} className="h-10 w-full rounded-lg px-5 sm:w-auto">
                <Save className="mr-1 size-4" />
                저장
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    if (activeTab === "application-form") {
      return (
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl align-bottom font-bold text-foreground">
              신청폼 설정
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(true)}
                className="h-9 w-full rounded-lg px-4 sm:w-auto"
              >
                <Eye className="mr-1 size-4" />
                미리보기
              </Button>
              <Button
                onClick={openAddQuestion}
                className="h-9 w-full rounded-lg bg-slate-900 px-4 text-white hover:bg-slate-800 sm:w-auto"
              >
                <CirclePlus className="mr-1 size-4" />새 문항 추가
              </Button>
            </div>
          </div>

          <div className="mt-0 border-t border-slate-200 pt-5">
            <section className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">지원자 기본정보는 자동으로 제공됩니다</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    아래 개인정보는 신청폼에 기본 항목으로 포함되므로 별도의 질문으로 만들지 않아도 됩니다.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {BUILT_IN_APPLICANT_FIELDS.map((field) => (
                      <span key={field} className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-primary">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <ul className="space-y-4">
              {questions.map((question, index) => (
                <li
                  key={question.id}
                  data-question-id={question.id}
                  onPointerDown={(event) => handleQuestionPointerDown(event, question.id)}
                  onPointerMove={handleQuestionPointerMove}
                  onPointerUp={(event) => void handleQuestionPointerEnd(event)}
                  onPointerCancel={(event) => void handleQuestionPointerEnd(event)}
                  onClick={() => {
                    if (suppressQuestionClickRef.current) {
                      suppressQuestionClickRef.current = false;
                      return;
                    }
                    openEditQuestion(question);
                  }}
                  className={cn(
                    "cursor-grab select-none rounded-xl border bg-white px-5 py-4 transition-all active:cursor-grabbing",
                    draggingQuestionId === question.id
                      ? "z-10 border-primary opacity-70 shadow-md ring-2 ring-primary/20"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-sm",
                  )}
                  style={{ touchAction: draggingQuestionId ? "none" : "pan-y" }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {question.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-1 sm:justify-end shrink-0">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                        {question.type}
                      </span>
                      <label onClick={(event) => event.stopPropagation()} className="inline-flex cursor-pointer items-center gap-2 align-bottom text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={() => void toggleRequired(question.id)}
                          className="size-4 rounded border-slate-300"
                        />
                        필수 응답
                      </label>
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); void removeQuestion(question.id); }}
                        className="text-slate-400 transition-colors hover:text-destructive"
                        aria-label={`${question.title} 문항 삭제`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {questions.length > 1 && (
              <p className="mt-3 text-xs text-slate-500">
                문항 클릭 시 수정 가능하며, 문항을 누른 뒤 드래그하면 순서를 자유롭게 변경할 수 있습니다.
              </p>
            )}

            <div className="mt-8 flex justify-end">
              <Button onClick={() => toast.success("변경사항이 저장되었습니다.")} className="h-10 w-full rounded-lg px-5 sm:w-auto">
                <Save className="mr-1 size-4" />
                변경사항 저장
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    if (activeTab === "submitted-applications") {
      return (
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl align-bottom font-bold text-foreground">
                신청서 관리
              </h2>
              <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-lg font-extrabold text-[#1F4F95]">
                총 {applicantTotal}명
              </span>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
              <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 sm:flex-1 xl:w-[280px] xl:flex-none">
                <Search className="size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="이름, 학번, 학과 검색"
                  value={applicantQuery}
                  onChange={(event) => {
                    setApplicantQuery(event.target.value);
                    setApplicantPage(1);
                  }}
                  className="h-full w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 sm:w-11"
                aria-label="필터"
              >
                <SlidersHorizontal className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full table-fixed">
              <thead className="bg-[#F8FAFD]">
                <tr className="h-12 text-left text-sm font-semibold text-slate-500">
                  <th className="w-[72px] px-4">NO.</th>
                  <th className="w-[160px] px-4">이름 / 학번</th>
                  <th className="w-[160px] px-4">학과</th>
                  <th className="w-[130px] px-4">지원일시</th>
                  <th className="w-[120px] px-4">상태</th>
                  <th className="w-[130px] px-4 text-center">상세보기</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {pagedApplicants.map((applicant, index) => {
                  return (
                    <tr
                      key={applicant.id}
                      className="h-[88px] border-t border-slate-100 text-sm text-slate-700 first:border-t-0"
                    >
                      <td className="px-4 text-sm font-semibold text-slate-600">
                        {(safeApplicantPage - 1) * APPLICANTS_PER_PAGE + index + 1}
                      </td>
                      <td className="px-4">
                        <div className="text-sm font-bold leading-tight text-slate-900">
                          {applicant.name}
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-500">
                          {applicant.studentId}
                        </div>
                      </td>
                      <td className="px-4 text-sm font-semibold text-slate-700">
                        {applicant.major}
                      </td>
                      <td className="px-4 text-sm font-semibold text-slate-500">
                        {applicant.submittedAt}
                      </td>
                      <td className="px-4">
                        <div className="relative inline-flex">
                          <select
                            value={applicant.status}
                            onChange={(e) =>
                              openStatusEdit(
                                applicant,
                                e.target.value as ApplicationStatusValue,
                              )
                            }
                            aria-label={`${applicant.name} 상태 변경`}
                            className={cn(
                              "h-7 cursor-pointer appearance-none rounded-full border-transparent pl-3 pr-7 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                              STATUS_SELECT_CLASS[applicant.status],
                            )}
                          >
                            {APPLICATION_STATUSES.map((status) => (
                              <option key={status} value={status} className="bg-white text-slate-700">
                                {status}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2"
                            aria-hidden
                          />
                        </div>

                      </td>
                      <td className="px-4 text-center">
                        <button
                          type="button"
                          onClick={() => void openApplicationDetail(applicant.id)}
                          className="inline-flex h-9 items-center justify-center rounded-lg bg-[#EDF3FF] px-4 text-sm font-semibold text-[#2B63B4] transition-colors hover:bg-[#E2EDFF]"
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-500">검색 결과 {applicantTotal}명</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApplicantPage((page) => Math.max(1, page - 1))}
                  disabled={safeApplicantPage <= 1}
                  className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  이전
                </button>
                {applicantPageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setApplicantPage(pageNumber)}
                    aria-current={pageNumber === safeApplicantPage ? "page" : undefined}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white text-sm",
                      pageNumber === safeApplicantPage
                        ? "font-bold text-[#2B63B4]"
                        : "font-semibold text-slate-500",
                    )}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setApplicantPage((page) => Math.min(applicantTotalPages, page + 1))}
                  disabled={safeApplicantPage >= applicantTotalPages}
                  className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    if (activeTab === "page-tags") {
      return (
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl align-bottom font-bold text-foreground">
              상세페이지 설정
            </h2>
            <Button
              variant="outline"
              onClick={() => setIsDetailPreviewOpen(true)}
              className="h-9 w-full rounded-lg px-4 sm:w-auto"
            >
              <Eye className="mr-1 size-4" />
              미리보기
            </Button>
          </div>

          <div className="mt-0 border-t border-slate-200 pt-6">
            <section>
              <h3 className="flex items-center gap-1.5 text-base font-bold text-slate-800">
                상단 배너 이미지
                <span className="text-sm font-medium text-slate-400">
                  (권장: 1500×500px)
                </span>
                <span className="group relative inline-flex">
                  <button
                    type="button"
                    aria-label="배너 이미지 안내"
                    aria-describedby="banner-crop-tip"
                    className="inline-flex text-slate-400 transition-colors hover:text-slate-600 focus-visible:text-slate-600 focus-visible:outline-none"
                  >
                    <Info className="size-4" />
                  </button>
                  <span
                    id="banner-crop-tip"
                    role="tooltip"
                    className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 w-60 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                  >
                    화면 너비에 따라 좌우나 위아래가 잘릴 수 있습니다. 로고와
                    문구는 가운데에 배치해주세요.
                  </span>
                </span>
              </h3>
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="mt-3 flex aspect-[3/1] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100"
              >
                {clubImageUrl ? <img src={clubImageUrl} alt="상단 배너" className="h-full w-full rounded-xl object-cover" /> : <><ImageIcon className="mb-2 size-8 text-slate-400" /><span className="text-sm font-medium">클릭하여 이미지 업로드</span><span className="mt-1 text-xs text-slate-400">JPG, PNG · 최대 5MB</span></>}
              </button>
              <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file, "cover"); event.target.value = ""; }} />
            </section>

            <section className="mt-6">
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
              <h3 className="text-base font-bold text-slate-800">활동 사진</h3>
              <div className="mt-3 flex flex-wrap items-start gap-3">
                {activityPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="flex w-[120px] flex-col gap-1.5 sm:w-[140px]"
                  >
                    <div className="relative">
                      <img src={photo.url} alt={photo.caption || `활동 사진 ${index + 1}`} className="h-[96px] w-full rounded-xl border border-slate-200 object-cover sm:h-[116px]" />
                      <button
                        type="button"
                        onClick={() => removeActivityPhoto(photo.id)}
                        aria-label={`사진 ${index + 1} 삭제`}
                        className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                    <Input
                      value={photo.caption}
                      onChange={(e) =>
                        updatePhotoCaption(photo.id, e.target.value)
                      }
                      placeholder="설명 (선택)"
                      maxLength={30}
                      aria-label={`사진 ${index + 1} 설명`}
                      className="h-8 bg-white px-2 text-xs"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => activityInputRef.current?.click()}
                  className="flex h-[96px] w-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 transition-colors hover:bg-slate-50 sm:h-[116px] sm:w-[140px]"
                >
                  <div className="inline-flex size-8 items-center justify-center rounded-full border border-slate-300">
                    <Plus className="size-4" />
                  </div>
                  <span className="mt-2 text-sm font-semibold">사진 추가</span>
                </button>
                <input ref={activityInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file, "activity"); event.target.value = ""; }} />
              </div>
            </section>

            <div className="mt-8 flex justify-end">
              <Button onClick={() => void saveClub()} className="h-10 w-full rounded-lg bg-[#0A5CB5] px-6 text-white hover:bg-[#0A4F9D] sm:w-auto">
                <Save className="mr-1.5 size-4" />
                페이지 설정 저장
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    if (activeTab === "community-board") {
      return (
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl align-bottom font-bold text-foreground">
              게시판 관리
            </h2>
            <Button onClick={() => setIsPostDialogOpen(true)} className="h-11 w-full rounded-xl bg-[#0F1B33] px-5 text-sm font-semibold text-white hover:bg-[#111f3b] sm:w-auto">
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
                {communityPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="h-[56px] border-t border-slate-100 text-sm font-medium text-slate-700 first:border-t-0"
                  >
                    <td className="px-4">
                      <input
                        type="checkbox"
                        checked={selectedPostIds.includes(post.id)}
                        onChange={(event) => setSelectedPostIds((prev) => event.target.checked ? [...prev, post.id] : prev.filter((id) => id !== post.id))}
                        className="size-5 rounded border-slate-300 align-middle"
                        aria-label={`${post.title} 선택`}
                      />
                    </td>
                    <td className="px-4">
                      <div className="flex items-center gap-2">
                        {post.is_notice ? (
                          <Badge className="font-semibold">공지</Badge>
                        ) : null}
                        <span className="truncate text-[15px] font-semibold text-slate-800">
                          {post.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 text-sm text-slate-600">{post.author_name}</td>
                    <td className="px-4 text-sm text-slate-500">{new Intl.DateTimeFormat("ko-KR").format(new Date(post.created_at))}</td>
                    <td className="px-4 text-sm text-slate-500">{post.comment_count}</td>
                    <td className="px-4">
                      <div className="flex items-center justify-center gap-3 text-slate-400">
                        <button
                          type="button"
                          onClick={() => void deleteCommunityPosts([post.id])}
                          className="transition-colors hover:text-slate-600"
                          aria-label={`${post.title} 삭제`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-3 py-3">
              <button
                type="button"
                onClick={() => void deleteCommunityPosts(selectedPostIds)}
                className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                선택 삭제
              </button>
              <button
                type="button"
                onClick={() => void toggleSelectedNotices()}
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
          <div className="p-3 sm:p-5 lg:p-8">
            {managedClubs.length > 1 && (
              <div className="mb-4 flex justify-end">
                <select value={selectedClubId} onChange={(event) => { setSelectedClubId(event.target.value); setApplicantPage(1); }} aria-label="관리할 동아리 선택" className="h-10 rounded-md border border-input bg-white px-3 text-sm">
                  {managedClubs.map((club) => <option key={club.club_id} value={club.club_id}>{club.club_name}</option>)}
                </select>
              </div>
            )}
            {renderMainContent()}
          </div>
        </div>
      </div>

      {/* 문항 추가 및 수정 */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) setEditingQuestionId(null); }}>
        <DialogContent
          className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="mb-2.5 font-bold">{editingQuestionId ? "문항 수정" : "새 문항 추가"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            {/* 문항 내용 */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="new-question-title"
                className="text-sm font-semibold text-foreground"
              >
                문항 내용 <span className="text-destructive">*</span>
              </label>
              <Input
                id="new-question-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="지원자에게 물어볼 내용을 입력해주세요."
                maxLength={100}
                className={cn(
                  addSubmitted &&
                    titleError &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {addSubmitted && titleError && (
                <p className="text-sm text-destructive">
                  문항 내용을 입력해주세요.
                </p>
              )}
            </div>

            {/* 유형 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-foreground">유형</span>
              <div className="flex flex-wrap gap-2">
                {QUESTION_TYPES.map((type) => {
                  const isActive = newType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewType(type)}
                      aria-pressed={isActive}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:bg-muted/60",
                      )}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 객관식 선택지 */}
            {isChoice && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">
                  선택지 <span className="text-destructive">*</span>
                </span>
                <div className="flex flex-col gap-2">
                  {newOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`선택지 ${index + 1}`}
                        maxLength={50}
                        aria-label={`선택지 ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        disabled={newOptions.length <= 2}
                        aria-label={`선택지 ${index + 1} 삭제`}
                        className="shrink-0 rounded-md p-2 text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {addSubmitted && optionsError && (
                  <p className="text-sm text-destructive">
                    선택지를 2개 이상 입력해주세요.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="h-9 self-start"
                >
                  <Plus className="mr-1 size-4" />
                  선택지 추가
                </Button>
              </div>
            )}

            {/* 필수 응답 */}
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={() => setNewRequired((prev) => !prev)}
                className="size-4 rounded border-slate-300"
              />
              필수 응답으로 설정
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddOpen(false)}
            >
              취소
            </Button>
            <Button type="button" onClick={submitQuestion}>
              {editingQuestionId ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 신청폼 미리보기 — 지원자에게 보이는 모습 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="mb-2.5 font-bold">
              신청폼 미리보기
            </DialogTitle>
          </DialogHeader>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-bold text-foreground">지원자 기본정보</h3>
            <p className="mt-1 text-xs text-muted-foreground">로그인한 지원자의 정보가 자동으로 입력됩니다.</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BUILT_IN_APPLICANT_FIELDS.map((field) => (
                <label key={field} className="flex flex-col gap-1.5 text-xs font-semibold text-foreground">
                  {field}
                  <Input value="자동 입력" readOnly disabled className="h-9 bg-white text-muted-foreground disabled:opacity-100" />
                </label>
              ))}
            </div>
          </section>

          {questions.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              아직 등록된 문항이 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {questions.map((question, index) => (
                <div key={question.id} className="flex flex-col gap-2">
                  <label
                    htmlFor={`preview-q-${question.id}`}
                    className="flex gap-1.5 text-sm font-semibold text-foreground"
                  >
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span>
                      {question.title}
                      {question.required && (
                        <span className="ml-1 text-destructive">*</span>
                      )}
                    </span>
                  </label>

                  {question.type === "단답형" && (
                    <Input
                      id={`preview-q-${question.id}`}
                      placeholder="답변을 입력해주세요."
                    />
                  )}

                  {question.type === "장문형" && (
                    <Textarea
                      id={`preview-q-${question.id}`}
                      placeholder="답변을 입력해주세요."
                      className="min-h-[120px] resize-none"
                    />
                  )}

                  {hasOptions(question.type) && (
                    <div className="flex flex-col gap-2">
                      {question.options?.map((option, optionIndex) => (
                        <label
                          key={`${question.id}-${optionIndex}`}
                          className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground"
                        >
                          {question.type === "객관식" ? (
                            <input
                              type="radio"
                              name={`preview-q-${question.id}`}
                              className="size-4 border-slate-300"
                            />
                          ) : (
                            <input
                              type="checkbox"
                              name={`preview-q-${question.id}`}
                              className="size-4 rounded border-slate-300"
                            />
                          )}
                          {option}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={() => setIsPreviewOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상세페이지 미리보기 — 지원자에게 보이는 모습 */}
      <Dialog open={isDetailPreviewOpen} onOpenChange={setIsDetailPreviewOpen}>
        <DialogContent
          className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="mb-2.5 font-bold">
              상세페이지 미리보기
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            {/* 상단 배너 */}
            <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl bg-slate-100">
              {clubImageUrl ? <img src={clubImageUrl} alt={`${clubName || "동아리"} 배너`} className="h-full w-full object-cover" /> : <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400"><ImageIcon className="size-7" aria-hidden /><span className="text-xs font-medium">등록된 배너 이미지 없음</span></div>}
              <div className="absolute top-3 right-3">
                <Badge size="detail" className="bg-primary font-semibold text-primary-foreground">
                  모집중
                </Badge>
              </div>
            </div>

            {/* 카테고리 · 동아리명 · 한줄 소개 · 태그 — ClubDetail과 동일 구성 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">
                  {clubCategory || "분과 미선택"}
                </span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {clubName.trim() || (
                  <span className="text-muted-foreground/60">
                    동아리명 미입력
                  </span>
                )}
              </h3>
              <p
                className={cn(
                  "text-base whitespace-pre-line sm:text-lg",
                  clubTagline.trim()
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60",
                )}
              >
                {clubTagline.trim() || "한줄 소개 미입력"}
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    size="detail"
                    className="font-normal text-secondary-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* 동아리 소개 */}
            <section className="space-y-4">
              <h4 className="text-xl font-bold">동아리 소개</h4>
              <div
                className={cn(
                  "text-base leading-relaxed whitespace-pre-line",
                  clubDetailDescription.trim()
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60",
                )}
              >
                {clubDetailDescription.trim() ||
                  "아직 작성된 상세 설명이 없습니다."}
              </div>
            </section>

            {/* 주요 활동 */}
            <section className="space-y-4">
              <h4 className="text-xl font-bold">주요 활동</h4>
              {activityPhotos.length === 0 ? (
                <p className="text-base text-muted-foreground/60">
                  등록된 활동 사진이 없습니다.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {activityPhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="flex flex-col overflow-hidden rounded-lg border bg-card"
                    >
                      {/* 설명이 없는 카드는 이미지가 남은 높이를 채웁니다. */}
                      <img src={photo.url} alt={photo.caption || `활동 사진 ${index + 1}`} className="min-h-48 w-full flex-1 object-cover" />
                      {/* 설명은 선택 입력이라 비어 있으면 표시하지 않습니다. */}
                      {photo.caption.trim() && (
                        <div className="p-3">
                          <p className="text-center text-sm font-bold">
                            {photo.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 연락처 · SNS — 입력된 것이 하나라도 있을 때만 노출 */}
            {contactLinks.some((link) => link.label.trim() && link.value.trim()) && (
              <section className="space-y-4">
                <h4 className="text-xl font-bold">연락처</h4>
                <div className="flex flex-col gap-3">
                  {contactLinks
                    .filter((link) => link.label.trim() && link.value.trim())
                    .map((link) => (
                      <a
                        key={link.id}
                        href={contactHref(link)}
                        {...(link.type === "url" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                      >
                        {link.type === "email" ? (
                          <Mail className="size-4 shrink-0" aria-hidden />
                        ) : link.type === "phone" ? (
                          <Phone className="size-4 shrink-0" aria-hidden />
                        ) : (
                          <Link2 className="size-4 shrink-0" aria-hidden />
                        )}
                        <span>{link.label}: {link.value}</span>
                      </a>
                    ))}
                </div>
              </section>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsDetailPreviewOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>게시글 작성</DialogTitle><DialogDescription>관리자가 작성한 게시글은 공지로 등록됩니다.</DialogDescription></DialogHeader>
          <div className="flex flex-col gap-3">
            <Input value={postTitle} onChange={(event) => setPostTitle(event.target.value)} placeholder="제목을 입력해주세요." />
            <Textarea value={postContent} onChange={(event) => setPostContent(event.target.value)} placeholder="내용을 입력해주세요." className="min-h-40 resize-none" />
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setIsPostDialogOpen(false)}>취소</Button><Button onClick={() => void createCommunityPost()} disabled={!postTitle.trim() || !postContent.trim()}>등록</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedApplication !== null} onOpenChange={(open) => { if (!open) setSelectedApplication(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>신청서 상세</DialogTitle>
            <DialogDescription>{selectedApplication?.user_name} · {selectedApplication?.user_student_id}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {selectedApplication && (
              <section className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">이름</p><p className="mt-1 text-sm font-medium">{selectedApplication.user_name}</p></div>
                <div><p className="text-xs text-muted-foreground">학번</p><p className="mt-1 text-sm font-medium">{selectedApplication.user_student_id}</p></div>
                <div><p className="text-xs text-muted-foreground">학과</p><p className="mt-1 text-sm font-medium">{selectedApplication.applicant_department ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">전화번호</p><p className="mt-1 text-sm font-medium">{selectedApplication.applicant_phone ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">학년</p><p className="mt-1 text-sm font-medium">{selectedApplication.applicant_grade ? `${selectedApplication.applicant_grade}학년` : "—"}</p></div>
              </section>
            )}
            {selectedApplication?.answers.map((answer, index) => {
              const question = questions.find((item) => item.id === answer.question_id);
              return <div key={answer.question_id} className="rounded-lg border p-3"><p className="text-sm font-semibold">{index + 1}. {answer.question_text ?? question?.title ?? "질문"}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{answer.answer_text || "답변 없음"}</p></div>;
            })}
            <section className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
              <label htmlFor="review-comment" className="text-sm font-bold text-foreground">관리자 코멘트</label>
              <p className="mt-1 text-xs text-muted-foreground">작성한 내용은 지원자의 신청 상태 화면에 표시됩니다.</p>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="지원자에게 전달할 코멘트를 입력해주세요."
                className="mt-3 min-h-28 resize-y bg-white"
                maxLength={1000}
              />
              <div className="mt-3 flex justify-end">
                <Button type="button" onClick={() => void saveReviewComment()}>코멘트 저장</Button>
              </div>
            </section>
          </div>
          <DialogFooter><Button onClick={() => setSelectedApplication(null)}>닫기</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상태 변경 확인 다이얼로그 */}
      <Dialog
        open={statusEdit !== null}
        onOpenChange={(open) => {
          if (!open) closeStatusEdit();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>상태 변경</DialogTitle>
            <DialogDescription>
              {statusEdit && (
                <>
                  <span className="font-semibold text-foreground">
                    {statusEdit.applicant.name}
                  </span>
                  님의 상태를{" "}
                  <span className="font-semibold text-foreground">
                    {statusEdit.nextStatus}
                  </span>
                  (으)로 변경합니다.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeStatusEdit}>
              취소
            </Button>
            <Button type="button" onClick={confirmStatusChange}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
