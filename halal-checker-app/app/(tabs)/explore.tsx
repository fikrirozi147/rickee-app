import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface HistoryItem {
  id: string;
  color: string;
  status: string;
  date: string;
  type: string;
  reason: string;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const isFocused = useIsFocused(); // Refresh list when tab is clicked

  useEffect(() => {
    if (isFocused) { loadHistory(); }
  }, [isFocused]);

  const loadHistory = async () => {
    const data = await AsyncStorage.getItem('scan_history');
    if (data) setHistory(JSON.parse(data));
  };

  const clearHistory = () => {
    Alert.alert("Clear History", "Are you sure?", [
      { text: "Cancel" },
      { text: "Clear", onPress: async () => {
          await AsyncStorage.removeItem('scan_history');
          setHistory([]);
      }}
    ]);
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.card}>
      <View style={[styles.statusBadge, { backgroundColor: item.color }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
      <View style={styles.infoArea}>
        <Text style={styles.dateText}>{item.date} • {item.type}</Text>
        <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Ionicons name="trash-outline" size={24} color="#FF4D4D" />
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#333" />
          <Text style={styles.emptyText}>No scans yet.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  list: { paddingBottom: 100 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 15, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 10, width: 90, alignItems: 'center' },
  statusText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  infoArea: { marginLeft: 15, flex: 1 },
  dateText: { color: '#888', fontSize: 12, marginBottom: 4 },
  reasonText: { color: '#BBB', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#555', marginTop: 10, fontSize: 18 }
});