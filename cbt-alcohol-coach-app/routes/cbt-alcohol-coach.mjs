import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { TranscriptFragment, Message } from '../../../charmonator/lib/transcript.mjs';
import { fetchChatModel } from '../../../charmonator/lib/core.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load system prompt from resources
let systemPrompt = '';
try {
    const promptPath = path.join(__dirname, '../resources/cbt-alcohol-use-disorder-prompt.md');
    systemPrompt = await fs.readFile(promptPath, 'utf8');
} catch (error) {
    console.error('❌ Failed to load CBT system prompt:', error);
    systemPrompt = 'You are a CBT-based alcohol-use disorder AI coach. Provide supportive, evidence-based guidance for alcohol recovery.';
}

// Pre-populate endpoint for creating CBT coaching sessions
router.post('/pre-populate', async (req, res) => {
    try {
        const { medicalRecord, sessionType = 'long_term', urgentContext } = req.body;
        const sessionId = `cbt-coach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🧠 Creating CBT coaching session: ${sessionId} (type: ${sessionType})`);
        
        // Create initial session data
        const sessionData = {
            sessionId,
            sessionType,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
            userProfile: {
                medicalHistory: medicalRecord || 'No medical records provided',
                sessionCount: 0,
                lastSessionDate: null,
                completedObjectives: [],
                highRiskSituations: [],
                reportedStrengths: [],
                significantOtherInvolvement: false
            },
            urgentContext: urgentContext || null,
            currentObjectives: sessionType === 'urgent' ? 
                {
                    sessionName: 'Urgent Craving Management',
                    sessionGoals: ['Navigate current craving without drinking', 'Apply immediate coping strategies'],
                    homeworkFromPreviousSession: null
                } : 
                {
                    sessionName: 'Core Session 1: Introduction to Coping Skills Training',
                    sessionGoals: ['Understand the CBT approach to alcohol recovery', 'Learn the basics of functional analysis'],
                    homeworkFromPreviousSession: null
                }
        };
        
        // Store session data (in production, this would use a proper database)
        global.cbtSessions = global.cbtSessions || {};
        global.cbtSessions[sessionId] = sessionData;
        
        const applicationUrl = `${req.protocol}://${req.get('host')}/charm/apps/cbt-alcohol-coach-app/interface?session=${sessionId}`;
        
        console.log(`✅ CBT coaching session created: ${sessionId}`);
        
        res.json({
            sessionId,
            applicationUrl,
            metadata: {
                createdAt: sessionData.createdAt,
                expiresAt: sessionData.expiresAt,
                sessionType: sessionType,
                model: 'hipaa:gpt-4.1'
            }
        });
    } catch (error) {
        console.error('❌ Error creating CBT coaching session:', error);
        res.status(500).json({ error: 'Failed to create CBT coaching session' });
    }
});

// Urgent session endpoint for immediate craving management
router.post('/urgent-session', async (req, res) => {
    try {
        const { userId, urgentContext } = req.body;
        
        // Create urgent session with minimal setup
        const result = await router.handle(Object.assign(req, {
            body: {
                sessionType: 'urgent',
                urgentContext: urgentContext || 'User experiencing craving or high-risk situation'
            }
        }), res);
        
        return result;
    } catch (error) {
        console.error('❌ Error creating urgent CBT session:', error);
        res.status(500).json({ error: 'Failed to create urgent session' });
    }
});

// Interface endpoint for the coaching web interface
router.get('/interface', async (req, res) => {
    try {
        const sessionId = req.query.session;
        
        if (!sessionId) {
            return res.status(400).send('Session ID required');
        }
        
        // Retrieve session data
        const sessionData = global.cbtSessions?.[sessionId];
        if (!sessionData) {
            return res.status(404).send('Session not found or expired');
        }
        
        console.log(`🌐 Loading CBT coaching interface for session: ${sessionId}`);
        
        // Read the HTML interface
        const htmlPath = path.join(__dirname, '../public/cbt-alcohol-coach.html');
        let html = await fs.readFile(htmlPath, 'utf8');
        
        // Inject session data
        html = html.replace('{{SESSION_ID}}', sessionId);
        html = html.replace('{{SESSION_TYPE}}', sessionData.sessionType);
        html = html.replace('{{CREATED_AT}}', sessionData.createdAt);
        
        res.send(html);
    } catch (error) {
        console.error('❌ Error loading CBT coaching interface:', error);
        res.status(500).send('Failed to load coaching interface');
    }
});

// Chat endpoint for CBT coaching conversations
router.post('/chat', async (req, res) => {
    try {
        const { sessionId, message, isFirstMessage } = req.body;
        
        if (!sessionId || !message) {
            return res.status(400).json({ error: 'Session ID and message required' });
        }
        
        const sessionData = global.cbtSessions?.[sessionId];
        if (!sessionData) {
            return res.status(404).json({ error: 'Session not found or expired' });
        }
        
        console.log(`💬 CBT coaching chat for session: ${sessionId}`);
        
        // Initialize or retrieve conversation transcript
        let transcript = sessionData.transcript || new TranscriptFragment();
        
        // Build structured first message if this is the initial interaction
        let userMessage = message;
        if (isFirstMessage) {
            const structuredContext = {
                user_id: sessionData.sessionId,
                session_type: sessionData.sessionType,
                session_history: {
                    total_sessions_completed: sessionData.userProfile.sessionCount,
                    last_session_date: sessionData.userProfile.lastSessionDate,
                    summary_of_last_session: sessionData.userProfile.lastSessionSummary || 'No previous session'
                },
                user_profile: {
                    identified_high_risk_situations: sessionData.userProfile.highRiskSituations,
                    reported_strengths: sessionData.userProfile.reportedStrengths,
                    significant_other_involvement: sessionData.userProfile.significantOtherInvolvement
                },
                completed_objectives: sessionData.userProfile.completedObjectives,
                current_objectives: sessionData.currentObjectives
            };
            
            // Add structured context as hidden system message, then user's actual message
            const contextMessage = new Message('system', JSON.stringify(structuredContext, null, 2));
            transcript = transcript.plus(contextMessage);
            userMessage = sessionData.urgentContext ? 
                `I'm experiencing a craving and need immediate help. ${message}` : 
                message;
        }
        
        // Add user message to transcript
        const userMsg = new Message('user', userMessage);
        transcript = transcript.plus(userMsg);
        
        // Get AI response using the CBT system prompt
        const chatModel = fetchChatModel('hipaa:gpt-4.1');
        
        // Prepare the conversation for the model
        let conversationText = systemPrompt + '\n\n';
        
        // Add conversation history
        for (const msg of transcript.messages) {
            conversationText += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
        }
        
        conversationText += `USER: ${userMessage}\n\nASSISTANT:`;
        
        const response = await chatModel.replyTo(conversationText);
        
        // Add AI response to transcript
        const assistantMsg = new Message('assistant', response);
        transcript = transcript.plus(assistantMsg);
        
        // Update session data
        sessionData.transcript = transcript;
        sessionData.lastActivity = new Date().toISOString();
        
        console.log(`✅ CBT coaching response generated for session: ${sessionId}`);
        
        res.json({ 
            response,
            sessionType: sessionData.sessionType,
            metadata: {
                timestamp: new Date().toISOString(),
                messageCount: transcript.messages?.length || 1
            }
        });
    } catch (error) {
        console.error('❌ Error in CBT coaching chat:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Update session profile endpoint
router.post('/update-profile', async (req, res) => {
    try {
        const { sessionId, profileUpdates } = req.body;
        
        const sessionData = global.cbtSessions?.[sessionId];
        if (!sessionData) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // Update user profile with new information
        Object.assign(sessionData.userProfile, profileUpdates);
        sessionData.lastActivity = new Date().toISOString();
        
        console.log(`📝 Updated CBT session profile: ${sessionId}`);
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error updating CBT session profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export default router;