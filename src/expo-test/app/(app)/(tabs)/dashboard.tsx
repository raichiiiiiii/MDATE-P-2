import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  // Mock data matching your schema / wireframe requirements
  const user = {
    display_name: 'MDATE User',
    username: '@mdate_user',
    profileImage: 'https://via.placeholder.com/100', // Replace with actual user profile URI
    coins: 129,
  };

  // 8 Action Buttons config
  const actionButtons = [
    { id: '1', title: 'Action 1', icon: 'flash-outline' },
    { id: '2', title: 'Action 2', icon: 'heart-outline' },
    { id: '3', title: 'Action 3', icon: 'stats-chart-outline' },
    { id: '4', title: 'Action 4', icon: 'settings-outline' },
    { id: '5', title: 'Action 5', icon: 'wallet-outline' },
    { id: '6', title: 'Action 6', icon: 'people-outline' },
    { id: '7', title: 'Action 7', icon: 'notifications-outline' },
    { id: '8', title: 'Action 8', icon: 'ellipsis-horizontal-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Top Header Section: Profile Image + Name & Username */}
        <View style={styles.headerSection}>
          <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{user.display_name}</Text>
            <Text style={styles.username}>{user.username}</Text>
          </View>
        </View>

        {/* Main Outer Card Wrapper matching wireframe */}
        <View style={styles.outerCard}>

          {/* Big Box / Widget Area (e.g., Carousel / async loadData) */}
          <View style={styles.widgetBox}>
            <Text style={styles.widgetPlaceholderText}>
              async loadData(dynamic, critical)
            </Text>
            <Text style={styles.widgetSubText}>{'<carousel />'}</Text>
          </View>

          {/* Two Wide Boxes Row */}
          <View style={styles.wideBoxesRow}>
            {/* Left Box: Coins Harnessed */}
            <View style={styles.coinBox}>
              <View style={styles.coinIconContainer}>
                <Text style={styles.coinSymbol}>$</Text>
              </View>
              <Text style={styles.coinValue}>{user.coins}</Text>
            </View>

            {/* Right Box: Undecided / Placeholder */}
            <View style={styles.undecidedBox}>
              <Text style={styles.placeholderLabel}>TBD / Metric</Text>
            </View>
          </View>

          {/* 8 Action Buttons Grid (4 columns x 2 rows) */}
          <View style={styles.gridContainer}>
            {actionButtons.map((btn) => (
              <TouchableOpacity key={btn.id} style={styles.actionButton} activeOpacity={0.7}>
                <Ionicons name={btn.icon as any} size={24} color="#333" />
                <Text style={styles.actionButtonText}>{btn.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  profileImage: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#ccc',
  },
  userInfo: {
    marginLeft: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  outerCard: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  widgetBox: {
    height: 180,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    padding: 12,
  },
  widgetPlaceholderText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 6,
  },
  widgetSubText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  wideBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  coinBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 16,
    padding: 16,
    marginRight: 8,
    backgroundColor: '#FFF',
  },
  coinIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCAC00',
    marginRight: 12,
  },
  coinSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  coinValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  undecidedBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 16,
    padding: 16,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  placeholderLabel: {
    fontSize: 13,
    color: '#999',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '22%', // Fits 4 items per row nicely with spacing
    aspectRatio: 1,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  actionButtonText: {
    fontSize: 10,
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
});
