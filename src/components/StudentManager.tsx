/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  UserPlus, Search, Edit2, Trash2, FileText, X, Upload, 
  User, Calendar, CreditCard, MapPin, Phone, ShieldAlert, Check
} from 'lucide-react';
import { Student } from '../types';

interface StudentManagerProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export default function StudentManager({
  students,
  onAddStudent,
  onEditStudent,
  onDeleteStudent
}: StudentManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Student | null>(null);
  
  // Form States
  const [no, setNo] = useState<number>(students.length + 1);
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [image, setImage] = useState('');
  const [ethnicity, setEthnicity] = useState('ไทย');
  const [nationality, setNationality] = useState('ไทย');
  const [religion, setReligion] = useState('พุทธ');
  const [birthday, setBirthday] = useState('');
  const [transport, setTransport] = useState('รถผู้ปกครอง');
  const [allowance, setAllowance] = useState<number>(40);
  const [parentPhone, setParentPhone] = useState('');

  // Drag and Drop State
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search filter
  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      s.studentId.includes(searchTerm) ||
      s.no.toString() === searchTerm
    );
  });

  const resetForm = () => {
    setEditingStudent(null);
    setNo(students.length + 1);
    setStudentId('');
    setFirstName('');
    setLastName('');
    setImage('');
    setEthnicity('ไทย');
    setNationality('ไทย');
    setReligion('พุทธ');
    setBirthday('');
    setTransport('รถผู้ปกครอง');
    setAllowance(40);
    setParentPhone('');
  };

  const handleOpenAddForm = () => {
    resetForm();
    // Default next student number
    const nextNo = students.length > 0 ? Math.max(...students.map(s => s.no)) + 1 : 1;
    setNo(nextNo);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (student: Student) => {
    setEditingStudent(student);
    setNo(student.no);
    setStudentId(student.studentId);
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setImage(student.image);
    setEthnicity(student.ethnicity || 'ไทย');
    setNationality(student.nationality || 'ไทย');
    setReligion(student.religion || 'พุทธ');
    setBirthday(student.birthday || '');
    setTransport(student.transport || 'รถผู้ปกครอง');
    setAllowance(student.allowance || 40);
    setParentPhone(student.parentPhone || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !firstName || !lastName) {
      alert('กรุณากรอกข้อมูลเลขประจำตัว, ชื่อ และนามสกุล ให้ครบถ้วน');
      return;
    }

    const studentData: Student = {
      id: editingStudent ? editingStudent.id : `stud-${Date.now()}`,
      no: Number(no),
      studentId,
      firstName,
      lastName,
      image: image || 'https://images.unsplash.com/photo-1597549880878-49019e588a54?w=150', // Default cartoon avatar
      ethnicity,
      nationality,
      religion,
      birthday,
      transport,
      allowance: Number(allowance),
      parentPhone,
    };

    if (editingStudent) {
      onEditStudent(studentData);
    } else {
      // Check if ID or No already exists
      const idExists = students.some(s => s.studentId === studentId);
      const noExists = students.some(s => s.no === Number(no));
      if (idExists) {
        alert('เลขประจำตัวนักเรียนนี้มีอยู่ในระบบแล้ว');
        return;
      }
      if (noExists) {
        if (!confirm(`เลขที่ ${no} มีอยู่ในระบบแล้ว คุณยังคงต้องการเพิ่มด้วยเลขที่นี้หรือไม่?`)) {
          return;
        }
      }
      onAddStudent(studentData);
    }
    setIsFormOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    const isConfirmed = window.confirm(
      `⚠️ คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อนักเรียน "${name}" ออกจากระบบ? การลบนี้รวมถึงประวัติและรูปภาพ และไม่สามารถเรียกคืนได้!`
    );
    if (isConfirmed) {
      onDeleteStudent(id);
    }
  };

  // Image upload handlers
  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">ทะเบียนนักเรียน (ชั้น ป.3/2)</h2>
          <p className="text-sm text-slate-500">จำนวนนักเรียนทั้งหมดในระบบ: {students.length} คน</p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="flex items-center justify-center gap-2 h-11 px-5 bg-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 cursor-pointer transition-all duration-200 active:scale-98"
        >
          <UserPlus className="w-5 h-5" />
          <span>เพิ่มนักเรียนใหม่</span>
        </button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="ค้นหาตามชื่อ, เลขประจำตัว หรือ เลขที่..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm placeholder:text-slate-400"
        />
      </div>

      {/* Students Bento Grid */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
            <User className="w-8 h-8" />
          </div>
          <p className="text-slate-500 text-sm">ไม่พบรายชื่อนักเรียนตามคำค้นหาที่ระบุ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div 
              key={student.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col group"
            >
              {/* Card top banner */}
              <div className="h-2 bg-gradient-to-r from-indigo-600 to-slate-400"></div>

              <div className="p-5 flex gap-4 items-start flex-grow">
                {/* Student Photo */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={student.image} 
                    alt={student.firstName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border border-slate-100"
                  />
                  <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-slate-900 text-white border-2 border-white flex items-center justify-center font-bold text-xs shadow-md">
                    {student.no}
                  </div>
                </div>

                {/* Details summary */}
                <div className="min-w-0 flex-grow">
                  <span className="text-[10px] font-bold text-indigo-700 tracking-wider bg-indigo-50 border border-indigo-100/30 px-2 py-0.5 rounded-full uppercase">
                    ID: {student.studentId}
                  </span>
                  <h3 className="font-bold text-slate-800 text-base mt-1.5 truncate">
                    {student.firstName} {student.lastName}
                  </h3>
                  
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>เงินมา รร: {student.allowance} บาท/วัน</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">เดินทาง: {student.transport}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                <button
                  onClick={() => setViewingProfile(student)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>ประวัตินักเรียน</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditForm(student)}
                    className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg hover:shadow-sm cursor-pointer transition-colors"
                    title="แก้ไขประวัติ"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)}
                    className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-lg hover:shadow-sm cursor-pointer transition-colors"
                    title="ลบรายชื่อ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT STUDENT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col my-8 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {editingStudent ? '📝 แก้ไขประวัตินักเรียน' : '➕ เพิ่มนักเรียนใหม่'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-grow space-y-6">
              
              {/* Photo Upload Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">รูปถ่ายประจำตัวนักเรียน</label>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {image ? (
                    <div className="relative">
                      <img 
                        src={image} 
                        alt="Preview" 
                        className="w-24 h-24 object-cover rounded-2xl border-2 border-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md cursor-pointer hover:bg-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                      <User className="w-10 h-10 stroke-1" />
                    </div>
                  )}

                  {/* Drag-n-Drop File Zone */}
                  <div 
                    className={`flex-grow w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                      dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/20'
                    }`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={onButtonClick}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700">ลากวางรูปภาพที่นี่ หรือ คลิกเพื่อเลือกไฟล์</p>
                    <p className="text-[10px] text-slate-400 mt-1">ไฟล์ JPG, PNG (แนะนำอัตราส่วน 1:1 หรือสี่เหลี่ยมจัตุรัส)</p>
                  </div>
                </div>
              </div>

              {/* Basic Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">เลขประจำตัวนักเรียน *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 10342"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full h-11 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">เลขที่ชั้นเรียน *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={no}
                    onChange={(e) => setNo(Number(e.target.value))}
                    className="w-full h-11 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">ชื่อจริง *</label>
                  <input
                    type="text"
                    required
                    placeholder="ชื่อ"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-11 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">นามสกุลจริง *</label>
                  <input
                    type="text"
                    required
                    placeholder="นามสกุล"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-11 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
                  />
                </div>
              </div>

              {/* History & Demographics Accordion/Fields */}
              <div className="p-5 bg-slate-50 rounded-2xl space-y-4">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">ข้อมูลประวัติรายบุคคลเพิ่มเติม</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">เชื้อชาติ</label>
                    <input
                      type="text"
                      value={ethnicity}
                      onChange={(e) => setEthnicity(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">สัญชาติ</label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">ศาสนา</label>
                    <input
                      type="text"
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">วันเกิด</label>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">การเดินทางมาโรงเรียน</label>
                    <select
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
                    >
                      <option value="รถผู้ปกครอง">รถส่วนบุคคลผู้ปกครอง</option>
                      <option value="รถตู้โรงเรียน">รถรับส่ง/รถตู้โรงเรียน</option>
                      <option value="เดินเท้า">เดินเท้า</option>
                      <option value="รถจักรยานยนต์">รถจักรยานยนต์</option>
                      <option value="จักรยาน">จักรยาน</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">เงินที่ได้มาโรงเรียน (บาท/วัน)</label>
                    <input
                      type="number"
                      min={0}
                      value={allowance}
                      onChange={(e) => setAllowance(Number(e.target.value))}
                      className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">เบอร์โทรศัพท์ผู้ปกครอง</label>
                    <input
                      type="tel"
                      placeholder="เช่น 081-234-5678"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="h-11 px-5 border border-slate-200 text-slate-600 rounded-2xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl text-sm cursor-pointer shadow-md shadow-slate-950/5 active:scale-98 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STUDENT PROFILE MODAL */}
      {viewingProfile && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            {/* Colored top */}
            <div className="h-20 bg-gradient-to-r from-indigo-950 to-indigo-900 flex items-center justify-between px-6 relative">
              <span className="text-white text-sm font-bold tracking-wider">ประวัติประวัตินักเรียนรายบุคคล</span>
              <button 
                onClick={() => setViewingProfile(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg cursor-pointer bg-indigo-850/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content info */}
            <div className="p-6 space-y-6">
              
              {/* Profile Avatar and Name */}
              <div className="flex gap-4 items-center border-b border-slate-100 pb-5">
                <img 
                  src={viewingProfile.image} 
                  alt={viewingProfile.firstName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-100"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-extrabold">
                      {viewingProfile.no}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">ID: {viewingProfile.studentId}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-lg mt-1">
                    {viewingProfile.firstName} {viewingProfile.lastName}
                  </h4>
                </div>
              </div>

              {/* Detailed history details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-sm">
                
                <div>
                  <span className="text-xs text-slate-400 block">เชื้อชาติ</span>
                  <span className="font-semibold text-slate-700">{viewingProfile.ethnicity || 'ไทย'}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">สัญชาติ</span>
                  <span className="font-semibold text-slate-700">{viewingProfile.nationality || 'ไทย'}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">ศาสนา</span>
                  <span className="font-semibold text-slate-700">{viewingProfile.religion || 'พุทธ'}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">วันเกิด</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {viewingProfile.birthday || 'ไม่ได้ระบุ'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">การเดินทางมาโรงเรียน</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {viewingProfile.transport || 'ไม่ได้ระบุ'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">เงินมาเรียนต่อวัน</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    {viewingProfile.allowance || 0} บาท
                  </span>
                </div>

                <div className="col-span-2 pt-3 border-t border-slate-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/40 flex items-center justify-center text-indigo-700">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">เบอร์โทรศัพท์ผู้ปกครอง (ติดต่อฉุกเฉิน)</span>
                    {viewingProfile.parentPhone ? (
                      <a href={`tel:${viewingProfile.parentPhone}`} className="font-bold text-indigo-600 hover:underline">
                        {viewingProfile.parentPhone}
                      </a>
                    ) : (
                      <span className="text-slate-400 font-semibold italic text-xs">ไม่ได้ระบุเบอร์โทร</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Close button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setViewingProfile(null)}
                  className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
