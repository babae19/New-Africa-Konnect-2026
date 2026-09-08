const pool = require('../database/db');

// ─── OpenAI / ChatGPT API Configuration ───────────────────────────────────────
const OpenAI = require('openai');
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';

const getOpenAI = () => {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing from environment configuration.');
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

/**
 * Call Gemini API for text (and optional image) generation
 */
async function callGeminiAPI(promptStr, imageData = null) {
    const content = [{ type: 'input_text', text: promptStr }];
    if (imageData) content.push({ type: 'input_image', image_url: imageData, detail: 'auto' });
    const response = await getOpenAI().responses.create({
        model: OPENAI_MODEL,
        input: [{ role: 'user', content }],
        max_output_tokens: 4096
    });
    if (!response.output_text) throw new Error('ChatGPT returned an empty response.');
    return response.output_text;
}

/**
 * Call Gemini API with streaming for real-time text output
 */
async function callGeminiAPIStream(promptStr, onChunk) {
    const stream = await getOpenAI().responses.create({ model: OPENAI_MODEL, input: promptStr, stream: true });
    for await (const event of stream) {
        if (event.type === 'response.output_text.delta' && event.delta) onChunk(event.delta);
    }
}

/**
 * Robust JSON extraction from AI response
 * Handles markdown code blocks, preamble, and postamble
 */
function extractJSON(text) {
    if (!text) return null;
    
    try {
        // 1. Try to find JSON inside markdown code blocks
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            try {
                return JSON.parse(codeBlockMatch[1].trim());
            } catch (e) {
                // Ignore and try other methods
            }
        }
        
        // 2. Try to find the first '{' and last '}'
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
                const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
                return JSON.parse(jsonCandidate);
            } catch (e) {
                let start = 0;
                while ((start = text.indexOf('{', start)) !== -1) {
                    let end = text.lastIndexOf('}');
                    while (end > start) {
                        try {
                            const candidate = text.substring(start, end + 1);
                            const parsed = JSON.parse(candidate);
                            if (parsed) return parsed;
                        } catch (err) {
                            // Continue searching
                        }
                        end = text.lastIndexOf('}', end - 1);
                    }
                    start++;
                }
            }
        }

        // 3. Try to find JSON array
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            try {
                return JSON.parse(text.substring(firstBracket, lastBracket + 1));
            } catch (e) {
                // Continue
            }
        }
        
        // 4. Last resort: try to parse the whole string
        return JSON.parse(text.trim());
    } catch (e) {
        console.error("JSON Extraction Error:", e.message, "Original text snippet:", text.substring(0, 100));
        return null;
    }
}

const aiController = {
    // Robust JSON extraction helper
    extractJSON,

    // Match Experts
    matchExperts: async (req, res) => {
        try {
            const { projectDescription, requirements } = req.body;

            // 1. Fetch all vetted experts
            const expertsResult = await pool.query(
                `SELECT u.id, u.name, ep.title, ep.skills, ep.bio, ep.hourly_rate 
                 FROM users u
                 JOIN expert_profiles ep ON u.id = ep.user_id
                 WHERE u.role = 'expert' AND ep.vetting_status = 'verified'`
            );
            const experts = expertsResult.rows;

            if (experts.length === 0) {
                return res.json({ matches: [] });
            }

            // 2. Construct Prompt
            const prompt = `
                You are an expert technical recruiter matching candidates to a project.
                
                PROJECT REQUIREMENTS:
                ${projectDescription}
                ${requirements ? `Requirements: ${requirements}` : ''}

                CANDIDATES:
                ${JSON.stringify(experts.map(e => ({
                id: e.id,
                name: e.name,
                title: e.title,
                skills: e.skills,
                bio: e.bio
            })))}

                TASK:
                Identify the top 3 matches based on skills and experience.
                
                OUTPUT FORMAT:
                Return ONLY a JSON object with a "matches" array.
                Each match should have:
                - "expert_id": The ID of the expert (UUID)
                - "score": Compatibility score (0-100)
                - "reason": A concise reason for the match
            `;

            const text = await callGeminiAPI(prompt);
            let parsedResult = extractJSON(text);

            if (!parsedResult || !parsedResult.matches) {
                console.warn("AI Match failed. Falling back to top verified experts.");
                parsedResult = {
                    matches: experts.slice(0, 3).map(e => ({
                        expert_id: e.id,
                        score: 95,
                        reason: "Matched based on verified status and broad technical alignment."
                    }))
                };
            }

            // 4. Merge with expert details
            const enrichedMatches = (parsedResult.matches || []).map(match => {
                const expert = experts.find(e => e.id === match.expert_id);
                return expert ? { ...expert, ...match } : null;
            }).filter(Boolean);

            res.json({ matches: enrichedMatches });

        } catch (error) {
            console.error('AI Match Error:', error.message);
            try {
                const expertsResult = await pool.query(
                    `SELECT u.id, u.name, ep.title, ep.skills, ep.bio, ep.hourly_rate 
                     FROM users u JOIN expert_profiles ep ON u.id = ep.user_id
                     WHERE u.role = 'expert' AND ep.vetting_status = 'verified' LIMIT 3`
                );
                const fallbackMatches = expertsResult.rows.map(e => ({
                    ...e, score: 90, reason: "Default platform recommendation."
                }));
                return res.json({ matches: fallbackMatches });
            } catch (dbErr) {
                res.json({ matches: [] });
            }
        }
    },

    // Generate Chat Response (Blocking)
    chat: async (req, res) => {
        try {
            const { message, context } = req.body;

            const systemPrompt = `
                You are the Africa Konnect AI Assistant, the official premium expert guide for Africa's leading platform connecting global businesses with vetted African talent.
                
                PLATFORM KNOWLEDGE BASE:
                - Mission: Bridging the gap between African technical talent and global innovation. Our vision is "Made in Africa" as a global standard of excellence.
                - Impact: 2,500+ Vetted Experts, 30+ Countries served, 10,000+ Projects completed, 98% Client satisfaction.
                - Pricing: 
                  - Starter: Free to join, 1 project post, 5% platform fee.
                  - Growth: $49/month, Unlimited projects, Priority matching, 3% platform fee.
                  - Enterprise: Custom pricing, White-glove matching, SLA guarantees, 1% platform fee.
                - How It Works (6 Steps):
                  1. Register & Profile
                  2. Company Vault: Securely upload brand assets and technical requirements.
                  3. AI Match Engine: Proprietary algorithm for technical/cultural matching.
                  4. Integrated Interview: Built-in video platform with whiteboard.
                  5. Smart Contract: Instant, fair contracts with IP protection.
                  6. Escrow & Collaborate: Milestone-based secure payments.
                - Security: Enterprise-grade security. TLS 1.3/AES-256 encryption. PCI-DSS Level 1 payment compliance via Stripe/PayPal. MFA enabled.
                - Legal: Latest updates to Privacy Policy and Terms of Service (Jan 1, 2026). 
                - Commitment: We pledge a portion of income to scholarships and learning resources (computers, textbooks) for African schools.
                - Contact: 
                  - USA: +1 (404) 713-2428 | Waterford Way, Conyers, GA.
                  - Sierra Leone: +232 88 580 063 | Tech Avenue, Freetown.
                  - Emails: hello@africakonnect.com, support@africakonnect.com.

                YOUR IDENTITY:
                - Helpful, professional, culturally aware, and supportive.
                - Expert in African tech ecosystem, freelancing, and collaboration.
                
                CONTEXT:
                Current Page: ${context?.currentPath || 'Unknown'}
                User: ${context?.userName || 'Guest'} (${context?.userRole || 'General Reader'})
                Page Info: ${context?.pageTitle || 'Africa Konnect Platform'}

                GUIDELINES:
                - Always reference specific platform features (e.g., "Company Vault", "Escrow Protection") when explaining how things work.
                - If asked about contracts, suggest our "Smart Contract" tool.
                - Keep responses concise (under 150 words) unless detail is specifically requested.
                - Use markdown for lists and bold text.
            `;

            const fullPrompt = systemPrompt + "\n\nUser Message: " + message;
            const reply = await callGeminiAPI(fullPrompt);

            res.json({ reply });

        } catch (error) {
            console.error('AI Chat Error:', error.message);
            res.status(500).json({ error: error.message || 'Failed to generate AI response' });
        }
    },

    // Streaming Chat Response (True SSE Stream via Gemini)
    chatStream: async (req, res) => {
        try {
            const { message, context } = req.body;

            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');

            // Send initial thinking signal
            res.write(`data: ${JSON.stringify({ text: "", status: "thinking" })}\n\n`);

            const systemPrompt = `
                You are the Africa Konnect AI Assistant. Provide helpful, platform-specific information.
                Platform Context: Vetted African Talent, Escrow Protection, Company Vault, Smart Contracts.
                Current Page: ${context?.currentPath || 'General'}
                User: ${context?.userName || 'User'} (${context?.userRole || 'User'})
            `;
            const fullPrompt = systemPrompt + "\n\nUser: " + message;

            // Handle client disconnect
            let isClosed = false;
            req.on('close', () => {
                isClosed = true;
            });

            try {
                // Use Gemini streaming for true real-time output
                await callGeminiAPIStream(fullPrompt, (chunk) => {
                    if (!isClosed) {
                        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
                    }
                });
            } catch (streamErr) {
                // Fallback: if streaming fails, try non-streaming and simulate
                console.warn('Gemini stream failed, falling back to non-stream:', streamErr.message);
                const fullText = await callGeminiAPI(fullPrompt);
                
                if (!isClosed) {
                    const words = fullText.split(' ');
                    for (let i = 0; i < words.length; i++) {
                        if (isClosed) break;
                        const chunk = words[i] + (i === words.length - 1 ? "" : " ");
                        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
                        await new Promise(r => setTimeout(r, words.length > 100 ? 20 : 50));
                    }
                }
            }

            if (!isClosed) {
                res.write('data: [DONE]\n\n');
                res.end();
            }

        } catch (error) {
            console.error('AI Stream Error:', error.message);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    },

    // Draft Contract
    draftContract: async (req, res) => {
        try {
            const { projectName, clientName, expertName, rate, deliverables, duration } = req.body;

            const prompt = `
                Draft a professional, legally-sound independent contractor agreement for a freelance engagement on Africa Konnect.
                
                PROJECT DETAILS:
                - Project Name: ${projectName}
                - Client: ${clientName}
                - Expert: ${expertName}
                - Payment Rate: $${rate}/hr
                - Estimated Duration: ${duration || 'TBD'}
                - Key Deliverables: ${deliverables || 'Specific services as defined in project milestones'}

                REQUIREMENTS:
                1. Professional, standard contract language.
                2. Explicit sections for Parties, Services, Compensation, Intellectual Property, and Confidentiality.
                3. Clear Markdown formatting with H1, H2, and Bullet points.
                4. Tone: Serious and authoritative.
            `;

            const contract = await callGeminiAPI(prompt);
            res.json({ contract });

        } catch (error) {
            console.error('AI Contract Error:', error.message);
            
            const { projectName, clientName, expertName, rate, duration } = req.body;
            const fallbackContract = `
# Independent Contractor Agreement
**Project:** ${projectName || 'TBD'}
**Client:** ${clientName || 'TBD'} 
**Expert:** ${expertName || 'TBD'}

## 1. Services
The Expert agrees to provide technical services according to the project specifications defined on the Africa Konnect platform.

## 2. Compensation
The Client agrees to compensate the Expert at a rate of **$${rate || 'TBD'}/hr** for an estimated duration of **${duration || 'TBD'}**, securely managed via the platform Escrow.

## 3. Confidentiality & IP
All work product developed belongs to the Client upon final payment. Both parties agree to maintain strict confidentiality regarding proprietary business information.

*(Note: AI drafting is temporarily unavailable. This is a standard boilerplate template.)*
            `;
            
            res.json({ contract: fallbackContract.trim() });
        }
    },

    // AI Project Generator
    generateProjectDetails: async (req, res) => {
        try {
            const { title, description } = req.body;
            const idea = title || req.body.idea;

            if (!idea && !description) return res.status(400).json({ error: "No title or description provided" });

            const prompt = `
                You are a senior project architect at Africa Konnect. 
                ${description ? `Refine and expand the following project description: "${description}" (Title: "${title}")` : `Generate a detailed project structure for the following idea: "${title}"`}.
                
                REQUIREMENTS:
                1. Professional title and comprehensive description (at least 250 words for description).
                2. At least 4 key milestones with titles and descriptions.
                3. Estimated budget in USD (as a single number).
                4. Estimated duration (e.g., "3 months", "6 weeks").
                5. Tech stack list (at least 5 relevant technologies).

                OUTPUT FORMAT:
                Return ONLY a valid JSON object with the following keys:
                - "title": string
                - "description": string
                - "milestones": array of { "title": string, "description": string }
                - "min_budget": number (value only)
                - "max_budget": number (value only, slightly higher than min_budget)
                - "estimated_duration": string
                - "techStack": array of strings
                
                Do not include any preamble or postamble text.
            `;

            const text = await callGeminiAPI(prompt);
            let parsedResult = extractJSON(text);

            if (!parsedResult) {
                console.warn("AI Generation failed. Falling back to placeholder scope.");
                parsedResult = {
                    title: idea.substring(0, 50) + " Project",
                    description: `This is a manually initiated project based on: "${idea}". Please edit the description to add more requirements.`,
                    milestones: [
                        { title: "Requirements Gathering", description: "Define technical scope and finalize project roadmap." },
                        { title: "Initial Development", description: "Build core features and foundational infrastructure." },
                        { title: "Testing & Refinement", description: "Comprehensive QA and bug fixing phase." },
                        { title: "Final Launch", description: "Global deployment and initial user onboarding." }
                    ],
                    min_budget: 1500,
                    max_budget: 2500,
                    estimated_duration: "4 weeks",
                    techStack: ["React", "Node.js", "PostgreSQL", "TailwindCSS", "AWS"]
                };
            }

            res.json(parsedResult);
        } catch (error) {
            console.error('AI Project Gen Error:', error.message);
            const { title, description } = req.body;
            res.json({
                title: title?.substring(0, 50) || "Project Specification",
                description: description || title || "Project scope needs manual refinement.",
                milestones: [{ title: "Phase 1: Discovery", description: "Initial phase focusing on requirements and setup." }],
                min_budget: 1000,
                max_budget: 2000,
                estimated_duration: "1 month",
                techStack: []
            });
        }
    },

    // AI Proposal Generator
    generateProposal: async (req, res) => {
        try {
            const { project, expert } = req.body;

            const prompt = `Expert: ${expert?.name || 'Expert'} (${expert?.title || 'Professional'})\nProject: ${project?.title || 'Project'}\n\nDraft a professional project proposal emphasizing the expert's suitability for the project requirements.`;

            const proposal = await callGeminiAPI(prompt);
            res.json({ proposal });
        } catch (error) {
            console.error('AI Proposal Gen Error:', error.message);
            res.json({ proposal: `I am highly interested in the ${req.body.project?.title || 'project'} and believe my experience strongly aligns with your requirements. I am ready to start immediately.` });
        }
    },

    // AI Interview Generator
    generateInterviewQuestions: async (req, res) => {
        try {
            const { project, expert } = req.body;

            const prompt = `Generate 5 technical interview questions for ${expert?.name || 'the expert'} regarding project "${project?.title || 'the project'}".`;

            const questions = await callGeminiAPI(prompt);
            res.json({ questions });
        } catch (error) {
            console.error('AI Interview Gen Error:', error.message);
            res.json({ questions: "1. Can you describe your past experience with similar projects?\n2. What is your preferred communication style?\n3. How do you handle tight deadlines?" });
        }
    },

    // AI Collaboration Suggestions
    getCollaborationSuggestions: async (req, res) => {
        try {
            const { project } = req.body;

            const prompt = `
                Generate a roadmap for this project:
                Title: ${project?.title || ''}
                Description: ${project?.description || ''}
                
                TASK:
                1. Create a logical sequence of milestones.
                2. Break down each milestone into specific, actionable tasks.
                3. Provide 10 distinct, professional tasks in total across all milestones.

                OUTPUT FORMAT:
                Return ONLY a valid JSON object with:
                1. "milestones": array of { "title": string, "description": string }
                2. "tasks": array of { "title": string, "description": string }
                
                No preamble or postamble.
            `;

            const text = await callGeminiAPI(prompt);
            let parsedResult = extractJSON(text);

            if (!parsedResult) {
                console.warn("AI Generation failed. Falling back to default milestones.");
                parsedResult = {
                    milestones: [
                        { title: "Project Kickoff", description: "Initial requirements gathering." },
                        { title: "Development Phase", description: "Main feature implementation." },
                        { title: "Delivery", description: "Final testing and handover." }
                    ],
                    tasks: [
                        { title: "Setup workspace", description: "Initialize environment." },
                        { title: "Review specs", description: "Client and expert agree on scope." }
                    ]
                };
            }

            res.json(parsedResult);
        } catch (error) {
            console.error('AI Collab Suggestions Error:', error.message);
            res.json({
                milestones: [],
                tasks: []
            });
        }
    },

    // AI Bid Analysis
    analyzeBids: async (req, res) => {
        try {
            const { project, bids } = req.body;
            if (!project || !bids || bids.length === 0) {
                return res.status(400).json({ error: "Missing project or bids for analysis" });
            }

            const prompt = `
                You are a senior technical project manager at Africa Konnect. 
                Your task is to analyze and compare these bids for a client.
                
                PROJECT:
                Title: ${project.title}
                Description: ${project.description}
                Budget Range: $${project.min_budget} - $${project.max_budget}
                
                BIDS:
                ${JSON.stringify(bids.map(b => ({
                id: b.id,
                expertName: b.expert_name,
                expertTitle: b.expert_title,
                bidAmount: b.bid_amount,
                timeline: b.proposed_timeline,
                coverLetter: b.cover_letter?.substring(0, 300)
            })))}

                TASK:
                1. Rank the top 3 bidders.
                2. Explain WHY each is a good fit (technical alignment, value, timeline).
                3. Highlight any risks for each.
                4. Provide a final recommendation.
                
                OUTPUT:
                Professional, data-driven reasoning in Markdown format.
            `;

            const analysis = await callGeminiAPI(prompt);
            res.json({ analysis });

        } catch (error) {
            console.error('AI Bid Analysis Error:', error.message);
            
            const { bids } = req.body;
            let fallbackAnalysis = "### AI Analysis Temporarily Unavailable\n\n*Here is a summary of your bids:*\n\n";
            
            if (bids && bids.length > 0) {
                bids.slice(0, 3).forEach((b, idx) => {
                    fallbackAnalysis += `**${idx + 1}. ${b.expert_name || 'Expert'}**\n`;
                    fallbackAnalysis += `- **Bid Amount:** $${b.bid_amount}\n`;
                    fallbackAnalysis += `- **Proposed Timeline:** ${b.proposed_timeline}\n\n`;
                });
                fallbackAnalysis += "\n**Recommendation:** Please review the top bidder's profile and message them to discuss technical alignment directly.";
            }

            res.json({ analysis: fallbackAnalysis });
        }
    },

    // AI Document Analyzer (Vision-enabled via Gemini multimodal)
    analyzeDocument: async (req, res) => {
        try {
            const { fileData } = req.body;
            if (!fileData) return res.status(400).json({ error: "No file data provided" });

            const prompt = `
                You are a senior project analyst. 
                Analyze the provided document (which might be an image of a project brief or requirements list) and extract a detailed project specification.
                
                REQUIREMENTS:
                1. Professional title and comprehensive description (at least 250 words).
                2. At least 4 key milestones with titles and descriptions.
                3. Estimated budget range (min and max) in USD.
                4. Estimated duration.
                5. Tech stack list (at least 5 relevant technologies).

                OUTPUT FORMAT:
                Return ONLY a valid JSON object with:
                - "title": string
                - "description": string
                - "milestones": array of { "title": string, "description": string }
                - "min_budget": number
                - "max_budget": number
                - "estimated_duration": string
                - "techStack": array of strings
                
                If you cannot read the document or it is not a project brief, fallback to a sensible generic project specification based on any keywords you see.
            `;

            const text = await callGeminiAPI(prompt, fileData);
            const result = extractJSON(text);

            if (!result) {
                return res.status(500).json({ error: "Failed to parse AI document analysis" });
            }

            res.json(result);
        } catch (error) {
            console.error('AI Document Analysis Error:', error.message);
            res.status(500).json({ error: error.message || 'Failed to analyze document' });
        }
    }
};

module.exports = aiController;
