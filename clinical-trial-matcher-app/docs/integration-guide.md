# Clinical Trial Matcher - Integration Guide

## Quick Start

This guide helps developers integrate the Clinical Trial Matcher into their systems using the pre-population and deep linking APIs.

## Integration Scenarios

### 1. EMR Integration (Electronic Medical Records)

**Use Case:** Launch trial matcher from patient record with pre-filled data.

**Implementation:**
```javascript
// In your EMR system
async function launchTrialMatcher(patientId, nctNumber) {
  const patientRecord = await getPatientRecord(patientId);
  const emrReturnUrl = `${window.location.origin}/patient/${patientId}/trials`;
  
  try {
    const response = await fetch('/api/clinical-trial-matcher/pre-populate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicalRecord: patientRecord.clinicalSummary,
        nctNumber: nctNumber,
        returnUrl: emrReturnUrl
      })
    });
    
    const { interfaceUrl } = await response.json();
    window.open(interfaceUrl, '_blank');
    
  } catch (error) {
    console.error('Failed to launch trial matcher:', error);
    // Fallback to manual URL
    window.open('/clinical-trial-matcher.html', '_blank');
  }
}
```

### 2. Clinical Research Platform Integration

**Use Case:** Streamlined screening workflow for research coordinators.

**Implementation:**
```python
import requests

class TrialMatcherIntegration:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def screen_patient(self, patient_data, trial_id, coordinator_id):
        """Screen patient for specific trial with pre-populated interface."""
        
        payload = {
            "medicalRecord": patient_data["clinical_summary"],
            "nctNumber": trial_id,
            "returnUrl": f"https://research-platform.com/screening/{coordinator_id}/results"
        }
        
        response = requests.post(
            f"{self.base_url}/pre-populate",
            json=payload
        )
        response.raise_for_status()
        
        session_data = response.json()
        return {
            "screening_url": session_data["interfaceUrl"],
            "session_id": session_data["sessionId"],
            "expires_at": session_data["metadata"]["expiresAt"]
        }
    
    def bulk_screen(self, patients, trial_id):
        """Create screening sessions for multiple patients."""
        
        results = []
        for patient in patients:
            try:
                screening = self.screen_patient(patient, trial_id, "bulk-screening")
                results.append({
                    "patient_id": patient["id"],
                    "status": "success",
                    "screening_url": screening["screening_url"]
                })
            except Exception as e:
                results.append({
                    "patient_id": patient["id"],
                    "status": "error",
                    "error": str(e)
                })
        
        return results

# Usage
matcher = TrialMatcherIntegration("http://localhost:5002/charm/apps/clinical-trial-matcher")
screening = matcher.screen_patient(patient_data, "NCT06038474", "coordinator123")
print(f"Screening URL: {screening['screening_url']}")
```

### 3. Mobile App / QR Code Integration

**Use Case:** Quick trial screening via mobile devices.

**Implementation:**
```javascript
// Mobile app or kiosk implementation
class MobileTrialMatcher {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  async generateQRCode(patientSummary, trialId) {
    // For mobile, use deep links for immediate access
    const response = await fetch(
      `${this.baseUrl}/generate-link?nct=${trialId}&medicalRecord=${encodeURIComponent(patientSummary.substring(0, 200))}`
    );
    
    const { deepLinkUrl } = await response.json();
    
    // Generate QR code (using your preferred QR library)
    return this.createQRCode(deepLinkUrl);
  }
  
  async createSessionForMobile(patientSummary, trialId) {
    // For complex data, use session-based approach
    const response = await fetch(`${this.baseUrl}/pre-populate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicalRecord: patientSummary,
        nctNumber: trialId
      })
    });
    
    const session = await response.json();
    return this.createQRCode(session.interfaceUrl);
  }
  
  createQRCode(url) {
    // Implementation depends on your QR code library
    // Example with qrcode.js:
    // return QRCode.toDataURL(url);
    return url; // Simplified for example
  }
}

// Usage
const matcher = new MobileTrialMatcher("http://localhost:5002/charm/apps/clinical-trial-matcher");
const qrCode = await matcher.generateQRCode("Patient summary...", "NCT06038474");
```

### 4. Lightweight Populate Integration

**Use Case:** Simple iframe embedding or popup windows with medical record pre-loaded.

**Implementation:**
```javascript
// Simple popup integration
async function openTrialMatcherPopup(patientRecord) {
  try {
    const response = await fetch('/charm/apps/clinical-trial-matcher/populate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicalRecord: patientRecord
      })
    });
    
    const htmlContent = await response.text();
    const sessionId = response.headers.get('X-Session-ID');
    
    // Open in new window
    const popup = window.open('', '_blank', 'width=1200,height=800');
    popup.document.write(htmlContent);
    popup.document.close();
    
    // Track the session
    console.log('Trial matcher opened with session:', sessionId);
    
  } catch (error) {
    console.error('Failed to open trial matcher:', error);
  }
}

// Iframe integration
async function embedTrialMatcher(containerId, patientRecord) {
  try {
    const response = await fetch('/charm/apps/clinical-trial-matcher/populate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicalRecord: patientRecord
      })
    });
    
    const htmlContent = await response.text();
    
    // Create iframe and inject content
    const container = document.getElementById(containerId);
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    
    container.appendChild(iframe);
    
    // Write content to iframe
    iframe.contentDocument.open();
    iframe.contentDocument.write(htmlContent);
    iframe.contentDocument.close();
    
  } catch (error) {
    console.error('Failed to embed trial matcher:', error);
  }
}

// Usage examples
// Simple popup
openTrialMatcherPopup("Patient is a 35-year-old female with lupus...");

// Embedded iframe
embedTrialMatcher('trial-matcher-container', patientRecord);
```

### 5. Simple Entry Page Integration

**Use Case:** Direct user entry of medical records with clean, simple interface.

**Implementation:**
```javascript
// Launch simple entry page
function launchSimpleTrialMatcher() {
  // Open the simple entry page directly
  const entryPageUrl = '/charm/apps/clinical-trial-matcher/simple-populate.html';
  window.open(entryPageUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
}

// Embed simple entry page in iframe
function embedSimpleEntryPage(containerId) {
  const container = document.getElementById(containerId);
  const iframe = document.createElement('iframe');
  iframe.src = '/charm/apps/clinical-trial-matcher/simple-populate.html';
  iframe.style.width = '100%';
  iframe.style.height = '700px';
  iframe.style.border = '1px solid #e5e5e7';
  iframe.style.borderRadius = '12px';
  
  container.appendChild(iframe);
}

// Custom integration with pre-filled data
function openTrialMatcherWithTemplate(templateType) {
  const templates = {
    lupus: `Patient is a 28-year-old female with systemic lupus erythematosus diagnosed 2 years ago. Current symptoms include joint pain in hands and knees, morning stiffness lasting 2 hours, and fatigue. Recent laboratory results show positive ANA (1:320), positive anti-dsDNA antibodies, and elevated ESR (45 mm/hr). Current medications include hydroxychloroquine 400mg daily and prednisone 10mg daily.`,
    diabetes: `Patient is a 45-year-old male with type 2 diabetes mellitus diagnosed 5 years ago. Current HbA1c is 8.2%. Patient is on metformin 1000mg twice daily and insulin glargine 24 units at bedtime. Recent complications include diabetic retinopathy and early nephropathy with microalbuminuria.`,
    copd: `Patient is a 62-year-old female with chronic obstructive pulmonary disease (COPD) GOLD stage 3. Former smoker with 40 pack-year history, quit 2 years ago. Current medications include tiotropium, albuterol inhaler PRN, and prednisolone 5mg daily. Recent exacerbation requiring hospitalization 3 months ago.`
  };
  
  const template = templates[templateType];
  if (template) {
    // Use the populate endpoint with template data
    openTrialMatcherPopup(template);
  } else {
    // Fall back to simple entry page
    launchSimpleTrialMatcher();
  }
}

// Usage examples
launchSimpleTrialMatcher();
embedSimpleEntryPage('entry-container');
openTrialMatcherWithTemplate('lupus');
```

### 6. Webhook Integration (Future Enhancement)

**Use Case:** Receive evaluation results back in your system.

**Planned Implementation:**
```javascript
// When creating session, include webhook URL
const session = await fetch('/pre-populate', {
  method: 'POST',
  body: JSON.stringify({
    medicalRecord: patientData,
    nctNumber: trialId,
    webhookUrl: "https://your-system.com/api/trial-results", // Future feature
    returnUrl: "https://your-system.com/patient/123"
  })
});

// Your webhook endpoint would receive:
// POST /api/trial-results
// {
//   "sessionId": "session-123",
//   "patientId": "patient-456", 
//   "nctNumber": "NCT06038474",
//   "evaluationResult": {
//     "overallEligibility": "eligible",
//     "confidence": 0.85,
//     "criteriaAnalysis": [...]
//   },
//   "timestamp": "2025-06-09T02:28:06.509Z"
// }
```

## Best Practices

### 1. Error Handling

Always implement proper error handling and fallbacks:

```javascript
async function safelyLaunchTrialMatcher(patientData, trialId) {
  try {
    // Primary approach: Pre-populated session
    const session = await createTrialSession(patientData, trialId);
    window.open(session.interfaceUrl, '_blank');
    
  } catch (sessionError) {
    console.warn('Session creation failed, trying deep link:', sessionError);
    
    try {
      // Fallback: Deep link with truncated data
      const deepLink = await generateDeepLink(patientData.substring(0, 400), trialId);
      window.open(deepLink.deepLinkUrl, '_blank');
      
    } catch (deepLinkError) {
      console.error('Both session and deep link failed:', deepLinkError);
      
      // Final fallback: Manual interface
      const manualUrl = `/clinical-trial-matcher.html?nct=${trialId}`;
      window.open(manualUrl, '_blank');
    }
  }
}
```

### 2. Data Validation

Validate data before sending to the API:

```javascript
function validateTrialMatcherData(patientRecord, nctNumber) {
  const errors = [];
  
  // Validate medical record
  if (!patientRecord || typeof patientRecord !== 'string') {
    errors.push('Medical record is required and must be a string');
  }
  
  if (patientRecord.length < 10) {
    errors.push('Medical record must be at least 10 characters');
  }
  
  // Validate NCT number
  if (nctNumber && !nctNumber.match(/^NCT\d{8}$/)) {
    errors.push('NCT number must be in format NCT00000000');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}
```

### 3. Session Management

Monitor and clean up sessions appropriately:

```javascript
class SessionManager {
  constructor() {
    this.activeSessions = new Map();
  }
  
  async createSession(patientData, trialId, userId) {
    const response = await fetch('/pre-populate', {
      method: 'POST',
      body: JSON.stringify({
        medicalRecord: patientData,
        nctNumber: trialId,
        sessionId: `${userId}-${Date.now()}` // Custom session ID
      })
    });
    
    const session = await response.json();
    
    // Track session locally
    this.activeSessions.set(session.sessionId, {
      userId: userId,
      createdAt: new Date(),
      expiresAt: new Date(session.metadata.expiresAt)
    });
    
    return session;
  }
  
  async cleanupExpiredSessions() {
    const now = new Date();
    
    for (const [sessionId, sessionInfo] of this.activeSessions.entries()) {
      if (now > sessionInfo.expiresAt) {
        try {
          await fetch(`/session/${sessionId}`, { method: 'DELETE' });
          this.activeSessions.delete(sessionId);
        } catch (error) {
          console.warn(`Failed to cleanup session ${sessionId}:`, error);
        }
      }
    }
  }
  
  getUserSessions(userId) {
    return Array.from(this.activeSessions.entries())
      .filter(([_, info]) => info.userId === userId)
      .map(([sessionId, info]) => ({ sessionId, ...info }));
  }
}
```

### 4. Monitoring and Analytics

Track usage for optimization:

```javascript
class TrialMatcherAnalytics {
  constructor(analyticsEndpoint) {
    this.endpoint = analyticsEndpoint;
  }
  
  trackSessionCreation(sessionData, source) {
    this.send('session_created', {
      sessionId: sessionData.sessionId,
      source: source, // 'emr', 'mobile', 'research_platform'
      nctNumber: sessionData.trialInfo?.nctNumber,
      timestamp: new Date().toISOString()
    });
  }
  
  trackSessionAccess(sessionId, source) {
    this.send('session_accessed', {
      sessionId: sessionId,
      source: source,
      timestamp: new Date().toISOString()
    });
  }
  
  trackEvaluationComplete(sessionId, result) {
    this.send('evaluation_completed', {
      sessionId: sessionId,
      eligibility: result.overallEligibility,
      confidence: result.overallAssessment.confidence,
      timestamp: new Date().toISOString()
    });
  }
  
  async send(event, data) {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data })
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }
}
```

## Security Considerations

### 1. Data Protection

- Always use HTTPS in production
- Consider encrypting medical data in sessions
- Implement proper authentication for enterprise deployments
- Log access patterns for audit trails

### 2. Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
// Example rate limiting middleware
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(clientId) {
    const now = Date.now();
    const clientRequests = this.requests.get(clientId) || [];
    
    // Remove old requests outside the window
    const validRequests = clientRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(clientId, validRequests);
    
    return true;
  }
}
```

### 3. Input Sanitization

Always sanitize and validate inputs:

```javascript
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/[<>]/g, '') // Remove HTML brackets
    .substring(0, 10000); // Limit length
}
```

## Testing

### Unit Tests

```javascript
describe('Trial Matcher Integration', () => {
  test('creates session with valid data', async () => {
    const session = await createTrialSession(
      'Patient is a 28-year-old female with SLE',
      'NCT06038474'
    );
    
    expect(session.sessionId).toBeDefined();
    expect(session.interfaceUrl).toContain('session=');
    expect(session.trialInfo.nctNumber).toBe('NCT06038474');
  });
  
  test('handles invalid NCT number', async () => {
    await expect(createTrialSession('Patient data', 'INVALID'))
      .rejects.toThrow('Invalid NCT number format');
  });
});
```

### Integration Tests

```bash
#!/bin/bash
# Test complete workflow

echo "Testing trial matcher integration..."

# Create session
SESSION_DATA=$(curl -s -X POST http://localhost:5002/charm/apps/clinical-trial-matcher/pre-populate \
  -H "Content-Type: application/json" \
  -d '{
    "medicalRecord": "Test patient with lupus",
    "nctNumber": "NCT06038474"
  }')

SESSION_ID=$(echo $SESSION_DATA | jq -r '.sessionId')
INTERFACE_URL=$(echo $SESSION_DATA | jq -r '.interfaceUrl')

echo "Created session: $SESSION_ID"

# Verify session retrieval
SESSION_RETRIEVED=$(curl -s "http://localhost:5002/charm/apps/clinical-trial-matcher/session/$SESSION_ID")
MEDICAL_RECORD=$(echo $SESSION_RETRIEVED | jq -r '.medicalRecord')

if [ "$MEDICAL_RECORD" = "Test patient with lupus" ]; then
  echo "✅ Session retrieval successful"
else
  echo "❌ Session retrieval failed"
  exit 1
fi

# Test interface URL accessibility
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$INTERFACE_URL")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Interface URL accessible"
else
  echo "❌ Interface URL not accessible (HTTP $HTTP_STATUS)"
  exit 1
fi

echo "✅ All integration tests passed"
```

## Common Issues and Solutions

### Issue: Session Not Found
**Cause:** Session expired or invalid session ID
**Solution:** Implement session validation and fallback to manual entry

### Issue: URL Too Long
**Cause:** Medical record data exceeds URL length limits
**Solution:** Use session-based approach instead of deep links

### Issue: NCT Number Not Found
**Cause:** Trial not in local database or invalid format
**Solution:** Validate NCT format and provide manual criteria entry fallback

### Issue: CORS Errors
**Cause:** Cross-origin requests blocked
**Solution:** Configure CORS headers in production deployment

## Support and Documentation

- **Complete API Documentation:** `/docs/clinical-trial-matcher-api.md`
- **Technical Documentation:** `/docs/goal-4-pre-population-api.md`
- **API Reference:** `/docs/api-reference-pre-population.md`
- **Integration Guide:** `/docs/integration-guide.md` (this document)
- **Live API Info:** `GET /info` endpoint
- **Sample Code:** Available in project repository

## Quick Start Summary

The Clinical Trial Matcher provides multiple integration approaches:

1. **Session-Based Integration** (`/pre-populate`) - For complex workflows with unlimited data
2. **Lightweight Integration** (`/populate`) - For simple medical record entry with hidden interface
3. **Simple Entry Page** (`simple-populate.html`) - For direct user input with templates
4. **Deep Link Integration** (`/generate-link`) - For quick access with URL parameters
5. **Direct API Integration** - For programmatic access to all matching and NCT lookup capabilities

All approaches support:
- ✅ **HIPAA-compliant processing** with advanced AI reasoning
- ✅ **Complete NCT database** (540,505+ clinical trials)
- ✅ **Mobile-responsive design** with Apple-style interface
- ✅ **Session management** with 24-hour expiration
- ✅ **Comprehensive evaluation results** with clinical recommendations

For additional support, check the project documentation or create an issue in the repository.