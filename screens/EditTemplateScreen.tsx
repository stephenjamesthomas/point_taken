import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { GameTemplate, WinCondition, EndCondition, EndConditionTiming } from '../types';
import { loadTemplates, saveTemplates } from '../utils/storage';

type EditTemplateScreenRouteProp = RouteProp<RootStackParamList, 'EditTemplate'>;
type EditTemplateScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditTemplate'
>;

export default function EditTemplateScreen() {
  const route = useRoute<EditTemplateScreenRouteProp>();
  const navigation = useNavigation<EditTemplateScreenNavigationProp>();
  const templateId = route.params?.templateId;

  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [minPlayers, setMinPlayers] = useState('2');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [unlimitedPlayers, setUnlimitedPlayers] = useState(false);
  const [winCondition, setWinCondition] = useState<WinCondition>('high');
  const [endCondition, setEndCondition] = useState<EndCondition>('manual');
  const [endConditionValue, setEndConditionValue] = useState('');
  const [endConditionAbsoluteValue, setEndConditionAbsoluteValue] = useState(false);
  const [endConditionTiming, setEndConditionTiming] = useState<EndConditionTiming>('finishRound');

  useEffect(() => {
    if (templateId) {
      loadTemplateData();
    }
  }, [templateId]);

  const loadTemplateData = async () => {
    if (!templateId) return;
    const templates = await loadTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      setMinPlayers(template.minPlayers.toString());
      setMaxPlayers(template.maxPlayers?.toString() || '4');
      setUnlimitedPlayers(template.maxPlayers === undefined);
      setWinCondition(template.winCondition || 'high');
      setEndCondition(template.endCondition || 'manual');
      setEndConditionValue(template.endConditionValue?.toString() || '');
      setEndConditionAbsoluteValue(template.endConditionAbsoluteValue || false);
      setEndConditionTiming(template.endConditionTiming || 'finishRound');
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    const min = parseInt(minPlayers, 10);

    if (isNaN(min) || min < 1) {
      Alert.alert('Error', 'Please enter a valid minimum number of players (at least 1)');
      return;
    }

    let max: number | undefined;
    if (!unlimitedPlayers) {
      const maxValue = parseInt(maxPlayers, 10);
      if (isNaN(maxValue) || maxValue < 1) {
        Alert.alert('Error', 'Please enter a valid maximum number of players');
        return;
      }
      if (maxValue < min) {
        Alert.alert('Error', 'Maximum players must be greater than or equal to minimum players');
        return;
      }
      max = maxValue;
    }

    // Validate end condition value if needed
    let endValue: number | undefined;
    if (endCondition === 'rounds' || endCondition === 'target') {
      const value = parseInt(endConditionValue, 10);
      if (isNaN(value) || value < 1) {
        Alert.alert('Error', 'Please enter a valid number for the end condition');
        return;
      }
      endValue = value;
    }

    // Validate timing for target score
    let timing: EndConditionTiming | undefined;
    if (endCondition === 'target') {
      timing = endConditionTiming;
    }

    const templates = await loadTemplates();
    let updatedTemplates: GameTemplate[];

    if (templateId) {
      // Editing existing template
      updatedTemplates = templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              name: templateName.trim(),
              description: templateDescription.trim() || undefined,
              minPlayers: min,
              maxPlayers: max,
              winCondition,
              endCondition,
              endConditionValue: endValue,
              endConditionAbsoluteValue: endCondition === 'target' ? endConditionAbsoluteValue : undefined,
              endConditionTiming: timing,
            }
          : t
      );
    } else {
      // Creating new template
      const newTemplate: GameTemplate = {
        id: Date.now().toString(),
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        minPlayers: min,
        maxPlayers: max,
        winCondition,
        endCondition,
        endConditionValue: endValue,
        endConditionAbsoluteValue: endCondition === 'target' ? endConditionAbsoluteValue : undefined,
        endConditionTiming: timing,
        createdAt: new Date().toISOString(),
      };
      updatedTemplates = [...templates, newTemplate];
    }

    await saveTemplates(updatedTemplates);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {templateId ? 'Edit Template' : 'New Template'}
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        bounces={true}
      >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <Text style={styles.label}>Template Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Template name"
              value={templateName}
              onChangeText={setTemplateName}
            />
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={templateDescription}
              onChangeText={setTemplateDescription}
              multiline={true}
              numberOfLines={3}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Player Limits</Text>
            <View style={styles.playerLimits}>
              <View style={[styles.playerLimitInput, styles.playerLimitSpacing]}>
                <Text style={styles.label}>Min Players</Text>
                <TextInput
                  style={[
                    styles.numberInput,
                    unlimitedPlayers && styles.numberInputDisabled,
                  ]}
                  placeholder="2"
                  value={minPlayers}
                  onChangeText={setMinPlayers}
                  keyboardType="numeric"
                  editable={!unlimitedPlayers}
                />
              </View>
              <View style={styles.playerLimitInput}>
                <Text style={styles.label}>Max Players</Text>
                <TextInput
                  style={[
                    styles.numberInput,
                    unlimitedPlayers && styles.numberInputDisabled,
                  ]}
                  placeholder="4"
                  value={maxPlayers}
                  onChangeText={setMaxPlayers}
                  keyboardType="numeric"
                  editable={!unlimitedPlayers}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setUnlimitedPlayers(!unlimitedPlayers)}
            >
              <View style={[styles.checkbox, unlimitedPlayers && styles.checkboxChecked]}>
                {unlimitedPlayers && <Text style={styles.checkmarkSmall}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Unlimited players</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Win</Text>
            <Text style={styles.description}>
              Select how the winner is determined
            </Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  winCondition === 'high' && styles.radioOptionSelected,
                ]}
                onPress={() => setWinCondition('high')}
              >
                <Text
                  style={[
                    styles.radioText,
                    winCondition === 'high' && styles.radioTextSelected,
                  ]}
                >
                  High Score Wins
                </Text>
                {winCondition === 'high' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  winCondition === 'low' && styles.radioOptionSelected,
                ]}
                onPress={() => setWinCondition('low')}
              >
                <Text
                  style={[
                    styles.radioText,
                    winCondition === 'low' && styles.radioTextSelected,
                  ]}
                >
                  Low Score Wins
                </Text>
                {winCondition === 'low' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to End Game</Text>
            <Text style={styles.description}>
              Select when the game should end
            </Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  endCondition === 'manual' && styles.radioOptionSelected,
                ]}
                onPress={() => setEndCondition('manual')}
              >
                <Text
                  style={[
                    styles.radioText,
                    endCondition === 'manual' && styles.radioTextSelected,
                  ]}
                >
                  Manually
                </Text>
                {endCondition === 'manual' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  endCondition === 'rounds' && styles.radioOptionSelected,
                ]}
                onPress={() => setEndCondition('rounds')}
              >
                <Text
                  style={[
                    styles.radioText,
                    endCondition === 'rounds' && styles.radioTextSelected,
                  ]}
                >
                  Number of Rounds
                </Text>
                {endCondition === 'rounds' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  endCondition === 'target' && styles.radioOptionSelected,
                ]}
                onPress={() => setEndCondition('target')}
              >
                <Text
                  style={[
                    styles.radioText,
                    endCondition === 'target' && styles.radioTextSelected,
                  ]}
                >
                  Target Score
                </Text>
                {endCondition === 'target' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {endCondition === 'rounds' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Number of Rounds</Text>
              <Text style={styles.description}>
                Game will automatically end after this many rounds
              </Text>
              <TextInput
                style={styles.numberInput}
                placeholder="10"
                value={endConditionValue}
                onChangeText={setEndConditionValue}
                keyboardType="numeric"
              />
            </View>
          )}

          {endCondition === 'target' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Target Score</Text>
                <Text style={styles.description}>
                  Game will end when a player reaches this score
                </Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="100"
                  value={endConditionValue}
                  onChangeText={setEndConditionValue}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setEndConditionAbsoluteValue(!endConditionAbsoluteValue)}
                >
                  <View style={[styles.checkbox, endConditionAbsoluteValue && styles.checkboxChecked]}>
                    {endConditionAbsoluteValue && <Text style={styles.checkmarkSmall}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Use absolute value{endConditionValue ? ` (game ends at +${endConditionValue} or -${endConditionValue})` : ''}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>When to End</Text>
                <Text style={styles.description}>
                  Choose when the game ends after target is reached
                </Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.radioOption,
                      endConditionTiming === 'immediately' &&
                        styles.radioOptionSelected,
                    ]}
                    onPress={() => setEndConditionTiming('immediately')}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        endConditionTiming === 'immediately' &&
                          styles.radioTextSelected,
                      ]}
                    >
                      Immediately
                    </Text>
                    {endConditionTiming === 'immediately' && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.radioOption,
                      endConditionTiming === 'finishRound' &&
                        styles.radioOptionSelected,
                    ]}
                    onPress={() => setEndConditionTiming('finishRound')}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        endConditionTiming === 'finishRound' &&
                          styles.radioTextSelected,
                      ]}
                    >
                      Finish Round
                    </Text>
                    {endConditionTiming === 'finishRound' && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.radioOption,
                      endConditionTiming === 'additionalTurn' &&
                        styles.radioOptionSelected,
                    ]}
                    onPress={() => setEndConditionTiming('additionalTurn')}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        endConditionTiming === 'additionalTurn' &&
                          styles.radioTextSelected,
                      ]}
                    >
                      Additional Turn
                    </Text>
                    {endConditionTiming === 'additionalTurn' && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 2,
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  playerLimits: {
    flexDirection: 'row',
    marginTop: 8,
  },
  playerLimitInput: {
    flex: 1,
  },
  playerLimitSpacing: {
    marginRight: 12,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  numberInputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  radioGroup: {
    marginTop: 12,
  },
  radioOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  radioOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  radioText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  radioTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 0,
  },
  checkboxChecked: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  checkmarkSmall: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

