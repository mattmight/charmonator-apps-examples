# Pre-population API - Technical Documentation

## Overview

The pre-population system enables external systems (EMRs, clinical research platforms, etc.) to integrate with the Clinical Trial Matcher by pre-filling the interface with patient data and trial information. The system supports both session-based workflows for complex data and direct URL-based access for simpler integrations.

## Architecture

### Components

1. **Pre-population API Endpoints** - REST endpoints for creating and managing pre-populated sessions
2. **Session Management System** - In-memory storage with 24-hour expiration and automatic cleanup
3. **Query Parameter Handler** - Client-side JavaScript for loading data from URLs
4. **Deep Linking System** - Direct URL access with embedded data

### Data Flow

```
External System → API Endpoint → Session Storage → Interface URL → User Interface
                                     ↓
                              Automatic Cleanup (24h)
```

## API Endpoints

### POST /pre-populate

Creates a pre-populated session with medical record and trial data.

**Request Body:**
```json
{
  "medicalRecord": "string (required) - Patient medical record text",
  "nctNumber": "string (optional) - NCT number (e.g., 'NCT00000102')",
  "trialCriteria": {
    "inclusionCriteria": ["array of strings (optional)"],
    "exclusionCriteria": ["array of strings (optional)"]
  },
  "sessionId": "string (optional) - Custom session identifier",
  "returnUrl": "string (optional) - URL to return to after evaluation"
}
```

**Validation Rules:**
- `medicalRecord` must be a non-empty string
- Either `nctNumber` OR `trialCriteria` must be provided
- `nctNumber` must match format `NCT\d{8}` if provided
- `sessionId` is generated automatically if not provided

**Response:**
```json
{
  "sessionId": "session-1234567890-abcdef123",
  "interfaceUrl": "http://host/clinical-trial-matcher.html?session=...",
  "deepLinkUrl": "http://host/clinical-trial-matcher.html?nct=...&medicalRecord=...",
  "trialInfo": {
    "nctNumber": "NCT00000102",
    "title": "Trial Title",
    "condition": "Medical Condition",
    "phase": "Phase 2",
    "status": "Recruiting",
    "ageRange": "18 Years to 65 Years",
    "gender": "All"
  },
  "prePopulatedData": {
    "medicalRecord": "Patient data...",
    "trialCriteria": {
      "inclusionCriteria": ["..."],
      "exclusionCriteria": ["..."]
    },
    "mode": "nct-lookup|manual-entry"
  },
  "metadata": {
    "createdAt": "2025-06-09T02:28:06.509Z",
    "expiresAt": "2025-06-10T02:28:06.509Z",
    "sessionDuration": "24 hours"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `404 Not Found` - NCT number not found in database
- `500 Internal Server Error` - Server processing error

### GET /session/:sessionId

Retrieves stored session data for interface pre-population.

**Path Parameters:**
- `sessionId` - The session identifier returned by `/pre-populate`

**Response:**
```json
{
  "medicalRecord": "Patient medical record text",
  "nctNumber": "NCT00000102",
  "trialCriteria": {
    "inclusionCriteria": ["..."],
    "exclusionCriteria": ["..."]
  },
  "trialInfo": {
    "nctNumber": "NCT00000102",
    "title": "Trial Title",
    "...
  },
  "returnUrl": "https://emr.example.com/patient/123",
  "metadata": {
    "sessionId": "session-1234567890-abcdef123",
    "createdAt": "2025-06-09T02:28:06.509Z",
    "expiresAt": "2025-06-10T02:28:06.509Z",
    "timeRemaining": 86340000
  }
}
```

**Error Responses:**
- `404 Not Found` - Session not found
- `410 Gone` - Session has expired
- `500 Internal Server Error` - Server processing error

### DELETE /session/:sessionId

Manually deletes a session (cleanup).

**Path Parameters:**
- `sessionId` - The session identifier to delete

**Response:**
```json
{
  "message": "Session deleted successfully",
  "sessionId": "session-1234567890-abcdef123"
}
```

**Error Responses:**
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Server processing error

### GET /generate-link

Generates deep links for direct access without session storage.

**Query Parameters:**
- `nct` - NCT number (optional)
- `medicalRecord` - Medical record text (optional, truncated to 500 chars)
- `returnUrl` - Return URL (optional)

**Response:**
```json
{
  "deepLinkUrl": "http://host/clinical-trial-matcher.html?nct=NCT00000102&medicalRecord=...",
  "sessionEndpoint": "http://host/clinical-trial-matcher/pre-populate",
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

## Query Parameter Support

The web interface supports automatic pre-population via URL query parameters:

### Supported Parameters

- `session` - Load data from stored session
- `nct` - Pre-populate with NCT trial data
- `medicalRecord` - Pre-populate medical record (URL-encoded)
- `returnUrl` - Show return button to external system

### Parameter Processing

1. **Session Loading**: `?session=session-id`
   - Fetches data from `/session/:sessionId` endpoint
   - Pre-populates all interface fields
   - Shows session metadata and expiration

2. **Direct Loading**: `?nct=NCT00000102&medicalRecord=...`
   - Immediately populates interface fields
   - Auto-loads trial data if NCT provided
   - Clears URL parameters after loading

3. **Return URL**: `?returnUrl=https://emr.example.com`
   - Shows "Return to Source System" button
   - Stored in sessionStorage for persistence

## Session Management

### Storage System

**Implementation:** In-memory Map (production should use Redis/database)
```javascript
global.clinicalTrialSessions = new Map();
```

**Session Data Structure:**
```javascript
{
  sessionId: "session-1234567890-abcdef123",
  medicalRecord: "Patient data...",
  nctNumber: "NCT00000102",
  trialCriteria: { inclusionCriteria: [...], exclusionCriteria: [...] },
  trialInfo: { nctNumber: "...", title: "...", ... },
  returnUrl: "https://emr.example.com/patient/123",
  createdAt: "2025-06-09T02:28:06.509Z",
  expiresAt: "2025-06-10T02:28:06.509Z"
}
```

### Lifecycle Management

1. **Creation**
   - Sessions created via `/pre-populate` endpoint
   - 24-hour expiration set automatically
   - Unique session ID generated

2. **Access**
   - Data retrieved via `/session/:sessionId`
   - Expiration checked on each access
   - Time remaining calculated

3. **Cleanup**
   - Automatic cleanup on each new session creation
   - Manual cleanup via DELETE endpoint
   - Expired sessions removed from memory

### Security Considerations

- Session IDs are cryptographically random
- No sensitive authentication data stored
- Sessions auto-expire after 24 hours
- Medical data should be transmitted over HTTPS in production

## Frontend Integration

### Query Parameter Handler

Located in `clinical-trial-matcher.html`, the `loadFromQueryParameters()` function handles automatic pre-population:

```javascript
async function loadFromQueryParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Session-based loading
  if (urlParams.has('session')) {
    await loadFromSession(urlParams.get('session'));
    return;
  }
  
  // Direct parameter loading
  // ... handles nct, medicalRecord, returnUrl parameters
}
```

### Session Loading

The `loadFromSession()` function fetches and applies session data:

```javascript
async function loadFromSession(sessionId) {
  const response = await fetch(`/session/${sessionId}`);
  const sessionData = await response.json();
  
  // Pre-populate interface fields
  // Display trial information
  // Show session metadata
  // Handle return URL
}
```

### User Experience Enhancements

1. **Session Status Display**
   - Blue banner showing "Pre-populated Session Active"
   - Session expiration time and remaining duration
   - Clear visual indication of pre-populated state

2. **Return Integration**
   - "Return to Source System" button when returnUrl provided
   - Seamless workflow integration

3. **Error Handling**
   - Expired session warnings
   - Loading error messages
   - Graceful fallback to manual entry

## Integration Examples

### EMR Integration

**Step 1: Generate Session**
```javascript
const sessionResponse = await fetch('/pre-populate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    medicalRecord: patientRecord,
    nctNumber: selectedTrial,
    returnUrl: `${emrBaseUrl}/patient/${patientId}`
  })
});

const { interfaceUrl } = await sessionResponse.json();
```

**Step 2: Redirect User**
```javascript
window.open(interfaceUrl, '_blank');
// or window.location.href = interfaceUrl;
```

### Clinical Research Platform Integration

**Option 1: Session-Based (Recommended for complex data)**
```bash
curl -X POST /pre-populate \
  -H "Content-Type: application/json" \
  -d '{
    "medicalRecord": "Complex patient history...",
    "nctNumber": "NCT06038474",
    "returnUrl": "https://research-platform.example.com/screening/123"
  }'
```

**Option 2: Deep Link (For simple data)**
```bash
curl "/generate-link?nct=NCT06038474&medicalRecord=Simple%20patient%20data"
```

### Mobile App Integration

**QR Code Generation** (Future Enhancement)
```javascript
// Generate session for mobile access
const session = await createSession(patientData, trialId);
const qrData = session.interfaceUrl;

// Generate QR code for mobile scanning
const qrCode = generateQRCode(qrData);
```

## Error Handling

### Common Error Scenarios

1. **Invalid NCT Number**
   ```json
   {
     "error": "Invalid NCT number format. Expected format: NCT00000000"
   }
   ```

2. **NCT Not Found**
   ```json
   {
     "error": "Trial NCT06038474 not found or could not be parsed: Clinical trial NCT06038474 not found in local database"
   }
   ```

3. **Session Expired**
   ```json
   {
     "error": "Session has expired"
   }
   ```

4. **Missing Required Data**
   ```json
   {
     "error": "Either \"nctNumber\" or \"trialCriteria\" must be provided."
   }
   ```

### Error Recovery

- Frontend gracefully handles expired sessions
- Fallback to manual entry on loading errors
- Clear error messages with actionable guidance
- Automatic retry mechanisms where appropriate

## Performance Considerations

### Memory Management

- Sessions limited to 24-hour lifespan
- Automatic cleanup prevents memory leaks
- Production should implement external storage (Redis)

### Scalability

- Current implementation: Single-server memory storage
- Production recommendations:
  - Redis for session storage
  - Database for persistent data
  - Load balancer session affinity
  - Session cleanup background jobs

### URL Length Limitations

- Deep links limited to ~500 characters of medical record
- Browser URL limits typically 2000-8000 characters
- Session-based approach recommended for longer data

## Testing

### Unit Tests

Test session lifecycle, data validation, and error handling:

```javascript
// Example test cases
describe('Pre-population API', () => {
  test('creates session with NCT number', async () => {
    const response = await request(app)
      .post('/pre-populate')
      .send({
        medicalRecord: 'Test patient data',
        nctNumber: 'NCT06038474'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.sessionId).toBeDefined();
    expect(response.body.trialInfo.nctNumber).toBe('NCT06038474');
  });
});
```

### Integration Tests

Test complete workflow from session creation to interface loading:

```bash
# Create session
SESSION_RESPONSE=$(curl -s -X POST /pre-populate -d '{"medicalRecord":"Test","nctNumber":"NCT06038474"}')
SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.sessionId')

# Verify session retrieval
curl -s "/session/$SESSION_ID" | jq '.medicalRecord'

# Test interface URL
curl -s "$(echo $SESSION_RESPONSE | jq -r '.interfaceUrl')"
```

## Production Deployment

### Configuration

```javascript
// Production session storage
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Session storage implementation
async function storeSession(sessionId, data) {
  await client.setex(sessionId, 86400, JSON.stringify(data)); // 24 hours
}
```

### Security

- HTTPS required for medical data transmission
- Consider session encryption for sensitive data
- Implement rate limiting on session creation
- Add authentication for enterprise deployments

### Monitoring

- Track session creation/access patterns
- Monitor session expiration and cleanup
- Alert on unusual usage patterns
- Performance metrics for session operations

## Future Enhancements

1. **QR Code Generation** - For mobile device access
2. **Session Extension** - Allow extending expiration time
3. **Bulk Operations** - Multiple patient/trial combinations
4. **Webhook Integration** - Notify external systems of evaluation results
5. **Advanced Analytics** - Usage patterns and integration metrics
6. **SSO Integration** - Enterprise authentication support