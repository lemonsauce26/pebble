import { Stack } from 'expo-router';
import React from 'react';

import { TopBar } from '@/components/top-bar';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <TopBar />,
      }}>
      {/* index는 /today로 넘기기만 한다. 넘어가는 순간 상단바가 깜빡이지 않게 헤더를 끈다. */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="today" />
      <Stack.Screen name="monthly" />
      <Stack.Screen name="weekly" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}
