# Card Score Tracker

A React Native mobile app built with Expo for tracking card game scores. All data is stored locally on your device using AsyncStorage - no internet connection required.

## Features

- **Player Profiles**: Add, edit, and manage player profiles
- **Game Templates**: Create reusable game templates with player limits
- **Score Tracking**: Track scores round by round for multiple players
- **Game History**: View past games and see winners
- **Local Storage**: All data is stored on your device - works offline

## Getting Started

### Prerequisites

- Node.js installed on your computer
- Expo Go app on your iOS or Android device (for testing), or
- iOS Simulator / Android Emulator

### Installation

1. Navigate to the project directory:
```bash
cd card-score-tracker
```

2. Install dependencies (if not already installed):
```bash
npm install
```

### Running the App

1. Start the Expo development server:
```bash
npm start
```

2. To run on a specific platform:
   - **iOS**: `npm run ios` (requires macOS with Xcode)
   - **Android**: `npm run android` (requires Android Studio)
   - **Web**: `npm run web`

3. **Using Expo Go** (recommended for testing):
   - Scan the QR code with:
     - **iOS**: Camera app
     - **Android**: Expo Go app
   - The app will load on your device

## How to Use

### 1. Add Players
- Go to "Manage Players" from the home screen
- Tap "+ Add Player" to create a new player profile
- You can edit or delete players at any time

### 2. Create Game Templates
- Go to "Game Templates" from the home screen
- Tap "+ Add Template" to create a new template
- Set the minimum and maximum number of players
- Add an optional description

### 3. Start a Game
- Tap "Start New Game" from the home screen
- Select a game template
- Select the players who will participate
- Tap "Start Game" to begin tracking scores

### 4. Track Scores
- In the game screen, you'll see:
  - Current standings (sorted by total score)
  - Round scores for each player
- Tap on a player's score card to enter their score for the current round
- Tap "Add Round" to save the round and start a new one
- Tap "Finish Game" when done

### 5. View Game History
- Go to "Game History" from the home screen
- View all past games with winners and statistics
- Tap "View" to see details of a completed game
- Delete games you no longer need

## Project Structure

```
card-score-tracker/
├── App.tsx                 # Main app component with navigation
├── types.ts                # TypeScript type definitions
├── screens/                # Screen components
│   ├── HomeScreen.tsx
│   ├── PlayersScreen.tsx
│   ├── TemplatesScreen.tsx
│   ├── StartGameScreen.tsx
│   ├── GameScreen.tsx
│   └── GameHistoryScreen.tsx
├── navigation/
│   └── types.ts            # Navigation type definitions
└── utils/
    └── storage.ts          # AsyncStorage utilities
```

## Technologies Used

- **React Native**: Mobile app framework
- **Expo**: Development platform and tooling
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation library
- **AsyncStorage**: Local data persistence
- **React Native Safe Area Context**: Safe area handling

## Data Storage

All data is stored locally on your device using AsyncStorage. The app stores:
- Player profiles
- Game templates
- Game history with scores

No data is sent to any server - everything stays on your device.

## Troubleshooting

- **App won't start**: Make sure all dependencies are installed (`npm install`)
- **Navigation errors**: Ensure you're using the latest version of React Navigation
- **Data not persisting**: Check that AsyncStorage permissions are granted (usually automatic)

## Next Steps

To customize the app further, you can:
- Add more game template options
- Implement different scoring systems
- Add statistics and charts
- Export game data
- Add themes and customization options

Happy gaming! 🎮

