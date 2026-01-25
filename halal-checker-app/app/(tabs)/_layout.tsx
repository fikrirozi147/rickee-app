import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
// We don't strictly need Colors here anymore if we hardcode the Rickee Green, 
// but we keep the hook for other uses if needed.
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // 1. BRANDING: Use your "Rickee Green" for active tabs
        tabBarActiveTintColor: '#4CAF50', 
        tabBarInactiveTintColor: '#888', // Grey for inactive
        headerShown: false,
        tabBarButton: HapticTab,

        // 2. GLASS EFFECT: Replace solid background with BlurView
        tabBarBackground: () => (
          <BlurView 
            intensity={80} 
            tint="dark" // "dark" fits the camera app vibe perfectly
            style={StyleSheet.absoluteFill} 
          />
        ),

        // 3. FLOATING STYLE: Make it transparent and floating
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 90, // Slightly taller to look like a pro navigation dock
          backgroundColor: 'transparent', // Important! Let the blur show through
          borderTopWidth: 0,    // Remove the default line on top
          elevation: 0,         // Remove shadow on Android
        },
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scanner',
          // I kept your SF Symbol name here. 
          // If you want a simpler camera icon, try "camera.fill" instead.
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="viewfinder" color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}