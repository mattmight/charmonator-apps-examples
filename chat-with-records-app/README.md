# Chat with Medical Records App

An AI-powered conversational interface for interacting with patient medical records using HIPAA-compliant models.

## Overview

This Charmonator app enables natural language conversations about patient health data. Medical records are pre-loaded into the AI's context, allowing users to ask questions, explore patterns, and gain insights about their health information.

## Features

- **Medical Record Pre-population**: Patient records are injected into the system prompt
- **HIPAA-Compliant AI**: Uses secure models like `hipaa:o3-high` by default
- **Session-based Security**: 24-hour session expiration with automatic cleanup
- **Medical Context Awareness**: AI understands medical terminology and relationships
- **Conversation Memory**: Maintains chat history within sessions
- **Mobile-Friendly Interface**: Responsive design optimized for all devices

## Directory Structure

```
chat-with-records-app/
├── app-config.json          # App configuration
├── README.md               # This file
├── public/                 # Static assets served at /apps/chat-with-records/
│   └── chat-with-records.html
└── routes/                 # Express route handlers
    └── chat-with-records.mjs
```

## API Endpoints

### POST /apps/chat-with-records/pre-populate

Creates a chat session with pre-loaded medical records.

**Request Body:**
```json
{
  "medicalRecord": "Complete patient medical record text...",
  "sessionId": "optional-custom-session-id",
  "chatContext": {
    "patientName": "John Doe",
    "recordCount": 15,
    "lastUpdated": "2025-06-08"
  }
}
```

**Response:**
```json
{
  "sessionId": "chat-session-1234567890-abcdef123",
  "chatUrl": "http://host/charm/apps/chat-with-records/chat-with-records.html?session=...",
  "prePopulatedData": {
    "medicalRecord": "Patient data...",
    "systemPrompt": "Generated system prompt with medical context...",
    "chatContext": { ... }
  },
  "metadata": {
    "createdAt": "2025-06-09T02:28:06.509Z",
    "expiresAt": "2025-06-10T02:28:06.509Z",
    "sessionDuration": "24 hours"
  }
}
```

### GET /apps/chat-with-records/session/:sessionId

Retrieves session data for chat interface initialization.

### POST /apps/chat-with-records/chat

Chat endpoint with medical context.

**Request Body:**
```json
{
  "sessionId": "chat-session-123",
  "message": "What medications am I currently taking?",
  "model": "hipaa:o3-high"
}
```

**Response:**
```json
{
  "sessionId": "chat-session-123",
  "message": "Based on your medical records, you are currently taking...",
  "model": "hipaa:o3-high",
  "timestamp": "2025-06-09T02:30:15.123Z",
  "metadata": {
    "messageCount": 3,
    "sessionActive": true
  }
}
```

## Configuration

The `app-config.json` file defines:

- **Models**: HIPAA-compliant AI models for medical conversations
- **Session Settings**: Expiration time, record size limits, history settings
- **Security Options**: HIPAA requirements, session cleanup, logging policies

## System Prompt Template

The app generates a specialized system prompt that includes:

```
You are a helpful medical AI assistant with access to the patient's complete health records.

PATIENT MEDICAL RECORDS:
[Injected medical record data]

Instructions for Medical Conversations:
- Answer questions about medical history based on provided records
- Provide insights and analysis based on available data
- Always cite specific records when making claims
- Explain medical terminology in plain language
- Look for patterns and correlations in the data

Important Medical Disclaimers:
- Do not provide medical advice or diagnosis
- Always remind users to consult healthcare providers
- Clearly state when information is missing or unclear
```

## Chat Interface Features

### Medical Context Panel
- Shows session information and record summary
- Displays medical record context (can be toggled)
- Session expiration countdown

### Conversation Features
- **Markdown Support**: Rich text formatting in responses
- **Code Highlighting**: For medical codes and structured data
- **Medical Term Highlighting**: Special formatting for medical terminology
- **Mobile Optimization**: Touch-friendly interface for mobile devices

### Smart Conversation Capabilities
- **Medical History Analysis**: Identifies patterns across records
- **Medication Tracking**: Discusses current and past medications
- **Test Result Interpretation**: Explains lab values and trends
- **Symptom Correlation**: Connects symptoms across different visits
- **Gap Identification**: Points out missing information in records

## Integration with FHIR-HOSE

This app is designed to integrate with the FHIR-HOSE mobile application:

1. **FHIR-HOSE** converts health records to medical text
2. **Creates session** via the pre-populate API
3. **Opens chat interface** in WebView with session context
4. **User converses** naturally about their health data

## Security & Privacy

- **HIPAA Compliance**: Only uses approved medical AI models
- **Session Isolation**: Each chat session is isolated and secure
- **Automatic Cleanup**: Sessions expire after 24 hours
- **Local Processing**: All data stays on localhost (no external APIs)
- **No Logging**: Medical conversations are not logged by default

## Usage Examples

### Basic Medical Questions
- "What medications am I currently taking?"
- "Show me my recent lab results"
- "What allergies are in my records?"

### Pattern Analysis
- "Are there any trends in my blood pressure over time?"
- "What symptoms appear most frequently in my records?"
- "How has my medication changed over the past year?"

### Record Exploration
- "What information is missing from my medical records?"
- "Can you summarize my surgical history?"
- "What chronic conditions do I have?"

## Development

To modify this app:

1. Update `app-config.json` for configuration changes
2. Modify `routes/chat-with-records.mjs` for API logic
3. Edit `public/chat-with-records.html` for UI changes
4. Restart Charmonator server to reload changes

## Model Requirements

Supported HIPAA-compliant models:
- `hipaa:o3-high` (recommended)
- `hipaa:o1-high`
- `hipaa:gpt-4o`
- `hipaa:gpt-4o-mini`

Models must be configured in the main Charmonator `config.json` file.

## Installation

This app is registered in the main Charmonator configuration:

```json
{
  "apps": {
    "chat-with-records-app": {
      "directory": "./examples/chat-with-records-app",
      "enabled": true,
      "description": "AI-powered chat with medical record context"
    }
  }
}
```