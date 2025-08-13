import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,

  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signInAnonymously,
} from 'firebase/auth';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import { auth, database } from './firebase';
import { User } from './types';

export const googleProvider = new GoogleAuthProvider();

// Generate random username for anonymous users
const generateRandomUsername = (): string => {
  const adjectives = [
    'Cool', 'Happy', 'Smart', 'Brave', 'Swift', 'Bright', 'Kind', 'Bold', 'Calm', 'Epic',
    'Fire', 'Ice', 'Storm', 'Star', 'Moon', 'Sun', 'Wave', 'Wind', 'Rock', 'Sky',
    'Wild', 'Free', 'Pure', 'True', 'Fast', 'Strong', 'Wise', 'Lucky', 'Magic', 'Super'
  ];

  const nouns = [
    'Tiger', 'Eagle', 'Wolf', 'Lion', 'Bear', 'Fox', 'Hawk', 'Shark', 'Dragon', 'Phoenix',
    'Warrior', 'Knight', 'Ninja', 'Wizard', 'Hunter', 'Ranger', 'Pilot', 'Captain', 'Hero', 'Legend',
    'Thunder', 'Lightning', 'Comet', 'Meteor', 'Galaxy', 'Nova', 'Cosmos', 'Nebula', 'Orbit', 'Stellar'
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;

  return `${adjective}${noun}${number}`;
};

export const signUpWithEmail = async (email: string, password: string, displayName: string, username: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });

  const userData: Omit<User, 'uid'> = {
    email,
    displayName,
    username: username.toLowerCase(),
    photoURL: userCredential.user.photoURL || '',
    phoneNumber: '',
    bio: 'Hey there! I am using WhatsApp.',
    isOnline: true,
    lastSeen: Date.now(),
    settings: {
      theme: 'light',
      chatWallpaper: '',
      fontSize: 'medium',
      notifications: true,
      autoDownload: true,
      showLastSeen: true,
      showProfilePicture: true,
      showStatus: true,
      soundEnabled: true,
      vibrationEnabled: true,
      readReceipts: true,
    },
  };

  await set(ref(database, `users/${userCredential.user.uid}`), userData);

  // Add to usernames index
  await set(ref(database, `usernames/${userCredential.user.uid}`), username.toLowerCase());

  return userCredential.user;
};

export const signInWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);

  // Check if user exists in database
  const userRef = ref(database, `users/${result.user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    // New Google user - will need username setup
    const userData: Omit<User, 'uid'> = {
      email: result.user.email || '',
      displayName: result.user.displayName || '',
      username: '', // Will be set later
      photoURL: result.user.photoURL || '',
      phoneNumber: result.user.phoneNumber || '',
      bio: 'Hey there! I am using WhatsApp.',
      isOnline: true,
      lastSeen: Date.now(),
      settings: {
        theme: 'light',
        chatWallpaper: '',
        fontSize: 'medium',
        notifications: true,
        autoDownload: true,
        showLastSeen: true,
        showProfilePicture: true,
        showStatus: true,
        soundEnabled: true,
        vibrationEnabled: true,
        readReceipts: true,
      },
    };

    await set(userRef, userData);
  }

  return result.user;
};

export const setupRecaptcha = (containerId: string) => {
  return new RecaptchaVerifier(containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
  }, auth);
};

export const signInWithPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
  return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

export const signOutUser = async () => {
  if (auth.currentUser) {
    // Update online status
    await set(ref(database, `users/${auth.currentUser.uid}/isOnline`), false);
    await set(ref(database, `users/${auth.currentUser.uid}/lastSeen`), serverTimestamp());
  }
  return await signOut(auth);
};

export const updateUserProfile = async (updates: Partial<User>) => {
  if (!auth.currentUser) throw new Error('No authenticated user');

  const userRef = ref(database, `users/${auth.currentUser.uid}`);
  await set(userRef, updates);

  if (updates.displayName || updates.photoURL) {
    await updateProfile(auth.currentUser, {
      displayName: updates.displayName,
      photoURL: updates.photoURL,
    });
  }
};

export const signInAnonymouslyWithRandomName = async () => {
  const result = await signInAnonymously(auth);
  const randomUsername = generateRandomUsername();

  await updateProfile(result.user, { displayName: randomUsername });

  const userData: Omit<User, 'uid'> = {
    email: `${randomUsername.toLowerCase()}@anonymous.local`,
    displayName: randomUsername,
    username: randomUsername.toLowerCase(),
    photoURL: '',
    phoneNumber: '',
    bio: 'Hey there! I am using WhatsApp anonymously.',
    isOnline: true,
    lastSeen: Date.now(),
    settings: {
      theme: 'light',
      chatWallpaper: '',
      fontSize: 'medium',
      notifications: true,
      autoDownload: true,
      showLastSeen: true,
      showProfilePicture: true,
      showStatus: true,
      soundEnabled: true,
      vibrationEnabled: true,
      readReceipts: true,
    },
  };

  await set(ref(database, `users/${result.user.uid}`), userData);

  // Add to usernames index
  await set(ref(database, `usernames/${result.user.uid}`), randomUsername.toLowerCase());

  return result.user;
};