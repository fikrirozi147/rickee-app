import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ResultModalProps {
  visible: boolean;
  onClose: () => void;
  status: string;
  reason: string;
  color: string;
}

export default function ResultModal({ visible, onClose, status, reason, color }: ResultModalProps) {
  
  // Choose an icon based on status
  const getIcon = () => {
    if (status === 'Halal') return 'checkmark-circle';
    if (status === 'Haram') return 'alert-circle';
    if (status === 'Mushbooh') return 'help-circle';
    return 'search'; // Default
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        {/* Dark Background Overlay */}
        <View style={styles.backdrop} />

        {/* The Modal Box */}
        <View style={styles.modalView}>
          
          {/* Header Icon */}
          <Ionicons name={getIcon()} size={80} color={color} style={{ marginBottom: 10 }} />

          {/* Status Title (e.g., HALAL) */}
          <Text style={[styles.modalTitle, { color: color }]}>
            {status.toUpperCase()}
          </Text>

          {/* Reason Text (Scrollable in case it's long) */}
          <ScrollView style={styles.scrollArea}>
            <Text style={styles.modalText}>
              {reason || "No ingredients found."}
            </Text>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: color }]}
            onPress={onClose}
          >
            <Text style={styles.textStyle}>SCAN AGAIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)', // Dim background
  },
  modalView: {
    width: '85%',
    maxHeight: '60%',
    backgroundColor: '#1E1E1E', // Dark grey card
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollArea: {
    marginVertical: 15,
    width: '100%',
  },
  modalText: {
    color: '#DDD', // Light text
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 2,
    marginTop: 10,
    width: '100%',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});