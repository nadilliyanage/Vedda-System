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

## Development

### Adding New Services

1. Create new service directory
2. Add `app.py`, `requirements.txt`, `Dockerfile`, `.env`
3. Update `docker-compose.yml`
4. Update API Gateway routing in `api-gateway/app.py`

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
