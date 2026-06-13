import { isTokenExpired } from "./auth";

export const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not defined. Please set it in your environment variables.");
}

export function apiUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export interface User {
  id?: number;
  studentId: number;
  name: string;
  email?: string;
  department: string | null;
  phone: string | null;
}

interface ApiUser {
  id?: number;
  student_id: number;
  name: string;
  email?: string;
  department: string | null;
  phone: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;
}

export interface SignupRequest {
  studentId: string;
  name: string;
  department: string;
  phone: string;
  password: string;
  passwordConfirm: string;
  email?: string;
  verificationCode?: string;
  privacyConsentRequired: boolean;
  privacyConsentOptional?: boolean;
}

export interface SignupResponse {
  studentId: number;
  name: string;
  department: string | null;
  phone: string | null;
  registered_at: string;
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

// Club types — matches BE ClubResponse exactly
export interface ClubTag {
  tag_key: string;
  tag_value: string;
}

export interface Club {
  id: string;
  name: string;
  club_type: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  open_chat_url: string | null;
  image_url: string | null;
  activity_images: string[];
  division: string | null;
  field: string | null;
  atmosphere: string | null;
  activity_purpose: string | null;
  activity_period: string | null;
  recruit_start: string | null;
  recruit_end: string | null;
  is_recruiting: boolean;
  member_count: number;
  tags: ClubTag[];
}

export interface ClubUpdateRequest {
  name?: string;
  club_type?: string;
  division?: string;
  description?: string;
  image_url?: string;
  activity_images?: string[];
  contact_email?: string;
  contact_phone?: string;
  open_chat_url?: string;
  field?: string;
  atmosphere?: string;
  activity_purpose?: string;
  activity_period?: string;
  recruit_start?: string;
  recruit_end?: string;
  is_recruiting?: boolean;
  tags?: ClubTag[];
}

// Form types — matches BE ApplicationFormResponse / FormQuestionResponse
export interface FormQuestion {
  id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  order_index: number;
  options?: unknown[] | null;
}

export interface ClubForm {
  id: string;
  club_id: string;
  title: string;
  is_active: boolean;
  questions: FormQuestion[];
}

// Post types
export interface PostListItem {
  id: number;
  title: string;
  content: string;
  is_notice: boolean;
  author_name: string;
  created_at: string;
  comment_count: number;
  is_author_president: boolean;
}

export interface CommentItem {
  id: number;
  content: string;
  author_name: string;
  author_id: number;
  created_at: string;
  is_author_president: boolean;
}

export interface PostDetail {
  id: number;
  title: string;
  content: string;
  is_notice: boolean;
  author_name: string;
  author_id: number;
  created_at: string;
  is_author_president: boolean;
  comments: CommentItem[];
}

// Application types — matches BE ApplicationListItem
export interface ApplicationListResponseItem {
  id: string;
  form_id: string;
  club_id: string | null;
  club_name: string | null;
  status: string; // "submitted" | "pending" | "passed" | "failed"
  is_draft: boolean;
  submitted_at: string | null;
  updated_at: string;
}

// User's own application detail — matches BE ApplicationResponse
export interface MyApplicationDetail {
  id: string;
  form_id: string;
  club_id: string | null;
  club_name: string | null;
  status: string;
  is_draft: boolean;
  submitted_at: string | null;
  updated_at: string;
  answers: Array<{
    question_id: string;
    answer_text: string | null;
  }>;
}

export interface ApplicationDetailResponse {
  id: string;
  club_id: string | null;
  club_name: string | null;
  status: string;
  content: ApplicationContent;
  submitted_at: string | null;
}

// Active club membership — matches BE ActiveClubItem
export interface ActiveClubItem {
  club_id: string;
  club_name: string;
  role: "president" | "member";
  joined_at: string;
}

// Admin application types — matches BE AdminApplicationListItem
export interface AdminApplicationListItem {
  id: string;
  user_id: string;
  user_name: string;
  user_student_id: string;
  status: string;
  submitted_at: string | null;
}

// Admin application detail — matches BE AdminApplicationResponse
export interface AdminApplicationDetail {
  id: string;
  user_id: string;
  user_name: string;
  user_student_id: string;
  status: string;
  submitted_at: string | null;
  answers: Array<{
    question_id: string;
    answer_text: string | null;
  }>;
}

export class SessionExpiredError extends Error {
  constructor() {
    super("세션이 만료되었습니다. 다시 로그인해주세요.");
    this.name = "SessionExpiredError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("접근 권한이 없습니다.");
    this.name = "ForbiddenError";
  }
}

function mapUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    studentId: apiUser.student_id,
    name: apiUser.name,
    email: apiUser.email,
    department: apiUser.department,
    phone: apiUser.phone,
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  clearTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const accessToken = this.getAccessToken();

    if (accessToken && isTokenExpired(accessToken, 30)) {
      this.clearTokens();
      throw new SessionExpiredError();
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      this.clearTokens();
      throw new SessionExpiredError();
    }

    if (response.status === 403) {
      throw new ForbiddenError();
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: "요청 처리 중 오류가 발생했습니다",
      }));

      const errorMessage = Array.isArray(error.detail)
        ? error.detail.map((e) => e.msg).join(", ")
        : error.detail;

      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async login(studentId: number, password: string): Promise<LoginResponse> {
    const response = await this.request<{ access_token: string; token_type: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ student_id: String(studentId), password }),
    });

    const user = mapUser(response.user);
    localStorage.setItem("access_token", response.access_token);
    localStorage.setItem("user", JSON.stringify(user));

    return {
      access_token: response.access_token,
      token_type: response.token_type,
      user,
    };
  }

  logout(): void {
    this.clearTokens();
  }

  async sendEmailVerification(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/email-verify/send", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async confirmEmailVerification(email: string, code: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/email-verify/confirm", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  }

  async signup(data: SignupRequest): Promise<SignupResponse> {
    const requestBody: Record<string, unknown> = {
      student_id: data.studentId,
      name: data.name,
      department: data.department,
      phone: data.phone,
      password: data.password,
      email: data.email,
      verification_code: data.verificationCode,
      privacy_consent: {
        required_agreed: data.privacyConsentRequired,
        optional_agreed: data.privacyConsentOptional ?? false,
      },
    };

    const response = await this.request<{
      id: string;
      student_id: string;
      name: string;
      email: string;
      department: string | null;
      phone: string | null;
      created_at: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    return {
      studentId: parseInt(response.student_id, 10),
      name: response.name,
      department: response.department,
      phone: response.phone,
      registered_at: response.created_at,
    };
  }

  async getMe(): Promise<User> {
    const apiUser = await this.request<ApiUser>("/me");
    return mapUser(apiUser);
  }

  // Club methods
  async getClubs(): Promise<Club[]> {
    return this.request<Club[]>("/clubs");
  }

  async getClub(clubId: string): Promise<Club> {
    return this.request<Club>(`/clubs/${clubId}`);
  }

  async createClub(data: {
    name: string;
    division?: string;
    club_type?: string;
    description?: string;
    image_url?: string;
    contact_email?: string;
    contact_phone?: string;
    tags?: ClubTag[];
  }): Promise<Club> {
    return this.request<Club>("/clubs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateClub(clubId: string, data: ClubUpdateRequest): Promise<Club> {
    return this.request<Club>(`/clubs/${clubId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async uploadClubImage(file: File): Promise<{ image_url: string }> {
    const url = `${this.baseUrl}/clubs/images`;
    const accessToken = this.getAccessToken();

    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const response = await fetch(url, { method: "POST", headers, body: formData });

    if (response.status === 401) {
      this.clearTokens();
      throw new SessionExpiredError();
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ detail: "이미지 업로드에 실패했습니다" }));
      const msg = Array.isArray(error.detail) ? error.detail.map((e) => e.msg).join(", ") : error.detail;
      throw new Error(msg);
    }

    return response.json();
  }

  // Club form methods
  async getClubForm(clubId: string): Promise<ClubForm> {
    return this.request<ClubForm>(`/clubs/${clubId}/form`);
  }

  async createClubForm(clubId: string, title: string): Promise<ClubForm> {
    return this.request<ClubForm>(`/clubs/${clubId}/form`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }

  async addFormQuestion(
    clubId: string,
    question: { question_text: string; question_type: string; is_required: boolean; order_index?: number }
  ): Promise<FormQuestion> {
    return this.request<FormQuestion>(`/clubs/${clubId}/form/questions`, {
      method: "POST",
      body: JSON.stringify(question),
    });
  }

  async updateFormQuestion(
    clubId: string,
    questionId: string,
    data: Partial<{ question_text: string; question_type: string; is_required: boolean; order_index: number }>
  ): Promise<FormQuestion> {
    return this.request<FormQuestion>(`/clubs/${clubId}/form/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteFormQuestion(clubId: string, questionId: string): Promise<void> {
    await this.request<void>(`/clubs/${clubId}/form/questions/${questionId}`, {
      method: "DELETE",
    });
  }

  // Application submission
  async submitApplication(data: {
    form_id: string;
    answers: Array<{ question_id: string; answer_text: string }>;
    is_draft: boolean;
  }): Promise<ApplicationListResponseItem> {
    return this.request<ApplicationListResponseItem>("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Adapter for ClubApplication.tsx (create mode)
  async submitMemberApplication(data: MemberApplicationRequest, isDraft = false): Promise<ApplicationListResponseItem> {
    let form: ClubForm;
    try {
      form = await this.getClubForm(data.clubId);
    } catch {
      throw new Error("동아리 신청폼을 찾을 수 없습니다.");
    }

    const answers = form.questions.map((q, i) => {
      let answer_text = "";
      if (i === 0) answer_text = data.content.motivation;
      else if (i === 1) answer_text = data.content.experience || "";
      else if (i === 2) answer_text = data.content.questions || "";
      return { question_id: q.id, answer_text };
    });

    return this.request<ApplicationListResponseItem>("/applications", {
      method: "POST",
      body: JSON.stringify({
        form_id: form.id,
        is_draft: isDraft,
        answers,
      }),
    });
  }

  // Adapter for ClubApplication.tsx (edit mode)
  async updateApplication(
    id: string,
    content: ApplicationContent,
    isDraft = false
  ): Promise<{ message: string }> {
    let existingAnswers: Array<{ question_id: string; answer_text: string | null }> = [];
    try {
      // draft 엔드포인트 우선 시도 — 제출 전환 시에도 draft에서 question_id를 가져와야 함
      const detail = await this.getMyDraft(id);
      existingAnswers = detail.answers || [];
    } catch {
      try {
        const detail = await this.getMySubmittedDetail(id);
        existingAnswers = detail.answers || [];
      } catch {
        // ignore
      }
    }

    const answers = existingAnswers.length > 0
      ? existingAnswers.map((a, i) => {
          let answer_text = a.answer_text || "";
          if (i === 0) answer_text = content.motivation;
          else if (i === 1) answer_text = content.experience || "";
          else if (i === 2) answer_text = content.questions || "";
          return { question_id: a.question_id, answer_text };
        })
      : [{ question_id: "", answer_text: content.motivation }];

    return this.request<{ message: string }>(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ answers, is_draft: isDraft }),
    });
  }

  async deleteApplication(id: string): Promise<void> {
    await this.request<void>(`/applications/${id}`, {
      method: "DELETE",
    });
  }

  // Draft methods
  async getMyDrafts(): Promise<ApplicationListResponseItem[]> {
    return this.request<ApplicationListResponseItem[]>("/me/applications/drafts");
  }

  async getMyDraft(id: string): Promise<MyApplicationDetail> {
    return this.request<MyApplicationDetail>(`/me/applications/drafts/${id}`);
  }

  // Submitted application methods
  async getMySubmitted(): Promise<ApplicationListResponseItem[]> {
    return this.request<ApplicationListResponseItem[]>("/me/applications/submitted");
  }

  async getMySubmittedDetail(id: string): Promise<MyApplicationDetail> {
    return this.request<MyApplicationDetail>(`/me/applications/submitted/${id}`);
  }

  // Adapter for ApplicationStatus.tsx
  async getMyApplications(): Promise<ApplicationListResponseItem[]> {
    return this.getMySubmitted();
  }

  // Check if user already applied to a club
  async checkApplicationStatus(clubId: string): Promise<boolean> {
    try {
      const apps = await this.getMySubmitted();
      return apps.some(a => !a.is_draft && String(a.club_id) === String(clubId));
    } catch {
      return false;
    }
  }

  // Get application detail for view/edit (user's own)
  async getApplication(id: string, isDraft = false): Promise<ApplicationDetailResponse> {
    const detail = isDraft
      ? await this.getMyDraft(id)
      : await this.getMySubmittedDetail(id);

    const motivation = detail.answers?.[0]?.answer_text || "";
    const experience = detail.answers?.[1]?.answer_text || "";
    const questionsContent = detail.answers?.[2]?.answer_text || "";

    return {
      id: detail.id,
      club_id: detail.club_id,
      club_name: detail.club_name,
      status: detail.status,
      content: {
        motivation,
        experience: experience || undefined,
        questions: questionsContent || undefined,
      },
      submitted_at: detail.submitted_at,
    };
  }

  // My clubs
  async getMyClubs(): Promise<ActiveClubItem[]> {
    return this.request<ActiveClubItem[]>("/me/clubs");
  }

  // Admin application methods
  async getClubApplications(clubId: string): Promise<AdminApplicationListItem[]> {
    return this.request<AdminApplicationListItem[]>(`/clubs/${clubId}/applications`);
  }

  async getClubApplication(clubId: string, appId: string): Promise<AdminApplicationDetail> {
    return this.request<AdminApplicationDetail>(`/clubs/${clubId}/applications/${appId}`);
  }

  async updateApplicationStatus(
    clubId: string,
    appId: string,
    status: "passed" | "failed"
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/clubs/${clubId}/applications/${appId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // Post methods
  async getPosts(clubId: string | number): Promise<PostListItem[]> {
    return this.request<PostListItem[]>(`/clubs/${clubId}/posts`);
  }

  async getPost(clubId: string | number, postId: string | number): Promise<PostDetail> {
    return this.request<PostDetail>(`/clubs/${clubId}/posts/${postId}`);
  }

  async createPost(clubId: string | number, data: {
    title: string;
    content: string;
    is_notice?: boolean;
  }): Promise<PostListItem> {
    return this.request<PostListItem>(`/clubs/${clubId}/posts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deletePost(clubId: string | number, postId: string | number): Promise<void> {
    await this.request<void>(`/clubs/${clubId}/posts/${postId}`, {
      method: "DELETE",
    });
  }

  async toggleNotice(clubId: string | number, postId: string | number): Promise<PostListItem> {
    return this.request<PostListItem>(`/clubs/${clubId}/posts/${postId}/notice`, {
      method: "PATCH",
    });
  }

  // Comment methods
  async createComment(
    clubId: string | number,
    postId: string | number,
    content: string
  ): Promise<CommentItem> {
    return this.request<CommentItem>(`/clubs/${clubId}/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(
    clubId: string | number,
    postId: string | number,
    commentId: string | number
  ): Promise<void> {
    await this.request<void>(`/clubs/${clubId}/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
