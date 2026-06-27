/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, AlertTriangle, XCircle, Calendar, 
  Search, CheckCheck, Save, Sparkles, RefreshCw
} from 'lucide-react';
import { Student, AttendanceStatus, AttendanceRecord } from '../types';

interface AttendanceCheckerProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onSaveAttendance: (date: string, records: Record<string, AttendanceStatus>) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isSyncing: boolean;
}

export default function AttendanceChecker({
  students,
  attendanceRecords,
  onSaveAttendance,
  selectedDate,
  setSelectedDate,
  isSyncing
}: AttendanceCheckerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'sick' | 'absent' | 'unchecked'>('all');
  
  // Local active checklist: maps student.id -> status
  const [localRecords, setLocalRecords] = useState<Record<string, AttendanceStatus>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with prop records when date or saved data changes
  useEffect(() => {
    const savedRecord = attendanceRecords.find(r => r.date === selectedDate);
    const initialRecords: Record<string, AttendanceStatus> = {};
    
    // Load existing records or default to empty
    students.forEach(s => {
      if (savedRecord && savedRecord.records[s.id]) {
        initialRecords[s.id] = savedRecord.records[s.id];
      }
    });
    
    setLocalRecords(initialRecords);
    setHasChanges(false);
  }, [selectedDate, attendanceRecords, students]);

  // Handle setting status for a student
  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setLocalRecords(prev => {
      const updated = { ...prev, [studentId]: status };
      setHasChanges(true);
      return updated;
    });
  };

  // Mark all students as present (Fast check-in)
  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      updated[s.id] = 'present';
    });
    setLocalRecords(updated);
    setHasChanges(true);
  };

  // Quick Clear checklist
  const handleClearAll = () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตประวัติการเช็คชื่อของวันนี้ใหม่ทั้งหมด?')) {
      setLocalRecords({});
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    const checkedCount = Object.keys(localRecords).length;
    if (checkedCount < students.length) {
      const confirmSave = confirm(
        `⚠️ เช็คชื่อไม่ครบจำนวน: คุณเช็คชื่อไปแล้ว ${checkedCount} จาก ${students.length} คน ต้องการบันทึกข้อมูลแบบนี้ต่อไปหรือไม่? (นักเรียนที่ไม่ได้เช็คชื่อจะถูกข้าม)`
      );
      if (!confirmSave) return;
    }

    onSaveAttendance(selectedDate, localRecords);
    setHasChanges(false);
  };

  // Metrics
  const totalStudents = students.length;
  const checkedStudents = Object.keys(localRecords).length;
  const presentCount = Object.values(localRecords).filter(s => s === 'present').length;
  const lateCount = Object.values(localRecords).filter(s => s === 'late').length;
  const sickCount = Object.values(localRecords).filter(s => s === 'sick').length;
  const absentCount = Object.values(localRecords).filter(s => s === 'absent').length;

  // Filter students
  const filteredStudents = students.filter(s => {
    // 1. Text Search filter
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          s.studentId.includes(searchTerm) || 
                          s.no.toString() === searchTerm;
    
    // 2. Status Filter
    const currentStatus = localRecords[s.id];
    let matchesStatus = true;
    if (statusFilter === 'unchecked') {
      matchesStatus = !currentStatus;
    } else if (statusFilter !== 'all') {
      matchesStatus = currentStatus === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Controller Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Date Picker Input */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-150/40 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 block">เลือกวันที่บันทึกการเรียน</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-bold text-slate-850 text-base focus:outline-none bg-transparent cursor-pointer border-b border-dashed border-slate-300 pb-0.5 hover:border-indigo-500"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          <button
            onClick={handleMarkAllPresent}
            className="h-11 px-4 border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-semibold rounded-2xl text-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>เช็คมาเรียนทุกคน</span>
          </button>

          <button
            onClick={handleClearAll}
            className="h-11 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
          >
            ล้างทั้งหมด
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges && !isSyncing}
            className={`h-11 px-5 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/5 active:scale-98 transition-all ${
              hasChanges 
                ? 'bg-indigo-600 text-white shadow-indigo-600/10 hover:bg-indigo-700' 
                : 'bg-slate-100 text-slate-400 border border-slate-150 cursor-not-allowed'
            }`}
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Save className="w-4 h-4 text-white" />
            )}
            <span>{isSyncing ? 'กำลังบันทึก...' : 'บันทึกข้อมูลวันนี้'}</span>
          </button>

        </div>
      </div>

      {/* Progress & Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Checked vs Unchecked Gauge */}
        <div className="col-span-2 bg-white border border-slate-200 p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">เช็คชื่อแล้ววันนี้</span>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
              {checkedStudents} <span className="text-sm font-medium text-slate-400">/ {totalStudents} คน</span>
            </h3>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1.5">
              คิดเป็น {(checkedStudents / (totalStudents || 1) * 100).toFixed(0)}% ของนักเรียนทั้งหมด
            </span>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-indigo-600" strokeWidth="3" strokeDasharray={`${(checkedStudents / (totalStudents || 1) * 100).toFixed(0)}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute text-xs font-bold text-indigo-700">
              {(checkedStudents / (totalStudents || 1) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Small metric statuses */}
        <div className="bg-emerald-50/50 border border-emerald-100/40 p-4 rounded-3xl">
          <span className="text-[10px] font-bold text-emerald-600 block uppercase">มาเรียน</span>
          <h4 className="text-2xl font-bold text-emerald-700 mt-0.5">{presentCount}</h4>
          <span className="text-[9px] text-emerald-600/80 mt-1 block">กดเช็คเป็นปกติ</span>
        </div>

        <div className="bg-amber-50/50 border border-amber-100/40 p-4 rounded-3xl">
          <span className="text-[10px] font-bold text-amber-600 block uppercase">สาย</span>
          <h4 className="text-2xl font-bold text-amber-700 mt-0.5">{lateCount}</h4>
          <span className="text-[9px] text-amber-600/80 mt-1 block">เข้าแถวสาย</span>
        </div>

        <div className="bg-blue-50/50 border border-blue-100/40 p-4 rounded-3xl">
          <span className="text-[10px] font-bold text-blue-600 block uppercase">ลาป่วย</span>
          <h4 className="text-2xl font-bold text-blue-700 mt-0.5">{sickCount}</h4>
          <span className="text-[9px] text-blue-600/80 mt-1 block">มีใบลาผู้ปกครอง</span>
        </div>

      </div>

      {/* Checklist Search & Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือเลขที่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-xs placeholder:text-slate-400"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500 w-full">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 hover:bg-slate-100'}`}
          >
            แสดงทั้งหมด ({totalStudents})
          </button>
          <button
            onClick={() => setStatusFilter('unchecked')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer ${statusFilter === 'unchecked' ? 'bg-slate-900 text-white' : 'bg-slate-50 hover:bg-slate-100'}`}
          >
            ยังไม่ได้เช็ค ({totalStudents - checkedStudents})
          </button>
          <button
            onClick={() => setStatusFilter('present')}
            className={`px-3 py-1.5 rounded-xl text-emerald-700 cursor-pointer ${statusFilter === 'present' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 hover:bg-emerald-100/50'}`}
          >
            มาเรียน ({presentCount})
          </button>
          <button
            onClick={() => setStatusFilter('late')}
            className={`px-3 py-1.5 rounded-xl text-amber-700 cursor-pointer ${statusFilter === 'late' ? 'bg-amber-500 text-white' : 'bg-amber-50 hover:bg-amber-100/50'}`}
          >
            สาย ({lateCount})
          </button>
          <button
            onClick={() => setStatusFilter('sick')}
            className={`px-3 py-1.5 rounded-xl text-blue-700 cursor-pointer ${statusFilter === 'sick' ? 'bg-blue-500 text-white' : 'bg-blue-50 hover:bg-blue-100/50'}`}
          >
            ลาป่วย ({sickCount})
          </button>
          <button
            onClick={() => setStatusFilter('absent')}
            className={`px-3 py-1.5 rounded-xl text-red-700 cursor-pointer ${statusFilter === 'absent' ? 'bg-red-500 text-white' : 'bg-red-50 hover:bg-red-100/50'}`}
          >
            ขาด ({absentCount})
          </button>
        </div>
      </div>

      {/* Main Checklist Card List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
          <p className="text-slate-500 text-sm">ไม่พบนร. ในกลุ่มที่กรอง</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => {
              const currentStatus = localRecords[student.id];
              return (
                <div 
                  key={student.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Name and avatar */}
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                      {student.no}
                    </span>
                    <img 
                      src={student.image} 
                      alt={student.firstName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {student.firstName} {student.lastName}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {student.studentId}</span>
                    </div>
                  </div>

                  {/* 4-State Buttons (Responsive layout) */}
                  <div className="grid grid-cols-4 gap-2 w-full sm:w-auto sm:min-w-[340px]">
                    
                    {/* Present Button */}
                    <button
                      onClick={() => setStudentStatus(student.id, 'present')}
                      className={`h-10 px-1 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 cursor-pointer border transition-all ${
                        currentStatus === 'present'
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/15'
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <CheckCircle className={`w-4 h-4 ${currentStatus === 'present' ? 'text-white' : 'text-emerald-500'}`} />
                      <span className="text-[9px]">มาเรียน</span>
                    </button>

                    {/* Late Button */}
                    <button
                      onClick={() => setStudentStatus(student.id, 'late')}
                      className={`h-10 px-1 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 cursor-pointer border transition-all ${
                        currentStatus === 'late'
                          ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/15'
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <Clock className={`w-4 h-4 ${currentStatus === 'late' ? 'text-white' : 'text-amber-500'}`} />
                      <span className="text-[9px]">สาย</span>
                    </button>

                    {/* Sick Button */}
                    <button
                      onClick={() => setStudentStatus(student.id, 'sick')}
                      className={`h-10 px-1 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 cursor-pointer border transition-all ${
                        currentStatus === 'sick'
                          ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/15'
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <AlertTriangle className={`w-4 h-4 ${currentStatus === 'sick' ? 'text-white' : 'text-blue-500'}`} />
                      <span className="text-[9px]">ป่วย</span>
                    </button>

                    {/* Absent Button */}
                    <button
                      onClick={() => setStudentStatus(student.id, 'absent')}
                      className={`h-10 px-1 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 cursor-pointer border transition-all ${
                        currentStatus === 'absent'
                          ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/15'
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <XCircle className={`w-4 h-4 ${currentStatus === 'absent' ? 'text-white' : 'text-red-500'}`} />
                      <span className="text-[9px]">ขาด</span>
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky Bottom Save Alert Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-950 border border-indigo-850 text-white rounded-3xl px-6 py-4 flex items-center justify-between gap-6 shadow-2xl shadow-indigo-950/30 max-w-lg w-[calc(100%-2rem)] z-40 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></div>
            <p className="text-xs font-semibold">มีข้อมูลที่มีการเปลี่ยนแปลง ควรรีบบันทึกข้อมูลประจำวัน</p>
          </div>
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md cursor-pointer flex items-center gap-1 active:scale-95 transition-all border border-indigo-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>บันทึกข้อมูลด่วน</span>
          </button>
        </div>
      )}

    </div>
  );
}
