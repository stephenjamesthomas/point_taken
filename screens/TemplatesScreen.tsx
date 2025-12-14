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
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  templateItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  templateInfo: {
    marginBottom: 12,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  templatePlayers: {
    fontSize: 14,
    color: '#999',
  },
  templateActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  buttonSpacing: {
    marginRight: 8,
  },
  editButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

