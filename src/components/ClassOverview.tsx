/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Image as ImageIcon, Sparkles, TrendingUp, Users, 
  Wallet, Bike, Share2, ClipboardList, HelpCircle
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { generateDailyReportCard, formatThaiDate } from './ReportCardGenerator';

interface ClassOverviewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
}

export default function ClassOverview({
  students,
  attendanceRecords,
  selectedDate
}: ClassOverviewProps) {
  const [reportCardImg, setReportCardImg] = useState<string>('');
  const [renderedDate, setRenderedDate] = useState<string>('');

  // 1. Calculate active date stats
  const activeRecord = attendanceRecords.find(r => r.date === selectedDate);
  const activeRecordsMap = activeRecord?.records || {};

  const total = students.length;
  const present = Object.values(activeRecordsMap).filter(s => s === 'present').length;
  const late = Object.values(activeRecordsMap).filter(s => s === 'late').length;
  const sick = Object.values(activeRecordsMap).filter(s => s === 'sick').length;
  const absent = Object.values(activeRecordsMap).filter(s => s === 'absent').length;
  const checked = Object.keys(activeRecordsMap).length;

  const presentPercentage = total > 0 ? ((present + late) / total) * 100 : 0;

  // 2. Profile Metrics
  // Daily allowance stats
  const totalAllowance = students.reduce((acc, s) => acc + (s.allowance || 0), 0);
  const avgAllowance = total > 0 ? (totalAllowance / total).toFixed(1) : '0';

  // Transport distribution stats
  const transportCounts: Record<string, number> = {};
  students.forEach(s => {
    const t = s.transport || 'ไม่ได้ระบุ';
    transportCounts[t] = (transportCounts[t] || 0) + 1;
  });
  let topTransport = 'ไม่ได้ระบุ';
  let topTransportCount = 0;
  Object.entries(transportCounts).forEach(([t, count]) => {
    if (count > topTransportCount) {
      topTransport = t;
      topTransportCount = count;
    }
  });

  // 3. Historical trends (last 5 dates with attendance records)
  const sortedRecords = [...attendanceRecords]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-5);

  // 4. Generate daily report card PNG on change
  useEffect(() => {
    if (students.length > 0) {
      const stats = { present, late, sick, absent, total };
      const imgDataUrl = generateDailyReportCard(selectedDate, stats, students, activeRecordsMap);
      setReportCardImg(imgDataUrl);
      setRenderedDate(selectedDate);
    }
  }, [selectedDate, attendanceRecords, students, present, late, sick, absent]);

  // Handle saving the report card image
  const handleDownloadReport = () => {
    if (!reportCardImg) return;
    const link = document.createElement('a');
    link.href = reportCardImg;
    link.download = `รายงานเข้าเรียน_ป3-2_วัดแสงสรรค์_${selectedDate}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      
      {/* Visual Title Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white relative overflow-hidden shadow-md border border-indigo-950/40">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-indigo-800 opacity-25 blur-xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-indigo-300 tracking-widest bg-indigo-950/60 border border-indigo-850 px-2.5 py-1 rounded-full uppercase">
              ระบบประเมินสถิติรายวัน
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2.5">
              สรุปภาพรวมการเรียน ชั้น ป.3/2
            </h2>
            <p className="text-indigo-200 text-xs md:text-sm mt-1">
              โรงเรียนวัดแสงสรรค์ • สถิติประมวลผลความพร้อมของนักเรียนประจำวัน
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 self-start sm:self-center text-xs">
            <ClipboardList className="w-4 h-4 text-indigo-300" />
            <div>
              <span className="text-white/60 block text-[9px] uppercase">วันที่ตรวจสถิติ</span>
              <span className="font-bold text-white">{formatThaiDate(selectedDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Bento Stats & Canvas Image Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Bento Analytics (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Bento 1: Attendance Gauge */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">อัตราการมาเรียน</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="my-5 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800">
                  {presentPercentage.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400 font-semibold">ในวันนี้</span>
              </div>
              
              {/* Simple progress bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${presentPercentage}%` }}
                ></div>
              </div>
              
              <p className="text-[10px] text-slate-500 mt-3 font-semibold">
                *อัตราคำนวณจากยอดผู้ลงชื่อ มาเรียน และ ลาสาย รวมกัน
              </p>
            </div>

            {/* Bento 2: Student Registry Size */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">ประชากรห้องเรียน</span>
                <Users className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <div className="my-5">
                <h4 className="text-4xl font-black text-slate-800">{total} คน</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">นักเรียนทั้งหมดในทะเบียนชั้น</p>
              </div>
              <div className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-100/40 px-2.5 py-1.5 rounded-xl flex items-center justify-between">
                <span>ความหนาแน่นห้องเรียน:</span>
                <span>เหมาะสมดี</span>
              </div>
            </div>

            {/* Bento 3: Allowance stats */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">เงินมาเรียนเฉลี่ย</span>
                <Wallet className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <div className="my-5">
                <h4 className="text-4xl font-black text-slate-800">{avgAllowance} ฿</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">ได้รับเงินค่าอาหาร/ขนมต่อวันเฉลี่ย</p>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                *ข้อมูลนำไปปรับและใช้ในโครงการพัฒนาทักษะการเงิน
              </p>
            </div>

            {/* Bento 4: Top Transport */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">การเดินทางยอดนิยม</span>
                <Bike className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div className="my-5">
                <h4 className="text-2xl font-black text-slate-800 truncate">{topTransport}</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">วิธีการเดินทางมา รร. สูงสุด ({topTransportCount} คน)</p>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                *สถิตินี้ใช้สนับสนุนมาตรการความปลอดภัยจราจรหน้า รร.
              </div>
            </div>

          </div>

          {/* Historical Bar Chart (Trend) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">แนวโน้มอัตราการเข้าเรียน ย้อนหลัง 5 วัน</h4>
                <p className="text-[10px] text-slate-400">เปรียบเทียบเปอร์เซ็นต์นักเรียนมาเข้าชั้นเรียนปกติ</p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>

            {sortedRecords.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                ไม่มีข้อมูลประวัติย้อนหลังบันทึกอยู่ในระบบ
              </div>
            ) : (
              <div className="flex items-end justify-between gap-4 h-36 pt-4 px-2">
                {sortedRecords.map((record, idx) => {
                  const recTotal = students.length;
                  const recPresent = Object.values(record.records).filter(s => s === 'present' || s === 'late').length;
                  const recPercent = recTotal > 0 ? (recPresent / recTotal) * 100 : 0;
                  
                  // Extract simple short date for labels (DD/MM)
                  const dateParts = record.date.split('-');
                  const label = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : record.date;

                  return (
                    <div key={idx} className="flex flex-col items-center flex-grow group">
                      <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                        {recPercent.toFixed(0)}%
                      </span>
                      {/* Visual Bar */}
                      <div className="w-full max-w-[24px] bg-slate-50 hover:bg-slate-100 h-28 rounded-md flex items-end overflow-hidden border border-slate-100">
                        <div 
                          className="bg-indigo-600 w-full rounded-t-md transition-all duration-500"
                          style={{ height: `${recPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 mt-2">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: LINE Share Card Preview & Download (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200/60 rounded-3xl p-6 flex flex-col items-center">
          
          {/* Section Description */}
          <div className="text-center w-full mb-6">
            <h4 className="font-extrabold text-slate-800 text-sm">การแชร์ข้อมูลรายงาน (กลุ่ม LINE)</h4>
            <p className="text-[10px] text-slate-500 mt-1">
              ภาพอินโฟกราฟิกรองรับความละเอียดสูง คมชัดสวยงาม สบายตาสำหรับผู้ปกครองใน LINE
            </p>
          </div>

          {/* Visual Canvas Image Preview Container */}
          <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative group">
            {reportCardImg ? (
              <img 
                src={reportCardImg} 
                alt="LINE Report Preview" 
                className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="aspect-[4/5] flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-100">
                <ImageIcon className="w-12 h-12 stroke-1 text-slate-300 mb-3" />
                <p className="text-xs font-semibold">กำลังประมวลผลรูปภาพรายงาน...</p>
              </div>
            )}
            
            {/* Live Indicator overlay */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
              <span>LIVE PREVIEW</span>
            </div>
          </div>

          {/* Guidelines on sharing */}
          <div className="mt-5 text-[10px] text-slate-400 leading-relaxed text-center max-w-xs">
            💡 <strong>วิธีแชร์:</strong> กดปุ่มดาวน์โหลดรายงาน สีน้ำเงินเด่น ด้านล่างเพื่อเซฟรูปลงเครื่อง แล้วทำการวางหรือแนบไฟล์รูปนี้ส่งเข้ากลุ่ม LINE ผู้ปกครองได้ทันที!
          </div>

          {/* Large prominent CTA share button */}
          <button
            onClick={handleDownloadReport}
            className="w-full max-w-[320px] h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-98 mt-6 border border-indigo-500/10"
          >
            <Download className="w-5 h-5 text-white stroke-2" />
            <span>ดาวน์โหลดรูปสรุปประจำวัน</span>
          </button>

        </div>
      </div>

    </div>
  );
}
