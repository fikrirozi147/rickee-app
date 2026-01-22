import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur'; // <--- The Magic Ingredient
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
  const [scanResult, setScanResult] = useState({ status: "Ready", reason: "", color: "#4CAF50" });

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

  const takePictureAndAnalyze = async () => {
    if (!cameraRef.current || isProcessing) return;
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, base64: true, skipProcessing: true });
      await checkBackend(photo.base64, 'image', selectedRegion);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, quality: 0.5, base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0].base64) {
        setIsProcessing(true);
        await checkBackend(result.assets[0].base64, 'image', selectedRegion);
      }
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualText.trim()) return;
    setIsProcessing(true);
    await checkBackend(manualText, 'text', 'ALL');
  };

  const checkBackend = async (dataPayload: string, type: 'image' | 'text', region: string) => {
    try {
      const LAPTOP_IP = "192.168.1.116"; // REPLACE WITH YOUR IP
      const body = type === 'image' ? { image: dataPayload, region: region } : { text: dataPayload };

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
      Alert.alert("Error", "Connection failed. Check your IP.");
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
    } catch (e) { console.error(e); }
  };

  return (
    <View style={styles.container}>
      {mode === 'camera' ? (
        <View style={StyleSheet.absoluteFill}>
          <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" />
          
          {/* GLASS HEADER: Region Selector */}
          <View style={styles.topGlassContainer}>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 10}}>
                {REGIONS.map((r) => (
                  <BlurView intensity={30} tint="dark" key={r.id} style={[styles.glassChip, selectedRegion === r.id && styles.activeGlassChip]}>
                    <TouchableOpacity onPress={() => setSelectedRegion(r.id)}>
                      <Text style={[styles.chipText, selectedRegion === r.id && styles.activeChipText]}>{r.label}</Text>
                    </TouchableOpacity>
                  </BlurView>
                ))}
              </ScrollView>
              <Text style={styles.regionHint}>{REGIONS.find(r => r.id === selectedRegion)?.desc}</Text>
          </View>

          {/* SCANNER FRAME */}
          <View style={styles.overlay}>
             <View style={styles.scannerFrame} />
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.manualContainer}>
          <Text style={styles.manualTitle}>Type Ingredients</Text>
          <BlurView intensity={20} tint="dark" style={styles.glassInputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Gelatin, Mirin..." 
              placeholderTextColor="#aaa"
              value={manualText}
              onChangeText={setManualText}
            />
          </BlurView>
          <TouchableOpacity style={styles.searchButton} onPress={handleManualSearch}>
            {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>CHECK NOW</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}

      {/* GLASS DOCK: Bottom Tab Bar */}
      <BlurView intensity={50} tint="dark" style={styles.glassDock}>
        <TouchableOpacity style={[styles.dockItem, mode === 'camera' && styles.activeDockItem]} onPress={() => setMode('camera')}>
          <Ionicons name="camera" size={24} color={mode === 'camera' ? "#fff" : "#888"} />
          <Text style={[styles.dockText, mode === 'camera' && styles.activeDockText]}>Scan</Text>
        </TouchableOpacity>
        
        {/* CENTER ACTION BUTTON */}
        {mode === 'camera' && (
          <View style={styles.actionCluster}>
             <TouchableOpacity style={styles.miniGlassBtn} onPress={pickImage} disabled={isProcessing}>
               <Ionicons name="images" size={20} color="white" />
             </TouchableOpacity>
             <TouchableOpacity style={styles.bigGlassBtn} onPress={takePictureAndAnalyze} disabled={isProcessing}>
               {isProcessing ? <ActivityIndicator color="#fff" /> : <Ionicons name="scan" size={32} color="white" />}
             </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={[styles.dockItem, mode === 'manual' && styles.activeDockItem]} onPress={() => setMode('manual')}>
          <Ionicons name="keypad" size={24} color={mode === 'manual' ? "#fff" : "#888"} />
          <Text style={[styles.dockText, mode === 'manual' && styles.activeDockText]}>Type</Text>
        </TouchableOpacity>
      </BlurView>

      <ResultModal visible={modalVisible} onClose={() => setModalVisible(false)} status={scanResult.status} reason={scanResult.reason} color={scanResult.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // GLASS HEADER
  topGlassContainer: { position: 'absolute', top: 60, width: '100%', alignItems: 'center', zIndex: 10 },
  glassChip: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginHorizontal: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeGlassChip: { backgroundColor: 'rgba(76, 175, 80, 0.5)', borderColor: '#4CAF50' },
  chipText: { color: '#ddd', fontWeight: '600' },
  activeChipText: { color: '#fff' },
  regionHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8, fontStyle: 'italic', textShadowColor: 'black', textShadowRadius: 2 },

  // SCANNER FRAME
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { width: 280, height: 280, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 24, borderStyle: 'dashed' },

  // MANUAL INPUT
  manualContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  manualTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
  glassInputContainer: { borderRadius: 15, padding: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
  input: { color: 'white', padding: 15, fontSize: 18 },
  searchButton: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 15, alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.5, shadowRadius: 10 },

  // GLASS DOCK (Bottom Bar)
  glassDock: { 
    position: 'absolute', bottom: 110, left: 20, right: 20, 
    height: 80, borderRadius: 40, overflow: 'hidden', 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  dockItem: { alignItems: 'center', opacity: 0.6 },
  activeDockItem: { opacity: 1 },
  dockText: { color: 'white', fontSize: 10, marginTop: 4 },
  activeDockText: { fontWeight: 'bold' },

  // ACTION BUTTONS (Center of Dock)
  actionCluster: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  miniGlassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  bigGlassBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.6, shadowRadius: 8 },

  button: { marginTop: 10, backgroundColor: '#4CAF50', padding: 10, borderRadius: 5 },
  buttonText: { color: 'white' },
  text: { color: 'white' }
});