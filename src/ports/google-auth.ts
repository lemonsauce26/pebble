import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";

export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
}

export async function getGoogleIdToken(): Promise<string | null> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true }).catch(() => true);
  const response = await GoogleSignin.signIn();

  if (isSuccessResponse(response)) {
    return response.data.idToken;
  }

  return null;
}

export async function signOutGoogle() {
  await GoogleSignin.signOut();
}
