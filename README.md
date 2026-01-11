# Vedda Language Preservation & Learning System

A comprehensive microservices-based platform for the Vedda language, combining translation, speech recognition/synthesis, artifact identification, cultural learning, and 3D model visualization. Built with modern React frontend and microservices backend architecture for preserving and promoting the indigenous Vedda language and culture of Sri Lanka.

## Project Overview

The Vedda language is an indigenous language of Sri Lanka that has significant overlap with Sinhala. This advanced system aims to provide:

1. **Multi-directional Translation**: Vedda ↔ English, Vedda ↔ Sinhala, and Vedda to 40+ international languages
2. **Speech Technology**: Speech-to-text (STT) and text-to-speech (TTS) with Vedda language support
3. **Artifact Recognition**: AI-powered identification of Vedda cultural artifacts using deep learning
4. **Interactive Learning**: Personalized AI-driven learning platform with exercises and progress tracking
5. **3D Cultural Models**: Visualization and information about Vedda cultural artifacts in 3D
6. **Intelligent Sinhala Bridge**: Uses Sinhala as bridge language when direct Vedda translations unavailable
7. **Microservices Architecture**: Scalable backend with 10 specialized services
8. **Real-time Translation**: Live translation with confidence scoring and method transparency
9. **Language Preservation**: Building comprehensive Vedda corpus through modern technology

## Project Structure

```
vedda-system/
├── README.md                           # Comprehensive project documentation
├── HOW_TO_ADD_TRAIN_WORDS.md          # Guide for adding new Vedda vocabulary
├── requirements.txt                    # Global Python dependencies
├── test_vedda_stt.py                  # STT processor testing script
├── backend/                            # Microservices Backend (10 Services)
│   ├── docker-compose.yml             # Docker orchestration
│   ├── start-all-services.bat         # Windows service launcher
│   ├── start-all-services.sh          # Linux/Mac service launcher
│   ├── stop-all-services.sh           # Service shutdown script
│   ├── api-gateway/                   # API Gateway Service (Port 5000)
│   │   ├── app.py                     # Central routing and load balancing
│   │   ├── Dockerfile                 # Container configuration
│   │   └── requirements.txt           # Service dependencies
│   ├── translator-service/            # Translation Service (Port 5001)
│   │   ├── app.py                     # Core translation with Sinhala bridge
│   │   ├── Dockerfile                 # Container configuration
│   │   └── requirements.txt           # Service dependencies
│   ├── dictionary-service/            # Dictionary Service (Port 5002)
│   │   ├── run.py                     # Service entry point
│   │   ├── Dockerfile                 # Container configuration
│   │   ├── app/
│   │   │   ├── __init__.py            # Flask app factory
│   │   │   ├── config.py              # Service configuration
│   │   │   ├── routes/                # API endpoints
│   │   │   ├── services/              # Business logic
│   │   │   └── db/                    # Database operations
│   │   └── requirements.txt           # Service dependencies
│   ├── history-service/               # History Service (Port 5003)
│   │   ├── run.py                     # Service entry point
│   │   ├── app/
│   │   │   ├── routes/                # API endpoints
│   │   │   ├── services/              # Analytics & tracking
│   │   │   └── models/                # Data models
│   │   └── requirements.txt           # Service dependencies
│   ├── speech-service/                # Speech Service (Port 5004)
│   │   ├── app.py                     # STT/TTS service
│   │   ├── run.py                     # Service entry point
│   │   ├── vedda_stt_processor.py     # Vedda speech recognition
│   │   ├── app/
│   │   │   ├── routes/                # API endpoints
│   │   │   └── models/                # Audio models
│   │   ├── audio_data/                # Audio file storage
│   │   ├── models/                    # Speech recognition models
│   │   └── requirements.txt           # Service dependencies
│   ├── auth-service/                  # Authentication Service (Port 5005)
│   │   ├── server.js                  # Node.js auth server
│   │   ├── controllers/               # Auth controllers
│   │   ├── middleware/                # JWT middleware
│   │   ├── models/                    # User models (MongoDB)
│   │   ├── routes/                    # Auth routes
│   │   ├── utils/                     # JWT utilities
│   │   └── package.json               # Node dependencies
│   ├── learn-service/                 # Learning Service (Port 5006)
│   │   ├── run.py                     # Service entry point
│   │   ├── test_ai_integration.py     # AI integration tests
│   │   ├── app/
│   │   │   ├── ai/                    # AI integration layer
│   │   │   ├── ml/                    # Machine learning models
│   │   │   ├── routes/                # Learning API endpoints
│   │   │   ├── services/              # Learning logic
│   │   │   └── models/                # Learning data models
│   │   ├── ml-model-train/            # ML training scripts
│   │   │   ├── train_mistake_classifier.py
│   │   │   └── data/                  # Training datasets
│   │   └── requirements.txt           # Service dependencies
│   ├── 3D-model-service/              # 3D Model Service (Port 5008)
│   │   ├── README.md                  # Service documentation
│   │   ├── run.py                     # Service entry point
│   │   ├── app/
│   │   │   ├── routes/                # 3D model API endpoints
│   │   │   ├── services/              # Model processing
│   │   │   └── db/                    # MongoDB operations
│   │   ├── Dockerfile                 # Container configuration
│   │   └── requirements.txt           # Service dependencies
│   ├── artifact-identifier-service/   # Artifact ID Service (Port 5009)
│   │   ├── run.py                     # Service entry point
│   │   ├── app/
│   │   │   ├── routes/                # Identification endpoints
│   │   │   ├── services/              # ML inference
│   │   │   └── utils/                 # File downloader
│   │   ├── data/
│   │   │   └── vedda_artifacts_model.keras  # Trained CNN model
│   │   ├── Dockerfile                 # Container configuration
│   │   └── requirements.txt           # Service dependencies
│   ├── artifact-service/              # Artifact Management (Port 5010)
│   │   ├── src/
│   │   │   ├── index.js               # Node.js service
│   │   │   ├── controllers/           # CRUD controllers
│   │   │   ├── models/                # Artifact models (MongoDB)
│   │   │   ├── routes/                # Artifact routes
│   │   │   ├── services/              # Business logic
│   │   │   ├── middleware/            # Express middleware
│   │   │   ├── config/                # Database config
│   │   │   └── utils/                 # Utilities
│   │   └── package.json               # Node dependencies
│   └── logs/                          # Centralized logging
├
└── frontend/                           # React Frontend (Port 5173)
    ├── index.html                      # Entry HTML
    ├── package.json                    # Node.js dependencies (Vite, Tailwind)
    ├── vite.config.js                  # Vite configuration
    ├── public/
    │   ├── index.html                  # Public HTML
    │   ├── manifest.json               # PWA configuration
    │   └── assets/                     # Static assets
    └── src/
        ├── App.jsx                     # Main app component
        ├── Router.jsx                  # Route configuration
        ├── index.jsx                   # Entry point
        ├── index.css                   # Global styles (Tailwind)
        ├── components/                 # React components
        │   ├── layout/                 # Layout components
        │   ├── translation/            # Translation components
        │   └── ui/                     # Reusable UI components
        ├── hooks/                      # Custom React hooks
        │   ├── useTranslation.js
        │   └── useTranslationHistory.js
        ├── pages/                      # Page components
        ├── services/                   # API service layer
        ├── contexts/                   # React contexts
        ├── constants/                  # App constants
        │   └── languages.js
        ├── data/                       # Static data
        └── utils/                      # Utility functions
```

## Technology Stack

### Backend Microservices (10 Services)

#### Python Services (Flask)

- **API Gateway** (Port 5000): Central routing, load balancing, and service orchestration
- **Translator Service** (Port 5001): Core translation engine with Sinhala bridge logic
- **Dictionary Service** (Port 5002): Vedda vocabulary management and lookup
- **History Service** (Port 5003): Translation tracking and analytics
- **Speech Service** (Port 5004): Speech-to-text (STT) and text-to-speech (TTS) with Vedda support
- **Learn Service** (Port 5006): AI-powered personalized learning with OpenAI integration
- **3D Model Service** (Port 5008): 3D model management with IPA pronunciation data
- **Artifact Identifier Service** (Port 5009): AI-powered artifact recognition using Keras CNN

#### Node.js Services (Express)

- **Auth Service** (Port 5005): JWT-based authentication and user management
- **Artifact Service** (Port 5010): Cultural artifact CRUD operations and metadata

### Databases

- **SQLite**: Translation data
- **MongoDB**: User accounts, artifacts, learning progress, 3D models

### AI & Machine Learning

- **OpenAI GPT-4**: Exercise generation, personalized learning, AI tutoring
- **TensorFlow/Keras**: Custom CNN model for artifact classification
- **ML Classifier**: Mistake pattern recognition for adaptive learning
- **Google Speech Recognition**: Speech-to-text processing
- **gTTS (Google TTS)**: Text-to-speech synthesis

### Translation Engine

- **Primary Method**: Dictionary-based translation (Confidence: 0.95)
- **Sinhala Bridge**: Bidirectional translation using Sinhala as intermediate
- **Google Translate API**: 40+ languages support with intelligent fallback
- **Confidence Scoring**: Transparent translation quality metrics
- **Method Tracking**: Shows translation method used

### Frontend

- **Framework**: React.js 18.2.0 with Vite 7.1.9 (Port 5173)
- **Styling**: Tailwind CSS v3.4.18
- **Icons**: React Icons library
- **Architecture**: Component-based with custom hooks
- **PWA Support**: Progressive Web App capabilities
- **State Management**: React Context API

### DevOps & Deployment

- **Containerization**: Docker with docker-compose
- **Code Quality**: PEP 8 standards, ESLint for JavaScript
- **Service Scripts**: Automated start/stop scripts for Windows and Unix
- **Logging**: Centralized logging across all services

## Development Status

### ✅ Phase 1: Core Translation Engine (Completed)

- ✅ **Microservices Architecture**: Scalable backend with 10 specialized services
- ✅ **Sinhala Bridge Translation**: Intelligent bidirectional translation
- ✅ **Advanced Translation Logic**: Dictionary → Sinhala Bridge → Google Translate fallback
- ✅ **Unicode Text Processing**: Proper handling of Sinhala/Vedda Unicode characters
- ✅ **Confidence Scoring**: Transparent translation quality metrics
- ✅ **Multi-directional Support**: English→Vedda, Vedda→English, and 40+ international languages

### ✅ Phase 2: Modern Frontend Architecture (Completed)

- ✅ **Material-UI to Tailwind Migration**: Complete styling framework modernization
- ✅ **React Icons Integration**: Consistent iconography
- ✅ **Component-Based Architecture**: Reusable components with separation of concerns
- ✅ **Custom Hooks**: Business logic separation
- ✅ **PWA Support**: Progressive Web App capabilities

### ✅ Phase 3: Enhanced Dictionary System (Completed)

- ✅ **Bidirectional Dictionary Lookup**: Multi-directional word mappings
- ✅ **Vedda-Sinhala-English Mappings**: 62+ comprehensive word entries
- ✅ **IPA Phonetic Transcriptions**: Pronunciation guides for all languages
- ✅ **CSV-Based Management**: Easy vocabulary updates and version control
- ✅ **Real-time Dictionary Updates**: Dynamic vocabulary additions through API

### ✅ Phase 4: Translation Quality & Code Standards (Completed)

- ✅ **Multiple Translation Methods**: Dictionary, Sinhala bridge, Google Translate
- ✅ **Intelligent Fallback Logic**: Automatic Sinhala fallback
- ✅ **Clean Production Code**: PEP 8 standards, organized imports
- ✅ **Phrase-Level Translation**: Multi-word expression handling
- ✅ **Working Bidirectional Translation**: Fixed English↔Vedda functionality

### ✅ Phase 5: Speech Technology (Completed)

- ✅ **Speech-to-Text (STT)**: Vedda speech recognition with Google Speech API
- ✅ **Text-to-Speech (TTS)**: Multi-language speech synthesis with gTTS
- ✅ **Vedda STT Processor**: Custom processor for Vedda language recognition
- ✅ **Audio File Management**: Upload and processing of audio files
- ✅ **Language Support**: Vedda, Sinhala, Tamil, English, and 15+ languages

### ✅ Phase 6: Cultural Artifact System (Completed)

- ✅ **Artifact Identification**: AI-powered recognition using Keras CNN model
- ✅ **Artifact Management**: CRUD operations for cultural artifacts
- ✅ **3D Model Integration**: Visualization of Vedda cultural artifacts
- ✅ **IPA Pronunciation**: Integration with dictionary for artifact names
- ✅ **MongoDB Storage**: Scalable artifact metadata storage

### ✅ Phase 7: Learning Platform (Completed)

- ✅ **AI-Powered Learning**: OpenAI GPT-4 integration for personalized content
- ✅ **Exercise Generation**: Automated exercise creation based on user level
- ✅ **Mistake Classification**: ML-based pattern recognition for adaptive learning
- ✅ **Progress Tracking**: User learning journey analytics
- ✅ **Interactive Lessons**: AI tutor for conversational learning

### ✅ Phase 8: Authentication & Authorization (Completed)

- ✅ **JWT Authentication**: Secure token-based auth system
- ✅ **User Management**: Registration, login, profile management
- ✅ **Role-Based Access**: Admin and user role separation
- ✅ **MongoDB Integration**: Scalable user data storage

### 📋 Phase 9: Advanced Features (In Progress)

- ⏳ **Advanced ML Models**: Vedda-specific translation patterns
- ⏳ **Collaborative Platform**: Community vocabulary building
- ⏳ **Accessibility Features**: ARIA support, keyboard navigation
- ⏳ **Offline Capabilities**: Service workers for offline translation
- ⏳ **Caching Optimization**: Performance improvements
- ⏳ **Real-time Collaboration**: Multi-user learning sessions

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

- **Python 3.8+** installed
- **Node.js 16+** and npm installed
- **MongoDB** installed and running (for auth, artifacts, and 3D models)
- **Git** installed

### Installation & Setup

1. **Clone this repository**

   ```bash
   git clone <repository-url>
   cd vedda-system
   ```

2. **Backend Setup - Python Services**

   ```bash
   # Install Python dependencies
   python -m pip install -r requirements.txt

   ```

3. **Backend Setup - Node.js Services**

   ```bash
   # Install Auth Service dependencies
   cd backend/auth-service
   npm install

   # Install Artifact Service dependencies
   cd backend/artifact-service
   npm install
   ```

4. **Environment Configuration**

   Create `.env` files for each service:

   ```bash
   # Auth Service (.env)
   PORT=5005
   MONGODB_URI=mongodb://localhost:27017/vedda-system
   JWT_SECRET=your_jwt_secret_key

   # Learn Service (.env)
   PORT=5006
   OPENAI_API_KEY=your_openai_api_key
   MONGODB_URI=mongodb://localhost:27017/vedda-system

   # 3D Model Service (.env)
   PORT=5008
   MONGODB_URI=mongodb://localhost:27017/vedda-system

   # Artifact Identifier Service (.env)
   PORT=5009

   # Artifact Service (.env)
   PORT=5010
   MONGODB_URI=mongodb://localhost:27017/vedda-system
   ```

5. **Frontend Setup**

   ```bash
   # Navigate to frontend directory
   cd frontend

   # Install Node.js dependencies
   npm install
   ```

### Running the Application

#### Method 1: Using Service Scripts (Recommended)

**Windows:**

```bash
cd backend
start-all-services.bat
```

**Linux/Mac:**

```bash
cd backend
chmod +x start-all-services.sh
./start-all-services.sh
```

**Stop Services:**

```bash
./stop-all-services.sh
```

#### Method 2: Using Docker Compose

```bash
cd backend
docker-compose up -d
```

#### Method 3: Manual Service Start (All 10 Services)

**Python Services:**

```bash
# Terminal 1: API Gateway
cd backend/api-gateway
python app.py
# Running on http://localhost:5000

# Terminal 2: Translator Service
cd backend/translator-service
python app.py
# Running on http://localhost:5001

# Terminal 3: Dictionary Service
cd backend/dictionary-service
python run.py
# Running on http://localhost:5002

# Terminal 4: History Service
cd backend/history-service
python run.py
# Running on http://localhost:5003

# Terminal 5: Speech Service
cd backend/speech-service
python run.py
# Running on http://localhost:5004

# Terminal 6: Learn Service
cd backend/learn-service
python run.py
# Running on http://localhost:5006

# Terminal 7: 3D Model Service
cd backend/3D-model-service
python run.py
# Running on http://localhost:5008

# Terminal 8: Artifact Identifier Service
cd backend/artifact-identifier-service
python run.py
# Running on http://localhost:5009
```

**Node.js Services:**

```bash
# Terminal 9: Auth Service
cd backend/auth-service
node server.js
# Running on http://localhost:5005

# Terminal 10: Artifact Service
cd backend/artifact-service
npm start
# Running on http://localhost:5010
```

**Frontend:**

```bash
# Terminal 11: Frontend Application
cd frontend
npm run dev
# Running on http://localhost:5173
```

### Service Health Checks

Verify all services are running:

```bash
# Check individual services
curl http://localhost:5000/health  # API Gateway
curl http://localhost:5001/health  # Translator Service
curl http://localhost:5002/health  # Dictionary Service
curl http://localhost:5003/health  # History Service
curl http://localhost:5004/health  # Speech Service
curl http://localhost:5005/health  # Auth Service
curl http://localhost:5006/health  # Learn Service
curl http://localhost:5008/health  # 3D Model Service
curl http://localhost:5009/health  # Artifact Identifier
curl http://localhost:5010/health  # Artifact Service

# Check frontend
# Navigate to http://localhost:5173
```

### Current Status ✅

- ✅ **Microservices Architecture**: All 10 backend services operational
  - 🟢 API Gateway (Port 5000): Unified endpoint and routing
  - 🟢 Translator Service (Port 5001): Core translation engine
  - 🟢 Dictionary Service (Port 5002): Vocabulary management
  - 🟢 History Service (Port 5003): Translation tracking
  - 🟢 Speech Service (Port 5004): STT/TTS capabilities
  - 🟢 Auth Service (Port 5005): User authentication
  - 🟢 Learn Service (Port 5006): AI-powered learning
  - 🟢 3D Model Service (Port 5008): 3D visualization
  - 🟢 Artifact Identifier (Port 5009): AI artifact recognition
  - 🟢 Artifact Service (Port 5010): Artifact management
- ✅ **Frontend Application**: Modern React with Vite (Port 5173)
- ✅ **Databases**: MongoDB (users, artifacts, models)
- ✅ **AI Integration**: OpenAI GPT-4 for learning, Keras CNN for artifacts
- ✅ **Translation Engine**: Multi-layered with bidirectional Sinhala bridge
- ✅ **Speech Technology**: STT/TTS for Vedda and 15+ languages
- ✅ **Styling**: Complete Tailwind CSS integration with React Icons
- ✅ **PWA Support**: Progressive Web App capabilities
- ✅ **Code Quality**: Clean production code with organized imports

### Translation Capabilities ✅

- **Dictionary Translation**: Direct Vedda ↔ English/Sinhala (Confidence: 0.95)
- **Sinhala Bridge**: Bidirectional translation using Sinhala as intermediate (Confidence: 0.65-0.8)
- **Google Translate**: 40+ international languages (Confidence: 0.8)
- **Phrase Translation**: Multi-word expressions with intelligent fallback
- **Unicode Support**: Proper handling of Sinhala/Vedda text
- **Speech Recognition**: Vedda STT with custom processor
- **Speech Synthesis**: Multi-language TTS with gTTS

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
- **Bidirectional Sinhala Bridge**: Intelligent translation using Sinhala as intermediate
- **Microservices Architecture**: Scalable backend with 10 specialized services
- **Modern Frontend**: React 18 + Vite + Tailwind CSS + React Icons
- **Multilingual Support**: Vedda ↔ English/Sinhala + 40+ international languages
- **Speech Technology**: STT/TTS for Vedda, Sinhala, Tamil, English, and 15+ languages
- **AI-Powered Learning**: Personalized lessons with OpenAI GPT-4 integration
- **Artifact Recognition**: Deep learning CNN model for cultural artifact identification
- **3D Model Visualization**: Interactive 3D models of Vedda cultural artifacts
- **User Authentication**: Secure JWT-based auth with role management
- **Intelligent Fallback**: Automatic translation fallback system
- **Real-time Translation**: Live translation with confidence scoring
- **Translation History**: User interaction tracking and analytics
- **IPA Transcriptions**: Pronunciation guidance for all supported languages
- **PWA Capabilities**: Progressive Web App with offline potential
- **Component Architecture**: Maintainable React components with custom hooks
- **Responsive Design**: Modern UI/UX with Tailwind CSS styling
- **Clean Code**: Production-ready code following industry standards
- **MongoDB Integration**: Scalable storage for users, artifacts, and learning data
- **Docker Support**: Containerized services for easy deployment
- **Automated Scripts**: Service management scripts for Windows and Unix

## API Endpoints

### API Gateway (Port 5000)

- `GET /health` - Overall system health
- `POST /api/*` - Proxies requests to appropriate services

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

### Speech Service (Port 5004)

- `POST /api/speech/stt` - Speech-to-text conversion
  - **Input**: Audio file (WAV, MP3, etc.)
  - **Output**: Transcribed text with language detection
- `POST /api/speech/tts` - Text-to-speech synthesis
  - **Input**: `{"text": "වතුර", "language": "sinhala"}`
  - **Output**: Audio file
- `POST /api/speech/vedda-stt` - Vedda-specific speech recognition
- `GET /api/speech/languages` - Supported languages for STT/TTS
- `GET /health` - Service health check

### Auth Service (Port 5005)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT token)
- `GET /api/auth/profile` - Get user profile (requires JWT)
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout
- `GET /health` - Service health check

### Learn Service (Port 5006)

- `POST /api/learn/exercises` - Generate AI-powered exercises
  - **Input**: `{"topic": "animals", "difficulty": "beginner", "user_id": "123"}`
  - **Output**: Personalized exercises
- `GET /api/learn/progress/:userId` - Get user learning progress
- `POST /api/learn/submit` - Submit exercise answers
- `GET /api/learn/lessons` - Get available lessons
- `POST /api/learn/tutor` - AI tutor conversation
- `GET /health` - Service health check

### 3D Model Service (Port 5008)

- `GET /api/models` - Get all 3D models
- `GET /api/models/:id` - Get specific 3D model
- `GET /api/models/words` - Get words with IPA notation
  - **Params**: `word_type`, `search`
- `POST /api/models` - Upload new 3D model
- `GET /health` - Service health check

### Artifact Identifier Service (Port 5009)

- `POST /api/identify` - Identify artifact from image
  - **Input**: Image file (JPEG, PNG)
  - **Output**: Artifact classification with confidence
- `POST /api/identify/batch` - Batch artifact identification
- `GET /api/identify/model-info` - Get model information
- `GET /health` - Service health check

### Artifact Service (Port 5010)

- `GET /api/artifacts` - Get all artifacts with pagination
- `GET /api/artifacts/:id` - Get specific artifact
- `POST /api/artifacts` - Create new artifact entry
- `PUT /api/artifacts/:id` - Update artifact
- `DELETE /api/artifacts/:id` - Delete artifact
- `GET /api/artifacts/search` - Search artifacts by name/type
- `GET /health` - Service health check
- `GET /health/db` - Database connection health

## Architecture Benefits

### 🏗️ **Microservices Backend**

- **10 Independent Services**: Each service handles specific domain functionality
- **Scalable Architecture**: Services can be scaled independently based on load
- **Service Isolation**: Independent development, deployment, and technology choices
- **API Gateway**: Centralized routing, load balancing, and request management
- **Health Monitoring**: Individual service health checks and system monitoring
- **Polyglot Persistence**: SQLite for dictionaries, MongoDB for users/artifacts
- **Language Flexibility**: Python (Flask) and Node.js (Express) services

### 🤖 **AI & Machine Learning Integration**

- **OpenAI GPT-4**: Personalized learning content and AI tutoring
- **Custom CNN Model**: Vedda artifact classification with TensorFlow/Keras
- **ML Classifiers**: Mistake pattern recognition for adaptive learning
- **Google Speech API**: Multi-language speech recognition
- **Transfer Learning**: Pre-trained models fine-tuned for Vedda culture

### 🔧 **Advanced Translation Logic**

- **Multi-Layered Approach**: Dictionary → Sinhala Bridge → Google Translate fallback
- **Confidence Scoring**: Transparent quality metrics (0.1-0.95 range)
- **Method Transparency**: Shows exactly how each translation was achieved
- **Unicode Support**: Proper handling of Sinhala/Vedda Unicode characters
- **Phrase Intelligence**: Context-aware translation for multi-word expressions
- **Bidirectional Support**: Full support for all language pairs

### 🎤 **Speech Technology**

- **Multi-Language STT**: Support for Vedda, Sinhala, Tamil, English, and 15+ languages
- **Custom Vedda Processor**: Specialized STT processor for Vedda language
- **Text-to-Speech**: Natural-sounding speech synthesis with gTTS
- **Audio Format Support**: WAV, MP3, and other common formats
- **Real-time Processing**: Low-latency speech recognition and synthesis

### 🏺 **Cultural Preservation**

- **Artifact Recognition**: AI-powered identification of cultural artifacts
- **3D Visualization**: Interactive 3D models of Vedda cultural items
- **IPA Pronunciation**: Phonetic transcriptions for accurate pronunciation
- **Community Platform**: Collaborative vocabulary and artifact database
- **Historical Documentation**: Preservation of Vedda cultural heritage

### 📚 **Intelligent Learning Platform**

- **Personalized Content**: AI-generated exercises based on user level
- **Adaptive Learning**: Mistake classification for targeted improvement
- **Progress Tracking**: Comprehensive analytics of learning journey
- **Interactive AI Tutor**: Conversational learning with GPT-4
- **Gamification**: Engaging learning experience with achievements

### 📊 **Data Management**

- **CSV-Based Vocabulary**: Easy editing and version control
- **Database Migration**: Smooth schema updates
- **Translation History**: User interaction tracking
- **Statistics Dashboard**: Vocabulary and usage analytics
- **MongoDB Scalability**: Flexible schema for growing data needs

## Contributing

This project aims to preserve and promote the Vedda language and culture. Contributions from linguists, developers, AI researchers, and Vedda community members are highly welcome.

### How to Contribute

1. **Add Vedda vocabulary**: Edit `data/vedda_dictionary.csv` with new words
2. **Improve translations**: Submit better translations or corrections
3. **Train ML models**: Contribute to artifact classification or speech recognition models
4. **Enhance components**: Contribute new React components or improve existing ones
5. **Add features**: Implement new functionality following the microservices architecture
6. **Improve AI learning**: Enhance exercise generation or add new learning modules
7. **Document culture**: Add 3D models, artifacts, or cultural information
8. **Documentation**: Help improve documentation and examples
9. **Testing**: Add unit tests for components, services, and API endpoints

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
- Follow PEP 8 for Python code and ESLint standards for JavaScript
- Use type hints in Python and JSDoc in JavaScript
- Add health check endpoints to all services
- Implement proper authentication for sensitive endpoints

## Development Workflow

### Service Development

1. **Start MongoDB** (required for auth, artifacts, learning, and 3D models)

   ```bash
   mongod
   ```

2. **Start individual services** in development mode
3. **Test endpoints** using curl or Postman
4. **Monitor logs** for any service issues

### Testing

**Backend Testing:**

```bash
# Test Speech Service
python test_vedda_stt.py

# Test AI Integration
cd backend/learn-service
pytest test_ai_integration.py

# Test Dictionary
cd data
python test_dictionary.py
```

**Frontend Testing:**

```bash
cd frontend
npm test
```

### Troubleshooting

**Service Startup Issues:**

- Ensure all dependencies are installed (`npm install` or `pip install -r requirements.txt`)
- Check that required ports (5000-5010, 5173) are available
- Verify MongoDB is running for services that need it
- Check `.env` files have correct configuration
- Verify database files exist in `data/` directory

**MongoDB Connection Issues:**

- Ensure MongoDB is installed and running
- Check MONGODB_URI in `.env` files
- Verify database permissions

**Speech Service Issues:**

- Verify audio file formats are supported (WAV, MP3)
- Check Google Speech API credentials if using external API
- Ensure microphone permissions for real-time STT

**AI/ML Service Issues:**

- Verify OpenAI API key is configured (for Learn Service)
- Check that model files exist (vedda_artifacts_model.keras)
- Ensure sufficient memory for ML inference

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
- **OpenAI** for GPT-4 API enabling intelligent learning features
- **TensorFlow/Keras** for deep learning capabilities
- **React community** for modern development patterns and best practices
- **Contributors and linguists** supporting this project
- **MongoDB** for flexible, scalable database solutions

## Project Statistics

- **Microservices**: 10 backend services (8 Python Flask, 2 Node.js Express)
- **Frontend**: Modern React 18 + Vite + Tailwind CSS architecture
- **Vocabulary**: 62+ Vedda words with English and Sinhala translations
- **Languages Supported**: 40+ languages including Vedda, Sinhala, English, and international languages
- **Translation Methods**: 4 distinct approaches (Dictionary, Sinhala Bridge, Google Translate, Fallback)
- **Speech Languages**: 15+ languages for STT/TTS
- **AI Integration**: OpenAI GPT-4 for learning, Custom CNN for artifact recognition
- **Components**: 20+ React components following modern architecture patterns
- **API Endpoints**: 50+ RESTful endpoints across all microservices
- **Databases**: SQLite + MongoDB for optimal data storage
- **Confidence Scoring**: Transparent quality metrics (0.1-0.95 range)
- **Unicode Support**: Full Sinhala/Vedda character handling
- **PWA Features**: Progressive Web App capabilities with manifest.json
- **Code Quality**: Clean production code following industry standards
- **Containerization**: Docker support for all services
- **Service Ports**: 5000-5010 (backend), 5173 (frontend)

---

**🌟 Star this repository if you find it useful for Vedda language and culture preservation!**

For detailed information:

- Component Architecture: See frontend documentation
- 3D Model Service: See [backend/3D-model-service/README.md](backend/3D-model-service/README.md)

---
