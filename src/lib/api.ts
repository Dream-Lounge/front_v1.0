export const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not defined. Please set it in your environment variables.");
}

export function apiUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export interface User {
  id: string;
  studentId: string;
  name: string;
  department: string | null;
  phone: string | null;
}

interface ApiUser {
  id: string;
  student_id: string;
  name: string;
  department: string | null;
  phone: string | null;
}

export interface LoginResponse {
  token_type: string;
  user: User;
}

interface ApiTokenResponse {
  token_type: string;
  user: ApiUser;
}

export interface ApiError {
  detail: string | Array<{ loc: Array<string | number>; msg: string; type: string }>;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface SignupRequest {
  studentId: string;
  password: string;
}

export interface SignupResponse {
  id: string;
  studentId: string;
  name: string;
  department: string | null;
  phone: string | null;
  createdAt: string;
}

export interface ClubResponse {
  id: string;
  name: string;
  club_type: string | null;
  tagline: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  open_chat_url: string | null;
  contact_links: ClubContactLink[];
  image_url: string | null;
  activity_images: string[];
  activity_image_details: Array<{
    image_url: string;
    caption: string | null;
    order_index: number;
  }>;
  division: string | null;
  field: string | null;
  activity_purpose: string | null;
  activity_period: string | null;
  recruit_start: string | null;
  recruit_end: string | null;
  is_recruiting: boolean;
  member_count: number;
  tags: Array<{ tag_key: string; tag_value: string }>;
}

export type ClubContactLinkType = "email" | "phone" | "url";

export interface ClubContactLink {
  type: ClubContactLinkType;
  label: string;
  value: string;
}

export type FormQuestionType = "text" | "textarea" | "choice" | "multiselect";

export interface FormQuestionResponse {
  id: string;
  question_text: string;
  question_type: FormQuestionType | string;
  is_required: boolean;
  order_index: number;
  options: string[] | null;
}

export interface ApplicationFormResponse {
  id: string;
  club_id: string;
  title: string;
  is_active: boolean;
  questions: FormQuestionResponse[];
}

export interface ApplicationAnswerInput {
  question_id: string;
  answer_text: string;
}

export interface ApplicantInfoInput {
  applicant_student_id: string;
  applicant_name: string;
  applicant_department: string;
  applicant_phone: string;
  applicant_grade: string;
}

export interface ActiveClubItem {
  club_id: string;
  club_name: string;
  role: "president" | "member" | string;
  joined_at: string;
}

export interface ClubWriteRequest {
  name?: string;
  club_type?: string | null;
  tagline?: string | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  open_chat_url?: string | null;
  contact_links?: ClubContactLink[];
  image_url?: string | null;
  activity_images?: string[];
  activity_image_details?: Array<{ image_url: string; caption: string | null }>;
  division?: string | null;
  field?: string | null;
  atmosphere?: string | null;
  activity_purpose?: string | null;
  activity_period?: string | null;
  recruit_start?: string | null;
  recruit_end?: string | null;
  is_recruiting?: boolean;
  tags?: Array<{ tag_key: string; tag_value: string }>;
}

export interface AdminApplicationListItem {
  id: string;
  user_id: string;
  user_name: string;
  user_student_id: string;
  status: string;
  submitted_at: string | null;
  admin_comment: string | null;
  applicant_department: string | null;
  applicant_phone: string | null;
  applicant_grade: string | null;
}

export interface AdminApplicationDetail extends AdminApplicationListItem {
  answers: ApiApplicationDetail["answers"];
  form_snapshot: ApiApplicationDetail["form_snapshot"];
}

export interface ClubMember {
  user_id: string;
  name: string;
  student_id: string;
  department: string | null;
  phone: string | null;
  role: string;
  joined_at: string;
}

export interface PostListItem {
  id: string;
  author_id: string;
  author_name: string;
  post_type: string;
  title: string;
  is_notice: boolean;
  created_at: string;
  comment_count: number;
  is_author_president: boolean;
}

export interface CommentResponse {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
  is_author_president: boolean;
}

export interface PostDetailResponse extends Omit<PostListItem, "comment_count"> {
  club_id: string;
  content: string;
  comments: CommentResponse[];
}

export interface NotificationResponse {
  id: string;
  noti_type: string;
  message: string;
  payload: unknown;
  is_read: boolean;
  created_at: string;
}

export interface ApplicationContent {
  motivation: string;
  experience?: string;
  questions?: string;
}

export interface MemberApplicationRequest {
  clubId: string;
  content: ApplicationContent;
}

export interface ApplicationResponse {
  message: string;
  application_id: string;
  applicant: {
    student_id: string;
    name: string;
    department: string | null;
    phone: string | null;
  };
}

type DisplayApplicationStatus = "임시저장" | "제출됨" | "합격" | "불합격" | "보류";

export interface ApplicationListResponseItem {
  id: string;
  club_id: string;
  club_name: string;
  club_image: string | null;
  category: string | null;
  status: DisplayApplicationStatus;
  submitted_time: string;
  motivation: string;
  admin_comment: string | null;
}

export interface ApplicationDetailResponse {
  id: string;
  club_id: string;
  club_name: string;
  student_id: string;
  status: DisplayApplicationStatus;
  content: ApplicationContent;
  submitted_time: string;
}

export interface ApiApplicationListItem {
  id: string;
  form_id: string;
  club_id: string | null;
  club_name: string | null;
  club_image: string | null;
  club_category: string | null;
  status: string;
  is_draft: boolean;
  submitted_at: string | null;
  updated_at: string;
  admin_comment: string | null;
}

export interface ApiApplicationDetail extends ApiApplicationListItem {
  applicant_student_id: string | null;
  applicant_name: string | null;
  applicant_department: string | null;
  applicant_phone: string | null;
  applicant_grade: string | null;
  answers: Array<{
    question_id: string;
    answer_text: string | null;
    question_text: string | null;
    question_type: string | null;
    is_required: boolean | null;
    order_index: number | null;
    options: string[] | null;
  }>;
  form_snapshot: {
    id: string;
    title: string;
    questions: FormQuestionResponse[];
  } | null;
}

interface ApiSignupResponse {
  id: string;
  student_id: string;
  name: string;
  department: string | null;
  phone: string | null;
  created_at: string;
}

export class SessionExpiredError extends Error {
  constructor() {
    super("세션이 만료되었습니다. 다시 로그인해주세요.");
    this.name = "SessionExpiredError";
  }
}

export function isSessionExpiredError(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError;
}

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

function mapUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    studentId: apiUser.student_id,
    name: apiUser.name,
    department: apiUser.department,
    phone: apiUser.phone,
  };
}

function mapApplicationStatus(status: string, isDraft: boolean): DisplayApplicationStatus {
  if (isDraft || status === "draft") return "임시저장";
  if (status === "passed") return "합격";
  if (status === "failed") return "불합격";
  if (status === "pending") return "보류";
  return "제출됨";
}

function applicationValues(content: ApplicationContent): string[] {
  return [content.motivation, content.experience ?? "", content.questions ?? ""];
}

class ApiClient {
  private readonly baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;
  private sessionExpiredHandler: (() => void) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  setSessionExpiredHandler(handler: (() => void) | null): void {
    this.sessionExpiredHandler = handler;
  }

  clearTokens(): void {
    // 이전 버전에서 남긴 인증 정보만 제거한다. 현재 세션 토큰은
    // JavaScript에서 읽을 수 없는 HttpOnly 쿠키에 저장된다.
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  }

  private expireSession(): never {
    this.clearTokens();
    this.sessionExpiredHandler?.();
    throw new SessionExpiredError();
  }

  private async performRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) return false;
      await response.json() as ApiTokenResponse;
      return true;
    } catch {
      return false;
    }
  }

  private refreshAccessToken(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  async request<T>(endpoint: string, options: RequestInit = {}, requiresAuth = true): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

    let response = await fetch(url, { ...options, headers, credentials: "include" });
    if (requiresAuth && response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) this.expireSession();
      response = await fetch(url, { ...options, headers, credentials: "include" });
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: "요청 처리 중 오류가 발생했습니다.",
      }));
      const message = Array.isArray(error.detail)
        ? error.detail.map((item) => item.msg).join(", ")
        : error.detail;
      throw new ApiRequestError(message, response.status);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async login(studentId: string, password: string): Promise<LoginResponse> {
    const response = await this.request<ApiTokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId, password }),
    }, false);
    const user = mapUser(response.user);
    return { ...response, user };
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>("/auth/logout", {
        method: "POST",
      });
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    return mapUser(await this.request<ApiUser>("/auth/me"));
  }

  async restoreSession(): Promise<User | null> {
    this.clearTokens();
    if (!await this.performRefresh()) return null;
    try {
      return await this.getCurrentUser();
    } catch {
      return null;
    }
  }

  deleteAccount(): Promise<void> {
    return this.request<void>("/auth/me", { method: "DELETE" });
  }

  async signup(data: SignupRequest): Promise<SignupResponse> {
    const response = await this.request<ApiSignupResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        student_id: data.studentId,
        password: data.password,
      }),
    }, false);
    return {
      id: response.id,
      studentId: response.student_id,
      name: response.name,
      department: response.department,
      phone: response.phone,
      createdAt: response.created_at,
    };
  }

  getClubs(search?: string): Promise<ClubResponse[]> {
    const query = search?.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : "";
    return this.request<ClubResponse[]>(`/clubs${query}`, {}, false);
  }

  getClub(clubId: string): Promise<ClubResponse> {
    return this.request<ClubResponse>(`/clubs/${encodeURIComponent(clubId)}`, {}, false);
  }

  getClubForm(clubId: string): Promise<ApplicationFormResponse> {
    return this.request<ApplicationFormResponse>(`/clubs/${encodeURIComponent(clubId)}/form`, {}, false);
  }

  getMyClubs(): Promise<ActiveClubItem[]> {
    return this.request<ActiveClubItem[]>("/me/clubs");
  }

  createClub(data: ClubWriteRequest & { name: string }): Promise<ClubResponse> {
    return this.request<ClubResponse>("/clubs", { method: "POST", body: JSON.stringify(data) });
  }

  updateClub(clubId: string, data: ClubWriteRequest): Promise<ClubResponse> {
    return this.request<ClubResponse>(`/clubs/${encodeURIComponent(clubId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async uploadClubImage(clubId: string | null, file: File): Promise<string> {
    const body = new FormData();
    body.append("file", file);
    const endpoint = clubId
      ? `/clubs/${encodeURIComponent(clubId)}/images`
      : "/clubs/images";
    const response = await this.request<{ image_url: string }>(endpoint, {
      method: "POST",
      body,
    });
    return response.image_url;
  }

  createClubForm(clubId: string, title: string): Promise<ApplicationFormResponse> {
    return this.request<ApplicationFormResponse>(`/clubs/${encodeURIComponent(clubId)}/form`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }

  updateClubForm(
    clubId: string,
    data: { title?: string; is_active?: boolean },
  ): Promise<ApplicationFormResponse> {
    return this.request<ApplicationFormResponse>(`/clubs/${encodeURIComponent(clubId)}/form`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  addFormQuestion(
    clubId: string,
    data: Omit<FormQuestionResponse, "id">,
  ): Promise<FormQuestionResponse> {
    return this.request<FormQuestionResponse>(`/clubs/${encodeURIComponent(clubId)}/form/questions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateFormQuestion(
    clubId: string,
    questionId: string,
    data: Partial<Omit<FormQuestionResponse, "id">>,
  ): Promise<FormQuestionResponse> {
    return this.request<FormQuestionResponse>(
      `/clubs/${encodeURIComponent(clubId)}/form/questions/${encodeURIComponent(questionId)}`,
      { method: "PATCH", body: JSON.stringify(data) },
    );
  }

  deleteFormQuestion(clubId: string, questionId: string): Promise<void> {
    return this.request<void>(
      `/clubs/${encodeURIComponent(clubId)}/form/questions/${encodeURIComponent(questionId)}`,
      { method: "DELETE" },
    );
  }

  reorderFormQuestions(clubId: string, questionIds: string[]): Promise<ApplicationFormResponse> {
    return this.request<ApplicationFormResponse>(
      `/clubs/${encodeURIComponent(clubId)}/form/questions/reorder`,
      { method: "POST", body: JSON.stringify({ question_ids: questionIds }) },
    );
  }

  createApplication(
    formId: string,
    answers: ApplicationAnswerInput[],
    isDraft: boolean,
    applicantInfo: ApplicantInfoInput,
  ): Promise<ApiApplicationDetail> {
    return this.request<ApiApplicationDetail>("/applications", {
      method: "POST",
      body: JSON.stringify({ form_id: formId, is_draft: isDraft, answers, ...applicantInfo }),
    });
  }

  patchApplication(
    applicationId: string,
    answers: ApplicationAnswerInput[],
    applicantInfo: ApplicantInfoInput,
    isDraft?: boolean,
  ): Promise<ApiApplicationDetail> {
    return this.request<ApiApplicationDetail>(`/applications/${encodeURIComponent(applicationId)}`, {
      method: "PATCH",
      body: JSON.stringify({ answers, ...applicantInfo, ...(isDraft === undefined ? {} : { is_draft: isDraft }) }),
    });
  }

  getDraftApplications(): Promise<ApiApplicationListItem[]> {
    return this.request<ApiApplicationListItem[]>("/me/applications/drafts");
  }

  getDraftApplication(applicationId: string): Promise<ApiApplicationDetail> {
    return this.request<ApiApplicationDetail>(`/me/applications/drafts/${encodeURIComponent(applicationId)}`);
  }

  getSubmittedApplication(applicationId: string): Promise<ApiApplicationDetail> {
    return this.request<ApiApplicationDetail>(`/me/applications/submitted/${encodeURIComponent(applicationId)}`);
  }

  deleteApplication(applicationId: string): Promise<void> {
    return this.request<void>(`/applications/${encodeURIComponent(applicationId)}`, { method: "DELETE" });
  }

  getClubApplications(
    clubId: string,
    page = 1,
    size = 20,
    query = "",
  ): Promise<PageResponse<AdminApplicationListItem>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (query.trim()) params.set("q", query.trim());
    return this.request<PageResponse<AdminApplicationListItem>>(
      `/clubs/${encodeURIComponent(clubId)}/applications?${params.toString()}`,
    );
  }

  getClubApplication(clubId: string, applicationId: string): Promise<AdminApplicationDetail> {
    return this.request<AdminApplicationDetail>(
      `/clubs/${encodeURIComponent(clubId)}/applications/${encodeURIComponent(applicationId)}`,
    );
  }

  updateClubApplicationStatus(
    clubId: string,
    applicationId: string,
    status: "pending" | "passed" | "failed",
  ): Promise<AdminApplicationListItem> {
    return this.request<AdminApplicationListItem>(
      `/clubs/${encodeURIComponent(clubId)}/applications/${encodeURIComponent(applicationId)}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    );
  }

  updateClubApplicationComment(
    clubId: string,
    applicationId: string,
    comment: string,
  ): Promise<AdminApplicationListItem> {
    return this.request<AdminApplicationListItem>(
      `/clubs/${encodeURIComponent(clubId)}/applications/${encodeURIComponent(applicationId)}/comment`,
      { method: "PATCH", body: JSON.stringify({ comment }) },
    );
  }

  getClubMembers(clubId: string, page = 1, size = 20): Promise<PageResponse<ClubMember>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return this.request<PageResponse<ClubMember>>(
      `/clubs/${encodeURIComponent(clubId)}/members?${params.toString()}`,
    );
  }

  withdrawClubMember(clubId: string, userId: string): Promise<void> {
    return this.request<void>(
      `/clubs/${encodeURIComponent(clubId)}/members/${encodeURIComponent(userId)}/withdraw`,
      { method: "PATCH" },
    );
  }

  transferClubRole(clubId: string, userId: string): Promise<void> {
    return this.request<void>(
      `/clubs/${encodeURIComponent(clubId)}/members/${encodeURIComponent(userId)}/role`,
      { method: "PATCH" },
    );
  }

  async submitMemberApplication(data: MemberApplicationRequest): Promise<ApplicationResponse> {
    const form = await this.getClubForm(data.clubId);
    const values = applicationValues(data.content);
    const questions = [...form.questions].sort((a, b) => a.order_index - b.order_index);
    const application = await this.request<ApiApplicationDetail>("/applications", {
      method: "POST",
      body: JSON.stringify({
        form_id: form.id,
        is_draft: false,
        answers: questions.slice(0, values.length).map((question, index) => ({
          question_id: question.id,
          answer_text: values[index],
        })),
      }),
    });
    const user = JSON.parse(localStorage.getItem("user") ?? "null") as User | null;
    return {
      message: "지원서가 제출되었습니다.",
      application_id: application.id,
      applicant: {
        student_id: user?.studentId ?? "",
        name: user?.name ?? "",
        department: user?.department ?? null,
        phone: user?.phone ?? null,
      },
    };
  }

  async checkApplicationStatus(clubId: string): Promise<boolean> {
    const applications = await this.request<ApiApplicationListItem[]>("/me/applications/submitted");
    return applications.some((application) => application.club_id === clubId);
  }

  async getMyApplications(): Promise<ApplicationListResponseItem[]> {
    const applications = await this.request<ApiApplicationListItem[]>("/me/applications/submitted");
    return applications.map((application) => {
      return {
        id: application.id,
        club_id: application.club_id ?? "",
        club_name: application.club_name ?? "동아리",
        club_image: application.club_image,
        category: application.club_category,
        status: mapApplicationStatus(application.status, application.is_draft),
        submitted_time: application.submitted_at ?? application.updated_at,
        motivation: "",
        admin_comment: application.admin_comment,
      };
    });
  }

  private async getApplicationDetail(id: string): Promise<ApiApplicationDetail> {
    const drafts = await this.request<ApiApplicationListItem[]>("/me/applications/drafts");
    const endpoint = drafts.some((application) => application.id === id)
      ? `/me/applications/drafts/${encodeURIComponent(id)}`
      : `/me/applications/submitted/${encodeURIComponent(id)}`;
    return this.request<ApiApplicationDetail>(endpoint);
  }

  async getApplication(id: string): Promise<ApplicationDetailResponse> {
    const application = await this.getApplicationDetail(id);
    const answers = application.answers.map((answer) => answer.answer_text ?? "");
    const user = JSON.parse(localStorage.getItem("user") ?? "null") as User | null;
    return {
      id: application.id,
      club_id: application.club_id ?? "",
      club_name: application.club_name ?? "동아리",
      student_id: user?.studentId ?? "",
      status: mapApplicationStatus(application.status, application.is_draft),
      content: {
        motivation: answers[0] ?? "",
        experience: answers[1] || undefined,
        questions: answers[2] || undefined,
      },
      submitted_time: application.submitted_at ?? application.updated_at,
    };
  }

  async updateApplication(id: string, content: ApplicationContent): Promise<{ message: string }> {
    const application = await this.getApplicationDetail(id);
    const values = applicationValues(content);
    await this.request(`/applications/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        answers: application.answers.slice(0, values.length).map((answer, index) => ({
          question_id: answer.question_id,
          answer_text: values[index],
        })),
      }),
    });
    return { message: "지원서가 수정되었습니다." };
  }

  getClubPosts(clubId: string): Promise<PostListItem[]> {
    return this.request<PostListItem[]>(`/clubs/${encodeURIComponent(clubId)}/posts`, {}, false);
  }

  createClubPost(clubId: string, title: string, content: string): Promise<PostDetailResponse> {
    return this.request<PostDetailResponse>(`/clubs/${encodeURIComponent(clubId)}/posts`, {
      method: "POST",
      body: JSON.stringify({ title, content }),
    });
  }

  getClubPost(clubId: string, postId: string): Promise<PostDetailResponse> {
    return this.request<PostDetailResponse>(
      `/clubs/${encodeURIComponent(clubId)}/posts/${encodeURIComponent(postId)}`,
      {},
      false,
    );
  }

  updateClubPost(
    clubId: string,
    postId: string,
    data: { title?: string; content?: string },
  ): Promise<PostDetailResponse> {
    return this.request<PostDetailResponse>(
      `/clubs/${encodeURIComponent(clubId)}/posts/${encodeURIComponent(postId)}`,
      { method: "PATCH", body: JSON.stringify(data) },
    );
  }

  deleteClubPost(clubId: string, postId: string): Promise<void> {
    return this.request<void>(
      `/clubs/${encodeURIComponent(clubId)}/posts/${encodeURIComponent(postId)}`,
      { method: "DELETE" },
    );
  }

  toggleClubPostNotice(clubId: string, postId: string): Promise<PostDetailResponse> {
    return this.request<PostDetailResponse>(
      `/clubs/${encodeURIComponent(clubId)}/posts/${encodeURIComponent(postId)}/notice`,
      { method: "PATCH" },
    );
  }

  createComment(clubId: string, postId: string, content: string): Promise<CommentResponse> {
    return this.request<CommentResponse>(
      `/clubs/${encodeURIComponent(clubId)}/posts/${encodeURIComponent(postId)}/comments`,
      { method: "POST", body: JSON.stringify({ content }) },
    );
  }

  deleteComment(clubId: string, postId: string, commentId: string): Promise<void> {
    return this.request<void>(
      `/clubs/${encodeURIComponent(clubId)}/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
      { method: "DELETE" },
    );
  }

  getNotifications(): Promise<NotificationResponse[]> {
    return this.request<NotificationResponse[]>("/me/notifications");
  }

  markNotificationRead(notificationId: string): Promise<NotificationResponse> {
    return this.request<NotificationResponse>(
      `/me/notifications/${encodeURIComponent(notificationId)}/read`,
      { method: "PATCH" },
    );
  }

  markAllNotificationsRead(): Promise<void> {
    return this.request<void>("/me/notifications/read-all", { method: "PATCH" });
  }
}

export const api = new ApiClient(API_BASE_URL);
