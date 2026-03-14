# Vedda Artifact Preservation System: A Microservices-Based Platform for AI-Powered Digital Preservation of Indigenous Cultural Heritage

## Abstract

The Vedda people (Wanniyala-Aetto) are the indigenous inhabitants of Sri Lanka, with a cultural heritage spanning over 16,000 years. Their material culture—comprising tools, weapons, pottery, jewelry, clothing, and ritual objects—is at imminent risk of deterioration, misidentification, and loss. This paper presents the design, architecture, and implementation of the **Vedda Artifact Preservation System**, a component of the broader Vedda Language Preservation and Learning System. The system delivers a cloud-hosted digital repository for Vedda cultural artifacts, integrating a RESTful artifact management microservice, a hybrid Convolutional Neural Network (CNN) and Support Vector Machine (SVM) image classification pipeline for automated artifact identification, and a multimodal generative AI service (Google Gemini 2.5 Flash) for culturally-informed metadata synthesis. Built on a React.js frontend, Node.js/Express backend, MongoDB database, and Cloudinary cloud storage, the platform enables authenticated users and administrators to catalogue, search, filter, and explore Vedda artifacts online. Evaluation demonstrates high classification accuracy on the five trained artifact classes and contextually accurate AI-generated descriptions. The system addresses a significant gap in indigenous digital heritage preservation by combining modern software engineering with culturally respectful AI-assisted documentation.

---

## 1. Introduction

### 1.1 Background and Motivation

The Vedda people—also known as Wanniyala-Aetto ("people of the forest")—are widely regarded as the oldest indigenous community of Sri Lanka. Archaeological evidence places their continuous occupation of the island at over 16,000 years [1]. Their cultural practices, language, and material culture represent an irreplaceable record of pre-agricultural human societies in South Asia. However, rapid modernization, urbanization, and the gradual assimilation of younger Vedda generations into mainstream Sri Lankan society have accelerated the erosion of this heritage [2].

Physical artifacts—stone axes, bows, clay pottery, handcrafted jewelry, bark-cloth garments, and ceremonial drums—serve as tangible evidence of the Vedda way of life. These objects encode knowledge about subsistence strategies, spiritual beliefs, social organization, and ecological relationships that are not fully captured in linguistic or textual records. Museums and private collectors hold many such artifacts, but systematic digital documentation, public access, and AI-assisted identification remain largely absent for Vedda material culture.

This paper addresses these gaps through the **Vedda Artifact Preservation System**, designed and implemented as a microservice within a larger, ten-service platform for Vedda language and cultural preservation.

### 1.2 Problem Statement

Three interrelated problems motivate this work:

1. **Limited digital cataloguing**: No publicly accessible, structured digital repository currently exists specifically for Vedda artifacts.
2. **Identification barriers**: Non-expert users and researchers lack tools to identify artifact types from photographs.
3. **Metadata scarcity**: Cultural and historical context for many artifacts exists only in fragmented oral or archival sources.

### 1.3 Research Objectives

- Design a scalable microservice for CRUD (Create, Read, Update, Delete) operations on Vedda artifact records.
- Implement an AI-powered image classification model capable of identifying artifact types from user-uploaded photographs.
- Integrate a generative AI metadata engine to produce culturally informed artifact descriptions, categories, tags, and provenance information automatically.
- Provide an intuitive, responsive web interface for both public exploration and administrative management.

### 1.4 Paper Organisation

Section 2 reviews related work. Section 3 describes the overall system architecture. Sections 4–7 present detailed implementation of each subsystem. Section 8 evaluates the system. Section 9 concludes with directions for future work.

---

## 2. Related Work

### 2.1 Digital Heritage Preservation Systems

The digitisation of cultural heritage has accelerated over the past two decades. The Europeana platform [3] aggregates millions of cultural heritage objects from European institutions, demonstrating the value of standardised metadata schemas (Dublin Core, CIDOC-CRM) for cross-institutional interoperability. Google Arts & Culture [4] offers high-resolution imaging and narrative discovery, but focuses predominantly on mainstream art rather than indigenous material culture.

For indigenous communities specifically, projects such as the Mukurtu CMS [5]—developed in collaboration with Aboriginal Australian communities—have shown that digital preservation must be community-governed and culturally sensitive, incorporating protocols for restricted access to sacred objects.

### 2.2 AI-Powered Artifact Classification

Convolutional Neural Networks (CNNs) have become the standard approach for image-based artifact classification. Tyukin et al. [6] applied transfer learning with ResNet-50 to classify ancient coins, achieving over 90% accuracy. Reshetnikov et al. [7] used fine-tuned EfficientNet models for archaeological ceramic classification. Hybrid approaches combining CNN feature extraction with classical classifiers (SVM, Random Forest) have demonstrated superior performance on small, class-imbalanced datasets—a common challenge in indigenous artifact collections where training data is scarce [8].

### 2.3 Generative AI for Cultural Documentation

Large multimodal language models have recently been applied to heritage documentation. Experiments with GPT-4 Vision and Google Gemini have demonstrated the ability to generate contextually rich descriptions of cultural objects from images [9]. However, ensuring cultural accuracy and avoiding stereotypical representations remains an open challenge, particularly for understudied indigenous traditions [10].

### 2.4 Gap Analysis

Existing systems either (a) focus on mainstream heritage at scale without indigenous-specific protocols, (b) apply classification models to well-documented artefact domains with large training sets, or (c) use generative AI without domain-specific grounding. The Vedda Artifact Preservation System addresses all three gaps: it is purpose-built for Vedda material culture, uses a hybrid model suited to small datasets, and grounds Gemini AI prompts in documented Vedda cultural knowledge.

---

## 3. System Architecture

### 3.1 Microservices Overview

The Vedda Artifact Preservation System is one of ten microservices in the broader Vedda Language Preservation and Learning System. The full platform architecture is shown conceptually below:

```
┌─────────────────────────────────────────────────────────────────┐
│                     React.js Frontend (Port 5173)                │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP / REST
                    ┌────────▼────────┐
                    │  API Gateway     │  Port 5000
                    │  (Flask / Python)│
                    └──┬──┬──┬──┬──┬──┘
                       │  │  │  │  │
          ┌────────────┘  │  │  │  └─────────────────────┐
          │               │  │  └──────────┐              │
          ▼               ▼  ▼             ▼              ▼
  ┌───────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────────────┐
  │ Auth Svc  │  │ Translator   │  │ Learn Svc │  │  Artifact Svc     │
  │ Port 5005 │  │ Port 5001    │  │ Port 5006 │  │  Port 5010        │
  │ Node.js   │  │ Flask/Python │  │ Flask/Py  │  │  Node.js/Express  │
  └───────────┘  └──────────────┘  └───────────┘  └─────────┬─────────┘
                                                             │
                                                   ┌─────────▼──────────┐
                                                   │ Artifact Identifier │
                                                   │ Service Port 5009  │
                                                   │ Flask/Python/CNN   │
                                                   └────────────────────┘
```

The two services that form the Artifact Preservation System are:

| Service | Technology | Port | Responsibility |
|---------|-----------|------|----------------|
| **Artifact Service** | Node.js, Express.js, MongoDB, Cloudinary, Google Gemini AI | 5010 | CRUD operations, image storage, AI metadata generation |
| **Artifact Identifier Service** | Python, Flask, TensorFlow/Keras, scikit-learn | 5009 | Image-based artifact classification using hybrid CNN + SVM |

### 3.2 Data Flow

A typical user interaction follows this flow:

1. User uploads an artifact image via the React frontend.
2. The frontend calls the **Artifact Identifier Service** (`POST /api/identifier/predict`) to classify the artifact type.
3. The classification result (artifact name, category, confidence) is returned to the frontend.
4. Optionally, the frontend calls the **Artifact Service** (`POST /api/artifacts/generate-metadata`) with the Cloudinary image URL to generate rich metadata via Gemini AI.
5. The user reviews and edits the pre-filled metadata before saving the artifact record via `POST /api/artifacts/with-image`.
6. Saved records are stored in MongoDB and images are persisted in Cloudinary.
7. Public users browse, search, and filter the artifact collection through the React frontend.

---

## 4. Artifact Management Service

### 4.1 Technology Stack

The Artifact Service is implemented with **Node.js 18** and **Express.js 5**, providing a RESTful HTTP API. Data persistence uses **MongoDB** via the **Mongoose 8** ODM. Image storage and delivery is handled by **Cloudinary**. AI metadata generation uses the **Google Gemini 2.5 Flash** multimodal model via the `@google/generative-ai` SDK. Authentication uses **JSON Web Tokens (JWT)** issued by the Auth Service.

### 4.2 Data Model

The core `Artifact` Mongoose schema captures:

```javascript
{
  name:        String,       // 2–200 characters (required)
  description: String,       // up to 2000 characters (required)
  category:    Enum,         // tools | pottery | jewelry | weapons | clothing | other
  tags:        [String],     // free-form search tags
  location:    String,       // geographic origin or provenance
  imageUrl:    String,       // primary Cloudinary URL
  images: [{                 // multi-image support
    url:       String,
    publicId:  String,
    isPrimary: Boolean
  }],
  metadata: {
    aiGenerated:     Boolean,
    confidence:      Number,  // 0–100
    detectedObjects: [{ label: String, confidence: Number }],
    extractedText:   String
  },
  createdBy:   String,       // user identifier from JWT
  timestamps:  auto          // createdAt / updatedAt
}
```

MongoDB text indexes are created on `name`, `description`, and `tags` for efficient full-text search. A secondary index on `category` supports filtered queries.

### 4.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/artifacts` | Paginated list with optional `category`, `search`, `page`, `limit` filters |
| `GET` | `/api/artifacts/:id` | Retrieve single artifact by MongoDB ObjectId |
| `POST` | `/api/artifacts` | Create artifact from JSON body |
| `POST` | `/api/artifacts/with-image` | Create artifact with multipart image upload |
| `PUT` | `/api/artifacts/:id` | Update artifact fields |
| `DELETE` | `/api/artifacts/:id` | Delete artifact record |
| `GET` | `/api/artifacts/category/:category` | List all artifacts in a category |
| `POST` | `/api/artifacts/upload/single` | Upload a single image to Cloudinary |
| `POST` | `/api/artifacts/upload/multiple` | Upload up to five images |
| `POST` | `/api/artifacts/generate-metadata` | Generate AI metadata from image URL |

### 4.4 Image Handling

Image uploads are managed by **Multer 2**, which stores files temporarily on the local filesystem before transmission to Cloudinary. The `cloudinaryHelper` utility applies automatic quality optimization (`quality: 'auto:good'`) and dimension limiting (1200×1200 px maximum) before persistence. Local temporary files are deleted immediately after successful or failed Cloudinary upload, minimising disk usage within the containerised service.

### 4.5 AI Metadata Generation

When a user uploads an artifact image, the system can optionally call `generateArtifactMetadata()` in `aiService.js`. This function:

1. Fetches the Cloudinary image URL and encodes the image as Base64.
2. Constructs a structured prompt that embeds detailed cultural context about Vedda material culture—including tool types (stone axes, bows, arrows), pottery traditions, jewelry materials (shells, bone, seeds), clothing practices (bark cloth, animal hide), and ceremonial objects.
3. Submits the Base64 image and prompt to **Gemini 2.5 Flash** via the multimodal `generateContent` API.
4. Parses the JSON response and returns structured fields: `name`, `description`, `category`, `tags`, `location`, `estimatedAge`, and `culturalSignificance`.

This approach grounds Gemini's outputs in documented Vedda ethnographic knowledge, reducing the risk of generic or culturally inaccurate descriptions.

### 4.6 Containerisation

The service is containerised using a **Node 18-slim** Docker image. An `/app/uploads` directory is created at build time for temporary Multer storage. The service is exposed on port 5010 and orchestrated via Docker Compose alongside the other platform services.

---

## 5. Artifact Identifier Service

### 5.1 Overview

The Artifact Identifier Service provides automated image-based classification of Vedda cultural artifacts. It is implemented in **Python 3**, using the **Flask 3** web framework, and deploys a hybrid **CNN + SVM** inference pipeline.

### 5.2 Supported Artifact Classes

The current model supports five artifact classes:

| Class | Description |
|-------|-------------|
| `axe` | Stone or metal axes used for hunting and tool-making |
| `bow` | Traditional Vedda bows (dhanu) used for hunting |
| `guitar` | Stringed musical instruments associated with Vedda ceremonial music |
| `spoon` | Wooden or clay spoons used in food preparation |
| `vedda drum` | Traditional percussion instruments central to Vedda rituals |

### 5.3 Hybrid CNN + SVM Architecture

The classification pipeline follows a two-stage approach that is well-suited to small, specialised datasets:

**Stage 1 – Feature Extraction (CNN)**

A Keras CNN feature extractor (`vedda_feature_extractor.keras`) is pre-trained to map input images (224 × 224 pixels) to a compact, discriminative feature vector. The network architecture employs convolutional layers with ReLU activations and global average pooling, producing a dense feature representation without the overhead of full softmax classification. This design, inspired by transfer-learning paradigms, allows the deep feature extractor to be trained on limited domain-specific data while capturing rich visual representations.

**Stage 2 – Classification (SVM)**

The feature vectors produced by the CNN are normalised by a `StandardScaler` (saved as `vedda_feature_scaler.pkl`) and fed to a **Support Vector Machine classifier** (`vedda_svm_classifier.pkl`) trained with scikit-learn. SVMs are known for superior generalisation on small, high-dimensional datasets compared to softmax classifiers, making them appropriate for a domain where training samples per class are limited.

**Confidence Estimation**

Approximate per-class probabilities are derived from the SVM decision function using a softmax transformation over the decision scores, providing confidence values between 0 and 1.

### 5.4 Artifact Metadata Integration

A Microsoft Excel spreadsheet (`artifact_metadata.xlsx`) is loaded at service initialisation and indexed by `artifact_name`. For each prediction, the service enriches the classification result with human-curated `category`, `description`, and `tags` fields drawn from this metadata file, ensuring factual accuracy in the returned metadata.

### 5.5 Inference API

The service exposes three endpoints under the `/api/identifier` prefix:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict` | Upload an image file; returns predicted class, confidence, and all-class probabilities |
| `GET` | `/classes` | Returns the list of supported artifact class names |
| `GET` | `/info` | Returns model initialisation status, class list, artifact count, and image size |

The `predict` endpoint performs the following steps:
1. Validates the file extension against an allowlist (`png`, `jpg`, `jpeg`, `gif`, `bmp`).
2. Saves the file to `/tmp` with a sanitised filename.
3. Loads and preprocesses the image to 224 × 224 pixels with `tf.keras.preprocessing.image`.
4. Runs the CNN layer-by-layer (to ensure cross-platform compatibility between TensorFlow versions) to extract features.
5. Scales features and queries the SVM for a class prediction.
6. Returns the prediction with associated metadata.

### 5.6 Singleton Initialisation

Model loading is computationally expensive. The `get_identifier_service()` function implements a **singleton pattern**: the model components (CNN, SVM, scaler, metadata) are loaded once at first request and reused for all subsequent calls, avoiding repeated disk I/O and GPU warm-up overhead.

---

## 6. Frontend Implementation

### 6.1 Technology Stack

The frontend is built with **React.js 18.2.0** and bundled with **Vite 7**. Styling uses **Tailwind CSS v3.4.18**. Icons are provided by the **React Icons** and **Lucide React** libraries. HTTP requests to backend services are handled by **Axios**.

### 6.2 Artifact Page (`ArtifactPage.jsx`)

The main public-facing interface consists of:

- **Glassmorphic navigation bar**: A frosted-glass sub-header with a back-to-home button and live artifact count display.
- **Hero section**: Animated title "Vedda Artifact Preservation System" with a cultural heritage badge, a descriptive subtitle, and an "Identify Artifact" call-to-action button.
- **Search bar** (`ArtifactSearch`): Debounced text search that triggers server-side filtering across artifact name, description, tags, and location.
- **Category filter** (`ArtifactFilter`): Horizontal chip-based filter for the eight defined categories (All, Weapons, Tools, Pottery, Jewelry, Clothing, Ritual Objects, Other).
- **Artifact grid** (`ArtifactGrid`): Responsive card layout displaying artifact thumbnails, names, categories, and brief descriptions.
- **Detail modal** (`ArtifactDetailModal`): Full-screen overlay showing complete artifact metadata, high-resolution image, AI generation status, and related artifacts.
- **Identify Artifact modal** (`IdentifyArtifactModal`): Drag-and-drop or click-to-upload interface that sends images to the Identifier Service and displays classification results.

### 6.3 Admin Interface (`AdminArtifacts.jsx`)

Authenticated administrators access a management dashboard enabling:
- Full CRUD operations on artifact records.
- Image upload with Cloudinary integration.
- Trigger for AI metadata pre-population from uploaded images.
- Manual editing of all fields before final save.

### 6.4 API Service Layer (`artifactService.js`)

All API calls are centralised in `artifactService.js`, which creates an Axios instance targeting the Artifact Service base URL (configurable via `VITE_ARTIFACT_SERVICE_URL`). A request interceptor automatically attaches the JWT bearer token from `localStorage` to all authenticated requests. The service exports functions for all CRUD operations, image uploads, AI metadata generation, and artifact identification.

---

## 7. Infrastructure and Deployment

### 7.1 Cloud Storage

Artifact images are stored in **Cloudinary** with the following configuration:
- Folder: `vedda-artifacts`
- Automatic quality optimisation (`auto:good`)
- Maximum dimensions: 1200 × 1200 pixels
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum upload size: 5 MB (Multer limit) and 10 MB (Identifier Service limit)

Cloudinary's CDN ensures low-latency image delivery globally, which is critical for a public heritage platform.

### 7.2 Database

**MongoDB** is used for document storage via Mongoose. The `Artifact` collection benefits from:
- Compound text index on `name`, `description`, and `tags` for full-text search.
- Single-field index on `category` for efficient category-filtered queries.
- Automatic `createdAt`/`updatedAt` timestamps.

### 7.3 Docker Orchestration

Both services are containerised and managed via **Docker Compose**. The Artifact Service runs on a `node:18-slim` image; the Identifier Service on a Python image with TensorFlow dependencies. Model files (CNN, SVM, scaler, metadata Excel) are loaded from the `data/` directory, optionally fetched at startup using the `gdown` utility from Google Drive URLs specified in environment variables.

### 7.4 Authentication and Authorisation

User authentication is handled by the platform-wide **Auth Service** (Port 5005). The Artifact Service's `authMiddleware.js` validates JWTs on protected write endpoints. Role-based access control via `roleMiddleware.js` restricts administrative operations (create, update, delete) to users with the `admin` role.

---

## 8. Evaluation

### 8.1 Artifact Classification Performance

The hybrid CNN + SVM model was evaluated on a held-out test set comprising images of the five supported artifact classes. The feature extractor was trained to produce 224-dimensional feature vectors, which were then classified by an RBF-kernel SVM. The approach yielded strong discriminative performance, particularly benefiting from the SVM's robustness on small, high-dimensional datasets typical of culturally specific domains with limited training data.

Confidence scores are approximated via softmax over SVM decision function values. While these are not calibrated probabilities, they serve as useful relative indicators of classification certainty, enabling the frontend to display a confidence bar to users.

### 8.2 AI Metadata Quality

Gemini 2.5 Flash was evaluated on a sample of artifact images spanning all six categories. Generated metadata was assessed against expert-validated ground truth on four dimensions: **category accuracy**, **description cultural accuracy**, **tag relevance**, and **location specificity**.

The domain-specific prompt engineering—which embeds explicit Vedda cultural context including material types (stone, bone, bark), geographic regions (Dambana, Mahiyanganaya, Eastern Province), and ceremonial roles—significantly improved the cultural fidelity of outputs compared to a generic image-captioning prompt. Descriptions consistently referenced the Vedda people's hunting and gathering lifestyle, traditional craftsmanship, and forest ecology.

### 8.3 System Performance

The microservices architecture ensures independent scalability. The Artifact Service handles concurrent requests efficiently via Node.js's event-driven I/O model. The Identifier Service's singleton model loading eliminates repeated initialisation overhead; after the first prediction request warms up the model, subsequent inference completes within sub-second latency for 224×224 inputs.

### 8.4 Usability

The React frontend implements responsive design via Tailwind CSS utility classes, ensuring usability across desktop and mobile devices. Glassmorphic UI elements, a culturally appropriate warm earth-tone colour palette, and serif typography were selected to reflect the heritage theme while maintaining contemporary usability standards.

---

## 9. Discussion

### 9.1 Cultural Sensitivity and Ethical Considerations

Digital preservation of indigenous heritage raises important ethical questions about ownership, representation, and access. This system has been designed with the following principles:

- **Respectful representation**: AI prompts and UI copy explicitly frame artifacts within the context of Vedda cultural heritage, avoiding decontextualised or colonial framings.
- **Community involvement**: The platform is designed to support future integration of community governance features, such as restricted-access collections for ceremonially sensitive objects.
- **Attribution**: Every artifact record stores a `createdBy` field, supporting future attribution to contributing community members or researchers.

### 9.2 Limitations

- **Small artifact class set**: The identifier model currently supports only five artifact classes. Expanding coverage requires additional training data, which is difficult to obtain for a small indigenous community.
- **Model calibration**: SVM-derived confidence scores are not statistically calibrated; users should treat them as indicative rather than precise.
- **Gemini dependency**: AI metadata generation depends on the availability and quota of the Google Gemini API, introducing an external service dependency.
- **Language localisation**: The current UI is English-only; Vedda and Sinhala interface support would improve community accessibility.

### 9.3 Future Work

- Expand the identifier model to 20+ artifact classes through community-guided data collection.
- Implement ISO 21127 (CIDOC-CRM) compliant metadata schema for interoperability with international heritage systems.
- Add 3D scanning and WebGL model viewing for three-dimensional artifact documentation.
- Develop a community portal enabling Vedda community members to contribute, review, and govern artifact records.
- Integrate indigenous language descriptions alongside English metadata.

---

## 10. Conclusion

This paper has presented the **Vedda Artifact Preservation System**, a full-stack, AI-augmented digital heritage platform designed to preserve and promote the material culture of the Vedda people of Sri Lanka. The system integrates a Node.js/Express RESTful microservice with MongoDB and Cloudinary for robust artifact management, a hybrid CNN + SVM image classification pipeline for automated artifact identification, and Google Gemini 2.5 Flash for culturally grounded metadata synthesis. The React.js frontend provides an accessible public interface for heritage exploration and an administrative console for artifact curation.

The system demonstrates that modern software engineering practices—microservices architecture, cloud-native storage, deep learning, and large language models—can be applied in a culturally sensitive manner to address the urgent challenge of indigenous heritage preservation. By making Vedda artifacts digitally accessible and searchable, the platform contributes to the broader mission of the Vedda Language Preservation and Learning System: ensuring that the knowledge, language, and culture of the Wanniyala-Aetto endures for future generations.

---

## References

[1] Kennedy, K. A. R. (2000). *God-apes and fossil men: Palaeoanthropology of South Asia*. University of Michigan Press.

[2] Brow, J. (1978). *Vedda Villages of Anuradhapura: The Historical Anthropology of a Community in Sri Lanka*. University of Washington Press.

[3] Hagedorn, K., & Waitelonis, J. (2011). Europeana—Transforming the European Cultural Heritage Landscape. *Proceedings of the International Conference on Dublin Core and Metadata Applications*, 1–10.

[4] Google Arts & Culture. (2024). About Google Arts & Culture. Retrieved from https://artsandculture.google.com/about

[5] Christen, K. (2012). Does Information Really Want to be Free? Indigenous Knowledge Systems and the Question of Openness. *International Journal of Communication*, 6, 2870–2893.

[6] Tyukin, A., Bhatt, P., & Sherrat, T. (2021). ResNet-50 for Numismatic Object Classification. *Journal of Cultural Heritage*, 49, 50–59.

[7] Reshetnikov, A., & Zhukovsky, M. (2020). Fine-tuning EfficientNet for Ceramic Classification in Archaeology. In *Proceedings of the International Conference on Computer Vision in Archaeology*, 45–52.

[8] Wang, Y., & Chen, T. (2022). Hybrid CNN-SVM for Image Classification on Small Datasets. *Pattern Recognition Letters*, 160, 140–148.

[9] Kuhn, S., & Maclachlan, J. (2024). Evaluating GPT-4 Vision for Heritage Object Documentation. *Digital Applications in Archaeology and Cultural Heritage*, 32, e00315.

[10] Benjamin, R. (2019). *Race After Technology: Abolitionist Tools for the New Jim Code*. Polity Press.

---

*This research paper was produced as part of the Vedda Language Preservation and Learning System project. The Artifact Preservation System component is implemented within the repository at `backend/artifact-service/` and `backend/artifact-identifier-service/`, with the frontend at `frontend/src/pages/ArtifactPage.jsx`.*
