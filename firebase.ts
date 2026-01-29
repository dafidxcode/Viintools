
import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  onSnapshot,
  deleteDoc,
  updateDoc,
  orderBy
} from "firebase/firestore";
import { Track } from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence error:", err));

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Auth Sign-In Error:", error);
    throw error;
  }
};

export const syncUserDoc = async (firebaseUser: any) => {
  const userRef = doc(db, "users", firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const userData = {
      name: firebaseUser.displayName || 'PRO',
      email: firebaseUser.email,
      avatar: firebaseUser.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${firebaseUser.uid}`,
      plan: 'FREE',
      freeUsageCount: 0,
      createdAt: new Date().toISOString()
    };
    await setDoc(userRef, userData);
    return userData;
  }
  return userSnap.data();
};

export const updateTrackMetadata = async (userId: string, trackId: string, updates: Partial<Track>) => {
  const trackDoc = doc(db, "users", userId, "tracks", trackId);
  return await updateDoc(trackDoc, updates);
};

export const deleteTrackFromFirestore = async (userId: string, trackId: string) => {
  const trackDoc = doc(db, "users", userId, "tracks", trackId);
  return await deleteDoc(trackDoc);
};

export const deleteJobFromFirestore = async (userId: string, jobId: string) => {
  const jobDoc = doc(db, "users", userId, "jobs", jobId);
  return await deleteDoc(jobDoc);
};

export const subscribeToLibrary = (userId: string, callback: (tracks: Track[]) => void) => {
  const q = query(
    collection(db, "users", userId, "tracks"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const tracks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Track[];
    callback(tracks);
    callback(tracks);
  });
};

export const incrementFreeUsage = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const current = snap.data().freeUsageCount || 0;
    await updateDoc(userRef, { freeUsageCount: current + 1 });
  }
};

export const getAllUsers = async () => {
  const usersRef = collection(db, "users");
  const snapshot = await import("firebase/firestore").then(fs => fs.getDocs(usersRef));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateUserProfile = async (userId: string, data: any) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, data);
};

export const deleteUserDocument = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  await deleteDoc(userRef);
};
