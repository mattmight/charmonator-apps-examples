# Clinical Trial Matcher - Pre-population API Reference

## Base URL
```
http://localhost:5002/charm/apps/clinical-trial-matcher
```

## Authentication
No authentication required for current implementation. Production deployments should implement appropriate security measures.

---

## Endpoints

### POST /populate

**NEW: Lightweight endpoint** that accepts only a medical record and returns a complete HTML interface with the medical record hidden but accessible.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `medicalRecord` | string | Yes | Patient medical record text |

**Example Request:**
```json
{
  "medicalRecord": "Patient is a 35-year-old female with systemic lupus erythematosus..."
}
```

**Response:** Complete HTML interface (Content-Type: text/html)
- Medical record data embedded in hidden `<div id="medicalRecordData">` element
- Interface looks identical to the main clinical trial matcher
- Medical record section is not visible to user
- Session ID provided in `X-Session-ID` header
- JavaScript automatically retrieves medical record from hidden element

**Use Cases:**
- Simple integration requiring only medical record input
- Embedded iframe scenarios
- Quick trial evaluation workflows
- Situations where you want interface without visible medical record section

---

### POST /pre-populate

Creates a pre-populated session with medical record and trial data.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `medicalRecord` | string | Yes | Patient medical record text |
| `nctNumber` | string | No* | NCT trial number (e.g., "NCT00000102") |
| `trialCriteria` | object | No* | Manual trial criteria |
| `trialCriteria.inclusionCriteria` | array[string] | No | Inclusion criteria list |
| `trialCriteria.exclusionCriteria` | array[string] | No | Exclusion criteria list |
| `sessionId` | string | No | Custom session identifier |
| `returnUrl` | string | No | URL to return to after evaluation |

*Either `nctNumber` OR `trialCriteria` must be provided.

**Example Request:**
```json
{
  "medicalRecord": "Patient is a 28-year-old female with systemic lupus erythematosus...",
  "nctNumber": "NCT06038474",
  "returnUrl": "https://emr.example.com/patient/123"
}
```

**Example Response:**
```json
{
  "sessionId": "session-1749436083592-k7d844een",
  "interfaceUrl": "http://localhost:5002/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html?session=session-1749436083592-k7d844een&nct=NCT06038474",
  "deepLinkUrl": "http://localhost:5002/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html?nct=NCT06038474&medicalRecord=Patient+is+a+28-year-old...",
  "trialInfo": {
    "nctNumber": "NCT06038474",
    "title": "Descartes-08 for Patients With Systemic Lupus Erythematosus",
    "condition": "Systemic Lupus Erythematosus (SLE)",
    "phase": "Phase 2",
    "status": "Recruiting",
    "ageRange": "18 Years to N/A",
    "gender": "All"
  },
  "prePopulatedData": {
    "medicalRecord": "Patient is a 28-year-old female...",
    "trialCriteria": {
      "inclusionCriteria": ["Patient must be at least 18 years of age.", "..."],
      "exclusionCriteria": ["Active severe lupus nephritis...", "..."]
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

---

### GET /session/:sessionId

Retrieves stored session data for interface pre-population.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | Session identifier from `/pre-populate` |

**Example Request:**
```
GET /session/session-1749436083592-k7d844een
```

**Example Response:**
```json
{
  "medicalRecord": "Patient is a 28-year-old female...",
  "nctNumber": "NCT06038474",
  "trialCriteria": {
    "inclusionCriteria": ["Patient must be at least 18 years of age.", "..."],
    "exclusionCriteria": ["Active severe lupus nephritis...", "..."]
  },
  "trialInfo": {
    "nctNumber": "NCT06038474",
    "title": "Descartes-08 for Patients With Systemic Lupus Erythematosus",
    "condition": "Systemic Lupus Erythematosus (SLE)",
    "phase": "Phase 2",
    "status": "Recruiting",
    "ageRange": "18 Years to N/A",
    "gender": "All"
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

---

### DELETE /session/:sessionId

Manually deletes a session for cleanup.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | Session identifier to delete |

**Example Request:**
```
DELETE /session/session-1749436083592-k7d844een
```

**Example Response:**
```json
{
  "message": "Session deleted successfully",
  "sessionId": "session-1749436083592-k7d844een"
}
```

---

### GET /generate-link

Generates deep links for direct access without session storage.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nct` | string | No* | NCT trial number |
| `medicalRecord` | string | No* | Medical record text (truncated to 500 chars) |
| `returnUrl` | string | No | Return URL for workflow integration |

*At least one of `nct` or `medicalRecord` is required.

**Example Request:**
```
GET /generate-link?nct=NCT06038474&medicalRecord=Patient%20is%20a%2028-year-old%20female&returnUrl=https://emr.example.com
```

**Example Response:**
```json
{
  "deepLinkUrl": "http://localhost:5002/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html?nct=NCT06038474&medicalRecord=Patient+is+a+28-year-old+female&returnUrl=https%3A%2F%2Femr.example.com",
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

---

## Query Parameters for Direct Access

The web interface supports pre-population via URL query parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `session` | Load from stored session | `?session=session-123` |
| `nct` | Pre-populate with NCT trial | `?nct=NCT06038474` |
| `medicalRecord` | Pre-populate medical record | `?medicalRecord=Patient%20data` |
| `returnUrl` | Show return button | `?returnUrl=https://emr.example.com` |

**Example URLs:**

**Session-based:**
```
http://localhost:5002/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html?session=session-123
```

**Direct parameters:**
```
http://localhost:5002/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html?nct=NCT06038474&medicalRecord=Patient%20data
```

---

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

---

## Integration Examples

### curl Examples

**Create Session:**
```bash
curl -X POST "http://localhost:5002/charm/apps/clinical-trial-matcher/pre-populate" \
  -H "Content-Type: application/json" \
  -d '{
    "medicalRecord": "Patient is a 28-year-old female with SLE",
    "nctNumber": "NCT06038474",
    "returnUrl": "https://emr.example.com/patient/123"
  }'
```

**Retrieve Session:**
```bash
curl "http://localhost:5002/charm/apps/clinical-trial-matcher/session/session-123"
```

**Generate Deep Link:**
```bash
curl "http://localhost:5002/charm/apps/clinical-trial-matcher/generate-link?nct=NCT06038474&medicalRecord=Patient%20data"
```

### JavaScript Example

```javascript
// Create pre-populated session
async function createTrialSession(patientRecord, nctNumber, returnUrl) {
  const response = await fetch('/charm/apps/clinical-trial-matcher/pre-populate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      medicalRecord: patientRecord,
      nctNumber: nctNumber,
      returnUrl: returnUrl
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Usage
try {
  const session = await createTrialSession(
    "Patient medical record...",
    "NCT06038474",
    "https://emr.example.com/patient/123"
  );
  
  // Redirect to pre-populated interface
  window.open(session.interfaceUrl, '_blank');
} catch (error) {
  console.error('Failed to create session:', error);
}
```

### Python Example

```python
import requests
import json

def create_trial_session(medical_record, nct_number=None, return_url=None):
    """Create a pre-populated clinical trial matcher session."""
    
    url = "http://localhost:5002/charm/apps/clinical-trial-matcher/pre-populate"
    
    payload = {
        "medicalRecord": medical_record,
    }
    
    if nct_number:
        payload["nctNumber"] = nct_number
        
    if return_url:
        payload["returnUrl"] = return_url
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    return response.json()

# Usage
try:
    session = create_trial_session(
        medical_record="Patient is a 28-year-old female with SLE",
        nct_number="NCT06038474",
        return_url="https://emr.example.com/patient/123"
    )
    
    print(f"Session created: {session['sessionId']}")
    print(f"Interface URL: {session['interfaceUrl']}")
    
except requests.exceptions.RequestException as e:
    print(f"Error creating session: {e}")
```

---

## Rate Limiting

Currently no rate limiting is implemented. Production deployments should consider:

- Rate limiting on session creation (e.g., 100 sessions per hour per IP)
- Session count limits per source system
- Resource usage monitoring

---

## Session Lifecycle

1. **Creation** - Session created via `/pre-populate`
2. **Storage** - Data stored with 24-hour expiration
3. **Access** - Interface loads data via `/session/:sessionId`
4. **Expiration** - Automatic cleanup after 24 hours
5. **Manual Cleanup** - Optional deletion via DELETE endpoint

---

## Production Considerations

### Security
- Use HTTPS for all medical data transmission
- Consider session data encryption
- Implement proper authentication for enterprise use
- Add request logging and audit trails

### Performance
- Implement Redis or database storage for sessions
- Add session cleanup background jobs
- Monitor memory usage and session counts
- Consider CDN for static assets

### Monitoring
- Track session creation and access patterns
- Monitor API response times
- Alert on high error rates
- Usage analytics for optimization