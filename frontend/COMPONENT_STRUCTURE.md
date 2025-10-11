# Vedda Translator - Component-Based Frontend

## 🎯 Overview

The frontend has been refactored from a monolithic structure to a clean, component-based architecture for better maintainability, reusability, and scalability.

## 📁 Project Structure

```
frontend/src/
├── components/
│   ├── layout/
│   │   └── Header.js              # App header with navigation
│   ├── translation/
│   │   ├── LanguageSelector.js    # Language selection and swap
│   │   ├── TranslationInput.js    # Input text area with IPA
│   │   ├── TranslationOutput.js   # Output display with methods
│   │   ├── TranslationHistory.js  # Recent translations
│   │   └── TranslationCard.js     # Main translation container
│   ├── ui/
│   │   └── ExamplePhrases.js      # Example phrase suggestions
│   └── index.js                   # Component exports
├── hooks/
│   ├── useTranslation.js          # Translation API logic
│   ├── useTranslationHistory.js   # History management
│   └── index.js                   # Hook exports
├── constants/
│   └── languages.js               # Language configs & constants
└── App.js                         # Main app component
```

## 🧩 Components

### Layout Components

#### `Header`

- App branding and navigation
- History button integration
- Material-UI AppBar styling

### Translation Components

#### `LanguageSelector`

- Source/target language dropdowns
- Language swap functionality
- Flag and native name display

#### `TranslationInput`

- Multiline text input
- Character counter
- IPA pronunciation display
- Clear button functionality

#### `TranslationOutput`

- Translation results display
- Loading states and error handling
- IPA transcriptions
- Bridge translation info
- Confidence scores
- Translation method chips
- Copy functionality

#### `TranslationHistory`

- Recent translation list
- Click to reuse functionality
- Responsive card layout

#### `TranslationCard`

- Main translation container
- Combines all translation components
- Handles translation flow

### UI Components

#### `ExamplePhrases`

- Predefined example phrases
- Click to populate input
- Vedda language examples

## 🪝 Custom Hooks

### `useTranslation`

- Handles translation API calls
- Loading state management
- Error handling
- Returns translation results

### `useTranslationHistory`

- Fetches translation history
- Auto-refreshes on new translations
- Manages history state

## 📦 Constants

### `languages.js`

- Language configurations
- Flag emojis and native names
- API base URL
- Example phrases

## 🎨 Benefits of Component-Based Architecture

### ✅ **Maintainability**

- Each component has a single responsibility
- Easy to locate and fix issues
- Clear separation of concerns

### ✅ **Reusability**

- Components can be used across different pages
- Consistent UI patterns
- Reduced code duplication

### ✅ **Scalability**

- Easy to add new features
- Components can be extended independently
- Better team collaboration

### ✅ **Testing**

- Components can be tested in isolation
- Mocking is simplified
- Better test coverage

### ✅ **Code Organization**

- Logical file structure
- Easy navigation
- Better development experience

## 🚀 Usage Examples

### Using Components

```jsx
import { Header, TranslationCard } from "./components";
import { useTranslation } from "./hooks";

function App() {
  const { translate, loading } = useTranslation();

  return (
    <div>
      <Header />
      <TranslationCard onTranslate={translate} loading={loading} />
    </div>
  );
}
```

### Using Hooks

```jsx
import { useTranslation, useTranslationHistory } from "./hooks";

function MyComponent() {
  const { translate, loading, error } = useTranslation();
  const { translationHistory, fetchHistory } = useTranslationHistory();

  // Use translation logic
}
```

## 🔧 Development

### Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm start

# Access the app
open http://localhost:3000
```

### Adding New Components

1. Create component in appropriate folder (`components/`)
2. Follow naming convention (PascalCase)
3. Export from `components/index.js`
4. Add PropTypes for type checking (recommended)

### Adding New Hooks

1. Create hook in `hooks/` folder
2. Start with `use` prefix
3. Export from `hooks/index.js`
4. Follow React hooks rules

## 📝 Next Steps

- [ ] Add PropTypes for better type checking
- [ ] Implement React.memo for performance optimization
- [ ] Add unit tests for components
- [ ] Create Storybook for component documentation
- [ ] Add accessibility features
- [ ] Implement theme customization

## 🤝 Contributing

When adding new features:

1. Create focused, single-responsibility components
2. Use custom hooks for business logic
3. Keep components pure and predictable
4. Follow the established folder structure
5. Update this README for new additions
