# Undiagnosed Diseases Network App

An AI-powered application assistance tool for the Undiagnosed Diseases Network (UDN) program, designed to help patients and healthcare providers prepare comprehensive applications for rare disease evaluation.

## Overview

This Charmonator app analyzes complex medical records and diagnostic journeys to assist in preparing applications for the Undiagnosed Diseases Network. It helps identify patterns, organize clinical data, and support the diagnostic process for rare and undiagnosed conditions.

## Features

- **Comprehensive Medical Record Analysis**: Deep analysis of complex diagnostic histories
- **Diagnostic Odyssey Assessment**: Tracks patient journey through multiple specialists
- **UDN Application Preparation**: Structured assistance for program applications
- **Clinical Phenotyping**: Helps identify and organize clinical features
- **Rare Disease Pattern Recognition**: AI-powered pattern matching for rare conditions
- **Multi-omics Data Integration**: Support for genetic, genomic, and other omics data
- **Extended Session Support**: 48-hour sessions for complex cases

## Directory Structure

```
undiagnosed-diseases-app/
├── app-config.json          # App configuration
├── README.md               # This file
├── public/                 # Static assets served at /apps/undiagnosed-diseases/
│   └── undiagnosed-diseases.html
└── routes/                 # Express route handlers
    └── undiagnosed-diseases.mjs
```

## Application Categories

The app organizes UDN applications into five key sections:

1. **Medical History**
   - Comprehensive symptom timeline
   - Previous diagnoses and treatments
   - Response to interventions

2. **Diagnostic Journey**
   - Specialist consultations
   - Diagnostic tests and results
   - Failed diagnostic attempts

3. **Clinical Phenotyping**
   - Detailed clinical features
   - Phenotypic patterns
   - Syndrome recognition

4. **Family History**
   - Genetic family history
   - Inheritance patterns
   - Consanguinity assessment

5. **Previous Testing**
   - Genetic testing results
   - Specialized diagnostic tests
   - Negative results documentation

## API Endpoints

### POST /apps/undiagnosed-diseases/pre-populate

Creates a session with medical records for UDN application preparation.

**Request Body:**
```json
{
  "medicalRecord": "Complete patient medical record text...",
  "sessionId": "optional-custom-session-id",
  "applicationContext": {
    "patientAge": "25 years",
    "symptomsOnset": "childhood",
    "previousApplications": false,
    "urgencyLevel": "high"
  }
}
```

**Response:**
```json
{
  "sessionId": "udn-session-1234567890-abcdef",
  "applicationUrl": "http://host/charm/apps/undiagnosed-diseases/undiagnosed-diseases.html?session=...",
  "prePopulatedData": {
    "medicalRecord": "Patient data...",
    "systemPrompt": "UDN-specific analysis prompt...",
    "applicationContext": { ... }
  },
  "metadata": {
    "createdAt": "2025-01-01T12:00:00.000Z",
    "expiresAt": "2025-01-03T12:00:00.000Z",
    "sessionDuration": "48 hours"
  }
}
```

### GET /apps/undiagnosed-diseases/session/:sessionId

Retrieves session data for application interface initialization.

### POST /apps/undiagnosed-diseases/analyze

Performs comprehensive analysis for UDN application preparation.

**Request Body:**
```json
{
  "sessionId": "udn-session-123",
  "analysisType": "full|phenotyping|timeline|genetic",
  "focusArea": "Clinical Phenotyping",
  "model": "hipaa:o3-high"
}
```

**Response:**
```json
{
  "sessionId": "udn-session-123",
  "analysisResults": {
    "diagnosticSummary": "Complex multi-system disorder with onset in childhood...",
    "clinicalPhenotype": [
      "Progressive muscle weakness",
      "Developmental delay",
      "Cardiac abnormalities",
      "Metabolic dysfunction"
    ],
    "diagnosticJourney": {
      "timelineYears": 15,
      "specialistsSeen": 12,
      "hospitalizations": 8,
      "diagnosticTests": 45
    },
    "rareDiseaseCandidates": [
      {
        "condition": "Mitochondrial myopathy",
        "confidence": 0.7,
        "supportingEvidence": ["Muscle biopsy findings", "Metabolic profile"],
        "additionalTesting": ["Whole exome sequencing", "Mitochondrial DNA analysis"]
      }
    ],
    "applicationStrength": "strong",
    "recommendedSections": [
      "Emphasize multi-system involvement",
      "Detail negative genetic testing",
      "Highlight functional impact"
    ]
  },
  "udnApplicationDraft": {
    "medicalHistory": "Generated comprehensive medical history...",
    "diagnosticJourney": "Structured diagnostic timeline...",
    "clinicalPhenotyping": "Detailed phenotype description...",
    "familyHistory": "Genetic family history analysis...",
    "previousTesting": "Comprehensive testing summary..."
  },
  "model": "hipaa:o3-high",
  "timestamp": "2025-01-01T12:30:00.000Z"
}
```

### POST /apps/undiagnosed-diseases/application-draft

Generates structured UDN application draft.

**Request Body:**
```json
{
  "sessionId": "udn-session-123",
  "sections": ["all"|"medical-history"|"diagnostic-journey"|"phenotyping"|"family-history"|"testing"],
  "format": "structured|narrative|hybrid"
}
```

**Response:**
```json
{
  "sessionId": "udn-session-123",
  "applicationDraft": {
    "patientSummary": "Executive summary of case...",
    "medicalHistorySection": "Comprehensive medical history...",
    "diagnosticJourneySection": "Detailed diagnostic odyssey...",
    "clinicalPhenotypingSection": "Systematic phenotype description...",
    "familyHistorySection": "Genetic and family history...",
    "previousTestingSection": "Testing summary and gaps..."
  },
  "metadata": {
    "wordCount": 5420,
    "sectionsCompleted": 5,
    "strengthScore": 8.5,
    "recommendedRevisions": ["Add more quantitative data", "Include functional impact scores"]
  }
}
```

## Configuration

The `app-config.json` file defines:

- **Models**: HIPAA-compliant AI models for complex medical analysis
- **Session Settings**: 48-hour expiration, large record size limits, draft saving
- **Security Options**: HIPAA requirements, session cleanup, no logging
- **Application Categories**: The five main UDN application sections

## System Prompt Template

The app uses a specialized system prompt for UDN applications:

```
You are an expert rare disease specialist AI assistant helping prepare applications for the Undiagnosed Diseases Network (UDN).

PATIENT MEDICAL RECORDS:
[Injected medical record data]

UDN APPLICATION REQUIREMENTS:
The UDN accepts patients with:
- Undiagnosed conditions after extensive evaluation
- Multi-system involvement suggesting single underlying cause
- Rare or novel phenotypes
- Diagnostic odyssey spanning multiple specialists
- Potential genetic or rare metabolic disorders

ANALYSIS FRAMEWORK:
1. Medical History: Comprehensive symptom timeline and treatments
2. Diagnostic Journey: Map the patient's diagnostic odyssey
3. Clinical Phenotyping: Identify and organize clinical features
4. Family History: Assess genetic patterns and inheritance
5. Previous Testing: Summarize all diagnostic tests and results

ASSESSMENT GOALS:
- Identify patterns suggesting rare/genetic conditions
- Organize complex medical history into coherent narrative
- Highlight features that support UDN acceptance criteria
- Identify testing gaps and recommend next steps
- Prepare structured application sections

RARE DISEASE EXPERTISE:
- Pattern recognition for rare genetic disorders
- Understanding of phenotypic variability
- Knowledge of diagnostic approaches for rare diseases
- Awareness of genetic testing limitations and gaps

MEDICAL DISCLAIMERS:
- This is application assistance, not medical diagnosis
- Always recommend consulting genetics specialists
- Cite specific evidence from medical records
- Clearly state when information is insufficient for diagnosis
```

## Web Interface Features

The UDN application interface provides:

- **Application Wizard**: Step-by-step guidance through UDN application sections
- **Timeline Builder**: Visual timeline of symptoms and medical history
- **Phenotype Organizer**: Structured clinical feature documentation
- **Test Result Manager**: Comprehensive testing history organization
- **Draft Generator**: Automated application draft creation
- **Collaboration Tools**: Support for multi-provider input
- **Progress Tracking**: Application completion status
- **Mobile Optimization**: Responsive design for all devices

## Integration with FHIR-HOSE

Designed to work with the FHIR-HOSE mobile application:

1. **FHIR-HOSE** converts comprehensive health records to medical text
2. **Creates session** via the pre-populate API with extended duration
3. **Opens application interface** in WebView with session context
4. **User works through** UDN application sections systematically
5. **Exports draft** for submission to UDN program

## Security & Privacy

- **HIPAA Compliance**: Only uses approved medical AI models
- **Extended Sessions**: 48-hour sessions for complex case preparation
- **Session Isolation**: Each application session is isolated and secure
- **Automatic Cleanup**: Sessions expire after 48 hours
- **Local Processing**: All data stays on localhost
- **No Logging**: Medical data is not logged by default
- **Draft Saving**: Secure session-based draft storage

## Model Requirements

Supported HIPAA-compliant models (prioritized for complexity):
- `hipaa:o3-high` (recommended for complex rare disease analysis)
- `hipaa:o1-high` (high reasoning for diagnostic pattern recognition)
- `hipaa:gpt-4o` (balanced performance for comprehensive analysis)
- `hipaa:gpt-4o-mini` (faster processing for simpler sections)

Models must be configured in the main Charmonator `config.json` file.

## Usage Examples

### Comprehensive Case Analysis
"Analyze my medical records to identify patterns that might suggest a rare or genetic condition suitable for UDN evaluation."

### Application Section Preparation
"Help me prepare the clinical phenotyping section of my UDN application, organizing all my symptoms and clinical features systematically."

### Diagnostic Journey Mapping
"Create a timeline of my diagnostic journey showing all the specialists I've seen, tests performed, and results over the past 10 years."

### Family History Assessment
"Analyze my family history for patterns that might suggest a genetic condition and help me organize this information for the UDN application."

### Testing Gap Analysis
"What additional testing should I consider before applying to the UDN program, based on my current medical records?"

## Development

To modify this app:

1. Update `app-config.json` for configuration changes
2. Modify `routes/undiagnosed-diseases.mjs` for API logic
3. Edit `public/undiagnosed-diseases.html` for UI changes
4. Restart Charmonator server to reload changes

## Installation

This app is registered in the main Charmonator configuration:

```json
{
  "apps": {
    "undiagnosed-diseases-app": {
      "directory": "../charmonator-apps-examples/undiagnosed-diseases-app",
      "enabled": true,
      "description": "AI-powered application assistance for the Undiagnosed Diseases Network program"
    }
  }
}
```

## References

- NIH Undiagnosed Diseases Network (UDN) Program
- Rare disease diagnostic approaches
- Clinical phenotyping methodologies
- Genetic counseling principles
- Medical genetics best practices