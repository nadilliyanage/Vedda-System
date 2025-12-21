# 3D Model Service

A Flask-based microservice for managing 3D model-related operations and fetching Vedda language words with IPA notation.

## Features

- Fetch words with vedda_IPA pronunciation
- Filter words by type and search term
- Get specific words by ID or Vedda word
- Retrieve only words with IPA notation
- MongoDB integration
- RESTful API endpoints

## Setup

### Prerequisites

- Python 3.11+
- MongoDB connection (configured in `.env`)

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables in `.env`:
```env
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=vedda-system
PORT=5008
DEBUG=True
```

3. Run the service:
```bash
python run.py
```

The service will start on `http://localhost:5008`

## API Endpoints

### Health Check

**GET** `/health`

Check service health and database connection.

**Response:**
```json
{
  "status": "healthy",
  "service": "3D Model Service",
  "database": "connected",
  "word_count": 150
}
```

### Get All Words

**GET** `/api/3d-models/words`

Fetch words with optional filtering.

**Query Parameters:**
- `word_type` (optional): Filter by word type (e.g., noun, verb)
- `search` (optional): Search term for vedda_word
- `limit` (optional, default: 100): Number of results to return
- `skip` (optional, default: 0): Number of results to skip for pagination

**Example:**
```
GET /api/3d-models/words?word_type=noun&limit=50
GET /api/3d-models/words?search=මල්
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "vedda_word": "මල්",
      "english_word": "flower",
      "sinhala_word": "මල්",
      "vedda_ipa": "mal",
      "sinhala_ipa": "mal",
      "english_ipa": "ˈflaʊ.ər",
      "word_type": "noun",
      "usage_example": "මල් සුන්දර වේ",
      "frequency_score": 1.0,
      "confidence_score": 0.95
    }
  ],
  "metadata": {
    "total": 150,
    "limit": 100,
    "skip": 0,
    "count": 50
  }
}
```

### Get Word by ID

**GET** `/api/3d-models/words/<word_id>`

Fetch a specific word by MongoDB ObjectId.

**Example:**
```
GET /api/3d-models/words/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "vedda_word": "මල්",
    "english_word": "flower",
    "sinhala_word": "මල්",
    "vedda_ipa": "mal",
    "sinhala_ipa": "mal",
    "english_ipa": "ˈflaʊ.ər",
    "word_type": "noun",
    "usage_example": "මල් සුන්දර වේ",
    "frequency_score": 1.0,
    "confidence_score": 0.95
  }
}
```

### Get Word by Vedda Word

**GET** `/api/3d-models/words/vedda/<vedda_word>`

Fetch word details by Vedda word (case-insensitive).

**Example:**
```
GET /api/3d-models/words/vedda/මල්
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "vedda_word": "මල්",
    "vedda_ipa": "mal",
    "english_word": "flower",
    "sinhala_word": "මල්",
    ...
  }
}
```

### Get Words with IPA Only

**GET** `/api/3d-models/words/ipa`

Fetch only words that have `vedda_ipa` defined (full word details).

**Query Parameters:**
- `limit` (optional, default: 100): Number of results to return
- `skip` (optional, default: 0): Number of results to skip for pagination

**Example:**
```
GET /api/3d-models/words/ipa?limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "vedda_word": "මල්",
      "vedda_ipa": "mal",
      ...
    }
  ],
  "metadata": {
    "total": 120,
    "limit": 50,
    "skip": 0,
    "count": 50,
    "filter": "words with vedda_ipa only"
  }
}
```

### Get IPA and Words Only (Minimal Data)

**GET** `/api/3d-models/words/ipa-only`

Fetch only `vedda_ipa`, `sinhala_ipa` and words (minimal response with no extra fields).

**Query Parameters:**
- `limit` (optional, default: 100): Number of results to return
- `skip` (optional, default: 0): Number of results to skip for pagination
- `has_vedda_ipa` (optional, default: false): If true, only return words with vedda_ipa defined

**Example:**
```
GET /api/3d-models/words/ipa-only?limit=50
GET /api/3d-models/words/ipa-only?has_vedda_ipa=true&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "vedda_word": "මල්",
      "english_word": "flower",
      "sinhala_word": "මල්",
      "vedda_ipa": "mal",
      "sinhala_ipa": "mal"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "vedda_word": "ගස",
      "english_word": "tree",
      "sinhala_word": "ගස",
      "vedda_ipa": "gasa",
      "sinhala_ipa": "gasa"
    }
  ],
  "metadata": {
    "total": 150,
    "limit": 50,
    "skip": 0,
    "count": 50,
    "fields": ["vedda_word", "english_word", "sinhala_word", "vedda_ipa", "sinhala_ipa"]
  }
}
```

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid parameter value"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Word not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Server error: detailed message"
}
```

## Docker Support

Build and run using Docker:

```bash
docker build -t 3d-model-service .
docker run -p 5008:5008 --env-file .env 3d-model-service
```

## Project Structure

```
3D-model-service/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── config.py            # Configuration
│   ├── db/
│   │   ├── __init__.py
│   │   └── mongo.py         # MongoDB connection
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health_routes.py # Health check endpoints
│   │   └── model_routes.py  # Word/model endpoints
│   └── services/
│       ├── __init__.py
│       └── model_service.py # Business logic
├── .env                     # Environment variables
├── Dockerfile              # Docker configuration
├── requirements.txt        # Python dependencies
├── run.py                  # Application entry point
└── README.md              # This file
```

## Development

The service connects to the same MongoDB database as the dictionary service and reads from the `dictionary` collection.

### Data Model

Each word document contains:
- `vedda_word`: Word in Vedda language
- `english_word`: English translation
- `sinhala_word`: Sinhala translation
- `vedda_ipa`: Vedda pronunciation in IPA notation
- `sinhala_ipa`: Sinhala pronunciation in IPA notation
- `english_ipa`: English pronunciation in IPA notation
- `word_type`: Type of word (noun, verb, etc.)
- `usage_example`: Example sentence
- `frequency_score`: Word frequency score
- `confidence_score`: Translation confidence score
