import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import ResultModal from '@/components/ResultModal'; // <--- Import the Modal

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  
  // NEW: State to handle opening the modal from history
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) { loadHistory(); }
  }, [isFocused]);

  const loadHistory = async () => {
    const data = await AsyncStorage.getItem('scan_history');
    if (data) {
      const parsed = JSON.parse(data);
      setHistory(parsed);
      setFilteredData(parsed);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = history.filter(item => 
      // UPGRADE: Now searches Status, Reason, Date, and Type
      (item.status && item.status.toLowerCase().includes(text.toLowerCase())) ||
      (item.reason && item.reason.toLowerCase().includes(text.toLowerCase())) ||
      (item.date && item.date.includes(text)) ||
      (item.type && item.type.toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredData(filtered);
  };

  const clearHistory = () => {
    AsyncStorage.removeItem('scan_history');
    setHistory([]);
    setFilteredData([]);
  };

  // NEW: Handle Card Tap
  const openDetails = (item: any) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }: any) => (
    // WRAPPER: Make the card clickable
    <TouchableOpacity onPress={() => openDetails(item)} activeOpacity={0.8}>
      <BlurView intensity={20} tint="dark" style={[styles.glassCard, { borderColor: 'rgba(255,255,255,0.1)' }]}>
        
        {/* Top Row: Badge + Date */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: item.color }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>

        {/* Middle: Content */}
        <Text style={styles.typeText}>{item.type}</Text>
        <Text style={styles.reasonText} numberOfLines={2}>
          {item.reason ? item.reason : "No flagged ingredients."}
        </Text>

        {/* Decorative Icon (Chevron) */}
        <Ionicons name="chevron-forward" size={20} color="#555" style={styles.arrowIcon} />
        
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }} 
      style={styles.container}
      blurRadius={60}
    >
      <View style={styles.darkOverlay} />

      <View style={styles.contentContainer}>
        
        <View style={styles.headerRow}>
          <Text style={styles.title}>History</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={22} color="#FF4D4D" />
            </TouchableOpacity>
          )}
        </View>
        
        <BlurView intensity={30} tint="dark" style={styles.glassSearchBar}>
          <Ionicons name="search" size={20} color="#aaa" />
          <TextInput 
            style={styles.input}
            placeholder="Search 'Haram', 'Sake', etc..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={handleSearch}
          />
        </BlurView>

        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={60} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No history yet.</Text>
            </View>
          }
        />

        {/* RE-USE THE RESULT MODAL HERE */}
        {selectedItem && (
            <ResultModal 
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                status={selectedItem.status}
                reason={selectedItem.reason}
                color={selectedItem.color}
            />
        )}

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  contentContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 70 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 34, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
  clearBtn: { padding: 8, backgroundColor: 'rgba(255, 77, 77, 0.1)', borderRadius: 12 },
  glassSearchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 15, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  input: { flex: 1, color: 'white', marginLeft: 10, fontSize: 16 },
  glassCard: { borderRadius: 24, padding: 20, marginBottom: 15, overflow: 'hidden', borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  statusText: { color: 'white', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
  dateText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  typeText: { color: '#ccc', fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  reasonText: { color: 'white', fontSize: 16, fontWeight: '500', lineHeight: 22, width: '90%' },
  arrowIcon: { position: 'absolute', right: 20, top: '50%' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: 'rgba(255,255,255,0.4)', marginTop: 15, fontSize: 16 }
});