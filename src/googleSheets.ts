/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, AttendanceRecord, AttendanceStatus } from './types';

const SPREADSHEET_NAME = 'Wat_Sangsan_3_2_Classroom_DB';

/**
 * Searches Google Drive for our classroom database spreadsheet.
 * If not found, creates a new one and returns the spreadsheet ID.
 */
export async function findOrCreateSpreadsheet(accessToken: string): Promise<string> {
  try {
    // 1. Search for existing file
    const q = `name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;
    
    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchRes.ok) {
      throw new Error(`Google Drive API error: ${searchRes.statusText}`);
    }

    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const spreadsheetId = searchData.files[0].id;
      // Ensure sheets "Students" and "Attendance" exist
      await verifyOrCreateSheets(accessToken, spreadsheetId);
      return spreadsheetId;
    }

    // 2. Create new spreadsheet if not found
    const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: SPREADSHEET_NAME,
        },
        sheets: [
          { properties: { title: 'Students' } },
          { properties: { title: 'Attendance' } },
        ],
      }),
    });

    if (!createRes.ok) {
      throw new Error(`Google Sheets Create error: ${createRes.statusText}`);
    }

    const createData = await createRes.json();
    return createData.spreadsheetId;
  } catch (error) {
    console.error('findOrCreateSpreadsheet failed:', error);
    throw error;
  }
}

/**
 * Verifies if required sheets exist, if not, creates them.
 */
async function verifyOrCreateSheets(accessToken: string, spreadsheetId: string): Promise<void> {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title))`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return;

    const data = await res.json();
    const sheetTitles = data.sheets?.map((s: any) => s.properties.title) || [];
    
    const requests: any[] = [];
    if (!sheetTitles.includes('Students')) {
      requests.push({ addSheet: { properties: { title: 'Students' } } });
    }
    if (!sheetTitles.includes('Attendance')) {
      requests.push({ addSheet: { properties: { title: 'Attendance' } } });
    }

    if (requests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
    }
  } catch (err) {
    console.error('verifyOrCreateSheets failed:', err);
  }
}

/**
 * Overwrites the "Students" sheet completely with the current student list.
 */
export async function saveStudentsToSheet(
  accessToken: string,
  spreadsheetId: string,
  students: Student[]
): Promise<void> {
  const range = 'Students!A1:M1000';
  
  const headers = [
    'id', 'no', 'studentId', 'firstName', 'lastName', 'image',
    'ethnicity', 'nationality', 'religion', 'birthday', 'transport',
    'allowance', 'parentPhone'
  ];

  const rows = [
    headers,
    ...students.map(s => [
      s.id,
      s.no.toString(),
      s.studentId,
      s.firstName,
      s.lastName,
      s.image,
      s.ethnicity,
      s.nationality,
      s.religion,
      s.birthday,
      s.transport,
      s.allowance.toString(),
      s.parentPhone
    ])
  ];

  // 1. Clear any current cells in Students sheet
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Students!A1:M1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 2. Put new values
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: rows }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save students: ${response.statusText}`);
  }
}

/**
 * Loads the student list from the "Students" sheet.
 */
export async function loadStudentsFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Student[]> {
  const range = 'Students!A1:M1000';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to load students: ${response.statusText}`);
  }

  const data = await response.json();
  const rows = data.values;
  if (!rows || rows.length <= 1) return []; // No students or empty header only

  const students: Student[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    students.push({
      id: row[0] || '',
      no: parseInt(row[1] || '0') || 0,
      studentId: row[2] || '',
      firstName: row[3] || '',
      lastName: row[4] || '',
      image: row[5] || '',
      ethnicity: row[6] || '',
      nationality: row[7] || '',
      religion: row[8] || '',
      birthday: row[9] || '',
      transport: row[10] || '',
      allowance: parseFloat(row[11] || '0') || 0,
      parentPhone: row[12] || '',
    });
  }

  // Sort students by No. (เลขที่) to ensure correct classroom order
  return students.sort((a, b) => a.no - b.no);
}

/**
 * Saves all attendance history back to the Google Sheet.
 * Combines local modifications and rewrites the Attendance sheet log.
 */
export async function saveAllAttendanceToSheet(
  accessToken: string,
  spreadsheetId: string,
  allRecords: AttendanceRecord[]
): Promise<void> {
  const range = 'Attendance!A1:E10000';
  
  const headers = ['date', 'student_id', 'no', 'name', 'status'];
  
  const rows = [headers];
  for (const record of allRecords) {
    for (const [studentId, status] of Object.entries(record.records)) {
      rows.push([
        record.date,
        studentId,
        '', // We can look up or keep empty, keeping it simple
        '',
        status
      ]);
    }
  }

  // Clear sheet
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Attendance!A1:E10000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Put new values
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: rows }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save attendance: ${response.statusText}`);
  }
}

/**
 * Loads all attendance logs from the "Attendance" sheet.
 * Groups them back into YYYY-MM-DD keys.
 */
export async function loadAttendanceFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<AttendanceRecord[]> {
  const range = 'Attendance!A1:E10000';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to load attendance: ${response.statusText}`);
  }

  const data = await response.json();
  const rows = data.values;
  if (!rows || rows.length <= 1) return [];

  const tempMap: Record<string, Record<string, AttendanceStatus>> = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 5) continue;
    
    const date = row[0];
    const studentId = row[1];
    const status = row[4] as AttendanceStatus;

    if (!date || !studentId || !status) continue;

    if (!tempMap[date]) {
      tempMap[date] = {};
    }
    tempMap[date][studentId] = status;
  }

  const records: AttendanceRecord[] = Object.entries(tempMap).map(([date, recordsMap]) => ({
    date,
    records: recordsMap,
  }));

  return records;
}
