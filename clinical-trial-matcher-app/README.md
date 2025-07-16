# Clinical Trial Matcher App

A modular Charmonator app for AI-powered clinical trial eligibility assessment using HIPAA-compliant models.

## Overview

This app evaluates patient medical records against inclusion and exclusion criteria for clinical trials, providing structured assessments with confidence scores.

## Features

- **HIPAA-Compliant AI**: Uses `hipaa:o3-high` model by default
- **Structured Evaluation**: Returns "matched", "non-matched", or "more-information-needed" for each criterion
- **Mobile-Friendly Interface**: Responsive design with Apple-style aesthetics
- **Full-Screen iPhone Support**: PWA-ready for home screen installation
- **Configurable Models**: Easily switch between different AI models

## Directory Structure

```
clinical-trial-matcher-app/
├── app-config.json          # App configuration
├── README.md                # This file
├── docs/                    # App documentation
│   ├── clinical-trial-matcher-api.md    # Complete API documentation
│   ├── comprehensive-ai-matching.md     # AI matching features
│   ├── pre-population-api.md            # Pre-population endpoints
│   ├── api-reference-pre-population.md  # Pre-population API reference
│   └── integration-guide.md             # Integration examples
├── public/                  # Static assets served at /apps/clinical-trial-matcher/
│   ├── clinical-trial-matcher.html
│   ├── populate-interface.html
│   └── simple-populate.html
└── routes/                  # Express route handlers
    └── clinical-trial-matcher.mjs
```

## Configuration

The `app-config.json` file defines:

- **name**: Display name for the app
- **baseRoute**: API endpoint base path 
- **staticRoute**: Static file serving path
- **models**: AI models configuration
- **features**: App capabilities list

## API Endpoints

### POST /apps/clinical-trial-matcher/clinical-trial-matcher

Evaluates patient eligibility for clinical trials.

**Request Body:**
```json
{
  "medicalRecord": "Patient medical record text...",
  "trialCriteria": {
    "inclusionCriteria": ["Age 18-65 years", "Diagnosis of diabetes"],
    "exclusionCriteria": ["Pregnancy", "Severe kidney disease"]
  }
}
```

**Response:**
```json
{
  "patientId": "pt-1234567890-abc123",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "overallEligibility": "eligible|ineligible|needs-review",
  "results": [
    {
      "criterion": "Age 18-65 years",
      "type": "inclusion",
      "status": "matched",
      "reasoning": "Patient is 45 years old, within range",
      "confidence": 0.9
    }
  ],
  "metadata": {
    "appVersion": "1.0.0",
    "model": "hipaa:o3-high"
  }
}
```

### GET /apps/clinical-trial-matcher/info

Returns app information and configuration.

## Frontend Interface

The web interface at `/apps/clinical-trial-matcher/clinical-trial-matcher.html` provides:

- Dynamic criteria management (add/remove)
- Real-time processing with loading states
- Formatted results with confidence visualization
- Mobile-optimized responsive design
- Full-screen iPhone app support

## Installation as iPhone App

1. Open Safari and navigate to the app URL
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will launch in full-screen mode with no browser UI

## Model Configuration

The app uses the model specified in `app-config.json`:

```json
{
  "models": {
    "default": "hipaa:o3-high",
    "fallback": "hipaa:gpt-4o"
  }
}
```

Models must be configured in the main Charmonator `config.json` file.

## Development

To modify this app:

1. Update `app-config.json` for configuration changes
2. Modify `routes/clinical-trial-matcher.mjs` for API logic
3. Edit `public/clinical-trial-matcher.html` for UI changes
4. Restart the Charmonator server to reload changes

## Integration

This app is registered in the main Charmonator configuration:

```json
{
  "apps": {
    "clinical-trial-matcher-app": {
      "directory": "./examples/clinical-trial-matcher-app",
      "enabled": true
    }
  }
}
```

## Documentation

For detailed technical documentation, see:

- **[Complete API Documentation](docs/clinical-trial-matcher-api.md)** - Full API reference with all endpoints
- **[Comprehensive AI Matching](docs/comprehensive-ai-matching.md)** - Advanced AI reasoning features
- **[Pre-population API](docs/pre-population-api.md)** - External system integration guide
- **[API Reference](docs/api-reference-pre-population.md)** - Pre-population API reference
- **[Integration Guide](docs/integration-guide.md)** - Integration examples and workflows