/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ClipboardCheck, Users, LogOut, RefreshCw, 
  Cloud, CloudOff, Database, HelpCircle, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Custom Components
import LoginScreen from './components/LoginScreen';
import ClassOverview from './components/ClassOverview';
import AttendanceChecker from './components/AttendanceChecker';
import StudentManager from './components/StudentManager';

// Helpers & Types
import { Student, AttendanceRecord, AttendanceStatus, TeacherSession } from './types';
import { checkAuthState, signOutSession, checkAuthState as initAuth } from './auth';
import { 
  findOrCreateSpreadsheet, 
  loadStudentsFromSheet, 
  saveStudentsToSheet, 
  loadAttendanceFromSheet, 
  saveAllAttendanceToSheet 
} from './googleSheets';

// 6 Default Mock Students for Grade 3/2 Wat Sangsan School
const INITIAL_MOCK_STUDENTS: Student[] = [
  {
    id: 'stud-1',
    no: 1,
    studentId: '10301',
    firstName: 'ด.ช. กิตติพงษ์',
    lastName: 'รักดี',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
    ethnicity: 'ไทย',
    nationality: 'ไทย',
    religion: 'พุทธ',
    birthday: '2017-05-12',
    transport: 'รถผู้ปกครอง',
    allowance: 40,
    parentPhone: '089-123-4567'
  },
  {
    id: 'stud-2',
    no: 2,
    studentId: '10302',
    firstName: 'ด.ช. ณัฐวุฒิ',
    lastName: 'นามดี',
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150',
    ethnicity: 'ไทย',
    nationality: 'ไทย',
    religion: 'พุทธ',
    birthday: '2017-09-20',
    transport: 'รถตู้โรงเรียน',
    allowance: 50,
    parentPhone: '081-987-6543'
  },
  {
    id: 'stud-3',
    no: 3,
    studentId: '10303',
    firstName: 'ด.ญ. พรประภา',
    lastName: 'แสงแก้ว',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=150',
    ethnicity: 'ไทย',
    nationality: 'ไทย',
    religion: 'พุทธ',
    birthday: '2018-01-05',
    transport: 'เดินเท้า',
    allowance: 30,
    parentPhone: '086-456-7890'
  },
  {
    id: 'stud-4',
    no: 4,
    studentId: '10304',
    firstName: 'ด.ญ. สุดารัตน์',
    lastName: 'มีมาก',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=150',
    ethnicity: 'ไทย',
    nationality: 'ไทย',
    religion: 'พุทธ',
    birthday: '2017-11-15',
    transport: 'รถจักรยานยนต์',
    allowance: 40,
    parentPhone: '085-333-2211'
  },
  {
    id: 'stud-5',
    no: 5,
    studentId: '10305',
    firstName: 'ด.ช. ธนพล',
    lastName: 'เพิ่มบุญ',
    image: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=150',
    ethnicity: 'ไทย',
    nationality: 'ไทย',
    religion: 'พุทธ',
    birthday: '2017-03-30',
    transport: 'รถผู้ปกครอง',
    allowance: 60,
    parentPhone: '082-777-8899'
  },
  {
    id: 'stud-6',
    no: 6,
    studentId: '10306',
    firstName: 'ด.ญ. อลิสา',
    lastName: 'คิงส์',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    ethnicity: 'ไทย-อังกฤษ',
    nationality: 'ไทย',
    religion: 'คริสต์',
    birthday: '2017-07-14',
    transport: 'รถผู้ปกครอง',
    allowance: 100,
    parentPhone: '094-111-2222'
  }
];

export default function App() {
  const [session, setSession] = useState<TeacherSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'students'>('dashboard');

  // Application Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  // App settings/status states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [googleSpreadsheetId, setGoogleSpreadsheetId] = useState<string | null>(null);

  // Initialize selected date as local YYYY-MM-DD
  useEffect(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000; // in ms
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
    setSelectedDate(localISOTime);
  }, []);

  // 1. Initial Authentication state listener
  useEffect(() => {
    const unsubscribePromise = checkAuthState(
      (activeSession) => {
        setSession(activeSession);
        setAuthChecked(true);
      },
      () => {
        setSession(null);
        setAuthChecked(true);
      }
    );

    return () => {
      unsubscribePromise.then(unsub => unsub());
    };
  }, []);

  // 2. Fetch and load database depending on session status (Sandbox vs Real Google Sheet)
  useEffect(() => {
    if (!authChecked) return;

    if (session) {
      if (session.isSandbox) {
        // Load data from LocalStorage
        loadLocalSandboxData();
      } else {
        // Logged in with Google, trigger Google Sheets synchronization
        syncWithGoogleSheets(session.accessToken!);
      }
    } else {
      // Not logged in, clear active data
      setStudents([]);
      setAttendanceRecords([]);
      setGoogleSpreadsheetId(null);
    }
  }, [session, authChecked]);

  // Load from local storage for offline Sandbox simulation
  const loadLocalSandboxData = () => {
    const cachedStudents = localStorage.getItem('wat_sangsan_students');
    const cachedAttendance = localStorage.getItem('wat_sangsan_attendance');

    if (cachedStudents) {
      try {
        setStudents(JSON.parse(cachedStudents));
      } catch (e) {
        setStudents(INITIAL_MOCK_STUDENTS);
      }
    } else {
      setStudents(INITIAL_MOCK_STUDENTS);
      localStorage.setItem('wat_sangsan_students', JSON.stringify(INITIAL_MOCK_STUDENTS));
    }

    if (cachedAttendance) {
      try {
        setAttendanceRecords(JSON.parse(cachedAttendance));
      } catch (e) {
        setAttendanceRecords([]);
      }
    } else {
      setAttendanceRecords([]);
    }
  };

  // Main Google Sheets Sync logic
  const syncWithGoogleSheets = async (token: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      // 1. Find or create the master spreadsheet
      const spreadsheetId = await findOrCreateSpreadsheet(token);
      setGoogleSpreadsheetId(spreadsheetId);

      // 2. Load Students from Sheet
      let studentsList = await loadStudentsFromSheet(token, spreadsheetId);
      if (studentsList.length === 0) {
        // Sheet is empty, initialize with mock students
        await saveStudentsToSheet(token, spreadsheetId, INITIAL_MOCK_STUDENTS);
        studentsList = INITIAL_MOCK_STUDENTS;
      }
      setStudents(studentsList);

      // 3. Load Attendance Records
      const attendanceList = await loadAttendanceFromSheet(token, spreadsheetId);
      setAttendanceRecords(attendanceList);

      triggerNotification('เชื่อมต่อและดึงข้อมูลจาก Google Sheets สำเร็จ!');
    } catch (err: any) {
      console.error(err);
      setSyncError('ไม่สามารถเชื่อมต่อฐานข้อมูล Google Sheets ได้: ' + (err.message || 'เน็ตเวิร์กขัดข้อง'));
      // Fallback to local cache so the app still functions seamlessly
      loadLocalSandboxData();
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerNotification = (msg: string) => {
    setSyncSuccessMsg(msg);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  // Save attendance record (Present/Late/Sick/Absent)
  const handleSaveAttendance = async (date: string, recordsMap: Record<string, AttendanceStatus>) => {
    setIsSyncing(true);
    setSyncError(null);

    // Update in-memory state
    const newRecord: AttendanceRecord = { date, records: recordsMap };
    const filteredRecords = attendanceRecords.filter(r => r.date !== date);
    const updatedRecords = [...filteredRecords, newRecord];
    setAttendanceRecords(updatedRecords);

    // Save to localStorage (acting as local cache/fallback)
    localStorage.setItem('wat_sangsan_attendance', JSON.stringify(updatedRecords));

    if (session && !session.isSandbox && googleSpreadsheetId) {
      // Sync with Google Sheets
      try {
        await saveAllAttendanceToSheet(session.accessToken!, googleSpreadsheetId, updatedRecords);
        triggerNotification('บันทึกและอัปโหลดประวัติการเช็คชื่อเข้า Google Sheets สำเร็จ!');
      } catch (err: any) {
        console.error(err);
        setSyncError('เซฟข้อมูลสำเร็จในเครื่อง แต่ไม่สามารถอัปโหลดเข้า Google Sheet ได้: ' + err.message);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSyncing(false);
      triggerNotification('บันทึกข้อมูลในเครื่อง (สาธิต) สำเร็จ!');
    }
  };

  // Student Registry mutations
  const handleAddStudent = async (newStudent: Student) => {
    setIsSyncing(true);
    const updated = [...students, newStudent].sort((a, b) => a.no - b.no);
    setStudents(updated);
    localStorage.setItem('wat_sangsan_students', JSON.stringify(updated));

    if (session && !session.isSandbox && googleSpreadsheetId) {
      try {
        await saveStudentsToSheet(session.accessToken!, googleSpreadsheetId, updated);
        triggerNotification(`เพิ่มรายชื่อ ด.ช./ด.ญ. ${newStudent.firstName} สำเร็จ!`);
      } catch (err: any) {
        setSyncError('บันทึกสำเร็จในเครื่อง แต่ล้มเหลวในการส่งเข้า Google Sheets: ' + err.message);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSyncing(false);
      triggerNotification(`เพิ่มรายชื่อ ด.ช./ด.ญ. ${newStudent.firstName} สำเร็จ!`);
    }
  };

  const handleEditStudent = async (editedStudent: Student) => {
    setIsSyncing(true);
    const updated = students.map(s => s.id === editedStudent.id ? editedStudent : s).sort((a, b) => a.no - b.no);
    setStudents(updated);
    localStorage.setItem('wat_sangsan_students', JSON.stringify(updated));

    if (session && !session.isSandbox && googleSpreadsheetId) {
      try {
        await saveStudentsToSheet(session.accessToken!, googleSpreadsheetId, updated);
        triggerNotification(`แก้ไขข้อมูล ${editedStudent.firstName} สำเร็จ!`);
      } catch (err: any) {
        setSyncError('ปรับปรุงสำเร็จในเครื่อง แต่ไม่สามารถบันทึกเข้า Google Sheets: ' + err.message);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSyncing(false);
      triggerNotification(`แก้ไขข้อมูล ${editedStudent.firstName} สำเร็จ!`);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    setIsSyncing(true);
    const updated = students.filter(s => s.id !== id);
    setStudents(updated);
    localStorage.setItem('wat_sangsan_students', JSON.stringify(updated));

    if (session && !session.isSandbox && googleSpreadsheetId) {
      try {
        await saveStudentsToSheet(session.accessToken!, googleSpreadsheetId, updated);
        triggerNotification('ลบข้อมูลนักเรียนออกจากห้องเรียนสำเร็จ!');
      } catch (err: any) {
        setSyncError('ลบสำเร็จในเครื่อง แต่ไม่สามารถแก้ไขใน Google Sheets: ' + err.message);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSyncing(false);
      triggerNotification('ลบข้อมูลนักเรียนออกจากระบบสำเร็จ!');
    }
  };

  const handleLogout = async () => {
    if (confirm('คุณต้องการออกจากระบบการจัดการห้องเรียนหรือไม่?')) {
      await signOutSession();
      setSession(null);
      setActiveTab('dashboard');
    }
  };

  // Loading indicator for checking auth state on mount
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600 font-bold text-sm">กำลังเปิดระบบกรุณารอสักครู่...</p>
      </div>
    );
  }

  // Not logged in -> Show portal landing & choice page
  if (!session) {
    return <LoginScreen onLoginSuccess={(activeSession) => setSession(activeSession)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12 selection:bg-indigo-100">
      
      {/* Sticky Main Header bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              ป.3/2
            </div>
            <div className="hidden sm:block">
              <h1 className="font-extrabold text-slate-800 text-sm tracking-wide">ห้องเรียน 3/2 วัดแสงสรรค์</h1>
              <p className="text-[10px] text-slate-400 font-medium">โรงเรียนวัดแสงสรรค์ อ.ธัญบุรี</p>
            </div>
          </div>

          {/* Sync Indicators */}
          <div className="flex items-center gap-4">
            
            {/* Status indicators */}
            {session.isSandbox ? (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-slate-600">
                <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-bold">โหมดสาธิต (ออฟไลน์)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full text-emerald-800">
                <Cloud className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="text-[10px] font-bold">เชื่อมต่อ Google Sheet</span>
              </div>
            )}

            {/* Syncing Loading state spinner */}
            {isSyncing && (
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[10px] bg-indigo-50 border border-indigo-100/50 px-2.5 py-1.5 rounded-full">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>กำลังทำงาน...</span>
              </div>
            )}

            {/* Teacher Profile / Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-100">
              {session.photoURL ? (
                <img 
                  src={session.photoURL} 
                  alt={session.displayName || 'ครู'} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {(session.displayName || 'T')[0]}
                </div>
              )}
              <div className="hidden md:block">
                <span className="text-xs font-bold text-slate-700 block max-w-[120px] truncate">
                  {session.displayName || 'คุณครูประจำชั้น'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-xl cursor-pointer transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Navigation tabs sticky under main header */}
      <nav className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-center p-2">
          <div className="grid grid-cols-3 bg-slate-50 border border-slate-200/60 p-1 rounded-2xl w-full">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 ${
                activeTab === 'dashboard' 
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>ภาพรวมสถิติ</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 ${
                activeTab === 'attendance' 
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>เช็คชื่อประจำวัน</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 ${
                activeTab === 'students' 
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ทะเบียนนักเรียน</span>
            </button>

          </div>
        </div>
      </nav>

      {/* Floating Notifications Alert Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4 space-y-2 z-20 relative">
        {syncError && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-2xl flex items-center justify-between gap-4 animate-fade-in shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
              <p className="font-semibold">{syncError}</p>
            </div>
            <button 
              onClick={() => setSyncError(null)}
              className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
            >
              ปิด
            </button>
          </div>
        )}

        {syncSuccessMsg && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs rounded-r-2xl flex items-center gap-2 animate-fade-in shadow-sm">
            <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 text-emerald-600" />
            <p className="font-bold">{syncSuccessMsg}</p>
          </div>
        )}
      </div>

      {/* Main Container Core Views (Bento Grid Style) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-grow w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="focus:outline-none"
          >
            {activeTab === 'dashboard' && (
              <ClassOverview 
                students={students}
                attendanceRecords={attendanceRecords}
                selectedDate={selectedDate}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceChecker 
                students={students}
                attendanceRecords={attendanceRecords}
                onSaveAttendance={handleSaveAttendance}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                isSyncing={isSyncing}
              />
            )}

            {activeTab === 'students' && (
              <StudentManager 
                students={students}
                onAddStudent={handleAddStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
