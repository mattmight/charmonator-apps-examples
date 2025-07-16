# Clinical Trial Matcher - Complete API Documentation

## Overview

The Clinical Trial Matcher provides a comprehensive set of RESTful API endpoints for clinical trial eligibility assessment, NCT data lookup, and workflow integration. All endpoints support HIPAA-compliant AI models and real-time processing of clinical trial data from the complete ClinicalTrials.gov dataset (540,505+ trials).

## Base URL

```
http://localhost:5002/charm/apps/clinical-trial-matcher
```

## Available Endpoints

### Core Matching Endpoints

#### 1. Comprehensive AI Matching
**POST /comprehensive-match**

Advanced clinical trial eligibility evaluation using comprehensive AI reasoning.

**Request Body:**
```json
{
  "medicalRecord": "Patient medical record text",
  "trialCriteria": {
    "inclusionCriteria": ["criterion 1", "criterion 2"],
    "exclusionCriteria": ["criterion 1", "criterion 2"]
  },
  "trialInfo": {
    "title": "optional trial title",
    "condition": "optional condition", 
    "phase": "optional phase"
  }
}
```

**Response:**
```json
{
  "patientId": "pt-1749436083592-k7d844een",
  "timestamp": "2025-06-09T02:28:06.509Z",
  "evaluationType": "comprehensive",
  "overallAssessment": {
    "eligibility": "eligible|ineligible|requires-review",
    "confidence": 0.85,
    "clinicalSummary": "Detailed clinical findings summary",
    "safetyAssessment": "Safety considerations and risk factors"
  },
  "criteriaAnalysis": [
    {
      "criterion": "Age ≥ 18 years",
      "type": "inclusion|exclusion",
      "status": "matched|non-matched|insufficient-data",
      "confidence": 0.95,
      "clinicalReasoning": "Detailed medical reasoning with context",
      "evidenceFromRecord": "Direct quotes from medical record",
      "missingInformation": "Specific additional data needed"
    }
  ],
  "clinicalRecommendations": {
    "nextSteps": "Actionable recommendations for enrollment",
    "additionalTests": "Required diagnostic workup",
    "riskFactors": "Key safety monitoring priorities",
    "alternativeTrials": "Suggestions for better-suited studies"
  }
}
```

#### 2. Comprehensive NCT-Based Matching
**POST /comprehensive-match-nct**

Enhanced NCT-based matching with comprehensive AI reasoning.

**Request Body:**
```json
{
  "medicalRecord": "Patient medical record text",
  "nctNumber": "NCT00000102"
}
```

**Response:** Same structure as `/comprehensive-match` with additional NCT-specific fields:
```json
{
  "nctNumber": "NCT00000102",
  "trialInfo": {
    "title": "Trial title from NCT database",
    "condition": "Primary condition",
    "phase": "Phase 2",
    "ageRange": "18 Years to N/A",
    "gender": "All",
    "status": "Recruiting"
  }
}
```

#### 3. Basic Clinical Trial Matching
**POST /clinical-trial-matcher**

Basic eligibility evaluation using criterion-by-criterion assessment.

**Request Body:**
```json
{
  "medicalRecord": "Patient medical record text",
  "trialCriteria": {
    "inclusionCriteria": ["criterion 1", "criterion 2"],
    "exclusionCriteria": ["criterion 1", "criterion 2"]
  }
}
```

**Response:**
```json
{
  "patientId": "pt-1749436083592-k7d844een",
  "timestamp": "2025-06-09T02:28:06.509Z",
  "overallEligibility": "eligible|ineligible|needs-review",
  "results": [
    {
      "criterion": "Age ≥ 18 years",
      "type": "inclusion|exclusion",
      "status": "matched|non-matched|more-information-needed",
      "reasoning": "Clear explanation of decision",
      "confidence": 0.85
    }
  ]
}
```

#### 4. Basic NCT-Based Matching
**POST /match-to-nct**

Basic NCT-based patient matching using individual criterion assessment.

**Request Body:**
```json
{
  "medicalRecord": "Patient medical record text",
  "nctNumber": "NCT00000102"
}
```

### NCT Data Endpoints

#### 5. Get Complete Trial Information
**GET /nct/:nctNumber**

Retrieve complete trial information for a specific NCT number.

**Example:** `GET /nct/NCT00000102`

**Response:**
```json
{
  "nctNumber": "NCT00000102",
  "studyInfo": {
    "briefTitle": "Trial title",
    "condition": "Primary condition",
    "phase": "Phase 2",
    "overallStatus": "Recruiting",
    "studyType": "Interventional"
  },
  "eligibility": {
    "inclusionCriteria": ["criterion 1", "criterion 2"],
    "exclusionCriteria": ["criterion 1", "criterion 2"],
    "gender": "All",
    "minimumAge": "18 Years",
    "maximumAge": "N/A",
    "healthyVolunteers": false
  },
  "metadata": {
    "parsedAt": "2025-06-09T02:28:06.509Z",
    "source": "ClinicalTrials.gov"
  }
}
```

#### 6. Get Eligibility Criteria Only
**GET /nct/:nctNumber/eligibility**

Retrieve only the eligibility criteria for a specific NCT number.

**Example:** `GET /nct/NCT00000102/eligibility`

**Response:**
```json
{
  "inclusionCriteria": ["criterion 1", "criterion 2"],
  "exclusionCriteria": ["criterion 1", "criterion 2"],
  "gender": "All",
  "minimumAge": "18 Years",
  "maximumAge": "N/A",
  "healthyVolunteers": false
}
```

#### 7. Search Trials by Pattern
**GET /search**

Search for clinical trials by NCT number pattern.

**Query Parameters:**
- `pattern` (required): Search pattern (e.g., "NCT0000010*")
- `limit` (optional): Maximum results (default: 50)

**Example:** `GET /search?pattern=NCT0000010*&limit=5`

**Response:**
```json
{
  "query": "NCT0000010*",
  "results": ["NCT00000102", "NCT00000104"],
  "count": 2,
  "totalMatches": 5,
  "limit": 5
}
```

#### 8. Database Statistics
**GET /database-stats**

Get statistics about the clinical trials database.

**Response:**
```json
{
  "totalTrials": 540505,
  "totalDirectories": 701,
  "directoryStats": {
    "NCT0000xxxx": 10000,
    "NCT0001xxxx": 10000
  },
  "lastUpdated": "2025-06-09T00:00:00.000Z"
}
```

### Pre-population and Session Management

#### 9. Pre-populate Interface
**POST /pre-populate**

Create a pre-populated session with medical record and trial data.

**Request Body:**
```json
{
  "medicalRecord": "Patient medical record text",
  "nctNumber": "NCT00000102",
  "trialCriteria": {
    "inclusionCriteria": ["criterion 1"],
    "exclusionCriteria": ["criterion 1"]
  },
  "sessionId": "optional custom session ID",
  "returnUrl": "https://emr.example.com/patient/123"
}
```

**Response:**
```json
{
  "sessionId": "session-1749436083592-k7d844een",
  "interfaceUrl": "http://localhost:5002/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html?session=session-1749436083592-k7d844een",
  "deepLinkUrl": "http://localhost:5002/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html?nct=NCT00000102&medicalRecord=Patient...",
  "trialInfo": {
    "nctNumber": "NCT00000102",
    "title": "Trial title",
    "condition": "Primary condition"
  },
  "prePopulatedData": {
    "medicalRecord": "Patient medical record text",
    "trialCriteria": {
      "inclusionCriteria": ["criterion 1"],
      "exclusionCriteria": ["criterion 1"]
    },
    "mode": "nct-lookup"
  },
  "metadata": {
    "createdAt": "2025-06-09T02:28:06.509Z",
    "expiresAt": "2025-06-10T02:28:06.509Z",
    "sessionDuration": "24 hours"
  }
}
```

#### 10. Lightweight Populate Endpoint
**POST /populate**

Lightweight endpoint that accepts only a medical record and returns a complete HTML interface.

**Request Body:**
```json
{
  "medicalRecord": "Patient medical record text"
}
```

**Response:** Complete HTML interface (Content-Type: text/html)
- Medical record data embedded in hidden `<div id="medicalRecordData">` element
- Session ID provided in `X-Session-ID` header
- Interface identical to main clinical trial matcher but with hidden medical record section

#### 11. Retrieve Session Data
**GET /session/:sessionId**

Retrieve stored session data for interface pre-population.

**Example:** `GET /session/session-1749436083592-k7d844een`

**Response:**
```json
{
  "medicalRecord": "Patient medical record text",
  "nctNumber": "NCT00000102",
  "trialCriteria": {
    "inclusionCriteria": ["criterion 1"],
    "exclusionCriteria": ["criterion 1"]
  },
  "trialInfo": {
    "nctNumber": "NCT00000102",
    "title": "Trial title"
  },
  "returnUrl": "https://emr.example.com/patient/123",
  "metadata": {
    "sessionId": "session-1749436083592-k7d844een",
    "createdAt": "2025-06-09T02:28:06.509Z",
    "expiresAt": "2025-06-10T02:28:06.509Z",
    "timeRemaining": 86340000
  }
}
```

#### 12. Delete Session
**DELETE /session/:sessionId**

Delete a session for cleanup.

**Response:**
```json
{
  "message": "Session deleted successfully",
  "sessionId": "session-1749436083592-k7d844een"
}
```

#### 13. Generate Deep Links
**GET /generate-link**

Generate deep links for direct access without session storage.

**Query Parameters:**
- `nct` (optional): NCT trial number
- `medicalRecord` (optional): Medical record text (truncated to 500 chars)
- `returnUrl` (optional): URL to return to after evaluation

**Example:** `GET /generate-link?nct=NCT00000102&medicalRecord=Patient%20data`

**Response:**
```json
{
  "deepLinkUrl": "http://localhost:5002/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html?nct=NCT00000102&medicalRecord=Patient+data",
  "sessionEndpoint": "http://localhost:5002/charm/apps/clinical-trial-matcher/pre-populate",
  "usage": {
    "deepLink": "Direct URL access - limited to ~500 chars of medical record",
    "session": "POST to /pre-populate for unlimited data with 24-hour session"
  },
  "metadata": {
    "urlLength": 194,
    "maxRecommendedLength": 2000,
    "medicalRecordTruncated": false
  }
}
```

#### 14. API Information
**GET /info**

Returns comprehensive information about the Clinical Trial Matcher API.

**Response:**
```json
{
  "app": "Clinical Trial Matcher",
  "version": "1.0.0",
  "description": "AI-powered clinical trial eligibility assessment",
  "features": ["NCT lookup", "AI matching", "Session management"],
  "models": {
    "default": "hipaa:o3-high",
    "available": ["hipaa:o3-high", "hipaa:gpt-4o", "hipaa:o1-high"]
  },
  "endpoints": [
    {
      "method": "POST",
      "path": "/comprehensive-match",
      "description": "Advanced eligibility evaluation with comprehensive AI reasoning"
    }
  ]
}
```

## Error Responses

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid input data |
| `404` | Not Found - Session or NCT not found |
| `410` | Gone - Session expired |
| `500` | Internal Server Error |

### Error Response Format

```json
{
  "error": "Error description message"
}
```

### Common Errors

**Invalid NCT Format:**
```json
{
  "error": "Invalid NCT number format. Expected format: NCT00000000"
}
```

**NCT Not Found:**
```json
{
  "error": "Trial NCT06038474 not found or could not be parsed: Clinical trial NCT06038474 not found in local database"
}
```

**Session Expired:**
```json
{
  "error": "Session has expired"
}
```

**Missing Required Data:**
```json
{
  "error": "Either \"nctNumber\" or \"trialCriteria\" must be provided."
}
```

## Web Interface Access

### Main Interface
```
http://localhost:5002/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html
```

Features:
- Apple-style design with mobile PWA support
- NCT lookup with auto-population
- Manual criteria entry
- Comprehensive results display
- Session loading and query parameter support

### Simple Entry Page
```
http://localhost:5002/charm/apps/clinical-trial-matcher/simple-populate.html
```

Features:
- Clean medical record entry interface
- Example templates with copy functionality
- Form validation and character counting
- Integration with `/populate` endpoint
- Mobile-optimized design

### Query Parameters

The web interface supports automatic pre-population via URL query parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `session` | Load from stored session | `?session=session-123` |
| `nct` | Pre-populate with NCT trial | `?nct=NCT06038474` |
| `medicalRecord` | Pre-populate medical record | `?medicalRecord=Patient%20data` |
| `returnUrl` | Show return button | `?returnUrl=https://emr.example.com` |

## Authentication and Security

- **Current Implementation**: No authentication required
- **Production Recommendations**:
  - Implement API key authentication for enterprise deployments
  - Use HTTPS for all medical data transmission
  - Consider session data encryption
  - Add request logging and audit trails
  - Implement rate limiting (suggested: 100 requests/hour per IP)

## Performance Characteristics

- **NCT Parsing**: <2 seconds per trial
- **Basic Matching**: 5-15 seconds per evaluation
- **Comprehensive AI Analysis**: 15-30 seconds per evaluation
- **Database**: 540,505+ trials across 701 directories
- **Concurrency**: Supports multiple simultaneous evaluations
- **Session Management**: 24-hour expiration with automatic cleanup

## Integration Examples

### JavaScript/Node.js
```javascript
// Create comprehensive evaluation
const response = await fetch('/charm/apps/clinical-trial-matcher/comprehensive-match-nct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    medicalRecord: 'Patient is a 28-year-old female...',
    nctNumber: 'NCT06038474'
  })
});

const evaluation = await response.json();
console.log('Eligibility:', evaluation.overallAssessment.eligibility);
```

### Python
```python
import requests

# Create pre-populated session
response = requests.post(
  'http://localhost:5002/charm/apps/clinical-trial-matcher/pre-populate',
  json={
    'medicalRecord': 'Patient is a 28-year-old female...',
    'nctNumber': 'NCT06038474',
    'returnUrl': 'https://emr.example.com/patient/123'
  }
)

session_data = response.json()
print(f"Interface URL: {session_data['interfaceUrl']}")
```

### cURL
```bash
# Get trial eligibility criteria
curl "http://localhost:5002/charm/apps/clinical-trial-matcher/nct/NCT06038474/eligibility"

# Create lightweight populated interface
curl -X POST "http://localhost:5002/charm/apps/clinical-trial-matcher/populate" \
  -H "Content-Type: application/json" \
  -d '{"medicalRecord":"Patient is a 28-year-old female with lupus..."}'
```

## Rate Limiting and Monitoring

### Suggested Production Limits
- **Session Creation**: 100 sessions per hour per IP
- **Evaluations**: 50 evaluations per hour per session
- **NCT Lookups**: 1000 requests per hour per IP
- **Search Operations**: 500 requests per hour per IP

### Monitoring Recommendations
- Track API response times and error rates
- Monitor session creation and expiration patterns
- Log evaluation results for quality assurance
- Track NCT lookup success rates
- Monitor AI model performance and confidence scores

## Development and Testing

### Local Development
```bash
# Start the server
cd charmonator
npm install
node server.mjs

# Verify installation
curl http://localhost:5002/charm/apps/clinical-trial-matcher/database-stats
```

### Testing Endpoints
```bash
# Test basic NCT lookup
curl "http://localhost:5002/charm/apps/clinical-trial-matcher/nct/NCT06038474"

# Test comprehensive matching
curl -X POST "http://localhost:5002/charm/apps/clinical-trial-matcher/comprehensive-match-nct" \
  -H "Content-Type: application/json" \
  -d '{
    "medicalRecord": "Patient is a 28-year-old female with systemic lupus erythematosus...",
    "nctNumber": "NCT06038474"
  }'
```

This comprehensive API provides all necessary functionality for clinical trial matching workflows, from simple NCT lookups to complex AI-powered eligibility assessments with full integration capabilities.