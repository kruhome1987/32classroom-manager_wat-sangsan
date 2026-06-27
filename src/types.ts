/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AttendanceStatus = 'present' | 'late' | 'sick' | 'absent';

export interface Student {
  id: string; // Internal unique ID (e.g., UUID or custom string)
  no: number; // เลขที่ (Student number in class)
  studentId: string; // เลขประจำตัวนักเรียน (School student ID)
  firstName: string; // ชื่อ
  lastName: string; // นามสกุล
  image: string; // Google Drive image link or general web URL
  ethnicity: string; // เชื้อชาติ
  nationality: string; // สัญชาติ
  religion: string; // ศาสนา
  birthday: string; // วันเกิด YYYY-MM-DD
  transport: string; // การเดินทางมาโรงเรียน
  allowance: number; // เงินที่ได้มาโรงเรียน (บาท)
  parentPhone: string; // เบอร์โทรศัพท์ผู้ปกครอง
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  records: Record<string, AttendanceStatus>; // Key is Student.id, value is AttendanceStatus
}

export interface TeacherSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  accessToken: string | null;
  isSandbox: boolean; // True if using offline local simulation mode
}
