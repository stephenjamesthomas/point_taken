import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { GameTemplate } from '../types';
import { loadTemplates, saveTemplates } from '../utils/storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/design';

type TemplatesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Templates'>;

export default function TemplatesScreen() {
  const navigation = useNavigation<TemplatesScreenNavigationProp>();
  const [templates, setTemplates] = useState<GameTemplate[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadTemplatesData();
    }, [])
  );

  const loadTemplatesData = async () => {
    const loadedTemplates = await loadTemplates();
    setTemplates(loadedTemplates);
  };

  const handleAddTemplate = () => {
    navigation.navigate('EditTemplate', {});
  };

  const handleEditTemplate = (template: GameTemplate) => {
    navigation.navigate('EditTemplate', { templateId: template.id });
  };

  const handleDeleteTemplate = (template: GameTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete ${template.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedTemplates = templates.filter((t) => t.id !== template.id);
            await saveTemplates(updatedTemplates);
            setTemplates(updatedTemplates);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Game Templates</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTemplate}>
          <Text style={styles.addButtonText}>+ Add Template</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.templateItem}>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.templateDescription}>{item.description}</Text>
              )}
              <Text style={styles.templatePlayers}>
                Players: {item.minPlayers} - {item.maxPlayers !== undefined ? item.maxPlayers : 'Unlimited'}
              </Text>
            </View>
            <View style={styles.templateActions}>
              <TouchableOpacity
                style={[styles.editButton, styles.buttonSpacing]}
                onPress={() => handleEditTemplate(item)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTemplate(item)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No templates yet. Create your first game template!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.xl,
    paddingTop: 60,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.sm,
  },
  backButton: {
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: Typography.body,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    marginBottom: Spacing.lg,
    color: Colors.textPrimary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  addButtonText: {
    color: Colors.surface,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
  templateItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  templateInfo: {
    marginBottom: Spacing.md,
  },
  templateName: {
    fontSize: Typography.h5,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  templateDescription: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.bodySmall * Typography.lineHeightNormal,
  },
  templatePlayers: {
    fontSize: Typography.bodySmall,
    color: Colors.textTertiary,
  },
  templateActions: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  buttonSpacing: {
    // Using gap instead
  },
  editButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  editButtonText: {
    color: Colors.surface,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  deleteButtonText: {
    color: Colors.surface,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
  },
  emptyContainer: {
    padding: Spacing.huge,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.body,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});

