import { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { signInWithGoogle } from "@/ports/auth";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handlePressGoogleLogin() {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error.message);
      }
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 32 }]}>
      <ThemedText type="title">조약돌</ThemedText>
      <ThemedText style={styles.subtitle}>구글 계정으로 로그인해주세요</ThemedText>

      <TouchableOpacity
        style={styles.button}
        onPress={handlePressGoogleLogin}
        disabled={isSigningIn}
      >
        <ThemedText style={styles.buttonText}>
          {isSigningIn ? "로그인 중..." : "구글로 로그인"}
        </ThemedText>
      </TouchableOpacity>

      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  subtitle: {
    opacity: 0.6,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#208AEF",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#fff",
  },
  error: {
    color: "#d33",
  },
});
