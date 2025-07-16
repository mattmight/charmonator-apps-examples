# Outlive Longevity Checklist App

An AI-powered health assessment app based on Dr. Peter Attia's "Outlive" book checklist, designed to evaluate longevity risk factors and provide personalized health recommendations.

## Overview

This Charmonator app analyzes patient medical records against the comprehensive health checklist outlined in Dr. Peter Attia's "Outlive" book, focusing on the key areas that impact longevity and healthspan.

## Features

- **Comprehensive Health Analysis**: Evaluates medical records against Outlive checklist criteria
- **Longevity Risk Assessment**: Identifies risk factors for major causes of death
- **Missing Test Identification**: Highlights important tests or screenings not in records
- **Personalized Recommendations**: Provides tailored health optimization suggestions
- **HIPAA-Compliant Processing**: Uses secure medical AI models
- **Session-Based Security**: 24-hour session expiration with automatic cleanup

## Directory Structure

```
outlive-checklist-app/
├── app-config.json          # App configuration
├── README.md               # This file
├── public/                 # Static assets served at /apps/outlive-checklist/
│   └── outlive-checklist.html
└── routes/                 # Express route handlers
    └── outlive-checklist.mjs
```

## Health Categories Evaluated

The app assesses five key areas from the Outlive framework:

1. **Metabolic Health**
   - Blood glucose control and insulin sensitivity
   - Lipid profile and cardiovascular risk markers
   - Body composition and metabolic efficiency

2. **Cardiovascular Health**
   - Blood pressure management
   - Heart rate variability
   - Vascular health markers

3. **Cancer Risk (Early Detection)**
   - Age-appropriate cancer screening compliance
   - Risk factor identification
   - Preventive care assessment

4. **Neurodegenerative Disease Risk**
   - Cognitive function indicators
   - Neurological health markers
   - Brain health optimization factors

5. **Physical Fitness and Function**
   - Strength, endurance, and mobility assessments
   - Exercise capacity evaluation
   - Functional movement patterns

## API Endpoints

### POST /apps/outlive-checklist/pre-populate

Creates a session with medical records for Outlive checklist analysis.

**Request Body:**
```json
{
  "medicalRecord": "Complete patient medical record text...",
  "sessionId": "optional-custom-session-id",
  "analysisOptions": {
    "includeRecommendations": true,
    "prioritizeRisks": true,
    "includeLabTrends": true
  }
}
```

**Response:**
```json
{
  "sessionId": "outlive-session-1234567890-abcdef",
  "reportUrl": "http://host/charm/apps/outlive-checklist/outlive-checklist.html?session=...",
  "prePopulatedData": {
    "medicalRecord": "Patient data...",
    "systemPrompt": "Outlive-specific analysis prompt...",
    "analysisOptions": { ... }
  },
  "metadata": {
    "createdAt": "2025-01-01T12:00:00.000Z",
    "expiresAt": "2025-01-02T12:00:00.000Z",
    "sessionDuration": "24 hours"
  }
}
```

### GET /apps/outlive-checklist/session/:sessionId

Retrieves session data for report interface initialization.

### POST /apps/outlive-checklist/analyze

Performs Outlive checklist analysis on medical records.

**Request Body:**
```json
{
  "sessionId": "outlive-session-123",
  "analysisType": "full|quick|category-specific",
  "focusCategory": "Metabolic Health",
  "model": "hipaa:o3-high"
}
```

**Response:**
```json
{
  "sessionId": "outlive-session-123",
  "analysisResults": {
    "overallScore": 7.2,
    "riskLevel": "moderate",
    "categories": [
      {
        "name": "Metabolic Health",
        "score": 8.1,
        "status": "good",
        "findings": [
          "HbA1c within optimal range (5.2%)",
          "Fasting glucose normal (88 mg/dL)",
          "Insulin sensitivity appears good based on HOMA-IR"
        ],
        "recommendations": [
          "Continue current glucose management approach",
          "Consider continuous glucose monitoring for optimization"
        ],
        "missingTests": [
          "Oral glucose tolerance test",
          "Advanced lipid panel with particle size"
        ]
      }
    ]
  },
  "priorityActions": [
    "Schedule cardiovascular calcium scoring",
    "Implement strength training program",
    "Consider comprehensive metabolic testing"
  ],
  "model": "hipaa:o3-high",
  "timestamp": "2025-01-01T12:30:00.000Z"
}
```

### GET /apps/outlive-checklist/report/:sessionId

Generates comprehensive longevity assessment report.

## Configuration

The `app-config.json` file defines:

- **Models**: HIPAA-compliant AI models for health analysis
- **Session Settings**: 24-hour expiration, record size limits, report history
- **Security Options**: HIPAA requirements, session cleanup, no logging
- **Checklist Categories**: The five main Outlive assessment areas

## System Prompt Template

The app uses a specialized system prompt that includes:

```
You are an expert longevity medicine AI assistant analyzing medical records according to Dr. Peter Attia's "Outlive" framework.

PATIENT MEDICAL RECORDS:
[Injected medical record data]

ANALYSIS FRAMEWORK:
Evaluate the patient's health across these five key areas:
1. Metabolic Health (diabetes, obesity, metabolic syndrome)
2. Cardiovascular Health (heart disease, stroke prevention)
3. Cancer Risk (early detection, prevention strategies)
4. Neurodegenerative Disease Risk (Alzheimer's, cognitive decline)
5. Physical Fitness and Function (strength, endurance, mobility)

ASSESSMENT CRITERIA:
- Identify current health status in each category
- Highlight risk factors and protective factors
- Note missing tests or screenings recommended by Outlive
- Provide evidence-based recommendations for optimization
- Prioritize interventions based on risk and impact

MEDICAL DISCLAIMERS:
- This is educational analysis, not medical advice
- Always recommend consulting healthcare providers
- Cite specific evidence from medical records
- Clearly state when information is insufficient
```

## Web Interface Features

The Outlive checklist interface provides:

- **Category-Based Assessment**: Visual breakdown of the five health categories
- **Risk Visualization**: Color-coded risk levels and priority actions
- **Progress Tracking**: Compare assessments over time
- **Recommendation Engine**: Prioritized action items for health optimization
- **Missing Tests Alert**: Highlights important screenings not in records
- **Mobile Optimization**: Responsive design for all devices

## Integration with FHIR-HOSE

Designed to work with the FHIR-HOSE mobile application:

1. **FHIR-HOSE** converts health records to medical text
2. **Creates session** via the pre-populate API
3. **Opens report interface** in WebView with session context
4. **User reviews** comprehensive longevity assessment

## Security & Privacy

- **HIPAA Compliance**: Only uses approved medical AI models
- **Session Isolation**: Each assessment session is isolated and secure
- **Automatic Cleanup**: Sessions expire after 24 hours
- **Local Processing**: All data stays on localhost
- **No Logging**: Medical assessments are not logged by default

## Model Requirements

Supported HIPAA-compliant models:
- `hipaa:o3-high` (recommended for complex analysis)
- `hipaa:o1-high` (high reasoning for detailed assessment)
- `hipaa:gpt-4o` (balanced performance)
- `hipaa:gpt-4o-mini` (faster processing)

Models must be configured in the main Charmonator `config.json` file.

## Usage Examples

### Comprehensive Health Assessment
"Analyze my medical records against the Outlive longevity checklist and provide a comprehensive assessment of my current health status across all five categories."

### Risk Prioritization
"What are the top 3 health risks I should address first based on my medical records and the Outlive framework?"

### Missing Tests Identification
"What important tests or screenings am I missing according to the Outlive checklist for someone my age?"

### Trend Analysis
"How has my metabolic health changed over the past year based on my lab results?"

## Development

To modify this app:

1. Update `app-config.json` for configuration changes
2. Modify `routes/outlive-checklist.mjs` for API logic
3. Edit `public/outlive-checklist.html` for UI changes
4. Restart Charmonator server to reload changes

## Installation

This app is registered in the main Charmonator configuration:

```json
{
  "apps": {
    "outlive-checklist-app": {
      "directory": "../charmonator-apps-examples/outlive-checklist-app",
      "enabled": true,
      "description": "AI-powered health assessment based on Dr. Peter Attia's Outlive book checklist"
    }
  }
}
```

## References

- Dr. Peter Attia's "Outlive: The Science and Art of Longevity"
- Evidence-based longevity medicine principles
- Preventive health screening guidelines
- Metabolic health optimization strategies