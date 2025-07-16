// routes/clinical-trial-matcher.mjs
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchChatModel } from '../../../charmonator/lib/core.mjs';
import { getAppConfig } from '../../../charmonator/lib/app-loader.mjs';
import { parseNCT, getEligibilityCriteria, searchNCT, getNCTDatabaseStats } from '../../../charmonator/lib/nct-parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * POST /clinical-trial-matcher
 * 
 * Takes a freetext medical record and determines if it matches inclusion/exclusion 
 * criteria for a clinical trial using a HIPAA-compliant model.
 * 
 * Request body:
 *   {
 *     "medicalRecord": "string containing patient medical record",
 *     "trialCriteria": {
 *       "inclusionCriteria": ["criterion 1", "criterion 2", ...],
 *       "exclusionCriteria": ["criterion 1", "criterion 2", ...]
 *     }
 *   }
 * 
 * Response:
 *   {
 *     "patientId": "generated-id",
 *     "timestamp": "ISO-date",
 *     "overallEligibility": "eligible|ineligible|needs-review",
 *     "results": [
 *       {
 *         "criterion": "string",
 *         "type": "inclusion|exclusion",
 *         "status": "matched|non-matched|more-information-needed",
 *         "reasoning": "explanation",
 *         "confidence": 0.0-1.0
 *       }
 *     ]
 *   }
 */
router.post('/clinical-trial-matcher', async (req, res) => {
  try {
    const { medicalRecord, trialCriteria } = req.body;

    // Validate input
    if (!medicalRecord || typeof medicalRecord !== 'string') {
      return res.status(400).json({ 
        error: 'Field "medicalRecord" is required and must be a string.' 
      });
    }

    if (!trialCriteria || !trialCriteria.inclusionCriteria || !trialCriteria.exclusionCriteria) {
      return res.status(400).json({ 
        error: 'Field "trialCriteria" with inclusionCriteria and exclusionCriteria arrays is required.' 
      });
    }

    // Get app configuration to determine which model to use
    const appConfig = getAppConfig('clinical-trial-matcher-app');
    const modelName = appConfig?.models?.default || 'hipaa:o3-high';

    // Get the specified model
    const chatModel = fetchChatModel(modelName);
    
    // Generate patient ID and timestamp
    const patientId = `pt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Process each criterion
    const results = [];
    
    // Process inclusion criteria
    for (const criterion of trialCriteria.inclusionCriteria) {
      const result = await evaluateCriterion(chatModel, medicalRecord, criterion, 'inclusion');
      results.push(result);
    }

    // Process exclusion criteria  
    for (const criterion of trialCriteria.exclusionCriteria) {
      const result = await evaluateCriterion(chatModel, medicalRecord, criterion, 'exclusion');
      results.push(result);
    }

    // Determine overall eligibility
    const overallEligibility = determineOverallEligibility(results);

    const response = {
      patientId,
      timestamp,
      overallEligibility,
      results,
      metadata: {
        appVersion: appConfig?.version || '1.0.0',
        model: modelName
      }
    };

    return res.json(response);

  } catch (error) {
    console.error('Error in clinical-trial-matcher:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error during clinical trial matching' 
    });
  }
});

/**
 * GET /nct/:nctNumber
 * Get trial information and eligibility criteria for a specific NCT number
 * 
 * Example: GET /nct/NCT00000102
 * 
 * Response:
 *   {
 *     "nctNumber": "NCT00000102",
 *     "studyInfo": { ... },
 *     "eligibility": { ... },
 *     "metadata": { ... }
 *   }
 */
router.get('/nct/:nctNumber', async (req, res) => {
  try {
    const { nctNumber } = req.params;
    
    // Validate NCT number format
    if (!nctNumber.match(/^NCT\d{8}$/)) {
      return res.status(400).json({
        error: 'Invalid NCT number format. Expected format: NCT00000000'
      });
    }
    
    const trialData = await parseNCT(nctNumber);
    return res.json(trialData);
    
  } catch (error) {
    console.error('Error fetching NCT data:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: `Clinical trial ${req.params.nctNumber} not found in local database`
      });
    }
    
    return res.status(500).json({
      error: error.message || 'Internal server error while fetching trial data'
    });
  }
});

/**
 * GET /nct/:nctNumber/eligibility
 * Get only the eligibility criteria for a specific NCT number
 * 
 * Example: GET /nct/NCT00000102/eligibility
 * 
 * Response:
 *   {
 *     "inclusionCriteria": [...],
 *     "exclusionCriteria": [...],
 *     "gender": "All",
 *     "minimumAge": "14 Years",
 *     "maximumAge": "35 Years",
 *     "healthyVolunteers": false
 *   }
 */
router.get('/nct/:nctNumber/eligibility', async (req, res) => {
  try {
    const { nctNumber } = req.params;
    
    if (!nctNumber.match(/^NCT\d{8}$/)) {
      return res.status(400).json({
        error: 'Invalid NCT number format. Expected format: NCT00000000'
      });
    }
    
    const eligibility = await getEligibilityCriteria(nctNumber);
    return res.json(eligibility);
    
  } catch (error) {
    console.error('Error fetching eligibility criteria:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: `Clinical trial ${req.params.nctNumber} not found in local database`
      });
    }
    
    return res.status(500).json({
      error: error.message || 'Internal server error while fetching eligibility criteria'
    });
  }
});

/**
 * GET /search?pattern=NCT0000010*
 * Search for clinical trials by NCT number pattern
 * 
 * Query parameters:
 *   - pattern: Search pattern (e.g., "NCT0000010*")
 *   - limit: Maximum number of results (default: 50)
 * 
 * Response:
 *   {
 *     "query": "NCT0000010*",
 *     "results": ["NCT00000102", "NCT00000104", ...],
 *     "count": 5,
 *     "limit": 50
 *   }
 */
router.get('/search', async (req, res) => {
  try {
    const { pattern, limit = 50 } = req.query;
    
    if (!pattern) {
      return res.status(400).json({
        error: 'Search pattern is required. Example: ?pattern=NCT0000010*'
      });
    }
    
    const results = searchNCT(pattern);
    const limitedResults = results.slice(0, parseInt(limit));
    
    return res.json({
      query: pattern,
      results: limitedResults,
      count: limitedResults.length,
      totalMatches: results.length,
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Error searching trials:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error while searching trials'
    });
  }
});

/**
 * GET /database-stats
 * Get statistics about the clinical trials database
 * 
 * Response:
 *   {
 *     "totalTrials": 540505,
 *     "totalDirectories": 701,
 *     "directoryStats": {...},
 *     "lastUpdated": "2025-06-09T00:00:00.000Z"
 *   }
 */
router.get('/database-stats', (req, res) => {
  try {
    const stats = getNCTDatabaseStats();
    return res.json(stats);
  } catch (error) {
    console.error('Error getting database stats:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error while getting database statistics'
    });
  }
});

/**
 * POST /comprehensive-match
 * Enhanced clinical trial matching with comprehensive AI reasoning
 * 
 * Request body:
 *   {
 *     "medicalRecord": "string containing patient medical record",
 *     "trialCriteria": {
 *       "inclusionCriteria": ["criterion 1", ...],
 *       "exclusionCriteria": ["criterion 1", ...]
 *     },
 *     "trialInfo": {
 *       "title": "optional trial title",
 *       "condition": "optional condition",
 *       "phase": "optional phase"
 *     }
 *   }
 * 
 * Response: Comprehensive clinical evaluation with detailed reasoning
 */
router.post('/comprehensive-match', async (req, res) => {
  try {
    const { medicalRecord, trialCriteria, trialInfo = {} } = req.body;

    // Validate input
    if (!medicalRecord || typeof medicalRecord !== 'string') {
      return res.status(400).json({ 
        error: 'Field "medicalRecord" is required and must be a string.' 
      });
    }

    if (!trialCriteria || !trialCriteria.inclusionCriteria || !trialCriteria.exclusionCriteria) {
      return res.status(400).json({ 
        error: 'Field "trialCriteria" with inclusionCriteria and exclusionCriteria arrays is required.' 
      });
    }

    // Get app configuration to determine which model to use
    const appConfig = getAppConfig('clinical-trial-matcher-app');
    const modelName = appConfig?.models?.default || 'hipaa:o3-high';

    // Get the specified model
    const chatModel = fetchChatModel(modelName);
    
    // Generate patient ID and timestamp
    const patientId = `pt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Perform comprehensive evaluation
    const comprehensiveResults = await evaluateEligibilityComprehensive(
      chatModel, 
      medicalRecord, 
      trialCriteria, 
      trialInfo
    );

    const response = {
      patientId,
      timestamp,
      evaluationType: "comprehensive",
      ...comprehensiveResults,
      metadata: {
        appVersion: appConfig?.version || '1.0.0',
        model: modelName,
        evaluationMethod: "comprehensive-ai-reasoning"
      }
    };

    return res.json(response);

  } catch (error) {
    console.error('Error in comprehensive-match:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error during comprehensive clinical trial matching' 
    });
  }
});

/**
 * POST /comprehensive-match-nct
 * Enhanced NCT-based matching with comprehensive AI reasoning
 * 
 * Request body:
 *   {
 *     "medicalRecord": "string containing patient medical record",
 *     "nctNumber": "NCT00000102"
 *   }
 * 
 * Response: Comprehensive clinical evaluation using NCT trial data
 */
router.post('/comprehensive-match-nct', async (req, res) => {
  try {
    const { medicalRecord, nctNumber } = req.body;
    
    // Validate input
    if (!medicalRecord || typeof medicalRecord !== 'string') {
      return res.status(400).json({
        error: 'Field "medicalRecord" is required and must be a string.'
      });
    }
    
    if (!nctNumber || !nctNumber.match(/^NCT\d{8}$/)) {
      return res.status(400).json({
        error: 'Field "nctNumber" is required and must be in format NCT00000000.'
      });
    }
    
    // Get trial data from NCT number
    const trialData = await parseNCT(nctNumber);
    const trialCriteria = {
      inclusionCriteria: trialData.eligibility.inclusionCriteria,
      exclusionCriteria: trialData.eligibility.exclusionCriteria
    };
    
    const trialInfo = {
      title: trialData.studyInfo.briefTitle,
      condition: trialData.studyInfo.condition,
      phase: trialData.studyInfo.phase,
      ageRange: `${trialData.eligibility.minimumAge} to ${trialData.eligibility.maximumAge}`,
      gender: trialData.eligibility.gender,
      status: trialData.studyInfo.overallStatus
    };
    
    // Get app configuration to determine which model to use
    const appConfig = getAppConfig('clinical-trial-matcher-app');
    const modelName = appConfig?.models?.default || 'hipaa:o3-high';
    
    // Get the specified model
    const chatModel = fetchChatModel(modelName);
    
    // Generate patient ID and timestamp
    const patientId = `pt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    // Perform comprehensive evaluation
    const comprehensiveResults = await evaluateEligibilityComprehensive(
      chatModel, 
      medicalRecord, 
      trialCriteria, 
      trialInfo
    );
    
    const response = {
      patientId,
      timestamp,
      nctNumber,
      evaluationType: "comprehensive-nct",
      trialInfo,
      ...comprehensiveResults,
      metadata: {
        appVersion: appConfig?.version || '1.0.0',
        model: modelName,
        evaluationMethod: "comprehensive-ai-reasoning-nct",
        nctDataParsedAt: trialData.metadata.parsedAt
      }
    };
    
    return res.json(response);
    
  } catch (error) {
    console.error('Error in comprehensive-match-nct:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: `Clinical trial ${req.body.nctNumber} not found in local database`
      });
    }
    
    return res.status(500).json({
      error: error.message || 'Internal server error during comprehensive NCT trial matching'
    });
  }
});

/**
 * POST /match-to-nct
 * Match a patient to a specific clinical trial by NCT number (basic version)
 * 
 * Request body:
 *   {
 *     "medicalRecord": "string containing patient medical record",
 *     "nctNumber": "NCT00000102"
 *   }
 * 
 * Response: Basic evaluation using individual criterion assessment
 */
router.post('/match-to-nct', async (req, res) => {
  try {
    const { medicalRecord, nctNumber } = req.body;
    
    // Validate input
    if (!medicalRecord || typeof medicalRecord !== 'string') {
      return res.status(400).json({
        error: 'Field "medicalRecord" is required and must be a string.'
      });
    }
    
    if (!nctNumber || !nctNumber.match(/^NCT\d{8}$/)) {
      return res.status(400).json({
        error: 'Field "nctNumber" is required and must be in format NCT00000000.'
      });
    }
    
    // Get trial data from NCT number
    const trialData = await parseNCT(nctNumber);
    const trialCriteria = {
      inclusionCriteria: trialData.eligibility.inclusionCriteria,
      exclusionCriteria: trialData.eligibility.exclusionCriteria
    };
    
    // Get app configuration to determine which model to use
    const appConfig = getAppConfig('clinical-trial-matcher-app');
    const modelName = appConfig?.models?.default || 'hipaa:o3-high';
    
    // Get the specified model
    const chatModel = fetchChatModel(modelName);
    
    // Generate patient ID and timestamp
    const patientId = `pt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    // Process each criterion
    const results = [];
    
    // Process inclusion criteria
    for (const criterion of trialCriteria.inclusionCriteria) {
      const result = await evaluateCriterion(chatModel, medicalRecord, criterion, 'inclusion');
      results.push(result);
    }
    
    // Process exclusion criteria  
    for (const criterion of trialCriteria.exclusionCriteria) {
      const result = await evaluateCriterion(chatModel, medicalRecord, criterion, 'exclusion');
      results.push(result);
    }
    
    // Determine overall eligibility
    const overallEligibility = determineOverallEligibility(results);
    
    const response = {
      patientId,
      timestamp,
      nctNumber,
      trialTitle: trialData.studyInfo.briefTitle,
      overallEligibility,
      results,
      trialInfo: {
        status: trialData.studyInfo.overallStatus,
        phase: trialData.studyInfo.phase,
        condition: trialData.studyInfo.condition,
        ageRange: `${trialData.eligibility.minimumAge} to ${trialData.eligibility.maximumAge}`,
        gender: trialData.eligibility.gender
      },
      metadata: {
        appVersion: appConfig?.version || '1.0.0',
        model: modelName,
        nctDataParsedAt: trialData.metadata.parsedAt
      }
    };
    
    return res.json(response);
    
  } catch (error) {
    console.error('Error in match-to-nct:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: `Clinical trial ${req.body.nctNumber} not found in local database`
      });
    }
    
    return res.status(500).json({
      error: error.message || 'Internal server error during NCT trial matching'
    });
  }
});

/**
 * POST /pre-populate
 * Pre-populate the interface with medical record and trial data
 * 
 * Request body:
 *   {
 *     "medicalRecord": "string containing patient medical record",
 *     "nctNumber": "NCT00000102" (optional),
 *     "trialCriteria": {
 *       "inclusionCriteria": ["criterion 1", ...],
 *       "exclusionCriteria": ["criterion 1", ...]
 *     } (optional, used if nctNumber not provided),
 *     "sessionId": "optional session identifier for complex workflows",
 *     "returnUrl": "optional URL to return to after evaluation"
 *   }
 * 
 * Response:
 *   {
 *     "sessionId": "generated-session-id",
 *     "interfaceUrl": "URL to pre-populated interface",
 *     "trialInfo": { ... },
 *     "prePopulatedData": { ... },
 *     "deepLinkUrl": "URL with query parameters for direct access"
 *   }
 */
router.post('/pre-populate', async (req, res) => {
  try {
    const { medicalRecord, nctNumber, trialCriteria, sessionId, returnUrl } = req.body;

    // Validate required fields
    if (!medicalRecord || typeof medicalRecord !== 'string') {
      return res.status(400).json({
        error: 'Field "medicalRecord" is required and must be a string.'
      });
    }

    // Must have either nctNumber or trialCriteria
    if (!nctNumber && !trialCriteria) {
      return res.status(400).json({
        error: 'Either "nctNumber" or "trialCriteria" must be provided.'
      });
    }

    // Generate or use provided session ID
    const finalSessionId = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let trialInfo = null;
    let criteriaToUse = trialCriteria;

    // If NCT number provided, fetch trial data
    if (nctNumber) {
      if (!nctNumber.match(/^NCT\d{8}$/)) {
        return res.status(400).json({
          error: 'Invalid NCT number format. Expected format: NCT00000000'
        });
      }

      try {
        const trialData = await parseNCT(nctNumber);
        trialInfo = {
          nctNumber: trialData.nctNumber,
          title: trialData.studyInfo.briefTitle,
          condition: trialData.studyInfo.condition,
          phase: trialData.studyInfo.phase,
          status: trialData.studyInfo.overallStatus,
          ageRange: `${trialData.eligibility.minimumAge} to ${trialData.eligibility.maximumAge}`,
          gender: trialData.eligibility.gender
        };
        
        criteriaToUse = {
          inclusionCriteria: trialData.eligibility.inclusionCriteria,
          exclusionCriteria: trialData.eligibility.exclusionCriteria
        };
      } catch (error) {
        return res.status(404).json({
          error: `Trial ${nctNumber} not found or could not be parsed: ${error.message}`
        });
      }
    }

    // Store session data for later retrieval
    const sessionData = {
      sessionId: finalSessionId,
      medicalRecord,
      nctNumber,
      trialCriteria: criteriaToUse,
      trialInfo,
      returnUrl,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    // Store in memory (in production, would use Redis or database)
    if (!global.clinicalTrialSessions) {
      global.clinicalTrialSessions = new Map();
    }
    global.clinicalTrialSessions.set(finalSessionId, sessionData);

    // Clean up expired sessions
    cleanupExpiredSessions();

    // Build interface URL with query parameters
    const baseUrl = `${req.protocol}://${req.get('host')}/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html`;
    const queryParams = new URLSearchParams({
      session: finalSessionId,
      ...(nctNumber && { nct: nctNumber }),
      ...(returnUrl && { returnUrl })
    });
    const interfaceUrl = `${baseUrl}?${queryParams}`;

    // Build deep link URL with encoded data
    const deepLinkParams = new URLSearchParams({
      medicalRecord: medicalRecord.substring(0, 500), // Truncate for URL length
      ...(nctNumber && { nct: nctNumber }),
      ...(returnUrl && { returnUrl })
    });
    const deepLinkUrl = `${baseUrl}?${deepLinkParams}`;

    const response = {
      sessionId: finalSessionId,
      interfaceUrl,
      deepLinkUrl,
      trialInfo,
      prePopulatedData: {
        medicalRecord,
        trialCriteria: criteriaToUse,
        mode: nctNumber ? 'nct-lookup' : 'manual-entry'
      },
      metadata: {
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        sessionDuration: '24 hours'
      }
    };

    return res.json(response);

  } catch (error) {
    console.error('Error in pre-populate:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error during pre-population'
    });
  }
});

/**
 * GET /session/:sessionId
 * Retrieve stored session data for pre-population
 */
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!global.clinicalTrialSessions || !global.clinicalTrialSessions.has(sessionId)) {
      return res.status(404).json({
        error: 'Session not found or expired'
      });
    }

    const sessionData = global.clinicalTrialSessions.get(sessionId);
    
    // Check if session is expired
    if (new Date() > new Date(sessionData.expiresAt)) {
      global.clinicalTrialSessions.delete(sessionId);
      return res.status(410).json({
        error: 'Session has expired'
      });
    }

    // Return session data without sensitive information
    const { sessionId: _, createdAt, expiresAt, ...publicData } = sessionData;
    
    return res.json({
      ...publicData,
      metadata: {
        sessionId,
        createdAt,
        expiresAt,
        timeRemaining: Math.max(0, new Date(expiresAt) - new Date())
      }
    });

  } catch (error) {
    console.error('Error retrieving session:', error);
    return res.status(500).json({
      error: 'Internal server error while retrieving session'
    });
  }
});

/**
 * DELETE /session/:sessionId
 * Delete a session (cleanup)
 */
router.delete('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!global.clinicalTrialSessions || !global.clinicalTrialSessions.has(sessionId)) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    global.clinicalTrialSessions.delete(sessionId);
    
    return res.json({
      message: 'Session deleted successfully',
      sessionId
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    return res.status(500).json({
      error: 'Internal server error while deleting session'
    });
  }
});

/**
 * POST /populate
 * Lightweight endpoint that accepts only a medical record and returns a simplified interface
 * 
 * Request body:
 *   {
 *     "medicalRecord": "string containing patient medical record"
 *   }
 * 
 * Response: HTML interface with medical record pre-populated but hidden
 */
router.post('/populate', async (req, res) => {
  try {
    const { medicalRecord } = req.body;

    // Validate required field
    if (!medicalRecord || typeof medicalRecord !== 'string') {
      return res.status(400).json({
        error: 'Field "medicalRecord" is required and must be a string.'
      });
    }

    // Generate a simple session ID for tracking
    const sessionId = `populate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Read the simplified template
    const templatePath = path.join(__dirname, '../public/populate-interface.html');
    let htmlTemplate;
    
    try {
      htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      // Fallback: generate inline HTML if template not found
      htmlTemplate = generateSimplifiedHTML();
    }
    
    // Replace placeholders with actual data
    const populatedHTML = htmlTemplate
      .replace(/{{MEDICAL_RECORD}}/g, escapeHtml(medicalRecord))
      .replace(/{{SESSION_ID}}/g, sessionId)
      .replace(/{{TIMESTAMP}}/g, new Date().toISOString());
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Session-ID', sessionId);
    
    return res.send(populatedHTML);

  } catch (error) {
    console.error('Error in populate endpoint:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error during population'
    });
  }
});

/**
 * Escape HTML characters to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generate simplified HTML template inline (fallback)
 */
function generateSimplifiedHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clinical Trial Matcher - Simplified</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .hidden { display: none; }
        .card { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .btn { background: #007aff; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Clinical Trial Matcher</h1>
        <div id="medicalRecordData" class="hidden">{{MEDICAL_RECORD}}</div>
        <div class="card">
            <h2>Select Trial Criteria</h2>
            <p>Please specify the trial criteria to evaluate.</p>
            <button class="btn" onclick="alert('Interface simplified - implement trial selection')">Select Trial</button>
        </div>
    </div>
</body>
</html>`;
}

/**
 * GET /generate-link
 * Generate deep links for direct access without session storage
 * 
 * Query parameters:
 *   - nct: NCT number (optional)
 *   - medicalRecord: Medical record text (optional, truncated for URL length)
 *   - returnUrl: URL to return to after evaluation (optional)
 * 
 * Response:
 *   {
 *     "deepLinkUrl": "URL with query parameters",
 *     "sessionUrl": "URL for creating a session (for longer data)",
 *     "qrCode": "Data URL for QR code (future enhancement)"
 *   }
 */
router.get('/generate-link', (req, res) => {
  try {
    const { nct, medicalRecord, returnUrl } = req.query;
    
    if (!nct && !medicalRecord) {
      return res.status(400).json({
        error: 'At least one of "nct" or "medicalRecord" parameters is required'
      });
    }
    
    // Build deep link URL
    const baseUrl = `${req.protocol}://${req.get('host')}/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html`;
    const params = new URLSearchParams();
    
    if (nct) {
      if (!nct.match(/^NCT\d{8}$/)) {
        return res.status(400).json({
          error: 'Invalid NCT number format. Expected format: NCT00000000'
        });
      }
      params.set('nct', nct);
    }
    
    if (medicalRecord) {
      // Truncate medical record for URL length limitations
      const truncatedRecord = medicalRecord.substring(0, 500);
      params.set('medicalRecord', truncatedRecord);
      
      if (medicalRecord.length > 500) {
        console.warn(`Medical record truncated from ${medicalRecord.length} to 500 characters for deep link`);
      }
    }
    
    if (returnUrl) {
      params.set('returnUrl', returnUrl);
    }
    
    const deepLinkUrl = `${baseUrl}?${params}`;
    
    // Provide session-based URL as alternative for longer data
    const sessionEndpoint = `${req.protocol}://${req.get('host')}/charm/apps/clinical-trial-matcher/pre-populate`;
    
    const response = {
      deepLinkUrl,
      sessionEndpoint,
      usage: {
        deepLink: 'Direct URL access - limited to ~500 chars of medical record',
        session: 'POST to /pre-populate for unlimited data with 24-hour session'
      },
      metadata: {
        urlLength: deepLinkUrl.length,
        maxRecommendedLength: 2000,
        medicalRecordTruncated: medicalRecord ? medicalRecord.length > 500 : false
      }
    };
    
    return res.json(response);
    
  } catch (error) {
    console.error('Error generating link:', error);
    return res.status(500).json({
      error: 'Internal server error while generating link'
    });
  }
});

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions() {
  if (!global.clinicalTrialSessions) return;
  
  const now = new Date();
  for (const [sessionId, sessionData] of global.clinicalTrialSessions.entries()) {
    if (new Date(sessionData.expiresAt) < now) {
      global.clinicalTrialSessions.delete(sessionId);
    }
  }
}

/**
 * GET /info
 * Returns app information and configuration
 */
router.get('/info', (req, res) => {
  const appConfig = getAppConfig('clinical-trial-matcher-app');
  res.json({
    app: 'Clinical Trial Matcher',
    version: appConfig?.version || '1.0.0',
    description: appConfig?.description || 'AI-powered clinical trial eligibility assessment',
    features: appConfig?.features || [],
    models: appConfig?.models || {},
    endpoints: [
      {
        method: 'POST',
        path: '/clinical-trial-matcher',
        description: 'Basic patient eligibility evaluation (criterion-by-criterion)'
      },
      {
        method: 'POST',
        path: '/comprehensive-match',
        description: 'Advanced eligibility evaluation with comprehensive AI reasoning'
      },
      {
        method: 'POST',
        path: '/comprehensive-match-nct',
        description: 'Comprehensive NCT-based matching with detailed clinical analysis'
      },
      {
        method: 'POST',
        path: '/match-to-nct',
        description: 'Basic NCT-based patient matching'
      },
      {
        method: 'GET',
        path: '/nct/:nctNumber',
        description: 'Get full trial information for NCT number'
      },
      {
        method: 'GET',
        path: '/nct/:nctNumber/eligibility',
        description: 'Get eligibility criteria for NCT number'
      },
      {
        method: 'GET',
        path: '/search',
        description: 'Search trials by NCT pattern'
      },
      {
        method: 'GET',
        path: '/database-stats',
        description: 'Get clinical trials database statistics'
      },
      {
        method: 'POST',
        path: '/pre-populate',
        description: 'Pre-populate interface with medical record and trial data'
      },
      {
        method: 'POST',
        path: '/populate',
        description: 'Lightweight endpoint returning HTML interface with hidden medical record'
      },
      {
        method: 'GET',
        path: '/session/:sessionId',
        description: 'Retrieve stored session data'
      },
      {
        method: 'DELETE',
        path: '/session/:sessionId',
        description: 'Delete a session'
      },
      {
        method: 'GET',
        path: '/generate-link',
        description: 'Generate deep links for direct access'
      },
      {
        method: 'GET', 
        path: '/info',
        description: 'Get app information and configuration'
      }
    ]
  });
});

/**
 * Advanced clinical trial eligibility evaluation using comprehensive AI reasoning
 * @param {Object} chatModel - The chat model instance
 * @param {string} medicalRecord - Patient medical record text
 * @param {Object} trialCriteria - Trial criteria object with inclusion/exclusion arrays
 * @param {Object} trialInfo - Additional trial information for context
 * @returns {Object} Comprehensive evaluation result
 */
async function evaluateEligibilityComprehensive(chatModel, medicalRecord, trialCriteria, trialInfo = {}) {
  const prompt = `You are a highly experienced clinical research coordinator with expertise in patient eligibility assessment for clinical trials. You will perform a comprehensive analysis of a patient's medical record against specific trial criteria.

CLINICAL TRIAL CONTEXT:
${trialInfo.title ? `Study: ${trialInfo.title}` : ''}
${trialInfo.condition ? `Condition: ${trialInfo.condition}` : ''}
${trialInfo.phase ? `Phase: ${trialInfo.phase}` : ''}
${trialInfo.ageRange ? `Age Range: ${trialInfo.ageRange}` : ''}

PATIENT MEDICAL RECORD:
${medicalRecord}

INCLUSION CRITERIA:
${trialCriteria.inclusionCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

EXCLUSION CRITERIA:
${trialCriteria.exclusionCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

INSTRUCTIONS:
Perform a comprehensive eligibility assessment. For each criterion, evaluate the patient's eligibility and provide detailed clinical reasoning. Consider interactions between criteria, medical contraindications, and safety implications.

Respond with EXACTLY this JSON format (no additional text):
{
  "overallAssessment": {
    "eligibility": "eligible|ineligible|requires-review",
    "confidence": 0.85,
    "clinicalSummary": "Brief clinical summary of key findings",
    "safetyAssessment": "Assessment of safety considerations"
  },
  "criteriaAnalysis": [
    {
      "criterion": "exact criterion text",
      "type": "inclusion|exclusion",
      "status": "matched|non-matched|insufficient-data",
      "confidence": 0.85,
      "clinicalReasoning": "Detailed medical reasoning",
      "evidenceFromRecord": "Specific quotes or findings from the record",
      "missingInformation": "What additional data would help confirm this assessment"
    }
  ],
  "clinicalRecommendations": {
    "nextSteps": "Recommended next steps for enrollment consideration",
    "additionalTests": "Suggested additional tests or evaluations needed",
    "riskFactors": "Key risk factors to monitor",
    "alternativeTrials": "Brief suggestion of what type of trials might be more suitable if ineligible"
  }
}

EVALUATION GUIDELINES:
- "matched": Criterion is clearly satisfied by the medical record
- "non-matched": Criterion is clearly not satisfied 
- "insufficient-data": Insufficient information to make determination
- For exclusion criteria: "matched" means patient IS excluded
- Be thorough in clinical reasoning, considering medical nuances
- Confidence should reflect clinical certainty (0.0-1.0)
- Consider drug interactions, contraindications, and safety
- Quote specific portions of the medical record as evidence
- Be conservative with eligibility - err on the side of safety`;

  try {
    const content = await chatModel.replyTo(prompt);
    const contentStr = typeof content === 'string' ? content : content.trim();
    
    let evaluation;
    try {
      evaluation = JSON.parse(contentStr);
    } catch (parseError) {
      console.warn('Failed to parse comprehensive evaluation:', contentStr);
      // Fallback to basic evaluation
      return await evaluateBasicCriteria(chatModel, medicalRecord, trialCriteria);
    }

    return evaluation;

  } catch (error) {
    console.error('Error in comprehensive evaluation:', error);
    // Fallback to basic evaluation
    return await evaluateBasicCriteria(chatModel, medicalRecord, trialCriteria);
  }
}

/**
 * Fallback basic evaluation method (original implementation)
 * @param {Object} chatModel - The chat model instance
 * @param {string} medicalRecord - Patient medical record text
 * @param {Object} trialCriteria - Trial criteria object
 * @returns {Object} Basic evaluation result
 */
async function evaluateBasicCriteria(chatModel, medicalRecord, trialCriteria) {
  const results = [];
  
  // Process inclusion criteria
  for (const criterion of trialCriteria.inclusionCriteria) {
    const result = await evaluateCriterion(chatModel, medicalRecord, criterion, 'inclusion');
    results.push(result);
  }

  // Process exclusion criteria  
  for (const criterion of trialCriteria.exclusionCriteria) {
    const result = await evaluateCriterion(chatModel, medicalRecord, criterion, 'exclusion');
    results.push(result);
  }

  // Convert to comprehensive format
  const overallEligibility = determineOverallEligibility(results);
  
  return {
    overallAssessment: {
      eligibility: overallEligibility,
      confidence: Math.min(...results.map(r => r.confidence)),
      clinicalSummary: "Basic criterion-by-criterion evaluation performed",
      safetyAssessment: "Individual criteria evaluated for safety"
    },
    criteriaAnalysis: results.map(r => ({
      criterion: r.criterion,
      type: r.type,
      status: r.status,
      confidence: r.confidence,
      clinicalReasoning: r.reasoning,
      evidenceFromRecord: "See individual criterion evaluation",
      missingInformation: r.status === 'more-information-needed' ? "Additional clinical data needed" : "None identified"
    })),
    clinicalRecommendations: {
      nextSteps: overallEligibility === 'eligible' ? "Proceed with detailed screening" : "Review with medical team",
      additionalTests: "Standard trial screening procedures",
      riskFactors: "Monitor per protocol",
      alternativeTrials: "Consider trials with modified eligibility criteria"
    }
  };
}

/**
 * Evaluates a single criterion against the medical record (enhanced version)
 * @param {Object} chatModel - The chat model instance
 * @param {string} medicalRecord - Patient medical record text
 * @param {string} criterion - The criterion to evaluate
 * @param {string} type - 'inclusion' or 'exclusion'
 * @returns {Object} Evaluation result
 */
async function evaluateCriterion(chatModel, medicalRecord, criterion, type) {
  const prompt = `You are a clinical research coordinator evaluating patient eligibility for a clinical trial.

MEDICAL RECORD:
${medicalRecord}

CRITERION TO EVALUATE:
${criterion}

CRITERION TYPE: ${type.toUpperCase()}

Please evaluate whether this patient's medical record meets the above ${type} criterion.

Respond with EXACTLY this JSON format (no additional text):
{
  "status": "matched|non-matched|more-information-needed",
  "reasoning": "Clear explanation of your decision",
  "confidence": 0.85
}

Guidelines:
- "matched": The medical record clearly meets the criterion
- "non-matched": The medical record clearly does not meet the criterion  
- "more-information-needed": The medical record lacks sufficient information to make a determination
- Confidence should be 0.0-1.0 based on how certain you are
- Be conservative - if unclear, choose "more-information-needed"
- For exclusion criteria: "matched" means the patient IS excluded, "non-matched" means they are NOT excluded`;

  try {
    const content = await chatModel.replyTo(prompt);
    const contentStr = typeof content === 'string' ? content : content.trim();
    
    // Try to parse the JSON response
    let evaluation;
    try {
      evaluation = JSON.parse(contentStr);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.warn('Failed to parse model response as JSON:', contentStr);
      evaluation = {
        status: 'more-information-needed',
        reasoning: 'Unable to parse model response properly',
        confidence: 0.1
      };
    }

    return {
      criterion,
      type,
      status: evaluation.status,
      reasoning: evaluation.reasoning,
      confidence: evaluation.confidence
    };

  } catch (error) {
    console.error('Error evaluating criterion:', error);
    return {
      criterion,
      type,
      status: 'more-information-needed',
      reasoning: `Error during evaluation: ${error.message}`,
      confidence: 0.0
    };
  }
}

/**
 * Determines overall eligibility based on individual criterion results
 * @param {Array} results - Array of criterion evaluation results
 * @returns {string} 'eligible'|'ineligible'|'needs-review'
 */
function determineOverallEligibility(results) {
  const inclusionResults = results.filter(r => r.type === 'inclusion');
  const exclusionResults = results.filter(r => r.type === 'exclusion');

  // Check if any inclusion criteria are non-matched
  const failedInclusion = inclusionResults.some(r => r.status === 'non-matched');
  
  // Check if any exclusion criteria are matched (patient is excluded)
  const failedExclusion = exclusionResults.some(r => r.status === 'matched');

  // Check if we need more information for any criteria
  const needsMoreInfo = results.some(r => r.status === 'more-information-needed');

  if (failedInclusion || failedExclusion) {
    return 'ineligible';
  }
  
  if (needsMoreInfo) {
    return 'needs-review';
  }

  // All inclusion criteria matched and no exclusion criteria matched
  const allInclusionMatched = inclusionResults.every(r => r.status === 'matched');
  const noExclusionMatched = exclusionResults.every(r => r.status === 'non-matched');

  if (allInclusionMatched && noExclusionMatched) {
    return 'eligible';
  }

  return 'needs-review';
}

export default router;