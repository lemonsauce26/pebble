import { useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { db } from "@/data/db";
import migrations from "@/data/migrations/migrations";
import { selectPlans } from "@/data/plan.repository";
import { toMonthPeriod } from "@/domain/period";
import { formatWeekLabel, getCurrentWeekRange } from "@/domain/week";
import { systemClock } from "@/ports/clock";
import { supabase } from "@/ports/supabase";

export default function WeeklyScreen() {
  const { success: migrationsReady, error: migrationError } = useMigrations(db, migrations);
  const [userId, setUserId] = useState<string | null>(null);
  const [weekRange] = useState(() => getCurrentWeekRange(systemClock));

  // 주가 두 달에 걸치면 시작일이 속한 달의 계획을 보여준다.
  const period = toMonthPeriod(
    Number(weekRange.startDate.slice(0, 4)),
    Number(weekRange.startDate.slice(5, 7)),
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: plans } = useLiveQuery(selectPlans(db, userId ?? "", "month", period), [
    userId,
    period,
  ]);

  if (migrationError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>DB 준비 중 문제가 생겼어요: {migrationError.message}</ThemedText>
      </ThemedView>
    );
  }

  if (!migrationsReady || !userId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>준비 중...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{formatWeekLabel(weekRange)}</ThemedText>

      {plans && plans.length > 0 ? (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThemedView style={styles.section}>
              <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
            </ThemedView>
          )}
        />
      ) : (
        <EmptyState message={"이번 달 계획이 없어요\n먼슬리 주머니에서 먼저 계획을 세워주세요"} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  section: {
    paddingVertical: 12,
  },
});
