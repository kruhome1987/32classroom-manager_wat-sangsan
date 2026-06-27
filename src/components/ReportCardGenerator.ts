/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, AttendanceStatus } from '../types';

interface AttendanceStats {
  present: number;
  late: number;
  sick: number;
  absent: number;
  total: number;
}

/**
 * Formats a date string (YYYY-MM-DD) into full Thai date format.
 * E.g., "2026-06-26" -> "วันศุกร์ที่ 26 มิถุนายน พ.ศ. 2569"
 */
export function formatThaiDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  const yearTh = date.getFullYear() + 543;

  return `${dayName}ที่ ${dayNum} ${monthName} พ.ศ. ${yearTh}`;
}

/**
 * Generates a high-quality classroom report card as a PNG data URL.
 */
export function generateDailyReportCard(
  dateStr: string,
  stats: AttendanceStats,
  students: Student[],
  records: Record<string, AttendanceStatus>
): string {
  // Create a canvas with high-res dimensions (800 x 1000) for sharp lines and typography
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // --- Background ---
  // Clean off-white background with subtle school spirit accent colors
  ctx.fillStyle = '#F8FAFC'; // Slate 50
  ctx.fillRect(0, 0, 800, 1000);

  // Top header background wave/banner (Deep Indigo for school feeling)
  ctx.fillStyle = '#312E81'; // Indigo 900
  ctx.fillRect(0, 0, 800, 240);

  // Subtle accent banner under header
  ctx.fillStyle = '#6366F1'; // Indigo 500
  ctx.fillRect(0, 240, 800, 8);

  // --- Header Typography ---
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Thai School Identity Text
  ctx.font = 'bold 36px "Inter", "Sarabun", sans-serif';
  ctx.fillText('รายงานสรุปการมาเรียนประจำวัน', 400, 65);

  ctx.font = '28px "Inter", "Sarabun", sans-serif';
  ctx.fillText('ชั้นประถมศึกษาปีที่ 3/2 | โรงเรียนวัดแสงสรรค์', 400, 115);

  // Indigo accent divider line
  ctx.strokeStyle = '#6366F1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(250, 155);
  ctx.lineTo(550, 155);
  ctx.stroke();

  // Date Tag
  ctx.fillStyle = '#F3F4F6';
  ctx.font = 'bold 24px "Inter", "Sarabun", sans-serif';
  ctx.fillText(formatThaiDate(dateStr), 400, 190);

  // --- Main Attendance Circular Gauge ---
  // Center: 400, Y: 430
  const gaugeX = 400;
  const gaugeY = 380;
  const radius = 95;

  // Background Ring
  ctx.strokeStyle = '#E2E8F0'; // Slate 200
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(gaugeX, gaugeY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Foreground Ring (Present + Late proportion)
  const presentRate = stats.total > 0 ? (stats.present + stats.late) / stats.total : 0;
  ctx.strokeStyle = '#10B981'; // Green 500
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.beginPath();
  // Standard start is -Math.PI / 2 (top)
  ctx.arc(gaugeX, gaugeY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * presentRate);
  ctx.stroke();

  // Percentage Text in Gauge
  ctx.fillStyle = '#0F172A'; // Slate 900
  ctx.font = 'bold 44px "Inter", "Sarabun", sans-serif';
  ctx.fillText(`${(presentRate * 100).toFixed(1)}%`, gaugeX, gaugeY - 10);

  ctx.fillStyle = '#64748B'; // Slate 500
  ctx.font = '18px "Inter", "Sarabun", sans-serif';
  ctx.fillText('สัดส่วนการมาเรียน', gaugeX, gaugeY + 30);

  // --- Statistics Cards (Grid Layout) ---
  const cardWidth = 150;
  const cardHeight = 110;
  const cardY = 530;
  const gap = 30;
  const startX = 400 - (2 * cardWidth + 1.5 * gap);

  const statsItems = [
    { label: 'มาเรียน', val: stats.present, color: '#10B981', bg: '#ECFDF5' },
    { label: 'สาย', val: stats.late, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'ป่วย', val: stats.sick, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'ขาด', val: stats.absent, color: '#EF4444', bg: '#FEF2F2' },
  ];

  statsItems.forEach((item, index) => {
    const x = startX + index * (cardWidth + gap);

    // Card background
    ctx.fillStyle = item.bg;
    ctx.beginPath();
    ctx.roundRect(x, cardY, cardWidth, cardHeight, 12);
    ctx.fill();

    // Card border
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Card value
    ctx.fillStyle = item.color;
    ctx.font = 'bold 38px "Inter", "Sarabun", sans-serif';
    ctx.fillText(item.val.toString(), x + cardWidth / 2, cardY + 40);

    // Card label
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 18px "Inter", "Sarabun", sans-serif';
    ctx.fillText(item.label, x + cardWidth / 2, cardY + 82);
  });

  // --- Absent/Sick/Late Detail Section ---
  const listY = 675;
  
  // Outer frame for details list
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(60, listY, 680, 250, 16);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Section Header
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 20px "Inter", "Sarabun", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('📋 รายละเอียดสถานะการมาเรียนวันนี้', 90, listY + 35);

  // Line separator
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, listY + 60);
  ctx.lineTo(710, listY + 60);
  ctx.stroke();

  // Compile lists with full names (First Name + Last Name)
  const absents: string[] = [];
  const sicks: string[] = [];
  const lates: string[] = [];

  students.forEach(s => {
    const status = records[s.id];
    if (status === 'absent') absents.push(`เลขที่ ${s.no} ${s.firstName} ${s.lastName}`);
    if (status === 'sick') sicks.push(`เลขที่ ${s.no} ${s.firstName} ${s.lastName}`);
    if (status === 'late') lates.push(`เลขที่ ${s.no} ${s.firstName} ${s.lastName}`);
  });

  // Helper to wrap text nicely on the canvas
  const drawWrappedText = (text: string, startX: number, startY: number, maxWidth: number, lineHeight: number): number => {
    if (text === 'ไม่มี') {
      ctx.fillText(text, startX, startY);
      return startY;
    }
    const words = text.split(', ');
    let line = '';
    let currentY = startY;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + (line ? ', ' : '') + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line + ',', startX, currentY);
        line = words[n];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, startX, currentY);
    return currentY;
  };

  let currentTextY = listY + 95;
  ctx.font = '18px "Inter", "Sarabun", sans-serif';

  // Render ขาดเรียน list
  ctx.fillStyle = '#EF4444';
  ctx.fillText(`• ขาดเรียน (${absents.length} คน):`, 90, currentTextY);
  ctx.fillStyle = '#334155';
  const absentText = absents.length > 0 ? absents.join(', ') : 'ไม่มี';
  const afterAbsentY = drawWrappedText(absentText, 270, currentTextY, 440, 26);
  currentTextY = afterAbsentY + 40;

  // Render ลาป่วย list
  ctx.fillStyle = '#3B82F6';
  ctx.fillText(`• ลาป่วย (${sicks.length} คน):`, 90, currentTextY);
  ctx.fillStyle = '#334155';
  const sickText = sicks.length > 0 ? sicks.join(', ') : 'ไม่มี';
  const afterSickY = drawWrappedText(sickText, 270, currentTextY, 440, 26);
  currentTextY = afterSickY + 40;

  // Render มาสาย list
  ctx.fillStyle = '#F59E0B';
  ctx.fillText(`• มาสาย (${lates.length} คน):`, 90, currentTextY);
  ctx.fillStyle = '#334155';
  const lateText = lates.length > 0 ? lates.join(', ') : 'ไม่มี';
  const afterLateY = drawWrappedText(lateText, 270, currentTextY, 440, 26);
  currentTextY = afterLateY + 38;

  // Total Summary Row
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 16px "Inter", "Sarabun", sans-serif';
  ctx.fillText(`*จำนวนรวมนักเรียนทั้งหมด ${stats.total} คน (ชาย/หญิง ตามทะเบียนประจำชั้น)`, 90, currentTextY);

  // --- Footnote & Branding ---
  ctx.fillStyle = '#94A3B8';
  ctx.font = '14px "Inter", "Sarabun", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('โรงเรียนวัดแสงสรรค์ อ.ธัญบุรี จ.ปทุมธานี', 400, 955);
  ctx.fillText('บันทึกผ่านระบบจัดการห้องเรียนประถม 3/2 • พิมพ์รายงานอัตโนมัติ', 400, 975);

  return canvas.toDataURL('image/png');
}
