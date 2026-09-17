import { Stack } from 'expo-router';
import React from 'react';

import { TopBar } from '@/components/top-bar';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <TopBar />,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}
