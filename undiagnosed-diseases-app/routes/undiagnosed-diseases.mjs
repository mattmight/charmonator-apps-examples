// routes/undiagnosed-diseases.mjs
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchChatModel } from '../../../charmonator/lib/core.mjs';
import { getAppConfig } from '../../../charmonator/lib/app-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// In-memory session storage (production should use Redis/database)
if (!global.undiagnosedDiseasesSessions) {
  global.undiagnosedDiseasesSessions = new Map();
}

/**
 * POST /pre-populate
 * 
 * Creates a UDN application session with pre-loaded medical records.
 * 
 * Request body:
 *   {
 *     "medicalRecord": "string containing patient medical record",
 *     "sessionId": "string (optional) - Custom session identifier",
 *     "patientContext": {
 *       "age": "number (optional)",
 *       "gender": "string (optional)",
 *       "patientName": "string (optional)",
 *       "diagnosticJourney": "string (optional)"
 *     }
 *   }
 * 
 * Response:
 *   {
 *     "sessionId": "udn-session-1234567890-abcdef123",
 *     "applicationUrl": "http://host/charm/apps/undiagnosed-diseases/undiagnosed-diseases.html?session=...",
 *     "prePopulatedData": {
 *       "medicalRecord": "Patient data...",
 *       "patientContext": { ... }
 *     },
 *     "metadata": {
 *       "createdAt": "2025-06-09T02:28:06.509Z",
 *       "expiresAt": "2025-06-11T02:28:06.509Z",
 *       "sessionDuration": "48 hours"
 *     }
 *   }
 */
router.post('/pre-populate', async (req, res) => {
  try {
    const { medicalRecord, sessionId, patientContext } = req.body;

    // Validate input
    if (!medicalRecord || typeof medicalRecord !== 'string') {
      return res.status(400).json({
        error: 'Medical record is required and must be a string'
      });
    }

    // Check medical record size limit
    const appConfig = getAppConfig('undiagnosed-diseases-app');
    const maxSize = appConfig?.sessionConfig?.maxMedicalRecordSize || 500000;
    if (medicalRecord.length > maxSize) {
      return res.status(400).json({
        error: `Medical record too large. Maximum size: ${maxSize} characters`
      });
    }

    // Clean up expired sessions
    cleanupExpiredSessions();

    // Generate session ID
    const finalSessionId = sessionId || `udn-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create expiration time (48 hours from now)
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);

    // Create session data
    const sessionData = {
      sessionId: finalSessionId,
      medicalRecord,
      patientContext: patientContext || {},
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      applicationStatus: 'draft',
      applicationData: null
    };

    // Store session
    global.undiagnosedDiseasesSessions.set(finalSessionId, sessionData);

    // Generate application URL
    const protocol = req.protocol;
    const host = req.get('host');
    const applicationUrl = `${protocol}://${host}/charm/apps/undiagnosed-diseases/undiagnosed-diseases.html?session=${finalSessionId}`;

    // Response
    res.json({
      sessionId: finalSessionId,
      applicationUrl,
      prePopulatedData: {
        medicalRecord,
        patientContext: patientContext || {}
      },
      metadata: {
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        sessionDuration: "48 hours"
      }
    });

    console.log(`Created UDN application session: ${finalSessionId}`);

  } catch (error) {
    console.error('Error creating UDN application session:', error);
    res.status(500).json({
      error: 'Internal server error while creating application session'
    });
  }
});

/**
 * GET /session/:sessionId
 * 
 * Retrieves stored session data for application interface initialization.
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Clean up expired sessions
    cleanupExpiredSessions();

    // Retrieve session
    const sessionData = global.undiagnosedDiseasesSessions.get(sessionId);

    if (!sessionData) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    if (now > expiresAt) {
      global.undiagnosedDiseasesSessions.delete(sessionId);
      return res.status(410).json({
        error: 'Session has expired'
      });
    }

    // Calculate time remaining
    const timeRemaining = expiresAt.getTime() - now.getTime();

    // Return session data
    res.json({
      sessionId: sessionData.sessionId,
      medicalRecord: sessionData.medicalRecord,
      patientContext: sessionData.patientContext,
      applicationStatus: sessionData.applicationStatus,
      applicationData: sessionData.applicationData,
      metadata: {
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        timeRemaining
      }
    });

  } catch (error) {
    console.error('Error retrieving UDN application session:', error);
    res.status(500).json({
      error: 'Internal server error while retrieving session'
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
    const appConfig = getAppConfig('undiagnosed-diseases-app');
    
    res.json({
      name: appConfig?.name || 'Undiagnosed Diseases Network',
      description: appConfig?.description || 'AI-powered application assistance for the Undiagnosed Diseases Network',
      version: appConfig?.version || '1.0.0',
      features: appConfig?.features || [],
      models: appConfig?.models || {},
      applicationCategories: appConfig?.applicationCategories || [],
      sessionStats: {
        activeSessions: global.undiagnosedDiseasesSessions.size,
        lastCleanup: new Date().toISOString()
      },
      status: 'coming-soon'
    });

  } catch (error) {
    console.error('Error getting UDN app info:', error);
    res.status(500).json({
      error: 'Internal server error while getting app info'
    });
  }
});

/**
 * Clean up expired sessions from memory
 */
function cleanupExpiredSessions() {
  const now = new Date();
  let cleanedCount = 0;

  for (const [sessionId, sessionData] of global.undiagnosedDiseasesSessions.entries()) {
    const expiresAt = new Date(sessionData.expiresAt);
    if (now > expiresAt) {
      global.undiagnosedDiseasesSessions.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired UDN application sessions`);
  }
}

export default router;