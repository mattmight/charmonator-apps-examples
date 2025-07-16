// routes/chat-with-records.mjs
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchChatModel } from '../../../charmonator/lib/core.mjs';
import { getAppConfig } from '../../../charmonator/lib/app-loader.mjs';
import { TranscriptFragment, Message } from '../../../charmonator/lib/transcript.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// In-memory session storage (production should use Redis/database)
if (!global.chatWithRecordsSessions) {
  global.chatWithRecordsSessions = new Map();
}

/**
 * POST /pre-populate
 * 
 * Creates a chat session with pre-loaded medical records in the system context.
 * 
 * Request body:
 *   {
 *     "medicalRecord": "string containing patient medical record",
 *     "sessionId": "string (optional) - Custom session identifier",
 *     "chatContext": {
 *       "patientName": "string (optional)",
 *       "recordCount": "number (optional)",
 *       "lastUpdated": "string (optional)"
 *     }
 *   }
 * 
 * Response:
 *   {
 *     "sessionId": "chat-session-1234567890-abcdef123",
 *     "chatUrl": "http://host/charm/apps/chat-with-records/chat-with-records.html?session=...",
 *     "prePopulatedData": {
 *       "medicalRecord": "Patient data...",
 *       "systemPrompt": "Generated system prompt...",
 *       "chatContext": { ... }
 *     },
 *     "metadata": {
 *       "createdAt": "2025-06-09T02:28:06.509Z",
 *       "expiresAt": "2025-06-10T02:28:06.509Z",
 *       "sessionDuration": "24 hours"
 *     }
 *   }
 */
router.post('/pre-populate', async (req, res) => {
  try {
    const { medicalRecord, sessionId, chatContext } = req.body;

    // Validate input
    if (!medicalRecord || typeof medicalRecord !== 'string') {
      return res.status(400).json({
        error: 'Medical record is required and must be a string'
      });
    }

    // Check medical record size limit
    const appConfig = getAppConfig('chat-with-records-app');
    const maxSize = appConfig?.sessionConfig?.maxMedicalRecordSize || 50000;
    if (medicalRecord.length > maxSize) {
      return res.status(400).json({
        error: `Medical record too large. Maximum size: ${maxSize} characters`
      });
    }

    // Clean up expired sessions
    cleanupExpiredSessions();

    // Generate session ID
    const finalSessionId = sessionId || `chat-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create expiration time (24 hours from now)
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

    // Generate system prompt with medical context
    const systemPrompt = generateMedicalSystemPrompt(medicalRecord, chatContext);

    // Create session data
    const sessionData = {
      sessionId: finalSessionId,
      medicalRecord,
      chatContext: chatContext || {},
      systemPrompt,
      transcript: new TranscriptFragment(),
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    // Store session
    global.chatWithRecordsSessions.set(finalSessionId, sessionData);

    // Generate chat URL
    const protocol = req.protocol;
    const host = req.get('host');
    const chatUrl = `${protocol}://${host}/charm/apps/chat-with-records/chat-with-records.html?session=${finalSessionId}`;

    // Response
    res.json({
      sessionId: finalSessionId,
      chatUrl,
      prePopulatedData: {
        medicalRecord,
        systemPrompt,
        chatContext: chatContext || {}
      },
      metadata: {
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        sessionDuration: "24 hours"
      }
    });

    console.log(`Created chat session: ${finalSessionId}`);

  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      error: 'Internal server error while creating chat session'
    });
  }
});

/**
 * GET /session/:sessionId
 * 
 * Retrieves stored session data for chat interface initialization.
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Clean up expired sessions
    cleanupExpiredSessions();

    // Retrieve session
    const sessionData = global.chatWithRecordsSessions.get(sessionId);

    if (!sessionData) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    if (now > expiresAt) {
      global.chatWithRecordsSessions.delete(sessionId);
      return res.status(410).json({
        error: 'Session has expired'
      });
    }

    // Calculate time remaining
    const timeRemaining = expiresAt.getTime() - now.getTime();

    // Return session data (without sensitive internal data)
    res.json({
      sessionId: sessionData.sessionId,
      systemPrompt: sessionData.systemPrompt,
      chatContext: sessionData.chatContext,
      transcript: sessionData.transcript,
      metadata: {
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        timeRemaining
      }
    });

  } catch (error) {
    console.error('Error retrieving chat session:', error);
    res.status(500).json({
      error: 'Internal server error while retrieving session'
    });
  }
});

/**
 * POST /chat
 * 
 * Chat endpoint with medical record context in system prompt.
 */
router.post('/chat', async (req, res) => {
  try {
    const { sessionId, message, model } = req.body;

    // Validate input
    if (!sessionId || !message) {
      return res.status(400).json({
        error: 'Session ID and message are required'
      });
    }

    // Retrieve session
    const sessionData = global.chatWithRecordsSessions.get(sessionId);
    if (!sessionData) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    if (now > expiresAt) {
      global.chatWithRecordsSessions.delete(sessionId);
      return res.status(410).json({
        error: 'Session has expired'
      });
    }

    // Get app config for model selection
    const appConfig = getAppConfig('chat-with-records-app');
    const selectedModel = model || appConfig?.models?.default || 'hipaa:o3-high';

    // Validate HIPAA compliance if required
    if (appConfig?.security?.requireHIPAACompliantModels && !selectedModel.startsWith('hipaa:')) {
      return res.status(400).json({
        error: 'HIPAA-compliant model required for medical conversations'
      });
    }

    // Add user message to transcript
    const userMessage = new Message('user', message);
    sessionData.transcript = sessionData.transcript.plus(userMessage);

    console.log(`Chat request for session ${sessionId} using model ${selectedModel}`);

    // Get the chat model
    const chatModel = fetchChatModel(selectedModel);

    // Prepare the conversation for the model
    let conversationText = sessionData.systemPrompt + '\n\n';
    
    // Add conversation history
    for (const msg of sessionData.transcript.messages) {
      conversationText += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
    }
    
    conversationText += `USER: ${message}\n\nASSISTANT:`;

    // Call chat model
    const responseContent = await chatModel.replyTo(conversationText);

    if (!responseContent || typeof responseContent !== 'string') {
      throw new Error('Invalid response from chat model');
    }

    // Add assistant response to transcript
    const assistantMessage = new Message('assistant', responseContent);
    sessionData.transcript = sessionData.transcript.plus(assistantMessage);

    // Update session data
    global.chatWithRecordsSessions.set(sessionId, sessionData);

    // Return response
    res.json({
      sessionId,
      message: responseContent,
      model: selectedModel,
      timestamp: new Date().toISOString(),
      metadata: {
        messageCount: sessionData.transcript.messages.length,
        sessionActive: true
      }
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      error: 'Internal server error during chat processing',
      details: error.message
    });
  }
});

/**
 * DELETE /session/:sessionId
 * 
 * Manually delete a chat session.
 */
router.delete('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionExists = global.chatWithRecordsSessions.has(sessionId);
    if (sessionExists) {
      global.chatWithRecordsSessions.delete(sessionId);
      res.json({
        message: 'Session deleted successfully',
        sessionId
      });
    } else {
      res.status(404).json({
        error: 'Session not found'
      });
    }

  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      error: 'Internal server error while deleting session'
    });
  }
});

/**
 * GET /info
 * 
 * Returns app information and configuration.
 */
router.get('/info', (req, res) => {
  try {
    const appConfig = getAppConfig('chat-with-records-app');
    
    res.json({
      name: appConfig?.name || 'Chat with Medical Records',
      description: appConfig?.description || 'AI-powered chat with medical record context',
      version: appConfig?.version || '1.0.0',
      features: appConfig?.features || [],
      models: appConfig?.models || {},
      sessionStats: {
        activeSessions: global.chatWithRecordsSessions.size,
        lastCleanup: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting app info:', error);
    res.status(500).json({
      error: 'Internal server error while getting app info'
    });
  }
});

// Helper Functions

/**
 * Generate medical system prompt with patient record context
 */
function generateMedicalSystemPrompt(medicalRecord, chatContext = {}) {
  const patientName = chatContext.patientName || 'the patient';
  const recordCount = chatContext.recordCount || 'multiple';
  
  return `You are a helpful medical AI assistant with access to ${patientName}'s complete health records. You have ${recordCount} medical records to reference.

PATIENT MEDICAL RECORDS:
${medicalRecord}

Instructions for Medical Conversations:
- Answer questions about the patient's medical history based on the provided records
- Provide insights and analysis based on available data
- Always cite specific records or data points when making claims
- Suggest areas where additional information might be helpful
- Explain medical terminology in plain language when appropriate
- Look for patterns, trends, or potential correlations in the data

Important Medical Disclaimers:
- Do not provide medical advice, diagnosis, or treatment recommendations
- Do not replace professional medical consultation
- Always remind users to consult healthcare providers for medical decisions
- Clearly state when information is missing or unclear in the records

Response Style:
- Be conversational but professional
- Use clear, accessible language
- Provide specific examples from the records when relevant
- Organize complex information clearly using bullet points, numbered lists, or paragraphs
- Ask clarifying questions when the user's intent is unclear
- NEVER use tables or complex formatting - format information as simple lists or paragraphs instead
- Use bullet points (•) or dashes (-) for lists rather than table structures
- Present data in easy-to-read paragraph form when appropriate

Mobile-Friendly Formatting:
- Avoid tables, complex charts, or multi-column layouts
- Use simple bullet points for multiple items
- Present information in short, digestible paragraphs
- Use clear headings when organizing longer responses

You may discuss:
- Medical history patterns and trends
- Test results and their general meanings
- Medication lists and timing
- Symptom correlations across records
- Gaps in the medical record that might be worth exploring

Remember: You are an informational assistant, not a medical provider. Focus on helping users understand their existing medical information in a mobile-friendly format.`;
}

/**
 * Clean up expired sessions from memory
 */
function cleanupExpiredSessions() {
  const now = new Date();
  let cleanedCount = 0;

  for (const [sessionId, sessionData] of global.chatWithRecordsSessions.entries()) {
    const expiresAt = new Date(sessionData.expiresAt);
    if (now > expiresAt) {
      global.chatWithRecordsSessions.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired chat sessions`);
  }
}

export default router;