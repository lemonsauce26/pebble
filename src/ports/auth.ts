import { supabase } from "./supabase";
import { getGoogleIdToken } from "./google-auth";

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
  // 폰에 저장된 구글 로그인 상태는 그대로 두고, 우리 앱 세션만 끊는다.
  // 그래야 다음 로그인 때 구글 계정 선택 화면을 다시 안 거치고 빠르게 들어올 수 있다.
  await supabase.auth.signOut();
}
