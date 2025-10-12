# Vedda Language Translator

A comprehensive translation system for the Vedda language, similar to Google Translate, with intelligent fallback to Sinhala when Vedda translations are unavailable. Built with modern React component-based architecture for scalability and maintainability.

## Project Overview

The Vedda language is an indigenous language of Sri Lanka that has significant overlap with Sinhala. This translator aims to:

1. Translate between Vedda and other languages (English, Sinhala, and 15+ international languages)
2. Provide intelligent fallback to Sinhala when Vedda words are not available
3. Build a comprehensive Vedda language corpus
4. Support both text and potentially speech translation
5. Preserve and promote the Vedda language through modern technology

## Project Structure

```
vedda-system/
├── README.md                    # Project documentation
├── requirements.txt             # Python dependencies
├── backend/
│   ├── app.py                   # Flask API server
│   └── .env                     # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/          # React components (component-based architecture)
│   │   │   ├── layout/         # Layout components (Header, etc.)
│   │   │   ├── translation/    # Translation-specific components
│   │   │   ├── ui/            # Reusable UI components
│   │   │   └── index.js       # Component exports
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useTranslation.js
│   │   │   ├── useTranslationHistory.js
│   │   │   └── index.js
│   │   ├── constants/         # App constants and configurations
│   │   │   └── languages.js
│   │   └── App.js            # Main app component (refactored)
│   ├── public/               # Static assets
│   ├── package.json          # Node.js dependencies
│   └── COMPONENT_STRUCTURE.md # Component architecture documentation
└── data/
    ├── vedda_dictionary.csv     # Main vocabulary dataset (48+ words)
    ├── csv_data_manager.py      # CSV import/export tool
    ├── migrate_database.py      # Database migration
    └── vedda_translator.db      # SQLite database
```

## Technology Stack

- **Frontend**: React.js with Material-UI, Component-based architecture
- **Architecture**: Modern React patterns with custom hooks and reusable components
- **Backend**: Python Flask with CORS support
- **Database**: SQLite with enhanced schema for training history
- **Translation**: Dictionary-based with Google Translate API integration
- **Data Management**: CSV-based with pandas for easy dataset updates
- **IPA Support**: International Phonetic Alphabet transcriptions
- **UI/UX**: Google Translate-inspired interface design

## Development Status

### ✅ Phase 1: Basic Dictionary-Based Translation (Completed)

- ✅ Created Vedda-Sinhala-English word mappings (48+ words)
- ✅ Implemented dictionary-based translation with intelligent fallback
- ✅ Built Google Translate-style web interface
- ✅ Added IPA phonetic transcriptions

### ✅ Phase 2: Enhanced Translation Engine (Completed)

- ✅ Added context-based translation with Sinhala fallback
- ✅ Implemented Google Translate API integration for 18+ languages
- ✅ Added CSV-based dataset management system
- ✅ Implemented translation history tracking
- ✅ Real-time translation with confidence scoring

### ✅ Phase 3: Component-Based Architecture (Completed)

- ✅ Refactored frontend to component-based architecture
- ✅ Created reusable React components for better maintainability
- ✅ Implemented custom hooks for business logic separation
- ✅ Organized code structure for team collaboration
- ✅ Added comprehensive component documentation

### 🚧 Phase 4: Advanced Features (In Progress)

- ✅ Streamlined CSV data management
- 🔄 Expanding Vedda vocabulary through community contributions
- 🔄 Performance optimizations with React.memo
- ⏳ Batch translation capabilities
- ⏳ Mobile-responsive design improvements
- ⏳ TypeScript integration for better type safety

### 📋 Phase 5: Future Enhancements

- Speech-to-text and text-to-speech integration
- Mobile application development
- Advanced ML translation models
- Collaborative vocabulary building platform
- Accessibility features (ARIA support, keyboard navigation)
- Offline translation capabilities

## Component Architecture

The frontend follows modern React best practices with a component-based architecture:

### 🧩 **Components Structure**

- **Layout Components**: Header, navigation
- **Translation Components**: Input, output, language selector, history
- **UI Components**: Reusable elements like example phrases
- **Custom Hooks**: Business logic separation for translations and history

### 🎯 **Benefits**

- **Maintainability**: Single responsibility components
- **Reusability**: Components can be used across different views
- **Scalability**: Easy to add new features without affecting existing code
- **Testing**: Components can be tested in isolation
- **Team Development**: Clear code organization for collaboration

For detailed component documentation, see [`frontend/COMPONENT_STRUCTURE.md`](frontend/COMPONENT_STRUCTURE.md).

## Getting Started

### Prerequisites

- Python 3.8+ installed
- Node.js 16+ and npm installed
- Git installed

### Installation & Setup

1. **Clone this repository**

   ```bash
   git clone <repository-url>
   cd vedda-system
   ```

2. **Backend Setup**

   ```bash
   # Install Python dependencies
   python -m pip install -r requirements.txt

   # Navigate to data directory and initialize database
   cd data
   python csv_data_manager.py
   ```

3. **Frontend Setup**

   ```bash
   # Navigate to frontend directory
   cd frontend

   # Install Node.js dependencies
   npm install
   ```

### Running the Application

1. **Start the Backend Server**

   ```bash
   # From project root, navigate to backend
   cd backend
   python app.py
   ```

   The backend will be available at: `http://localhost:5000`

2. **Start the Frontend Development Server**
   ```bash
   # In a new terminal, navigate to frontend
   cd frontend
   npm start
   ```
   The frontend will be available at: `http://localhost:3000`

### Current Status ✅

- ✅ **Backend Server**: Running on http://localhost:5000
- ✅ **Frontend Application**: Running on http://localhost:3000
- ✅ **Database**: Initialized with 48 Vedda dictionary entries
- ✅ **Component Architecture**: Fully implemented and functional
- ✅ **Translation Engine**: Supporting 18+ languages with intelligent fallback

### Adding More Vedda Words

1. **Edit the CSV file**

   ```bash
   # Open data/vedda_dictionary.csv and add new rows:
   # vedda_word,sinhala_word,english_word,vedda_ipa,sinhala_ipa,english_ipa,word_type,usage_example
   ```

2. **Import to Database**

   ```bash
   cd data
   python csv_data_manager.py
   ```

3. **Check Statistics**
   ```bash
   python csv_data_manager.py --stats
   ```

### Development Commands

- **Database Management:**

  - `python csv_data_manager.py` - Import CSV data and show statistics
  - `python csv_data_manager.py --export` - Export database to CSV
  - `python csv_data_manager.py --stats` - View statistics only

- **Development Servers:**

  - Backend: `python backend/app.py`
  - Frontend: `npm start` (from frontend directory)

- **Component Development:**
  - Components are located in `frontend/src/components/`
  - Hooks are in `frontend/src/hooks/`
  - See `frontend/COMPONENT_STRUCTURE.md` for detailed architecture

### Current Features ✅

- **48+ Vedda words** with IPA pronunciations and usage examples
- **Multilingual support**: English ↔ Vedda with Sinhala fallback
- **International languages**: 18+ languages via Google Translate integration
- **Component-based architecture** for better maintainability
- **Real-time translation** interface with confidence scoring
- **Translation history** tracking and recent translations display
- **IPA transcriptions** for pronunciation guidance
- **Example phrases** for quick translation testing
- **Responsive design** with Material-UI components

## API Endpoints

- `POST /api/translate` - Translate text between languages
  - Supports Vedda, Sinhala, English, and 15+ international languages
  - Returns translation with confidence score and method information
  - Includes IPA pronunciations when available
- `GET /api/history` - Get translation history
- `GET /api/health` - Check API health status
- `GET /api/languages` - Get supported languages list
- `GET /api/stats` - Get translation and vocabulary statistics

## Architecture Benefits

### 🏗️ **Component-Based Frontend**

- **Modular Design**: Each component has a single responsibility
- **Reusable Components**: Consistent UI patterns across the application
- **Custom Hooks**: Business logic separated from UI components
- **Easy Testing**: Components can be tested in isolation
- **Team Collaboration**: Clear code organization for multiple developers

### 🔧 **Maintainable Backend**

- **Flask API**: RESTful endpoints for translation services
- **SQLite Database**: Lightweight database with migration support
- **CSV Integration**: Easy vocabulary management and updates
- **Intelligent Fallback**: Sinhala fallback when Vedda words unavailable

### 📊 **Data Management**

- **CSV-Based Vocabulary**: Easy editing and version control
- **Database Migration**: Smooth schema updates
- **Translation History**: User interaction tracking
- **Statistics Dashboard**: Vocabulary and usage analytics

## Contributing

This project aims to preserve and promote the Vedda language. Contributions from linguists, developers, and Vedda community members are highly welcome.

### How to Contribute

1. **Add Vedda vocabulary**: Edit `data/vedda_dictionary.csv` with new words
2. **Improve translations**: Submit better translations or corrections
3. **Enhance components**: Contribute new React components or improve existing ones
4. **Add features**: Implement new functionality following the component architecture
5. **Documentation**: Help improve documentation and examples
6. **Testing**: Add unit tests for components and API endpoints

### Development Guidelines

- Follow the component-based architecture patterns
- Use custom hooks for business logic
- Maintain consistency with Material-UI design system
- Add proper PropTypes or TypeScript types
- Write tests for new components and features
- Update documentation for significant changes

### Data Format

When adding words to `vedda_dictionary.csv`, use this format:

```csv
vedda_word,sinhala_word,english_word,vedda_ipa,sinhala_ipa,english_ipa,word_type,usage_example
```

Example:

```csv
කැකුලෝ,ලමයි,children,kækulo,ləməi,ˈtʃɪldrən,noun,මේ කැකුලෝ ගෙදර ඉන්නවා - These children are at home
```

## License

This project is dedicated to preserving the Vedda language and culture. Please use responsibly and with respect for the Vedda community.

## Acknowledgments

- **Vedda community** for preserving their language and culture
- **Google Translate API** for international language support
- **Material-UI team** for the excellent React component library
- **Contributors and linguists** supporting this project
- **React community** for the modern development patterns and best practices

## Project Statistics

- **Vocabulary**: 48+ Vedda words with English and Sinhala translations
- **Languages Supported**: 18+ languages including Vedda, Sinhala, English, and international languages
- **Components**: 10+ React components following modern architecture patterns
- **API Endpoints**: 5+ RESTful endpoints for translation services
- **Translation Methods**: Dictionary-based, Google Translate integration, and intelligent fallback

---

**🌟 Star this repository if you find it useful for Vedda language preservation!**

For detailed component architecture information, see [`frontend/COMPONENT_STRUCTURE.md`](frontend/COMPONENT_STRUCTURE.md).
