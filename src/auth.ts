/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TeacherSession } from './types';

// In-memory cache for the Google OAuth Access Token
let cachedAccessToken: string | null = null;
let cachedUser: any = null;
let isInitialized = false;

// Initialize Google OAuth Scope Definitions
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

/**
 * Attempts to load Firebase config and initialize Authentication dynamically.
 * Returns null if Firebase is not yet configured or fails.
 */
export async function getFirebaseServices() {
  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAuth, GoogleAuthProvider } = await import('firebase/auth');

    // Load the config file directly using ES Modules dynamic import to avoid static build-time failures or runtime 404s
    const firebaseConfig = await import('../firebase-applet-config.json').then(m => m.default);
    if (!firebaseConfig) {
      return null;
    }
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    
    // Add required workspace scopes for Google Sheets and Google Drive
    WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

    return { auth, provider, GoogleAuthProvider };
  } catch (err) {
    console.warn('Firebase is not yet configured or initialized:', err);
    return null;
  }
}

/**
 * Checks if the user is already authenticated.
 */
export async function checkAuthState(
  onSuccess: (session: TeacherSession) => void,
  onFail: () => void
): Promise<() => void> {
  const services = await getFirebaseServices();
  if (!services) {
    // If Firebase Auth is not active, look for simulated local session
    const localSession = localStorage.getItem('wat_sangsan_session');
    if (localSession) {
      try {
        const parsed = JSON.parse(localSession);
        if (parsed.isSandbox) {
          onSuccess(parsed);
          return () => {};
        }
      } catch (e) {}
    }
    onFail();
    return () => {};
  }

  const { auth } = services;
  const { onAuthStateChanged } = await import('firebase/auth');

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      if (cachedAccessToken) {
        onSuccess({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          accessToken: cachedAccessToken,
          isSandbox: false,
        });
      } else {
        // Logged in but token was cleared (e.g. page refresh), need to re-login to get fresh token
        onFail();
      }
    } else {
      onFail();
    }
  });
}

/**
 * Performs Google Sign-In with popup.
 */
export async function signInWithGoogle(): Promise<TeacherSession> {
  const services = await getFirebaseServices();
  if (!services) {
    throw new Error('ระบบล็อกอิน Google ยังไม่พร้อมใช้งาน กรุณากดยืนยันการเชื่อมต่อ API ก่อน');
  }

  const { auth, provider, GoogleAuthProvider } = services;
  const { signInWithPopup } = await import('firebase/auth');

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  
  if (!credential?.accessToken) {
    throw new Error('ไม่ได้รับ Access Token สำหรับ Google Sheets API');
  }

  cachedAccessToken = credential.accessToken;
  
  const session: TeacherSession = {
    uid: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
    accessToken: cachedAccessToken,
    isSandbox: false,
  };

  localStorage.setItem('wat_sangsan_session', JSON.stringify(session));
  return session;
}

/**
 * Triggers offline Sandbox Mode for direct demonstration/local-only storage.
 */
export function startSandboxSession(): TeacherSession {
  const session: TeacherSession = {
    uid: 'sandbox-teacher',
    email: 'kru.somchai@wat-sangsan.school.th',
    displayName: 'คุณครูสมชาย แสงสรรค์ (โหมดจำลองออฟไลน์)',
    photoURL: null,
    accessToken: null,
    isSandbox: true,
  };
  localStorage.setItem('wat_sangsan_session', JSON.stringify(session));
  return session;
}

/**
 * Signs out current session.
 */
export async function signOutSession(): Promise<void> {
  const services = await getFirebaseServices();
  if (services) {
    await services.auth.signOut();
  }
  cachedAccessToken = null;
  localStorage.removeItem('wat_sangsan_session');
}
