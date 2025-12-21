import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/design';

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
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Card Score</Text>
          <Text style={styles.titleAccent}>Tracker</Text>
        </View>
        <Text style={styles.subtitle}>Track your card game scores with style</Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonPrimary]}
            onPress={() => navigation.navigate('StartGame')}
            activeOpacity={0.8}
          >
            <View style={styles.menuButtonContent}>
              <Text style={styles.menuButtonIcon}>🎮</Text>
              <Text style={styles.menuButtonText}>Start New Game</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonSecondary]}
            onPress={() => navigation.navigate('Players')}
            activeOpacity={0.8}
          >
            <View style={styles.menuButtonContent}>
              <Text style={styles.menuButtonIcon}>👥</Text>
              <Text style={styles.menuButtonText}>Manage Players</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonAccent]}
            onPress={() => navigation.navigate('Templates')}
            activeOpacity={0.8}
          >
            <View style={styles.menuButtonContent}>
              <Text style={styles.menuButtonIcon}>📋</Text>
              <Text style={styles.menuButtonText}>Game Templates</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonInfo]}
            onPress={() => navigation.navigate('GameHistory')}
            activeOpacity={0.8}
          >
            <View style={styles.menuButtonContent}>
              <Text style={styles.menuButtonIcon}>📊</Text>
              <Text style={styles.menuButtonText}>Game History</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing.huge,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingTight,
    marginRight: Spacing.sm,
  },
  titleAccent: {
    fontSize: Typography.h1,
    fontWeight: Typography.extrabold,
    color: Colors.primaryLight,
    letterSpacing: Typography.letterSpacingTight,
  },
  subtitle: {
    fontSize: Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    color: Colors.textSecondary,
    fontWeight: Typography.regular,
    letterSpacing: Typography.letterSpacingNormal,
  },
  menuContainer: {
    gap: Spacing.lg,
  },
  menuButton: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    ...Shadows.lg,
  },
  menuButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  menuButtonSecondary: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondaryLight,
  },
  menuButtonAccent: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accentLight,
  },
  menuButtonInfo: {
    backgroundColor: Colors.info,
    borderColor: Colors.infoLight,
  },
  menuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  menuButtonIcon: {
    fontSize: 24,
  },
  menuButtonText: {
    color: Colors.surface,
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    letterSpacing: Typography.letterSpacingWide,
  },
});

