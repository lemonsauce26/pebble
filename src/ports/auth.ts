import { supabase } from "./supabase";
import { getGoogleIdToken, signOutGoogle } from "./google-auth";

export async function signInWithGoogle() {
  const idToken = await getGoogleIdToken();
  if (!idToken) {
    return { error: new Error("로그인이 취소됐어요.") };
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });

  return { data, error };
}

export async function signOut() {
  await supabase.auth.signOut();
  await signOutGoogle();
}
