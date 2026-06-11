export interface Document {
  id: string;
  docCode: string; // Mã tài liệu, ví dụ: EN-WI1124
  docName: string; // Tên tài liệu, ví dụ: P011534_A
  docType: string; // Loại: Bản gốc, Bản sao...
  currentRev: string; // Rev hiện hành: 00, 01, A, A1...
  issueDate: string; // ISO date string
  customer?: string; // Khách hàng
  aspPn?: string; // ASP P/N
  createdAt: string;
  updatedAt: string;
}

export interface Distribution {
  id: string;
  docCode: string;
  docName: string;
  rev: string;
  employeeId: string;
  dept: string;
  fullName: string;
  distributionDate: string; // ISO date string
  recalled: boolean;
  recalledDate: string | null;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeId: string; // MSNV, ví dụ: ASP0684
  fullName: string;
  dept: string;
  email: string; // Nhập thủ công, dùng để gửi EmailJS
  createdAt: string;
}

export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface AppSettings {
  emailjs: EmailJSConfig;
}
