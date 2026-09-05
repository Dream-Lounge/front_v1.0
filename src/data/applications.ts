export interface Application {
  id: string;
  studentId: string | number;
  clubId: string;
  clubName: string;
  clubImage: string;
  category: string;
  status: "pending" | "accepted" | "rejected" | "held";
  rawStatus?: string;
  appliedDate: string;
  message: string;
  adminComment?: string;
}

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: "1",
    studentId: 20240001,
    clubId: "6",
    clubName: "CPR (CJU Public Relation)",
    clubImage: "https://placehold.co/160x160/e2e8f0/1e293b?text=CPR",
    category: "학술",
    status: "pending",
    appliedDate: "2025.10.01",
    message: "지원서가 성공적으로 접수되었습니다. 현재 운영진이 서류를 꼼꼼히 검토하고 있습니다. 결과 발표까지 조금만 기다려주세요!",
  },
  {
    id: "2",
    studentId: 20240002,
    clubId: "2",
    clubName: "디지털 아트 크리에이터",
    clubImage: "https://placehold.co/160x160/e2e8f0/1e293b?text=Art",
    category: "문화예술",
    status: "accepted",
    appliedDate: "2025.09.28",
    message: "축하합니다! 서류 전형에 합격하셨습니다. 향후 면접 일정 및 자세한 안내 사항은 가입하신 이메일로 발송되었습니다.",
  },
  {
    id: "3",
    studentId: 20240001,
    clubId: "3",
    clubName: "경제 분석 연구회",
    clubImage: "https://placehold.co/160x160/e2e8f0/1e293b?text=Economy",
    category: "학술연구",
    status: "rejected",
    appliedDate: "2025.09.25",
    message: "지원해주셔서 감사합니다. 아쉽게도 이번 모집에서는 함께하지 못하게 되었습니다. 귀하의 앞날에 무궁한 발전이 있기를 기원합니다.",
  },
  {
    id: "4",
    studentId: 20240001,
    clubId: "2",
    clubName: "디지털 아트 크리에이터",
    clubImage: "https://placehold.co/160x160/e2e8f0/1e293b?text=Art",
    category: "문화예술",
    status: "held",
    appliedDate: "2025.09.20",
    message: "지원서를 검토한 결과, 추가 확인이 필요하여 현재 보류 상태입니다. 결과가 확정되면 별도로 안내드리겠습니다.",
  },
];
