import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
      scrollEventThrottle={16}
      bounces={true}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Card Score Tracker</Text>
        <Text style={styles.subtitle}>Track your card game scores</Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonSpacing]}
            onPress={() => navigation.navigate('StartGame')}
          >
            <Text style={styles.menuButtonText}>Start New Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonSpacing]}
            onPress={() => navigation.navigate('Players')}
          >
            <Text style={styles.menuButtonText}>Manage Players</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonSpacing]}
            onPress={() => navigation.navigate('Templates')}
          >
            <Text style={styles.menuButtonText}>Game Templates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('GameHistory')}
          >
            <Text style={styles.menuButtonText}>Game History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  menuContainer: {
  },
  menuButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  menuButtonSpacing: {
    marginBottom: 16,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

