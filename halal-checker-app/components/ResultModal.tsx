import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface ResultModalProps {
  visible: boolean;
  onClose: () => void;
  status: string;
  reason: string;
  color: string;
}

export default function ResultModal({ visible, onClose, status, reason, color }: ResultModalProps) {
  
  const getIcon = () => {
    if (status === 'Halal') return 'checkmark-circle';
    if (status === 'Haram') return 'alert-circle';
    if (status === 'Mushbooh') return 'help-circle';
    return 'search'; 
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      {/* FULL SCREEN BLUR BACKGROUND */}
      <BlurView intensity={40} tint="dark" style={styles.centeredView}>
        
        {/* GLASS CARD */}
        <View style={[styles.modalView, { borderColor: color }]}>
          
          <Ionicons name={getIcon()} size={70} color={color} style={{ marginBottom: 15 }} />

          <Text style={[styles.modalTitle, { color: color }]}>
            {status.toUpperCase()}
          </Text>

          <ScrollView style={styles.scrollArea}>
            <Text style={styles.modalText}>
              {reason || "No prohibited ingredients found."}
            </Text>
          </ScrollView>

          <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={onClose}>
            <Text style={styles.textStyle}>SCAN AGAIN</Text>
          </TouchableOpacity>

        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalView: {
    width: '85%', maxHeight: '65%',
    backgroundColor: 'rgba(30, 30, 30, 0.85)', // Semi-transparent dark
    borderRadius: 25, padding: 30, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.5, // Thin colored border based on Halal/Haram
  },
  modalTitle: { marginBottom: 10, textAlign: 'center', fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  scrollArea: { marginVertical: 10, width: '100%' },
  modalText: { color: '#EEE', fontSize: 16, textAlign: 'center', lineHeight: 24, fontWeight: '500' },
  button: { borderRadius: 30, paddingVertical: 14, paddingHorizontal: 30, elevation: 2, marginTop: 15, width: '100%', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: {width: 0, height: 4} },
  textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16, letterSpacing: 1 },
});