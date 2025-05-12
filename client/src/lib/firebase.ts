import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInWithRedirect,
  getRedirectResult 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("Firebase config:", {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  apiKeyLength: import.meta.env.VITE_FIREBASE_API_KEY?.length || 0,
  appIdLength: import.meta.env.VITE_FIREBASE_APP_ID?.length || 0
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Define a type for the Google auth result
type GoogleAuthResult = 
  | { success: true; user: { email: string | null; displayName: string | null; photoURL: string | null; uid: string }; token: string | undefined }
  | { success: false; error?: string; errorCode?: string };

// Check for redirect result on page load
export const checkRedirectResult = async (): Promise<GoogleAuthResult> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user = result.user;
      
      return {
        success: true,
        user: {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid,
        },
        token
      };
    }
    return { success: false };
  } catch (error: any) {
    console.error("Error checking redirect result:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Sign in with Google - using redirect for better compatibility in iframes
export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  try {
    // Using redirect instead of popup for better iframe compatibility
    // Add the correct prompt parameter to handle existing credentials better
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    await signInWithRedirect(auth, googleProvider);
    return { success: true } as GoogleAuthResult;
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    
    let errorMessage = error.message;
    let errorCode = error.code;
    
    if (error.code === 'auth/network-request-failed') {
      errorMessage = "Network error occurred. Please check your internet connection or try again later.";
    } else if (error.code === 'auth/unauthorized-domain') {
      errorMessage = "This domain is not authorized in Firebase. Please ensure your Replit URL is added to the authorized domains in Firebase console.";
    } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      errorMessage = "Sign-in was cancelled. Please try again.";
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode
    };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};