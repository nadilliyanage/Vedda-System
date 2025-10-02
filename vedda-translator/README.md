# Vedda Language Translator

A comprehensive translation system for the Vedda language, similar to Google Translate, with intelligent fallback to Sinhala when Vedda translations are unavailable.

## Project Overview

The Vedda language is an indigenous language of Sri Lanka that has significant overlap with Sinhala. This translator aims to:

1. Translate between Vedda and other languages (English, Sinhala)
2. Provide intelligent fallback to Sinhala when Vedda words are not available
3. Build a comprehensive Vedda language corpus
4. Support both text and potentially speech translation


## Project Structure

```
vedda-translator/
├── README.md                    # Project documentation
├── requirements.txt             # Python dependencies
├── backend/
│   ├── app.py                   # Flask API server
│   └── .env                     # Environment variables
├── frontend/
│   ├── src/
│   │   └── App.js               # React main component
│   ├── public/                  # Static assets
│   └── package.json             # Node.js dependencies
└── data/
    ├── vedda_dictionary.csv     # Main vocabulary dataset
    ├── csv_data_manager.py      # CSV import/export tool
    ├── migrate_database.py      # Database migration
    └── vedda_translator.db      # SQLite database
```

## Technology Stack

- **Frontend**: React.js with Material-UI, Google Translate-style interface
- **Backend**: Python Flask with CORS support
- **Database**: SQLite with enhanced schema for training history
- **Translation**: Dictionary-based with Google Translate API integration
- **Data Management**: CSV-based with pandas for easy dataset updates (no backup overhead)
- **IPA Support**: Google Translate-style phonetic transcriptions

## Development Status

### ✅ Phase 1: Basic Dictionary-Based Translation (Completed)
- ✅ Created Vedda-Sinhala-English word mappings (49+ words)
- ✅ Implemented dictionary-based translation with intelligent fallback
- ✅ Built Google Translate-style web interface
- ✅ Added IPA phonetic transcriptions

### ✅ Phase 2: Enhanced Translation Engine (Completed)
- ✅ Added context-based translation with Sinhala fallback
- ✅ Implemented Google Translate API integration for 20+ languages
- ✅ Added CSV-based dataset management system (streamlined, no backups)
- ✅ Implemented translation history tracking

### 🚧 Phase 3: Advanced Features (In Progress)
- ✅ Streamlined CSV data management (removed backup overhead)
- 🔄 Expanding Vedda vocabulary through CSV updates
- 🔄 Community contribution interface
- ⏳ Batch translation capabilities
- ⏳ Mobile-responsive design improvements

### 📋 Phase 4: Future Enhancements
- Speech-to-text and text-to-speech
- Mobile application
- Advanced ML translation models
- Collaborative vocabulary building platform

## Getting Started

### Prerequisites
- Python 3.8+ installed
- Node.js 16+ and npm installed
- Git installed

### Installation & Setup

1. **Clone this repository**
   ```bash
   git clone <repository-url>
   cd vedda-translator
   ```

2. **Backend Setup**
   ```bash
   # Navigate to project root
   cd vedda-translator
   
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Navigate to data directory and initialize database
   cd data
   python migrate_database.py
   python csv_data_manager.py --import
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

### Adding More Vedda Words

1. **Edit the CSV file**
   ```bash
   # Open data/vedda_dictionary.csv and add new rows:
   # vedda_word,sinhala_word,english_word,vedda_ipa,sinhala_ipa,english_ipa,word_type,usage_example
   ```

2. **Import to Database**
   ```bash
   cd data
   python csv_data_manager.py --import
   ```

3. **Check Statistics**
   ```bash
   python csv_data_manager.py --stats
   ```

### Project Commands

- **Database Management:**
  - `python csv_data_manager.py --import` - Import CSV data
  - `python csv_data_manager.py --export` - Export database to CSV
  - `python csv_data_manager.py --stats` - View statistics

- **Development:**
  - Backend: `python backend/app.py`
  - Frontend: `npm start` (from frontend directory)

### Current Features ✅

- **49+ Vedda words** with IPA pronunciations
- **English ↔ Vedda translation** with Sinhala fallback
- **Google Translate integration** for 20+ languages
- **Streamlined CSV-based dataset management** (no backup overhead)
- **Real-time translation interface**
- **Translation history tracking**

## Contributing

This project aims to preserve and promote the Vedda language. Contributions from linguists, developers, and Vedda community members are highly welcome.

### How to Contribute

1. **Add Vedda vocabulary**: Edit `data/vedda_dictionary.csv` with new words
2. **Improve translations**: Submit better translations or corrections
3. **Enhance features**: Contribute code improvements or new features
4. **Documentation**: Help improve documentation and examples

### Data Format

When adding words to `vedda_dictionary.csv`, use this format:
```csv
vedda_word,sinhala_word,english_word,vedda_ipa,sinhala_ipa,english_ipa,word_type,usage_example
```

## API Endpoints

- `POST /translate` - Translate text between languages
- `GET /health` - Check API health status
- `GET /languages` - Get supported languages
- `GET /stats` - Get translation statistics

## License

This project is dedicated to preserving the Vedda language and culture. Please use responsibly and with respect for the Vedda community.

## Acknowledgments

- Vedda community for preserving their language and culture
- Google Translate API for multi-language support
- Contributors and linguists supporting this project