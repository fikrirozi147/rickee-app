import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import Scanner from '../../components/Scanner'; 
// Note: If you get an import error, try: import Scanner from '@/components/Scanner';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* We set the status bar to 'light' so the battery/time 
        text is white against the dark camera background.
      */}
      <StatusBar barStyle="light-content" />
      
      {/* Render the Scanner Component we just built */}
      <Scanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background matches the camera feel
  },
});