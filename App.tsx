import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './navigation/types';
import HomeScreen from './screens/HomeScreen';
import PlayersScreen from './screens/PlayersScreen';
import TemplatesScreen from './screens/TemplatesScreen';
import EditTemplateScreen from './screens/EditTemplateScreen';
import StartGameScreen from './screens/StartGameScreen';
import GameScreen from './screens/GameScreen';
import GameCompleteScreen from './screens/GameCompleteScreen';
import CompletedGameScreen from './screens/CompletedGameScreen';
import GameHistoryScreen from './screens/GameHistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Players" component={PlayersScreen} />
          <Stack.Screen name="Templates" component={TemplatesScreen} />
          <Stack.Screen name="EditTemplate" component={EditTemplateScreen} />
          <Stack.Screen name="StartGame" component={StartGameScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="GameComplete" component={GameCompleteScreen} />
          <Stack.Screen name="CompletedGame" component={CompletedGameScreen} />
          <Stack.Screen name="GameHistory" component={GameHistoryScreen} />
        </Stack.Navigator>
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
