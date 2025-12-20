# Code Quality Improvement Plan

## Overview
This document outlines a comprehensive plan to improve code quality, maintainability, and developer experience for the Card Score Tracker app.

---

## Phase 1: Linting & Formatting Setup

### 1.1 ESLint Configuration
**Priority: High** | **Estimated Time: 30 minutes**

**Actions:**
- Install ESLint with React Native and TypeScript plugins
- Configure rules for:
  - React Hooks best practices
  - TypeScript strict type checking
  - Common code quality issues
  - Unused variables/imports
  - Console statements (warn instead of error for console.error)

**Files to create:**
- `.eslintrc.js` or `.eslintrc.json`
- Add lint script to `package.json`

**Benefits:**
- Catch bugs early
- Enforce consistent code style
- Prevent common React/TypeScript mistakes

---

### 1.2 Prettier Configuration
**Priority: High** | **Estimated Time: 15 minutes**

**Actions:**
- Install Prettier
- Configure formatting rules (2 spaces, single quotes, etc.)
- Set up integration with ESLint
- Add format script to `package.json`
- Optionally add pre-commit hooks

**Files to create:**
- `.prettierrc` or `.prettierrc.json`
- `.prettierignore`

**Benefits:**
- Consistent code formatting
- Eliminates formatting debates
- Better code readability

---

## Phase 2: Code Organization & Structure

### 2.1 Extract Shared Constants
**Priority: Medium** | **Estimated Time: 1 hour**

**Issues Found:**
- Avatar colors duplicated in `GameScreen.tsx` and `StartGameScreen.tsx`
- Magic numbers scattered throughout code
- Hardcoded color values repeated

**Actions:**
- Create `constants/colors.ts` for color palette
- Create `constants/avatar.ts` for avatar-related constants
- Create `constants/index.ts` as barrel export
- Replace hardcoded values with constants

**Files to create:**
- `constants/colors.ts`
- `constants/avatar.ts`
- `constants/index.ts`

**Files to modify:**
- `screens/GameScreen.tsx`
- `screens/StartGameScreen.tsx`
- `screens/EditPlayerScreen.tsx`
- Other screens with hardcoded colors

---

### 2.2 Extract Utility Functions
**Priority: High** | **Estimated Time: 2 hours**

**Issues Found:**
- Avatar helper functions (`getInitials`, `getAvatarColor`) duplicated across screens
- Score calculation logic repeated
- Date formatting logic could be centralized

**Actions:**
- Create `utils/avatar.ts` for avatar utilities
- Create `utils/score.ts` for score calculation utilities
- Create `utils/date.ts` for date formatting
- Create `utils/validation.ts` for input validation

**Files to create:**
- `utils/avatar.ts`
- `utils/score.ts`
- `utils/date.ts`
- `utils/validation.ts`

**Files to modify:**
- All screen files using these utilities

---

### 2.3 Extract Reusable Components
**Priority: High** | **Estimated Time: 3-4 hours**

**Issues Found:**
- Large screen components (GameScreen: 685 lines, EditTemplateScreen: 678 lines)
- Repeated UI patterns (buttons, modals, input fields)
- Avatar rendering logic duplicated

**Actions:**
- Create `components/PlayerAvatar.tsx` for avatar display
- Create `components/ScoreInputModal.tsx` (extract from GameScreen)
- Create `components/Button.tsx` for consistent button styling
- Create `components/Input.tsx` for form inputs
- Create `components/ConfirmDialog.tsx` for Alert confirmations

**Files to create:**
- `components/PlayerAvatar.tsx`
- `components/ScoreInputModal.tsx`
- `components/Button.tsx`
- `components/Input.tsx`
- `components/ConfirmDialog.tsx`
- `components/index.ts` (barrel export)

**Files to modify:**
- `screens/GameScreen.tsx` (reduce from 685 to ~400 lines)
- `screens/StartGameScreen.tsx`
- `screens/EditPlayerScreen.tsx`
- Other screens with repeated patterns

---

## Phase 3: Error Handling & Logging

### 3.1 Improve Error Handling
**Priority: Medium** | **Estimated Time: 2 hours**

**Issues Found:**
- `console.error` statements without user feedback
- No error boundaries
- Silent failures in async operations
- Generic error messages

**Actions:**
- Create `utils/errorHandler.ts` for centralized error handling
- Add user-friendly error messages
- Create `components/ErrorBoundary.tsx` for React error boundaries
- Replace console.error with proper error handling
- Add error logging utility (optional: integrate with crash reporting)

**Files to create:**
- `utils/errorHandler.ts`
- `components/ErrorBoundary.tsx`

**Files to modify:**
- `utils/storage.ts` (improve error handling)
- All screen files with async operations

---

### 3.2 Add Loading States
**Priority: Medium** | **Estimated Time: 1 hour**

**Issues Found:**
- Some screens show "Loading..." but could be more consistent
- No loading indicators for async operations

**Actions:**
- Create `components/LoadingSpinner.tsx`
- Create `components/LoadingScreen.tsx`
- Standardize loading states across screens

**Files to create:**
- `components/LoadingSpinner.tsx`
- `components/LoadingScreen.tsx`

---

## Phase 4: Type Safety & Code Quality

### 4.1 Improve TypeScript Usage
**Priority: Medium** | **Estimated Time: 2 hours**

**Issues Found:**
- Some `any` types in storage.ts migration code
- Missing return type annotations
- Could use more specific types

**Actions:**
- Remove `any` types where possible
- Add explicit return types to functions
- Create utility types for common patterns
- Add stricter type checking

**Files to modify:**
- `utils/storage.ts`
- All screen files
- `types.ts` (add utility types if needed)

---

### 4.2 Extract Custom Hooks
**Priority: Medium** | **Estimated Time: 2-3 hours**

**Issues Found:**
- Repeated data loading patterns
- Similar state management across screens
- useEffect dependencies could be better managed

**Actions:**
- Create `hooks/useGameData.ts` for game data loading
- Create `hooks/usePlayers.ts` for player data
- Create `hooks/useTemplates.ts` for template data
- Create `hooks/useDebounce.ts` for search inputs

**Files to create:**
- `hooks/useGameData.ts`
- `hooks/usePlayers.ts`
- `hooks/useTemplates.ts`
- `hooks/useDebounce.ts`
- `hooks/index.ts` (barrel export)

**Files to modify:**
- All screen files using these patterns

---

## Phase 5: Performance Optimizations

### 5.1 Memoization & Optimization
**Priority: Low** | **Estimated Time: 2 hours**

**Issues Found:**
- Some expensive calculations not memoized
- FlatList/ScrollView could use better optimization props
- Unnecessary re-renders possible

**Actions:**
- Add `React.memo` to components where appropriate
- Review `useMemo` and `useCallback` usage
- Optimize FlatList with `keyExtractor` and `getItemLayout` where possible
- Add `removeClippedSubviews` for better performance

**Files to modify:**
- All screen files with lists
- Extracted components

---

## Phase 6: Code Style & Best Practices

### 6.1 Consistent Naming Conventions
**Priority: Low** | **Estimated Time: 1 hour**

**Actions:**
- Ensure consistent naming (camelCase for functions, PascalCase for components)
- Review variable names for clarity
- ESLint will help enforce this

---

### 6.2 Extract Business Logic
**Priority: Medium** | **Estimated Time: 3 hours**

**Issues Found:**
- Game end condition logic in GameScreen component
- Score calculation logic mixed with UI
- Validation logic in components

**Actions:**
- Create `services/gameLogic.ts` for game rules
- Create `services/scoreService.ts` for score calculations
- Move validation to utility functions

**Files to create:**
- `services/gameLogic.ts`
- `services/scoreService.ts`
- `services/index.ts`

**Files to modify:**
- `screens/GameScreen.tsx` (extract end condition logic)
- Other screens with business logic

---

## Phase 7: Testing Infrastructure (Optional)

### 7.1 Setup Testing
**Priority: Low** | **Estimated Time: 2-3 hours**

**Actions:**
- Install Jest and React Native Testing Library
- Create example tests for utilities
- Add test script to package.json

**Note:** This is optional but recommended for long-term maintainability.

---

## Implementation Order Recommendation

1. **Phase 1** (Linting & Formatting) - Do this first to catch issues as you refactor
2. **Phase 2.1 & 2.2** (Constants & Utilities) - Foundation for other refactoring
3. **Phase 2.3** (Components) - Reduces duplication and improves maintainability
4. **Phase 3** (Error Handling) - Improves user experience
5. **Phase 4** (Type Safety & Hooks) - Improves code quality
6. **Phase 6.2** (Business Logic) - Separates concerns
7. **Phase 5** (Performance) - Optimize after refactoring
8. **Phase 7** (Testing) - Optional, but valuable

---

## Quick Wins (Do These First)

1. **Setup ESLint & Prettier** (30-45 min) - Immediate code quality improvements
2. **Extract Avatar Utilities** (30 min) - Removes duplication quickly
3. **Extract Constants** (1 hour) - Easy win, improves maintainability
4. **Create PlayerAvatar Component** (1 hour) - Reusable component

---

## Metrics to Track

- Lines of code per file (target: < 300 for screens, < 200 for components)
- Code duplication percentage
- TypeScript strict mode compliance
- ESLint warnings/errors count
- Test coverage (if testing is added)

---

## Notes

- This is a React Native/Expo app, so ensure all changes are compatible
- The app uses AsyncStorage for persistence - keep this in mind when refactoring
- All screens use React Navigation - maintain navigation type safety
- Consider backward compatibility when refactoring storage utilities

---

## Estimated Total Time

- **Quick Wins:** 3-4 hours
- **Full Implementation:** 20-30 hours (spread over multiple sessions)

---

## Next Steps

1. Review this plan
2. Start with Phase 1 (Linting & Formatting)
3. Work through phases incrementally
4. Test thoroughly after each phase
5. Commit changes frequently with clear messages

