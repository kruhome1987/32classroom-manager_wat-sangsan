/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, GraduationCap, LayoutDashboard, Calendar, ClipboardCheck, ArrowRight } from 'lucide-react';
import { TeacherSession } from '../types';
import { signInWithGoogle, startSandboxSession } from '../auth';

interface LoginScreenProps {
  onLoginSuccess: (session: TeacherSession) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await signInWithGoogle();
      onLoginSuccess(session);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || 'เกิดข้อผิดพลาดในการลงชื่อเข้าใช้ด้วย Google. โปรดยืนยันการตั้งค่า OAuth ในระบบก่อน'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const session = startSandboxSession();
      onLoginSuccess(session);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 md:p-8 selection:bg-indigo-100">
      {/* Top Margin Spacer */}
      <div className="hidden md:block"></div>

      {/* Main Login Card */}
      <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 my-auto">
        
        {/* Left Side: Illustration & Details */}
        <div className="md:col-span-7 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Decorative Circles */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-indigo-800 opacity-35 blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-slate-800 opacity-25 blur-3xl"></div>

          <div className="relative z-10">
            {/* School Crest Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-950/40 border border-indigo-500/30">
                WSS
              </div>
              <div>
                <h2 className="font-bold text-lg tracking-wide">โรงเรียนวัดแสงสรรค์</h2>
                <p className="text-indigo-200 text-xs font-mono">Wat Sangsan School</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              ระบบจัดการห้องเรียน ป.3/2
            </h1>
            <p className="text-indigo-200 text-sm md:text-base mb-8 max-w-md">
              อำนวยความสะดวกให้คุณครูประจำชั้นในการเช็คชื่อ เช็คสถานะการมาเรียน บันทึกประวัตินักเรียน และส่งรายงานสรุปเข้ากลุ่มไลน์ผู้ปกครองอย่างง่ายดาย
            </p>

            {/* Features List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-800/60 rounded-lg text-indigo-200 mt-0.5">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">เช็คชื่อรายวันรวดเร็ว</h4>
                  <p className="text-indigo-200/80 text-xs">เช็คชื่อนักเรียนรายวันด้วยการกดแทปเพียงปุ่มเดียว สะดวกและปลอดภัย</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-800/60 rounded-lg text-indigo-200 mt-0.5">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">รายงานสถิติ Bento Dashboard</h4>
                  <p className="text-indigo-200/80 text-xs">สรุปข้อมูลอัตราการมาเรียน ป่วย ลาสาย ด้วยกราฟิกที่สวยงาม เข้าใจง่าย</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-800/60 rounded-lg text-indigo-200 mt-0.5">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">ส่งการมาเรียนเข้ากลุ่ม LINE</h4>
                  <p className="text-indigo-200/80 text-xs">ส่งออกรายงานสรุปสถิติประจำวันเป็นไฟล์รูปภาพสีสันสดใส เพื่อส่งแชร์เข้าไลน์กลุ่มผู้ปกครองได้ทันที</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-indigo-300 relative z-10 mt-12 md:mt-0 pt-4 border-t border-indigo-800">
            © 2026 ระบบการจัดการโรงเรียนประถมศึกษา 3/2 • โรงเรียนวัดแสงสรรค์ อ.ธัญบุรี จ.ปทุมธานี
          </div>
        </div>

        {/* Right Side: Login Actions */}
        <div className="md:col-span-5 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-800">ยินดีต้อนรับ</h3>
            <p className="text-slate-500 text-sm mt-1">กรุณาเลือกลงชื่อเข้าใช้งานเพื่อควบคุมระบบ</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-xl">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer text-slate-700 text-sm font-medium shadow-sm active:scale-98 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>ลงชื่อเข้าใช้ด้วย Google Account</span>
            </button>

            <div className="relative my-6 flex py-1 items-center">
              <div className="flex-grow border-t border-slate-150"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400">หรือทดลองเล่นออฟไลน์</span>
              <div className="flex-grow border-t border-slate-150"></div>
            </div>

            {/* Offline Sandbox Button */}
            <button
              onClick={handleSandboxLogin}
              disabled={loading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer text-sm font-semibold shadow-md shadow-indigo-600/10 active:scale-98 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4 text-white" />
              <span>ลองใช้งานระบบสาธิต (Sandbox)</span>
              <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
            </button>
          </div>

          {/* Quick Guidance */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 text-slate-400">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <p className="text-[11px] leading-relaxed">
              *ข้อมูลในโหมดสาธิตจะบันทึกอยู่ในเครื่องของท่าน (LocalStorage) สำหรับการเชื่อมต่อฐานข้อมูล Google Sheets อย่างสมบูรณ์แบบ กรุณากดปุ่มเพื่อขอเปิดสิทธิ์ Google API ก่อนเริ่มใช้งานจริง
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-center text-slate-400 text-xs py-4 md:py-0">
        ระบบจัดการชั้นประถมศึกษาปีที่ 3/2 โรงเรียนวัดแสงสรรค์ • ออกแบบอย่างสวยงามและทันสมัย
      </div>
    </div>
  );
}
