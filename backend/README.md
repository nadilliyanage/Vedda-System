# Vedda Translator Microservices Backend

This backend implements a microservices architecture for the Vedda Language Translator application.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │  Load Balancer  │
│   (React)       │───▶│   Port: 5000    │◀───│   (Optional)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────────┐
            │              Service Mesh               │
            └─────────────────────────────────────────┘
                    │           │           │
                    ▼           ▼           ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
        │  Translator     │ │  Dictionary     │ │   History       │
        │  Service        │ │  Service        │ │   Service       │
        │  Port: 5001     │ │  Port: 5002     │ │  Port: 5003     │
        └─────────────────┘ └─────────────────┘ └─────────────────┘
                    │           │           │
                    ▼           ▼           ▼
        ┌─────────────────────────────────────────────────────────┐
        │                 Data Layer                              │
        │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
        │  │ Translation │ │ Dictionary  │ │ History &       │   │
        │  │ Cache       │ │ Database    │ │ Feedback DB     │   │
        │  └─────────────┘ └─────────────┘ └─────────────────┘   │
        └─────────────────────────────────────────────────────────┘
```

## Project Structure

```
vedda-system/
├── backend/
│   ├── api-gateway/           # API Gateway service
│   ├── dictionary-service/    # Dictionary management
│   ├── translator-service/    # Translation engine
│   ├── history-service/       # History & feedback
│   ├── docker-compose.yml     # Container orchestration
│   └── README.md             # This file
├── frontend/                  # React frontend
├── data/                     # Database files
├── requirements.txt          # Main project dependencies
├── update_dependencies.py    # Dependency update script
├── update_dependencies_enhanced.py  # Advanced update script
└── README.md                # Project overview
```

## Services

### 1. API Gateway (Port: 5000)

- **Purpose**: Single entry point for all client requests
- **Responsibilities**:
  - Request routing to appropriate microservices
  - CORS handling
  - Rate limiting (future)
  - Authentication (future)
  - Load balancing
  - Health monitoring

### 2. Translator Service (Port: 5001)

- **Purpose**: Core translation functionality
- **Responsibilities**:
  - Text translation using multiple methods
  - Language detection
  - Translation quality assessment
  - Integration with external translation APIs
  - Caching translation results

### 3. Dictionary Service (Port: 5002)

- **Purpose**: Vedda-Sinhala-English dictionary management
- **Responsibilities**:
  - Word lookup and reverse lookup
  - IPA phonetic transcriptions
  - Dictionary word management
  - Search functionality
  - Word statistics

### 4. History Service (Port: 5003)

- **Purpose**: Translation history and user feedback
- **Responsibilities**:
  - Translation history tracking
  - User feedback collection
  - Analytics and reporting
  - Usage statistics

## Quick Start

### Prerequisites

1. **Update Dependencies** (Recommended first step):

   ```bash
   # Navigate to project root
   cd "D:\SLIIT\RP\Vedda System"

   # Update all Python dependencies
   python update_dependencies.py
   ```

### Using Docker Compose (Recommended)

1. **Start all services**:

   ```bash
   cd backend
   docker-compose up --build
   ```

2. **Start services in detached mode**:

   ```bash
   docker-compose up -d --build
   ```

3. **View logs**:

   ```bash
   docker-compose logs -f [service-name]
   ```

4. **Stop all services**:
   ```bash
   docker-compose down
   ```

### Manual Setup

1. **Install dependencies for each service**:

   ```bash
   # API Gateway
   cd api-gateway
   pip install -r requirements.txt

   # Translator Service
   cd ../translator-service
   pip install -r requirements.txt

   # Dictionary Service
   cd ../dictionary-service
   pip install -r requirements.txt

   # History Service
   cd ../history-service
   pip install -r requirements.txt
   ```

2. **Start services** (in separate terminals):

   ```bash
   # Terminal 1 - Dictionary Service
   cd dictionary-service && python app.py

   # Terminal 2 - History Service
   cd history-service && python app.py

   # Terminal 3 - Translator Service
   cd translator-service && python app.py

   # Terminal 4 - API Gateway
   cd api-gateway && python app.py
   ```

## API Endpoints

### API Gateway (http://localhost:5000)

- `GET /health` - Overall system health
- `POST /api/translate` - Translation (routed to translator-service)
- `GET /api/languages` - Supported languages (routed to translator-service)
- `GET /api/dictionary/*` - Dictionary operations (routed to dictionary-service)
- `GET /api/history/*` - History operations (routed to history-service)

### Direct Service Access (for development)

#### Translator Service (http://localhost:5001)

- `POST /api/translate` - Translate text
- `POST /api/translate/word` - Translate single word
- `GET /api/languages` - Get supported languages
- `GET /health` - Service health

#### Dictionary Service (http://localhost:5002)

- `GET /api/dictionary/search?word=<word>&source=<lang>&target=<lang>` - Search dictionary
- `GET /api/dictionary?limit=<n>&offset=<n>` - Get dictionary entries
- `POST /api/dictionary/add` - Add new word
- `GET /api/dictionary/stats` - Dictionary statistics
- `GET /health` - Service health

#### History Service (http://localhost:5003)

- `GET /api/history?limit=<n>&offset=<n>` - Get translation history
- `POST /api/history` - Add translation to history
- `GET /api/feedback` - Get user feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/statistics` - Usage statistics
- `GET /health` - Service health

## Environment Configuration

Each service has its own `.env` file for configuration:

### API Gateway (.env)

```
FLASK_ENV=development
TRANSLATOR_SERVICE_URL=http://localhost:5001
DICTIONARY_SERVICE_URL=http://localhost:5002
HISTORY_SERVICE_URL=http://localhost:5003
```

### Translator Service (.env)

```
FLASK_ENV=development
DICTIONARY_SERVICE_URL=http://localhost:5002
HISTORY_SERVICE_URL=http://localhost:5003
```

### Dictionary Service (.env)

```
FLASK_ENV=development
DATABASE_PATH=../../data/vedda_dictionary.db
```

### History Service (.env)

```
FLASK_ENV=development
DATABASE_PATH=../../data/vedda_history.db
```

## Database Structure

### Dictionary Database (vedda_dictionary.db)

```sql
dictionary (
    id INTEGER PRIMARY KEY,
    vedda_word TEXT NOT NULL,
    sinhala_word TEXT,
    english_word TEXT,
    vedda_ipa TEXT,
    sinhala_ipa TEXT,
    english_ipa TEXT,
    word_type TEXT,
    usage_example TEXT,
    created_at TIMESTAMP
)
```

### History Database (vedda_history.db)

```sql
translation_history (
    id INTEGER PRIMARY KEY,
    input_text TEXT NOT NULL,
    output_text TEXT NOT NULL,
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL,
    translation_method TEXT,
    confidence_score REAL,
    created_at TIMESTAMP
)

user_feedback (
    id INTEGER PRIMARY KEY,
    original_text TEXT NOT NULL,
    suggested_translation TEXT NOT NULL,
    current_translation TEXT,
    feedback_type TEXT,
    user_rating INTEGER,
    comments TEXT,
    created_at TIMESTAMP
)
```

## Dependency Management

### Automated Dependency Updates

The project includes automated scripts for updating Python dependencies across all microservices:

#### Quick Update (Recommended)

```bash
# Run the dependency update script
python update_dependencies.py
```

Or with full Python path:

```bash
C:/Users/nadil/AppData/Local/Programs/Python/Python313/python.exe "D:\SLIIT\RP\Vedda System\update_dependencies.py"
```

#### Enhanced Update (With Backup & Health Checks)

```bash
# Run enhanced version with logging and backups
python update_dependencies_enhanced.py

# Skip backup creation
python update_dependencies_enhanced.py --no-backup

# Skip health checks
python update_dependencies_enhanced.py --no-health-check

# Custom project root
python update_dependencies_enhanced.py --project-root "C:\MyProject"
```

#### Manual Dependency Updates

For individual services:

```bash
# Update specific service dependencies
cd api-gateway && pip install -r requirements.txt --upgrade
cd dictionary-service && pip install -r requirements.txt --upgrade
cd translator-service && pip install -r requirements.txt --upgrade
cd history-service && pip install -r requirements.txt --upgrade

# Check for outdated packages
pip list --outdated

# Update main project dependencies
pip install -r requirements.txt --upgrade
```

#### Current Dependency Versions

- **Flask**: `>=3.1.2` (upgraded from 2.3.3)
- **flask-cors**: `>=6.0.1` (upgraded from 4.0.0)
- **requests**: `>=2.32.5` (upgraded from 2.31.0)
- **python-dotenv**: `>=1.1.1` (upgraded from 1.0.0)
- **pandas**: `>=2.3.3`
- **openpyxl**: `>=3.1.5`

#### Dependency Update Features

- ✅ **Automated Updates**: Updates all microservices with one command
- ✅ **Error Handling**: Shows success/failure for each service
- ✅ **Backup Creation**: Creates backup of requirements files (enhanced version)
- ✅ **Health Checks**: Verifies services can import dependencies (enhanced version)
- ✅ **Logging**: Maintains update logs with timestamps (enhanced version)
- ✅ **Progress Tracking**: Visual feedback with emojis
- ✅ **Cross-Platform**: Works on Windows, Linux, and macOS

## Development

### Adding New Services

1. Create new service directory
2. Add `app.py`, `requirements.txt`, `Dockerfile`, `.env`
3. Update `docker-compose.yml`
4. Update API Gateway routing in `api-gateway/app.py`
5. Add service to dependency update script in `update_dependencies.py`

### Testing Services

```bash
# Test API Gateway health
curl http://localhost:5000/health

# Test translation
curl -X POST http://localhost:5000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "hello", "source_language": "english", "target_language": "vedda"}'

# Test dictionary search
curl "http://localhost:5000/api/dictionary/search?word=hello&source=english&target=vedda"
```

## Troubleshooting

### Dependency Issues

**Problem**: Import errors after updates

```bash
# Solution: Run health check
python update_dependencies_enhanced.py
```

**Problem**: Path issues with spaces in directory names

```bash
# Use quotes around the full path
"C:/path/to/python.exe" "D:\SLIIT\RP\Vedda System\update_dependencies.py"
```

**Problem**: Services won't start after dependency updates

```bash
# Check individual service requirements
cd backend/api-gateway && pip install -r requirements.txt
cd ../dictionary-service && pip install -r requirements.txt
# ... repeat for other services
```

### Service Startup Issues

**Problem**: Database connection errors

```bash
# Check database path in .env files
# Ensure database files exist in data/ directory
```

**Problem**: Port conflicts

```bash
# Check if ports 5000-5003 are available
netstat -an | findstr "500[0-3]"
```

## Monitoring and Logging

- Each service provides `/health` endpoint for monitoring
- Logs are available through `docker-compose logs`
- Future: Integration with monitoring tools (Prometheus, Grafana)

## Security Considerations

- **Current**: Basic CORS configuration
- **Future Enhancements**:
  - API authentication (JWT tokens)
  - Rate limiting
  - Input validation and sanitization
  - HTTPS termination
  - Secret management

## Scalability

The microservices architecture allows for:

- Independent scaling of services
- Load balancing at the API Gateway level
- Database sharding (future)
- Caching strategies (Redis integration)
- Container orchestration (Kubernetes deployment)

## Frontend Integration

Update your frontend to point to the API Gateway:

```javascript
const API_BASE_URL = "http://localhost:5000";
```

All existing API endpoints remain the same, but now go through the API Gateway.

taskkill /f /im python.exe
