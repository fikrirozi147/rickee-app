import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import ResultModal from './ResultModal';

const REGIONS = [
  { id: 'GENERAL', label: 'Global 🌍', desc: 'English, Malay' },
  { id: 'JAPAN',   label: 'Japan 🇯🇵',  desc: 'Japanese + English' },
  { id: 'KOREA',   label: 'Korea 🇰🇷',  desc: 'Korean + English' },
  { id: 'THAI',    label: 'Thai 🇹🇭',   desc: 'Thai + English' },
  { id: 'CHINA',   label: 'China 🇨🇳',  desc: 'Chinese + English' },
  { id: 'ALL',     label: 'All 🐌',    desc: 'Slowest (Runs everything)' },
];

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<any>(null);
  
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualText, setManualText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('GENERAL');

  const [modalVisible, setModalVisible] = useState(false);
  const [scanResult, setScanResult] = useState({
    status: "Ready",
    reason: "",
    color: "#4CAF50"
  });

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission is required.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // LOGIC 1: Camera Capture
  const takePictureAndAnalyze = async () => {
    if (!cameraRef.current || isProcessing) return;
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ 
        quality: 0.3, base64: true, skipProcessing: true 
      });
      await checkBackend(photo.base64, 'image', selectedRegion);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not capture image.");
      setIsProcessing(false);
    }
  };

  // LOGIC 2: Upload from Gallery (NEW)
  const pickImage = async () => {
    try {
      // 1. Launch Image Library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Updated to match new Expo API
        allowsEditing: true,    // Lets user crop the focus area
        quality: 0.5,
        base64: true,           // Important: We need the base64 string
      });

      // 2. Check if user cancelled
      if (!result.canceled && result.assets && result.assets[0].base64) {
        setIsProcessing(true);
        // 3. Send to backend just like a camera photo
        await checkBackend(result.assets[0].base64, 'image', selectedRegion);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load image from gallery.");
      setIsProcessing(false);
    }
  };

  // LOGIC 3: Manual Text
  const handleManualSearch = async () => {
    if (!manualText.trim()) return;
    setIsProcessing(true);
    await checkBackend(manualText, 'text', 'ALL');
  };

  // LOGIC 4: Backend Call
  const checkBackend = async (dataPayload: string, type: 'image' | 'text', region: string) => {
    try {
      // ⚠️ REPLACE WITH YOUR LAPTOP IP
      const LAPTOP_IP = "192.168.1.116"; 
      
      const body = type === 'image' 
        ? { image: dataPayload, region: region } 
        : { text: dataPayload };

      const response = await fetch(`http://${LAPTOP_IP}:5000/check-ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      const newHistoryItem = {
        id: Date.now().toString(),
        status: data.status,
        reason: data.reason,
        color: data.color,
        date: new Date().toLocaleString(),
        type: type === 'image' ? 'Camera Scan' : 'Manual Search'
      };
      await saveToHistory(newHistoryItem);

      setScanResult({ status: data.status, reason: data.reason, color: data.color });
      setModalVisible(true);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Connection failed. Check your IP address.");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToHistory = async (newItem: any) => {
    try {
      const existingHistory = await AsyncStorage.getItem('scan_history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      const updatedHistory = [newItem, ...history].slice(0, 20);
      await AsyncStorage.setItem('scan_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  return (
    <View style={styles.container}>
      
      {mode === 'camera' ? (
        <View style={StyleSheet.absoluteFill}>
          <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" />
          <View style={styles.overlay}>
            
            <View style={styles.chipContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {REGIONS.map((r) => (
                  <TouchableOpacity 
                    key={r.id} 
                    style={[styles.chip, selectedRegion === r.id && styles.activeChip]}
                    onPress={() => setSelectedRegion(r.id)}
                  >
                    <Text style={[styles.chipText, selectedRegion === r.id && styles.activeChipText]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.regionHint}>
                {REGIONS.find(r => r.id === selectedRegion)?.desc}
              </Text>
            </View>

            <View style={styles.scannerFrame} />
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.manualContainer}>
          <Text style={styles.manualTitle}>Type Ingredients</Text>
          <Text style={styles.manualSubtitle}>Enter names like "E471" or "Sake"</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Gelatin, Mirin..." 
            placeholderTextColor="#888"
            value={manualText}
            onChangeText={setManualText}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleManualSearch}>
            {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>CHECK NOW</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}

      {/* TABS */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, mode === 'camera' && styles.activeTab]} onPress={() => setMode('camera')}>
          <Ionicons name="camera" size={24} color={mode === 'camera' ? "#4CAF50" : "#888"} />
          <Text style={[styles.tabText, mode === 'camera' && styles.activeTabText]}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, mode === 'manual' && styles.activeTab]} onPress={() => setMode('manual')}>
          <Ionicons name="keypad" size={24} color={mode === 'manual' ? "#4CAF50" : "#888"} />
          <Text style={[styles.tabText, mode === 'manual' && styles.activeTabText]}>Manual</Text>
        </TouchableOpacity>
      </View>

      {/* CAPTURE + GALLERY BUTTONS */}
      {mode === 'camera' && (
        <View style={styles.captureRow}>
           {/* 1. Gallery Button (Small, Left) */}
           <TouchableOpacity style={styles.galleryButton} onPress={pickImage} disabled={isProcessing}>
             <Ionicons name="images" size={28} color="white" />
           </TouchableOpacity>

           {/* 2. Capture Button (Big, Center) */}
           <TouchableOpacity style={styles.captureButton} onPress={takePictureAndAnalyze} disabled={isProcessing}>
             {isProcessing ? <ActivityIndicator size="large" color="#fff" /> : <Ionicons name="scan-circle" size={70} color="white" />}
           </TouchableOpacity>
           
           {/* 3. Spacer (To keep center button centered) */}
           <View style={{ width: 50 }} />
        </View>
      )}

      <ResultModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        status={scanResult.status}
        reason={scanResult.reason}
        color={scanResult.color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  chipContainer: { position: 'absolute', top: 60, height: 80, width: '100%', alignItems: 'center', zIndex: 10 },
  chip: { backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginHorizontal: 5, borderWidth: 1, borderColor: '#555' },
  activeChip: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  chipText: { color: '#ccc', fontWeight: '600' },
  activeChipText: { color: 'white' },
  regionHint: { color: '#ddd', fontSize: 12, marginTop: 5, fontStyle: 'italic' },
  scannerFrame: { width: 280, height: 280, borderWidth: 2, borderColor: '#4CAF50', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  manualContainer: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#121212' },
  manualTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  manualSubtitle: { fontSize: 16, color: '#aaa', marginBottom: 30 },
  input: { backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 10, fontSize: 18, marginBottom: 20 },
  searchButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center' },
  tabBar: { flexDirection: 'row', position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#222', borderRadius: 30, padding: 5, justifyContent: 'space-around' },
  tabItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  activeTab: { backgroundColor: 'rgba(76, 175, 80, 0.2)' },
  tabText: { color: '#888', marginLeft: 8, fontWeight: '600' },
  activeTabText: { color: '#4CAF50' },
  
  // NEW STYLES FOR BUTTON ROW
  captureRow: { 
    position: 'absolute', 
    bottom: 100, 
    flexDirection: 'row', 
    width: '100%', 
    justifyContent: 'space-evenly', 
    alignItems: 'center',
    paddingHorizontal: 40
  },
  captureButton: { 
    backgroundColor: '#4CAF50', 
    padding: 5, 
    borderRadius: 50, 
    elevation: 5 
  },
  galleryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  button: { marginTop: 10, backgroundColor: '#4CAF50', padding: 10, borderRadius: 5 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  text: { color: 'white' }
});