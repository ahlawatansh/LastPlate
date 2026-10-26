import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  Auth,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
} from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

const DEFAULT_CONFIG: FirebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || 'AIzaSyBaNuBVyg-i39iDZsBp4XdFIhwl0VE6AS8',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || 'lastplate.firebaseapp.com',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || 'lastplate',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || 'lastplate.firebasestorage.app',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '638334894533',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || '1:638334894533:web:e4a8743a9ff69e45278bac',
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || 'G-3F4EZWWZ32',
};

const STORAGE_KEY_CONFIG = 'lastplate_firebase_config_v1';

export const getSavedFirebaseConfig = (): FirebaseConfig | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.authDomain && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved Firebase config', e);
  }
  return null;
};

export const saveFirebaseConfig = (config: FirebaseConfig): void => {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  initializeFirebase();
};

export const clearSavedFirebaseConfig = (): void => {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
};

export const getEffectiveFirebaseConfig = (): FirebaseConfig => {
  const saved = getSavedFirebaseConfig();
  if (saved && saved.apiKey.startsWith('AIza')) return saved;
  return DEFAULT_CONFIG;
};

export const isFirebaseConfigured = (): boolean => {
  const config = getEffectiveFirebaseConfig();
  return Boolean(
    config.apiKey &&
    config.authDomain &&
    config.projectId
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export const initializeFirebase = (): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
} => {
  const config = getEffectiveFirebaseConfig();
  if (!isFirebaseConfigured()) {
    auth = null;
    db = null;
    return { app: null, auth: null, db: null };
  }

  try {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(config);
    }
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
  return { app, auth, db };
};

initializeFirebase();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export { auth, app, db };

export interface FirebaseLoginResult {
  success: boolean;
  user?: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
  error?: string;
  isConfigurationMissing?: boolean;
  isPopupBlocked?: boolean;
}

export const checkGoogleRedirectResult = async (): Promise<FirebaseLoginResult | null> => {
  if (!auth) initializeFirebase();
  if (!auth) return null;

  try {
    const result = await getRedirectResult(auth);
    if (!result || !result.user) return null;

    const fbUser: FirebaseUser = result.user;
    const userData = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
      photoURL: fbUser.photoURL,
    };

    if (db && fbUser.uid) {
      try {
        const userRef = doc(db, 'users', fbUser.uid);
        setDoc(
          userRef,
          {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            lastLogin: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => {
          console.warn('Firestore user sync notice:', err);
        });
      } catch (err) {
        console.warn('Firestore user sync notice:', err);
      }
    }

    return {
      success: true,
      user: userData,
    };
  } catch (error: any) {
    console.warn('Google redirect result check notice:', error);
    return null;
  }
};

export const signInWithGoogleRedirectFirebase = async (): Promise<void> => {
  if (!auth) initializeFirebase();
  if (!auth) {
    throw new Error('Firebase Authentication is not configured yet.');
  }
  await signInWithRedirect(auth, googleProvider);
};

export const signInWithGoogleFirebase = async (): Promise<FirebaseLoginResult> => {
  if (!auth) initializeFirebase();

  if (!isFirebaseConfigured() || !auth) {
    return {
      success: false,
      error: 'Firebase Authentication is not configured yet. Please configure your Firebase credentials.',
      isConfigurationMissing: true,
    };
  }

  try {

    let timerId: any = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        const timeoutErr: any = new Error(
          'Google Sign-In popup did not respond or was blocked by your browser. Please check your browser address bar to allow popups, or use the Redirect option below.'
        );
        timeoutErr.code = 'auth/popup-blocked';
        reject(timeoutErr);
      }, 20000);
    });

    try {
      const result = await Promise.race([
        signInWithPopup(auth, googleProvider),
        timeoutPromise,
      ]);
      const fbUser: FirebaseUser = result.user;

      const userData = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
        photoURL: fbUser.photoURL,
      };

      if (db && fbUser.uid) {
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          setDoc(
            userRef,
            {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              lastLogin: new Date().toISOString(),
            },
            { merge: true }
          ).catch((err) => {
            console.warn('Firestore user sync notice:', err);
          });
        } catch (err) {
          console.warn('Firestore user sync notice:', err);
        }
      }

      return {
        success: true,
        user: userData,
      };
    } finally {
      if (timerId) clearTimeout(timerId);
    }
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);
    let errorMessage = error.message || 'Failed to authenticate with Google.';
    let isPopupBlocked = false;

    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled: Google popup window was closed.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Google sign-in popup was blocked or did not respond. Check your address bar for a "Pop-up blocked" icon, or try Google Redirect.';
      isPopupBlocked = true;
    } else if (error.code === 'auth/unauthorized-domain') {
      errorMessage = 'This domain is not authorized in Firebase Console. Go to Firebase Console > Authentication > Settings > Authorized Domains and add "localhost".';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network connection failure while connecting to Firebase.';
    } else if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Google Sign-In is disabled in Firebase. Please enable Google provider under Firebase Console > Authentication > Sign-in method.';
    } else if (error.code === 'auth/invalid-api-key') {
      errorMessage = 'Invalid Firebase API Key. Please verify your Firebase project credentials.';
    }

    return {
      success: false,
      error: errorMessage,
      isPopupBlocked,
    };
  }
};

export const signInWithEmailFirebase = async (
  email: string,
  pass: string
): Promise<FirebaseLoginResult> => {
  if (!auth) initializeFirebase();

  if (!isFirebaseConfigured() || !auth) {
    return {
      success: false,
      error: 'Firebase Authentication is not configured.',
      isConfigurationMissing: true,
    };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const fbUser = cred.user;

    const userData = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
    };

    if (db && fbUser.uid) {
      try {
        const userRef = doc(db, 'users', fbUser.uid);
        await setDoc(
          userRef,
          {
            uid: fbUser.uid,
            email: fbUser.email,
            lastLogin: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore sync notice:', err);
      }
    }

    return {
      success: true,
      user: userData,
    };
  } catch (error: any) {
    console.error('Firebase Email Login error:', error);
    let errorMessage = error.message || 'Login failed.';

    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password. Please check your credentials or create an account.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Access temporarily disabled due to many failed login attempts. Try again later or reset password.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const signUpWithEmailFirebase = async (
  email: string,
  pass: string,
  displayName?: string,
  additionalData?: Record<string, any>
): Promise<FirebaseLoginResult> => {
  if (!auth) initializeFirebase();

  if (!isFirebaseConfigured() || !auth) {
    return {
      success: false,
      error: 'Firebase Authentication is not configured.',
      isConfigurationMissing: true,
    };
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = cred.user;

    if (displayName) {
      await updateProfile(fbUser, { displayName });
    }

    const userData = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: displayName || fbUser.displayName,
      photoURL: fbUser.photoURL,
    };

    if (db && fbUser.uid) {
      try {
        const userRef = doc(db, 'users', fbUser.uid);
        setDoc(userRef, {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: displayName || '',
          photoURL: fbUser.photoURL || '',
          createdAt: new Date().toISOString(),
          ...additionalData,
        }).catch((err) => {
          console.warn('Firestore registration sync notice:', err);
        });
      } catch (err) {
        console.warn('Firestore registration sync notice:', err);
      }
    }

    return {
      success: true,
      user: userData,
    };
  } catch (error: any) {
    console.error('Firebase Email Signup error:', error);
    let errorMessage = error.message || 'Signup failed.';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please sign in instead.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please provide a valid email address.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const signOutFirebase = async (): Promise<void> => {
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
  }
};

export const saveOrderToFirestore = async (order: any): Promise<void> => {
  if (!db) initializeFirebase();
  if (!db || !order?.id) return;

  try {
    const orderRef = doc(db, 'orders', order.id);
    const cleanedOrder = JSON.parse(JSON.stringify(order));
    await setDoc(orderRef, cleanedOrder, { merge: true });
  } catch (err) {
    console.warn('Error saving order to Firestore:', err);
  }
};

export const saveSurplusToFirestore = async (listing: any): Promise<void> => {
  if (!db) initializeFirebase();
  if (!db || !listing?.id) return;

  try {
    const surplusRef = doc(db, 'surplus', listing.id);
    const cleanedListing = JSON.parse(JSON.stringify(listing));
    await setDoc(surplusRef, cleanedListing, { merge: true });
  } catch (err) {
    console.warn('Error saving surplus listing to Firestore:', err);
  }
};

export const subscribeToFirestoreOrders = (
  callback: (orders: any[]) => void
): (() => void) => {
  if (!db) initializeFirebase();
  if (!db) return () => {};

  try {
    const ordersCol = collection(db, 'orders');
    return onSnapshot(
      ordersCol,
      (snapshot) => {
        const firestoreOrders: any[] = [];
        snapshot.forEach((docSnap) => {
          firestoreOrders.push(docSnap.data());
        });
        if (firestoreOrders.length > 0) {
          callback(firestoreOrders);
        }
      },
      (err) => {
        console.warn('Firestore orders sync subscription warning:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to Firestore orders:', err);
    return () => {};
  }
};
