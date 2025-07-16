# CBT Alcohol Coach App

A real-time CBT-based alcohol-use disorder AI coach with structured sessions, memory, and urgent intervention support, designed to provide evidence-based therapeutic guidance for alcohol recovery.

## Overview

This Charmonator app implements cognitive behavioral therapy (CBT) principles to provide personalized coaching for individuals dealing with alcohol use disorders. It combines medical record context with therapeutic interventions to offer supportive, evidence-based guidance for recovery.

## Features

- **CBT-Based Interventions**: Evidence-based cognitive behavioral therapy techniques
- **Real-Time Coaching**: Immediate support and guidance during challenging moments
- **Session Memory**: Maintains conversation history and progress tracking
- **Urgent Intervention Support**: Specialized responses for crisis situations
- **Personalized Approach**: Tailored to individual medical history and recovery goals
- **Structured Sessions**: Organized therapeutic conversations with clear objectives
- **Practice Exercises**: Interactive CBT exercises and skill-building activities
- **Relapse Prevention**: Proactive strategies and coping mechanism development

## Directory Structure

```
cbt-alcohol-coach-app/
├── app.json                 # App configuration
├── README.md               # This file
├── resources/              # CBT system prompts and therapeutic content
│   └── cbt-alcohol-use-disorder-prompt.md
├── public/                 # Static assets served at /apps/cbt-alcohol-coach-app/
│   └── cbt-alcohol-coach.html
└── routes/                 # Express route handlers
    └── cbt-alcohol-coach.mjs
```

## Therapeutic Features

### Core CBT Techniques
- **Cognitive Restructuring**: Identifying and challenging negative thought patterns
- **Behavioral Activation**: Encouraging positive activities and behaviors
- **Trigger Identification**: Recognizing high-risk situations and emotional triggers
- **Coping Skills Training**: Developing healthy responses to cravings and stress
- **Relapse Prevention Planning**: Creating personalized prevention strategies

### Session Types
- **Long-Term Sessions**: Ongoing therapeutic conversations and progress tracking
- **Urgent Sessions**: Crisis intervention and immediate support
- **Practice Sessions**: Skill-building exercises and therapeutic techniques
- **Check-in Sessions**: Regular progress monitoring and adjustment

## API Endpoints

### POST /apps/cbt-alcohol-coach-app/pre-populate

Creates a therapeutic session with medical record context.

**Request Body:**
```json
{
  "medicalRecord": "Patient medical record including alcohol use history...",
  "sessionId": "optional-custom-session-id",
  "sessionType": "long-term|urgent|practice|check-in",
  "therapeuticContext": {
    "recoveryStage": "early|maintenance|relapse",
    "sobrietyDuration": "30 days",
    "previousAttempts": 3,
    "supportSystem": "strong|moderate|limited"
  }
}
```

**Response:**
```json
{
  "sessionId": "cbt-session-1234567890-abcdef",
  "coachUrl": "http://host/charm/apps/cbt-alcohol-coach-app/cbt-alcohol-coach.html?session=...",
  "prePopulatedData": {
    "medicalRecord": "Patient data...",
    "systemPrompt": "CBT-specific therapeutic prompt...",
    "sessionType": "long-term",
    "therapeuticContext": { ... }
  },
  "metadata": {
    "createdAt": "2025-01-01T12:00:00.000Z",
    "expiresAt": "2025-01-01T13:00:00.000Z",
    "sessionDuration": "1 hour"
  }
}
```

### GET /apps/cbt-alcohol-coach-app/session/:sessionId

Retrieves session data for coach interface initialization.

### POST /apps/cbt-alcohol-coach-app/interface

Main therapeutic conversation endpoint.

**Request Body:**
```json
{
  "sessionId": "cbt-session-123",
  "message": "I'm feeling a strong urge to drink right now",
  "urgencyLevel": "high|moderate|low",
  "emotionalState": "anxious|depressed|angry|stressed|neutral",
  "model": "hipaa:gpt-4.1"
}
```

**Response:**
```json
{
  "sessionId": "cbt-session-123",
  "response": "I understand you're experiencing a strong urge right now. Let's work through this together using the HALT technique we discussed...",
  "interventionType": "coping-skills|cognitive-restructuring|behavioral-activation|crisis-intervention",
  "suggestedActions": [
    "Use the 5-4-3-2-1 grounding technique",
    "Review your personal triggers list",
    "Contact your support person if needed"
  ],
  "therapeuticTechniques": ["HALT assessment", "Urge surfing", "Cognitive restructuring"],
  "followUpRecommendations": [
    "Practice mindfulness exercises",
    "Schedule check-in tomorrow",
    "Review trigger management plan"
  ],
  "urgencyAssessment": "moderate",
  "model": "hipaa:gpt-4.1",
  "timestamp": "2025-01-01T12:30:00.000Z"
}
```

### POST /apps/cbt-alcohol-coach-app/urgent-session

Specialized endpoint for crisis intervention.

**Request Body:**
```json
{
  "sessionId": "cbt-session-123",
  "message": "I've already had several drinks and I'm thinking about drinking more",
  "safetyRisk": "high|moderate|low",
  "currentLocation": "home|work|social|other",
  "supportAvailable": true
}
```

**Response:**
```json
{
  "sessionId": "cbt-session-123",
  "response": "Thank you for reaching out - that takes courage. Let's focus on your safety right now...",
  "interventionType": "crisis-intervention",
  "immediateActions": [
    "Remove alcohol from immediate access",
    "Contact your emergency support person",
    "Consider calling a crisis helpline if needed"
  ],
  "safetyPlan": [
    "Move to a safe environment",
    "Engage grounding techniques",
    "Stay connected with support"
  ],
  "resourcesProvided": [
    "Crisis helpline numbers",
    "Emergency contacts",
    "Safety planning tools"
  ],
  "followUpRequired": true,
  "professionalReferral": "recommended",
  "timestamp": "2025-01-01T12:30:00.000Z"
}
```

## Configuration

The `app.json` file defines:

- **Session Settings**: 1-hour duration, configurable based on session type
- **Model Configuration**: HIPAA-compliant therapeutic models
- **Feature Flags**: Enable/disable specific therapeutic features
- **Safety Settings**: Crisis intervention thresholds and responses
- **Supported Formats**: File types for medical record input

## System Prompt Template

The app uses a specialized CBT system prompt:

```
You are a CBT-based alcohol-use disorder AI coach. Provide supportive, evidence-based guidance for alcohol recovery using cognitive behavioral therapy principles.

PATIENT MEDICAL CONTEXT:
[Injected medical record data including alcohol use history]

CORE CBT PRINCIPLES:
- Use evidence-based CBT techniques
- Provide supportive, non-judgmental guidance
- Focus on practical coping strategies
- Encourage self-reflection and awareness
- Maintain professional boundaries
- Refer to professional help when appropriate

THERAPEUTIC APPROACH:
- Help identify triggers and high-risk situations
- Teach coping skills and relapse prevention strategies
- Support goal-setting and progress tracking
- Provide psychoeducation about alcohol use disorders
- Encourage healthy lifestyle changes
- Offer motivational interviewing techniques

SAFETY PROTOCOLS:
- If user expresses suicidal thoughts, provide crisis resources
- For medical emergencies, advise to seek immediate medical attention
- Acknowledge limitations as an AI coach
- Encourage professional treatment when needed
- Escalate to crisis intervention for high-risk situations

THERAPEUTIC TECHNIQUES:
- Cognitive restructuring for negative thought patterns
- Behavioral activation for positive activities
- Urge surfing for craving management
- HALT assessment (Hungry, Angry, Lonely, Tired)
- Mindfulness and grounding exercises
- Relapse prevention planning
```

## Web Interface Features

The CBT coach interface provides:

- **Therapeutic Chat**: Real-time conversation with CBT-trained AI
- **Session History**: Access to previous conversations and progress
- **Coping Tools**: Quick access to CBT techniques and exercises
- **Trigger Journal**: Track triggers and responses over time
- **Progress Tracking**: Monitor recovery milestones and setbacks
- **Resource Library**: Access to CBT resources and exercises
- **Safety Features**: Crisis intervention and emergency resources
- **Mobile Optimization**: Responsive design for mobile support

## Integration with FHIR-HOSE

Designed to work with the FHIR-HOSE mobile application:

1. **FHIR-HOSE** converts health records including substance use history
2. **Creates session** via the pre-populate API with therapeutic context
3. **Opens coach interface** in WebView with session context
4. **User engages** in real-time therapeutic conversations
5. **Provides continuous support** for recovery journey

## Security & Privacy

- **HIPAA Compliance**: Only uses approved medical AI models
- **Session Security**: Secure therapeutic conversations with automatic cleanup
- **Crisis Safety**: Built-in safety protocols for high-risk situations
- **Local Processing**: All therapeutic data stays on localhost
- **No Logging**: Therapeutic conversations are not logged by default
- **Professional Boundaries**: Clear limitations and referral guidelines

## Model Requirements

Supported HIPAA-compliant models:
- `hipaa:gpt-4.1` (recommended for therapeutic conversations)
- `hipaa:o3-high` (advanced reasoning for complex situations)
- `hipaa:gpt-4o` (balanced performance for general coaching)
- `hipaa:gpt-4o-mini` (faster responses for crisis situations)

Models must be configured in the main Charmonator `config.json` file.

## Usage Examples

### Urge Management
"I'm feeling a strong urge to drink right now. Can you help me work through this?"

### Trigger Analysis
"I noticed I always want to drink when I'm stressed at work. How can I handle this better?"

### Relapse Prevention
"Help me create a plan for handling social situations where there will be drinking."

### Progress Review
"Can we review my progress over the past month and adjust my recovery goals?"

### Crisis Intervention
"I've already had several drinks and I'm thinking about having more. I need help."

## Development

To modify this app:

1. Update `app.json` for configuration changes
2. Modify `routes/cbt-alcohol-coach.mjs` for API logic
3. Edit `public/cbt-alcohol-coach.html` for UI changes
4. Update `resources/cbt-alcohol-use-disorder-prompt.md` for therapeutic content
5. Restart Charmonator server to reload changes

## Installation

This app is registered in the main Charmonator configuration:

```json
{
  "apps": {
    "cbt-alcohol-coach-app": {
      "directory": "../charmonator-apps-examples/cbt-alcohol-coach-app",
      "enabled": true,
      "description": "Real-time CBT-based alcohol-use disorder AI coach with session memory and urgent intervention support"
    }
  }
}
```

## References

- Cognitive Behavioral Therapy (CBT) for Substance Use Disorders
- SAMHSA Treatment Guidelines for Alcohol Use Disorders
- Evidence-based addiction treatment approaches
- Crisis intervention and safety planning protocols
- Motivational interviewing techniques for recovery