// routes/outlive-checklist.mjs
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
if (!global.outliveChecklistSessions) {
  global.outliveChecklistSessions = new Map();
}

/**
 * POST /pre-populate
 * 
 * Creates an assessment session with pre-loaded medical records for Outlive checklist evaluation.
 * 
 * Request body:
 *   {
 *     "medicalRecord": "string containing patient medical record",
 *     "sessionId": "string (optional) - Custom session identifier",
 *     "patientContext": {
 *       "age": "number (optional)",
 *       "gender": "string (optional)",
 *       "patientName": "string (optional)"
 *     }
 *   }
 * 
 * Response:
 *   {
 *     "sessionId": "outlive-session-1234567890-abcdef123",
 *     "assessmentUrl": "http://host/charm/apps/outlive-checklist/outlive-checklist.html?session=...",
 *     "prePopulatedData": {
 *       "medicalRecord": "Patient data...",
 *       "patientContext": { ... }
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
    const { medicalRecord, sessionId, patientContext } = req.body;

    // Validate input
    if (!medicalRecord || typeof medicalRecord !== 'string') {
      return res.status(400).json({
        error: 'Medical record is required and must be a string'
      });
    }

    // Check medical record size limit
    const appConfig = getAppConfig('outlive-checklist-app');
    const maxSize = appConfig?.sessionConfig?.maxMedicalRecordSize || 100000;
    if (medicalRecord.length > maxSize) {
      return res.status(400).json({
        error: `Medical record too large. Maximum size: ${maxSize} characters`
      });
    }

    // Clean up expired sessions
    cleanupExpiredSessions();

    // Generate session ID
    const finalSessionId = sessionId || `outlive-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create expiration time (24 hours from now)
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

    // Create session data
    const sessionData = {
      sessionId: finalSessionId,
      medicalRecord,
      patientContext: patientContext || {},
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      assessmentResults: null
    };

    // Store session
    global.outliveChecklistSessions.set(finalSessionId, sessionData);

    // Generate assessment URL
    const protocol = req.protocol;
    const host = req.get('host');
    const assessmentUrl = `${protocol}://${host}/charm/apps/outlive-checklist/outlive-checklist.html?session=${finalSessionId}`;

    // Response
    res.json({
      sessionId: finalSessionId,
      assessmentUrl,
      prePopulatedData: {
        medicalRecord,
        patientContext: patientContext || {}
      },
      metadata: {
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        sessionDuration: "24 hours"
      }
    });

    console.log(`Created Outlive assessment session: ${finalSessionId}`);

  } catch (error) {
    console.error('Error creating Outlive assessment session:', error);
    res.status(500).json({
      error: 'Internal server error while creating assessment session'
    });
  }
});

/**
 * GET /session/:sessionId
 * 
 * Retrieves stored session data for assessment interface initialization.
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Clean up expired sessions
    cleanupExpiredSessions();

    // Retrieve session
    const sessionData = global.outliveChecklistSessions.get(sessionId);

    if (!sessionData) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    if (now > expiresAt) {
      global.outliveChecklistSessions.delete(sessionId);
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
      assessmentResults: sessionData.assessmentResults,
      metadata: {
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        timeRemaining
      }
    });

  } catch (error) {
    console.error('Error retrieving Outlive assessment session:', error);
    res.status(500).json({
      error: 'Internal server error while retrieving session'
    });
  }
});

/**
 * POST /assess
 * 
 * Performs Outlive checklist assessment on patient medical records.
 */
router.post('/assess', async (req, res) => {
  try {
    const { sessionId, model } = req.body;

    // Validate input
    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    // Retrieve session
    const sessionData = global.outliveChecklistSessions.get(sessionId);
    if (!sessionData) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    if (now > expiresAt) {
      global.outliveChecklistSessions.delete(sessionId);
      return res.status(410).json({
        error: 'Session has expired'
      });
    }

    // Get app config for model selection
    const appConfig = getAppConfig('outlive-checklist-app');
    const selectedModel = model || appConfig?.models?.default || 'hipaa:o3-high';

    // Validate HIPAA compliance if required
    if (appConfig?.security?.requireHIPAACompliantModels && !selectedModel.startsWith('hipaa:')) {
      return res.status(400).json({
        error: 'HIPAA-compliant model required for medical assessments'
      });
    }

    console.log(`Performing Outlive assessment for session ${sessionId} using model ${selectedModel}`);

    // Get the chat model
    const chatModel = fetchChatModel(selectedModel);

    // Perform the assessment
    const assessmentResults = await performOutliveAssessment(
      chatModel, 
      sessionData.medicalRecord, 
      sessionData.patientContext
    );

    // Store results in session
    sessionData.assessmentResults = assessmentResults;
    global.outliveChecklistSessions.set(sessionId, sessionData);

    // Return results
    res.json({
      sessionId,
      assessmentResults,
      model: selectedModel,
      timestamp: new Date().toISOString(),
      metadata: {
        sessionActive: true,
        assessmentComplete: true
      }
    });

  } catch (error) {
    console.error('Error in Outlive assessment endpoint:', error);
    res.status(500).json({
      error: 'Internal server error during assessment processing',
      details: error.message
    });
  }
});

/**
 * DELETE /session/:sessionId
 * 
 * Manually delete an assessment session.
 */
router.delete('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionExists = global.outliveChecklistSessions.has(sessionId);
    if (sessionExists) {
      global.outliveChecklistSessions.delete(sessionId);
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
    const appConfig = getAppConfig('outlive-checklist-app');
    
    res.json({
      name: appConfig?.name || 'Outlive Longevity Checklist',
      description: appConfig?.description || 'Health assessment based on Dr. Peter Attia\'s Outlive book',
      version: appConfig?.version || '1.0.0',
      features: appConfig?.features || [],
      models: appConfig?.models || {},
      checklistCategories: appConfig?.checklistCategories || [],
      sessionStats: {
        activeSessions: global.outliveChecklistSessions.size,
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
 * Perform comprehensive Outlive checklist assessment
 */
async function performOutliveAssessment(chatModel, medicalRecord, patientContext) {
  const outliveChecklist = getOutliveChecklist();
  const results = {
    overall: {
      totalItems: 0,
      itemsFound: 0,
      itemsMissing: 0,
      itemsPartial: 0,
      completionPercentage: 0
    },
    categories: {},
    recommendations: [],
    missingTests: []
  };

  // Assess each category
  for (const [categoryName, categoryItems] of Object.entries(outliveChecklist)) {
    console.log(`Assessing category: ${categoryName}`);
    
    const categoryResult = await assessCategory(
      chatModel, 
      medicalRecord, 
      categoryName, 
      categoryItems, 
      patientContext
    );
    
    results.categories[categoryName] = categoryResult;
    
    // Update overall stats
    results.overall.totalItems += categoryResult.totalItems;
    results.overall.itemsFound += categoryResult.itemsFound;
    results.overall.itemsMissing += categoryResult.itemsMissing;
    results.overall.itemsPartial += categoryResult.itemsPartial;
    
    // Collect missing tests
    results.missingTests.push(...categoryResult.missingTests);
  }

  // Calculate completion percentage
  results.overall.completionPercentage = Math.round(
    (results.overall.itemsFound / results.overall.totalItems) * 100
  );

  // Generate personalized recommendations
  results.recommendations = await generateRecommendations(
    chatModel, 
    medicalRecord, 
    results, 
    patientContext
  );

  return results;
}

/**
 * Assess a specific category of the Outlive checklist
 */
async function assessCategory(chatModel, medicalRecord, categoryName, categoryItems, patientContext) {
  const prompt = `You are a medical AI assistant analyzing patient records against the Outlive longevity checklist by Dr. Peter Attia.

PATIENT MEDICAL RECORDS:
${medicalRecord}

PATIENT CONTEXT:
${JSON.stringify(patientContext, null, 2)}

CATEGORY TO ASSESS: ${categoryName}

CHECKLIST ITEMS FOR THIS CATEGORY:
${categoryItems.map((item, index) => `${index + 1}. ${item.test}\n   Rationale: ${item.rationale}`).join('\n\n')}

Please analyze the patient's medical records and determine the status of each checklist item.

For EACH item, respond with EXACTLY this JSON format:
{
  "categoryName": "${categoryName}",
  "items": [
    {
      "testName": "Exact test name from checklist",
      "status": "found|missing|partial",
      "evidence": "Specific evidence from records or 'Not found in records'",
      "details": "Additional relevant details or recommendations",
      "lastDate": "Date of most recent test if found, or null",
      "values": "Relevant test values if available, or null"
    }
  ],
  "categoryStatus": "excellent|good|needs-attention|poor",
  "categoryNotes": "Overall assessment of this category"
}

Guidelines:
- "found": Test clearly documented in records with recent results
- "missing": No evidence of this test in the records
- "partial": Some related testing but not the specific comprehensive test mentioned
- Be specific about what evidence you found
- Include actual test values and dates when available
- Focus on the specific tests mentioned in the Outlive checklist`;

  try {
    const responseContent = await chatModel.replyTo(prompt);
    const assessment = parseJsonFromResponse(responseContent);
    
    // Process the assessment results
    const categoryResult = {
      categoryName,
      categoryStatus: assessment.categoryStatus,
      categoryNotes: assessment.categoryNotes,
      totalItems: categoryItems.length,
      itemsFound: 0,
      itemsMissing: 0,
      itemsPartial: 0,
      items: assessment.items,
      missingTests: []
    };

    // Count statuses and collect missing tests
    assessment.items.forEach(item => {
      switch (item.status) {
        case 'found':
          categoryResult.itemsFound++;
          break;
        case 'missing':
          categoryResult.itemsMissing++;
          categoryResult.missingTests.push({
            testName: item.testName,
            category: categoryName,
            rationale: categoryItems.find(ci => ci.test === item.testName)?.rationale || '',
            priority: determinePriority(item.testName, categoryName)
          });
          break;
        case 'partial':
          categoryResult.itemsPartial++;
          break;
      }
    });

    return categoryResult;

  } catch (error) {
    console.error(`Error assessing category ${categoryName}:`, error);
    // Return a fallback result
    return {
      categoryName,
      categoryStatus: 'needs-attention',
      categoryNotes: 'Error occurred during assessment',
      totalItems: categoryItems.length,
      itemsFound: 0,
      itemsMissing: categoryItems.length,
      itemsPartial: 0,
      items: categoryItems.map(item => ({
        testName: item.test,
        status: 'missing',
        evidence: 'Assessment error',
        details: 'Unable to complete assessment',
        lastDate: null,
        values: null
      })),
      missingTests: categoryItems.map(item => ({
        testName: item.test,
        category: categoryName,
        rationale: item.rationale,
        priority: 'medium'
      }))
    };
  }
}

/**
 * Generate personalized recommendations based on assessment results
 */
async function generateRecommendations(chatModel, medicalRecord, assessmentResults, patientContext) {
  const prompt = `You are a medical AI assistant providing personalized health recommendations based on the Outlive longevity checklist assessment.

PATIENT CONTEXT:
${JSON.stringify(patientContext, null, 2)}

ASSESSMENT RESULTS SUMMARY:
- Total completion: ${assessmentResults.overall.completionPercentage}%
- Items found: ${assessmentResults.overall.itemsFound}
- Items missing: ${assessmentResults.overall.itemsMissing}
- Items partial: ${assessmentResults.overall.itemsPartial}

MISSING TESTS (TOP PRIORITIES):
${assessmentResults.missingTests.slice(0, 10).map(test => `- ${test.testName} (${test.category})`).join('\n')}

Based on this assessment, provide 5-8 personalized recommendations prioritized by importance for longevity and health span.

Respond with EXACTLY this JSON format:
{
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "Category name",
      "title": "Brief recommendation title",
      "description": "Detailed explanation of what to do and why",
      "timeframe": "When to implement (e.g., 'Within 3 months', 'Next annual physical')",
      "rationale": "Why this is important based on Outlive principles"
    }
  ]
}

Focus on:
1. The highest-impact missing tests
2. Preventive measures for the "Four Horsemen" (ASCVD, cancer, neurodegeneration, T2D)
3. Actionable steps the patient can take
4. Tests that should be prioritized based on age/gender
5. Lifestyle modifications supported by the missing data`;

  try {
    const responseContent = await chatModel.replyTo(prompt);
    const recommendations = parseJsonFromResponse(responseContent);
    return recommendations.recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [
      {
        priority: 'high',
        category: 'General',
        title: 'Consult with Healthcare Provider',
        description: 'Review these assessment results with your healthcare provider to create a personalized testing and prevention plan.',
        timeframe: 'Within 1 month',
        rationale: 'Professional medical guidance is essential for implementing longevity strategies safely and effectively.'
      }
    ];
  }
}

/**
 * Determine priority level for missing tests
 */
function determinePriority(testName, category) {
  const highPriorityTests = [
    'ApoB', 'Lp(a)', 'OGTT with Insulin', 'CT Angiogram', 'APOE Genotype', 'VO₂ max'
  ];
  
  const mediumPriorityTests = [
    'ALT', 'Uric Acid', 'DEXA Scan', 'PSA', 'Colonoscopy'
  ];

  if (highPriorityTests.some(test => testName.includes(test))) {
    return 'high';
  } else if (mediumPriorityTests.some(test => testName.includes(test))) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Get the Outlive checklist structure
 */
function getOutliveChecklist() {
  return {
    "Metabolic Health": [
      {
        test: "Comprehensive Lipoprotein Panel including ApoB and Lp(a)",
        rationale: "ApoB-containing particles are a more direct measure of cardiovascular disease risk than standard cholesterol panels. Lp(a) is the most prevalent hereditary risk factor for heart disease."
      },
      {
        test: "Oral Glucose Tolerance Test (OGTT) with Insulin Measurements",
        rationale: "Can reveal hyperinsulinemia, an early sign of insulin resistance that precedes high blood glucose and is a risk factor for all chronic diseases."
      },
      {
        test: "Alanine Aminotransferase (ALT) Levels",
        rationale: "Elevated ALT can indicate nonalcoholic fatty liver disease (NAFLD), a precursor to severe metabolic problems including type 2 diabetes."
      },
      {
        test: "Uric Acid Levels",
        rationale: "High uric acid is linked to high blood pressure and can promote fat storage, serving as an early warning for metabolic dysfunction."
      },
      {
        test: "Continuous Glucose Monitoring (CGM) Data",
        rationale: "Provides real-time feedback on blood glucose responses to food, exercise, and sleep, invaluable for personalizing nutritional strategies."
      },
      {
        test: "DEXA Scan for Visceral Adipose Tissue (VAT)",
        rationale: "Visceral fat is highly inflammatory and strongly linked to increased risk for cancer and cardiovascular disease, regardless of total body weight."
      }
    ],
    "Cardiovascular Health": [
      {
        test: "CT Angiogram",
        rationale: "Preferred over calcium scan as it can identify both calcified and noncalcified plaque. Soft plaque is often more dangerous and precedes calcification."
      },
      {
        test: "Comprehensive ApoB and Lp(a) Panel",
        rationale: "More accurate assessment of cardiovascular risk than traditional cholesterol panels."
      },
      {
        test: "Blood Pressure Monitoring",
        rationale: "Controlling blood pressure is a non-negotiable first step in reducing cardiovascular risk as hypertension directly damages arterial endothelium."
      }
    ],
    "Cancer Risk (Early Detection)": [
      {
        test: "Colonoscopy",
        rationale: "Recommended starting at age 40 for average-risk individuals. Allows both detection and removal of precancerous polyps in a single procedure."
      },
      {
        test: "Mammogram, Ultrasound, and/or MRI for Breast Cancer",
        rationale: "Multi-modal approach to breast cancer screening improves accuracy and reduces false positives beyond simple mammography."
      },
      {
        test: "PSA test with additional parameters (velocity, density, free PSA)",
        rationale: "PSA velocity and density provide a more nuanced picture of prostate cancer risk, helping avoid unnecessary biopsies."
      },
      {
        test: "Low-Dose CT Scan for Lung Cancer",
        rationale: "Recommended for wider population than just smokers, as 15% of lung cancers occur in never-smokers."
      },
      {
        test: "Liquid Biopsy (e.g., Galleri test)",
        rationale: "Can detect trace amounts of cancer-cell DNA in blood, potentially identifying cancers much earlier than imaging."
      }
    ],
    "Neurodegenerative Disease Risk": [
      {
        test: "APOE Genotype Test",
        rationale: "Knowing APOE status, particularly e4 allele, is critical for understanding Alzheimer's risk and developing personalized prevention strategies."
      },
      {
        test: "Comprehensive Cognitive and Memory Testing Battery",
        rationale: "Assesses various cognitive domains and can distinguish normal age-related changes from early signs of neurodegenerative diseases."
      },
      {
        test: "Hearing Test",
        rationale: "Hearing loss is strongly associated with cognitive decline and Alzheimer's disease, possibly due to social withdrawal and reduced brain stimulation."
      },
      {
        test: "Sleep Study to rule out sleep apnea",
        rationale: "Sleep apnea is prevalent, underdiagnosed, and significantly increases risk for both cardiovascular disease and dementia."
      }
    ],
    "Physical Fitness and Function": [
      {
        test: "VO₂ max Test",
        rationale: "Perhaps the single most powerful marker for longevity. Low cardiorespiratory fitness carries greater mortality risk than smoking."
      },
      {
        test: "DEXA Scan for Bone Mineral Density and Lean Muscle Mass",
        rationale: "Screening for osteopenia/osteoporosis should begin earlier than standard recommendations. Low muscle mass is associated with higher mortality risk."
      },
      {
        test: "Grip Strength Test",
        rationale: "Excellent proxy for overall strength and strongly inversely associated with dementia incidence and all-cause mortality."
      }
    ]
  };
}

/**
 * Clean up expired sessions from memory
 */
function cleanupExpiredSessions() {
  const now = new Date();
  let cleanedCount = 0;

  for (const [sessionId, sessionData] of global.outliveChecklistSessions.entries()) {
    const expiresAt = new Date(sessionData.expiresAt);
    if (now > expiresAt) {
      global.outliveChecklistSessions.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired Outlive assessment sessions`);
  }
}

/**
 * Parse JSON from AI response, handling markdown code blocks
 */
function parseJsonFromResponse(responseContent) {
  let jsonString = responseContent.trim();
  
  // Remove markdown code blocks if present
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Clean up any remaining whitespace
  jsonString = jsonString.trim();
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse JSON from response:', error);
    console.error('Original response:', responseContent);
    console.error('Cleaned JSON string:', jsonString);
    throw new Error(`Invalid JSON response: ${error.message}`);
  }
}

export default router;