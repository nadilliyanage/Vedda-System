# Vedda Language Translator

A comprehensive microservices-based translation system for the Vedda language, similar to Google Translate, with intelligent Sinhala fallback and bridge translation capabilities. Built with modern React frontend, microservices backend architecture, and advanced translation logic for preserving the indigenous Vedda language of Sri Lanka.

## Project Overview

The Vedda language is an indigenous language of Sri Lanka that has significant overlap with Sinhala. This advanced translator system aims to:

1. **Multi-directional Translation**: Vedda ↔ English, Vedda ↔ Sinhala, and Vedda to 40+ international languages
2. **Intelligent Sinhala Bridge**: Uses Sinhala as bridge language when direct Vedda translations unavailable
3. **Advanced Fallback Logic**: Automatic fallback to Sinhala when Vedda words not found in dictionary
4. **Microservices Architecture**: Scalable backend with separate services for translation, dictionary, and history
5. **Real-time Translation**: Live translation with confidence scoring and method transparency
6. **Language Preservation**: Building comprehensive Vedda corpus through modern technology

## Project Structure

```
vedda-system/
├── README.md                    # Project documentation
├── requirements.txt             # Python dependencies
├── update_dependencies.py       # Automated dependency update script with backups & health checks
├── backend/                     # Microservices Backend Architecture
│   ├── api-gateway/            # API Gateway Service (Port 5000)
│   │   └── app.py              # Central routing and load balancing
│   ├── translator-service/     # Translation Service (Port 5001)
│   │   └── app.py              # Core translation logic with Sinhala bridge
│   ├── dictionary-service/     # Dictionary Service (Port 5002)
│   │   └── app.py              # Vedda dictionary management
│   ├── history-service/        # History Service (Port 5003)
│   │   └── app.py              # Translation history and analytics
│   └── shared/                 # Shared utilities and configurations
├── frontend/                   # React Frontend (Port 5173)
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
│   │   └── App.js            # Main app component (Tailwind CSS)
│   ├── public/               # Static assets
│   │   ├── manifest.json     # PWA configuration
│   │   └── index.html
│   ├── package.json          # Node.js dependencies (Vite, Tailwind)
│   └── COMPONENT_STRUCTURE.md # Component architecture documentation
└── data/
    ├── vedda_dictionary.csv     # Main vocabulary dataset (62+ words)
    ├── csv_data_manager.py      # CSV import/export tool
    ├── migrate_database.py      # Database migration
    ├── test_dictionary.py       # Dictionary validation
    └── vedda_translator.db      # SQLite database
```

## Technology Stack

### Backend Microservices

- **API Gateway**: Central routing and service orchestration (Flask, Port 5000)
- **Translator Service**: Core translation engine with Sinhala bridge logic (Flask, Port 5001)
- **Dictionary Service**: Vedda vocabulary management and lookup (Flask, Port 5002)
- **History Service**: Translation tracking and analytics (Flask, Port 5003)
- **Database**: SQLite with enhanced schema for comprehensive language data
- **Translation Engine**: Multi-layered approach with bidirectional Sinhala bridge support
- **Code Quality**: Clean production code following PEP 8 standards, organized imports

### Frontend

- **Framework**: React.js 18.2.0 with Vite 7.1.9 (Port 5173)
- **Styling**: Tailwind CSS v3.4.18 (migrated from Material-UI)
- **Icons**: React Icons library for consistent iconography
- **Architecture**: Component-based with custom hooks and reusable components
- **PWA Support**: Progressive Web App capabilities with manifest.json

### Translation Logic

- **Primary**: Dictionary-based translation (Confidence: 0.95)
- **Sinhala Bridge**: Bidirectional translation using Sinhala as intermediate language
- **Google Translate Integration**: 40+ languages support with intelligent fallback
- **Confidence Scoring**: Transparent translation quality metrics (0.1-0.95 range)
- **Method Tracking**: Shows translation method used (dictionary/sinhala_bridge/google)
- **Bidirectional Support**: Full English↔Vedda and Vedda↔Other languages functionality

## Development Status

### ✅ Phase 1: Core Translation Engine (Completed)

- ✅ **Microservices Architecture**: Scalable backend with 4 separate services
- ✅ **Sinhala Bridge Translation**: Intelligent bidirectional translation using Sinhala as intermediate language
- ✅ **Advanced Translation Logic**: Dictionary → Sinhala Bridge → Google Translate fallback
- ✅ **Unicode Text Processing**: Proper handling of Sinhala/Vedda Unicode characters
- ✅ **Confidence Scoring**: Transparent translation quality metrics (0.1-0.95 range)
- ✅ **Multi-directional Support**: English→Vedda, Vedda→English, and 40+ international languages

### ✅ Phase 2: Modern Frontend Architecture (Completed)

- ✅ **Material-UI to Tailwind Migration**: Complete styling framework modernization
- ✅ **React Icons Integration**: Consistent iconography across the application
- ✅ **Component-Based Architecture**: Reusable components with separation of concerns
- ✅ **Custom Hooks**: Business logic separation (useTranslation, useTranslationHistory)
- ✅ **PWA Support**: Progressive Web App capabilities with proper manifest

### ✅ Phase 3: Enhanced Dictionary System (Completed)

- ✅ **Bidirectional Dictionary Lookup**: Vedda→Others, English→Vedda, Sinhala→Vedda mappings
- ✅ **Vedda-Sinhala-English Mappings**: 62+ comprehensive word entries
- ✅ **IPA Phonetic Transcriptions**: Pronunciation guides for all languages
- ✅ **CSV-Based Management**: Easy vocabulary updates and version control
- ✅ **Real-time Dictionary Updates**: Dynamic vocabulary additions through API

### ✅ Phase 4: Translation Quality & Code Standards (Completed)

- ✅ **Multiple Translation Methods**: Dictionary, Sinhala bridge, Google Translate with method tracking
- ✅ **Intelligent Fallback Logic**: Automatic Sinhala fallback for missing Vedda translations
- ✅ **Clean Production Code**: Removed all experimental/debug code, organized imports (PEP 8)
- ✅ **Phrase-Level Translation**: Improved handling of multi-word expressions
- ✅ **Working Bidirectional Translation**: Fixed English→Vedda and Vedda→English functionality

### 📋 Phase 5: Advanced Features (Planned)

- ⏳ **Speech-to-text and text-to-speech integration**
- ⏳ **Mobile application development with React Native**
- ⏳ **Advanced ML translation models for Vedda-specific patterns**
- ⏳ **Collaborative vocabulary building platform**
- ⏳ **Accessibility features (ARIA support, keyboard navigation)**
- ⏳ **Offline translation capabilities with service workers**
- ⏳ **Translation caching for performance optimization**

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

### Dependency Management (Recommended First Step)

The project includes automated scripts for updating all Python dependencies across microservices:

#### Quick Dependency Update

```bash
# Navigate to project root
cd "D:\SLIIT\RP\Vedda System"

# Update all Python dependencies automatically
python update_dependencies.py
```

Or with full Python path:

```bash
C:/Users/nadil/AppData/Local/Programs/Python/Python313/python.exe "D:\SLIIT\RP\Vedda System\update_dependencies.py"
```

#### Advanced Options

```bash
# The script includes backup and health check features by default
python update_dependencies.py

# Available options:
python update_dependencies.py --no-backup      # Skip backup creation
python update_dependencies.py --no-health-check # Skip health checks
python update_dependencies.py --help           # Show all options
```

#### Current Dependency Versions

The update scripts will upgrade all services to these latest versions:

- **Flask**: `>=3.1.2` (upgraded from 2.3.3)
- **flask-cors**: `>=6.0.1` (upgraded from 4.0.0)
- **requests**: `>=2.32.5` (upgraded from 2.31.0)
- **python-dotenv**: `>=1.1.1` (upgraded from 1.0.0)
- **pandas**: `>=2.3.3`
- **openpyxl**: `>=3.1.5`

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

#### Method 1: Full Microservices Stack (Recommended)

1. **Start All Backend Services** (in separate terminals):

   ```bash
   # Terminal 1: Dictionary Service
   cd backend/dictionary-service
   python app.py
   # Running on http://localhost:5002

   # Terminal 2: History Service
   cd backend/history-service
   python app.py
   # Running on http://localhost:5003

   # Terminal 3: Translator Service
   cd backend/translator-service
   python app.py
   # Running on http://localhost:5001

   # Terminal 4: API Gateway (Optional - for unified API)
   cd backend/api-gateway
   python app.py
   # Running on http://localhost:5000
   ```

2. **Start the Frontend**
   ```bash
   # Terminal 5: Frontend Application
   cd frontend
   npm run dev
   # Running on http://localhost:5173
   ```

#### Method 2: Direct Service Access

The frontend can connect directly to individual services:

- **Translator Service**: Primary translation endpoint (Port 5001)
- **Dictionary Service**: Vocabulary management (Port 5002)
- **History Service**: Translation tracking (Port 5003)

### Service Health Checks

Verify all services are running:

```bash
# Check individual services
curl http://localhost:5001/health  # Translator Service
curl http://localhost:5002/health  # Dictionary Service
curl http://localhost:5003/health  # History Service
curl http://localhost:5000/health  # API Gateway (if running)

# Check frontend
# Navigate to http://localhost:5173
```

### Current Status ✅

- ✅ **Microservices Architecture**: All 4 backend services operational
  - 🟢 Dictionary Service (Port 5002): Vocabulary management
  - 🟢 History Service (Port 5003): Translation tracking
  - 🟢 Translator Service (Port 5001): Core translation engine
  - 🟢 API Gateway (Port 5000): Optional unified endpoint
- ✅ **Frontend Application**: Modern React with Vite (Port 5173)
- ✅ **Database**: SQLite with 62+ Vedda dictionary entries
- ✅ **Translation Engine**: Multi-layered with bidirectional Sinhala bridge support
- ✅ **Styling**: Complete Tailwind CSS integration with React Icons
- ✅ **PWA Support**: Progressive Web App capabilities
- ✅ **Code Quality**: Clean production code with organized imports (PEP 8)

### Translation Capabilities ✅

- **Dictionary Translation**: Direct Vedda ↔ English/Sinhala (Confidence: 0.95)
- **Sinhala Bridge**: Bidirectional translation using Sinhala as intermediate language (Confidence: 0.65-0.8)
- **Google Translate**: 40+ international languages (Confidence: 0.8)
- **Phrase Translation**: Multi-word expressions with intelligent fallback
- **Unicode Support**: Proper handling of Sinhala/Vedda text
- **Working Bidirectional Translation**: Fixed English→Vedda and Vedda→English functionality

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

- **Advanced Translation Engine**: Multi-layered approach with 62+ Vedda words
- **Bidirectional Sinhala Bridge**: Intelligent translation using Sinhala as intermediate language
- **Microservices Architecture**: Scalable backend with 4 specialized services
- **Modern Frontend**: React 18 + Vite + Tailwind CSS + React Icons
- **Multilingual Support**: Vedda ↔ English/Sinhala + 40+ international languages
- **Intelligent Fallback**: Automatic translation fallback system
- **Real-time Translation**: Live translation with confidence scoring and method transparency
- **Unicode Text Support**: Proper handling of Sinhala/Vedda characters
- **Translation History**: User interaction tracking and analytics
- **IPA Transcriptions**: Pronunciation guidance for all supported languages
- **PWA Capabilities**: Progressive Web App with offline potential
- **Component Architecture**: Maintainable React components with custom hooks
- **Responsive Design**: Modern UI/UX with Tailwind CSS styling
- **Clean Code**: Production-ready code following PEP 8 standards with organized imports

## API Endpoints

### Translator Service (Port 5001)

- `POST /api/translate` - Main translation endpoint
  - **Input**: `{"text": "වතුර පිරිසිදු", "source_language": "vedda", "target_language": "english"}`
  - **Output**: Translation with confidence score, method, and bridge language info
  - **Methods**: dictionary, sinhala_bridge, sinhala_fallback, google
- `GET /api/languages` - Get supported languages (40+ languages)
- `POST /api/translate/word` - Single word translation
- `GET /health` - Service health check

### Dictionary Service (Port 5002)

- `GET /api/dictionary/search` - Search for word translations
  - **Params**: `word`, `source`, `target`
  - **Example**: `/api/dictionary/search?word=වතුර&source=vedda&target=english`
- `GET /api/dictionary` - Get dictionary entries with pagination
- `POST /api/dictionary/add` - Add new dictionary entry
- `GET /api/dictionary/stats` - Vocabulary statistics
- `GET /health` - Service health check

### History Service (Port 5003)

- `GET /api/history` - Get translation history
- `POST /api/history` - Save translation to history
- `GET /api/feedback` - Get user feedback
- `POST /api/feedback` - Submit translation feedback
- `GET /api/statistics` - Translation usage statistics
- `GET /health` - Service health check

### API Gateway (Port 5000) - Optional

- `GET /health` - Overall system health
- `POST /api/*` - Proxies requests to appropriate services
- Provides unified API endpoint for all services

## Architecture Benefits

### 🏗️ **Microservices Backend**

- **Scalable Architecture**: Independent services for translation, dictionary, and history
- **Service Isolation**: Each service can be developed, deployed, and scaled independently
- **API Gateway**: Optional centralized routing and load balancing
- **Health Monitoring**: Individual service health checks and system monitoring
- **Database Per Service**: Specialized data storage for each microservice domain

### 🔧 **Advanced Translation Logic**

- **Multi-Layered Approach**: Dictionary → Sinhala Bridge → Google Translate fallback
- **Confidence Scoring**: Transparent quality metrics (0.5-0.9 range)
- **Method Transparency**: Shows exactly how each translation was achieved
- **Unicode Support**: Proper handling of Sinhala/Vedda Unicode characters
- **Phrase Intelligence**: Context-aware translation for multi-word expressions

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

- Follow the microservices architecture patterns
- Maintain service independence and clear API contracts
- Use Tailwind CSS for consistent styling across components
- Implement proper error handling and fallback mechanisms
- Follow React best practices with hooks and component composition
- Add comprehensive logging for translation methods and confidence scoring
- Maintain backward compatibility when updating APIs
- Write unit tests for both frontend components and backend services
- Document API changes and new translation methods

## Development Workflow

### Dependency Management

Before starting development or after pulling changes:

```bash
# Update all Python dependencies (recommended)
python update_dependencies.py

# With additional options if needed
python update_dependencies.py --help
```

### Service Development

1. **Update dependencies** first (using scripts above)
2. **Start services** in development mode
3. **Test endpoints** using the provided curl examples in backend README
4. **Monitor logs** for any dependency or service issues

### Troubleshooting

**Dependency Issues:**

- Run `python update_dependencies.py` for health checks (included by default)
- Check individual service `requirements.txt` files for conflicts
- Use virtual environments for isolation

**Service Startup Issues:**

- Ensure all dependencies are updated
- Check that ports 5000-5003 are available
- Verify database files exist in `data/` directory

### Translation Method Priority

1. **Dictionary Translation** (Confidence: 0.95)

   - Direct lookup in Vedda dictionary
   - Highest accuracy for known words
   - Supports bidirectional translation

2. **Sinhala Bridge** (Confidence: 0.65-0.8)

   - Uses Sinhala as intermediate language
   - Bidirectional support: Other Language ↔ Sinhala ↔ Vedda
   - Intelligent step-by-step confidence calculation

3. **Google Translate** (Confidence: 0.8)

   - For international language support
   - Handles 40+ languages reliably
   - Used as fallback for non-Vedda translations

4. **Fallback** (Confidence: 0.1-0.5)
   - Last resort when other methods fail
   - Maintains system functionality

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

- **Microservices**: 4 backend services (Translator, Dictionary, History, API Gateway)
- **Frontend**: Modern React 18 + Vite + Tailwind CSS architecture
- **Vocabulary**: 62+ Vedda words with English and Sinhala translations
- **Languages Supported**: 40+ languages including Vedda, Sinhala, English, and international languages
- **Translation Methods**: 4 distinct approaches (Dictionary, Sinhala Bridge, Google Translate, Fallback)
- **Components**: 15+ React components following modern architecture patterns
- **API Endpoints**: 12+ RESTful endpoints across all microservices
- **Confidence Scoring**: Transparent quality metrics (0.1-0.95 range)
- **Unicode Support**: Full Sinhala/Vedda character handling
- **PWA Features**: Progressive Web App capabilities with manifest.json
- **Code Quality**: Clean production code following PEP 8 standards

---

**🌟 Star this repository if you find it useful for Vedda language preservation!**

For detailed component architecture information, see [`frontend/COMPONENT_STRUCTURE.md`](frontend/COMPONENT_STRUCTURE.md).
