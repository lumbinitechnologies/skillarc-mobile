import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

type Props = {
  state: "loading" | "empty" | "error" | "ready";
  children?: ReactNode;
  message?: string;
};

export function ScreenState({ state, children, message }: Props) {
  if (state === "ready") return <>{children}</>;
  return (
    <View style={styles.container}>
      {state === "loading" ? (
        <ActivityIndicator accessibilityLabel="Loading" />
      ) : null}
      <Text
        accessibilityRole={state === "error" ? "alert" : "text"}
        style={state === "error" ? styles.error : styles.text}
      >
        {message ??
          (state === "loading"
            ? "Loading…"
            : state === "empty"
              ? "Nothing here yet."
              : "Something went wrong. Please try again.")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.lg,
    backgroundColor: tokens.color.background,
  },
  text: { color: tokens.color.muted, textAlign: "center" },
  error: { color: tokens.color.danger, textAlign: "center" },
});
