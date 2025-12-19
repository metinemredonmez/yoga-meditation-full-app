import {
  PrismaClient,
  Prisma,
  HallucinationCheckType,
  HallucinationSeverity,
} from '@prisma/client';
import { chatCompletion, createEmbedding, moderateContent, ChatMessage } from './openaiService';

const prisma = new PrismaClient();

export interface HallucinationCheckResult {
  severity: HallucinationSeverity;
  score: number; // 0-1, higher = more likely hallucination
  confidence: number; // 0-1
  findings: HallucinationFinding[];
  isHallucination: boolean;
  correctedContent?: string;
}

export interface HallucinationFinding {
  type: string;
  description: string;
  evidence?: string;
  location?: string; // Where in the content
  severity: HallucinationSeverity;
}

interface GroundingDoc {
  title: string;
  content: string;
  similarity: number;
}

// ==================== MAIN CHECK FUNCTIONS ====================

// Comprehensive hallucination check
export const checkForHallucination = async (
  content: string,
  options: {
    contentType?: string;
    originalPrompt?: string;
    originalContext?: Record<string, unknown>;
    sourceEntityType?: string;
    sourceEntityId?: string;
    checkTypes?: HallucinationCheckType[];
    userId?: string;
  } = {}
): Promise<HallucinationCheckResult> => {
  const checkTypes = options.checkTypes || [
    HallucinationCheckType.FACT_CHECK,
    HallucinationCheckType.SOURCE_GROUNDING,
    HallucinationCheckType.SELF_CONSISTENCY,
  ];

  const allFindings: HallucinationFinding[] = [];
  let maxScore = 0;

  // Run different check types
  for (const checkType of checkTypes) {
    let result: HallucinationCheckResult;

    switch (checkType) {
      case HallucinationCheckType.FACT_CHECK:
        result = await runFactCheck(content, options.originalContext);
        break;
      case HallucinationCheckType.SOURCE_GROUNDING:
        result = await runSourceGroundingCheck(content, options.userId);
        break;
      case HallucinationCheckType.SELF_CONSISTENCY:
        result = await runSelfConsistencyCheck(content, options.originalPrompt, options.userId);
        break;
      case HallucinationCheckType.CONSISTENCY_CHECK:
        result = await runConsistencyCheck(content, options.originalContext);
        break;
      case HallucinationCheckType.RETRIEVAL_AUGMENTED:
        result = await runRAGCheck(content, options.originalContext, options.userId);
        break;
      default:
        continue;
    }

    allFindings.push(...result.findings);
    maxScore = Math.max(maxScore, result.score);
  }

  // Determine severity
  const severity = determineSeverity(maxScore, allFindings);

  // Calculate confidence based on number of checks
  const confidence = Math.min(0.95, 0.5 + checkTypes.length * 0.15);

  const result: HallucinationCheckResult = {
    severity,
    score: maxScore,
    confidence,
    findings: allFindings,
    isHallucination: maxScore > 0.5,
  };

  // Try to correct if hallucination detected
  if (result.isHallucination && allFindings.length > 0) {
    try {
      result.correctedContent = await correctContent(
        content,
        allFindings,
        options.userId
      );
    } catch {
      // Correction failed, continue without
    }
  }

  // Save check result to database
  await prisma.hallucination_checks.create({
    data: {
      content,
      contentType: options.contentType || 'unknown',
      sourceEntityType: options.sourceEntityType,
      sourceEntityId: options.sourceEntityId,
      checkType: checkTypes[0] || HallucinationCheckType.FACT_CHECK,
      severity: result.severity,
      score: result.score,
      confidence: result.confidence,
      findings: result.findings as unknown as Prisma.InputJsonValue,
      originalPrompt: options.originalPrompt,
      originalContext: options.originalContext as Prisma.InputJsonValue | undefined,
      checkedByModel: 'gpt-4',
      wasFiltered: result.isHallucination,
      wasCorrected: !!result.correctedContent,
      correctedContent: result.correctedContent,
    },
  });

  return result;
};

// ==================== CHECK IMPLEMENTATIONS ====================

// Fact check using LLM
const runFactCheck = async (
  content: string,
  context?: Record<string, unknown>
): Promise<HallucinationCheckResult> => {
  const systemPrompt = `You are a fact-checking expert for yoga and wellness content.
Your task is to identify any factual inaccuracies, made-up information, or misleading claims.

Focus on:
1. Yoga pose instructions and safety claims
2. Health and medical claims
3. Historical or cultural claims about yoga
4. Scientific claims about benefits

Be especially careful about:
- Dangerous incorrect instructions
- Unsubstantiated medical claims
- Made-up pose names or traditions`;

  const userPrompt = `Analyze this content for factual accuracy:

${content}

${context ? `Context: ${JSON.stringify(context)}` : ''}

Respond in JSON format:
{
  "score": 0-1 (likelihood of hallucination),
  "findings": [
    {
      "type": "factual_error|misleading|unverifiable|dangerous",
      "description": "description of the issue",
      "evidence": "the problematic text",
      "severity": "NONE|LOW|MEDIUM|HIGH|CRITICAL"
    }
  ]
}`;

  const response = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.1, maxTokens: 1000 }
  );

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        severity: HallucinationSeverity.NONE,
        score: result.score || 0,
        confidence: 0.8,
        findings: (result.findings || []).map((f: HallucinationFinding) => ({
          ...f,
          severity: f.severity as HallucinationSeverity || HallucinationSeverity.LOW,
        })),
        isHallucination: result.score > 0.5,
      };
    }
  } catch {
    // Parse failed
  }

  return {
    severity: HallucinationSeverity.NONE,
    score: 0,
    confidence: 0.5,
    findings: [],
    isHallucination: false,
  };
};

// Source grounding check using embeddings
const runSourceGroundingCheck = async (
  content: string,
  userId?: string
): Promise<HallucinationCheckResult> => {
  // Get content embedding
  const contentEmbedding = await createEmbedding(content, userId);

  // Find relevant grounding documents
  const documents = await prisma.grounding_documents.findMany({
    where: {
      isActive: true,
      embedding: { not: Prisma.DbNull },
    },
    take: 100,
  });

  if (documents.length === 0) {
    return {
      severity: HallucinationSeverity.NONE,
      score: 0,
      confidence: 0.3, // Low confidence without grounding docs
      findings: [],
      isHallucination: false,
    };
  }

  // Calculate similarities
  const similarities = documents.map((doc) => {
    const embedding = doc.embedding as number[];
    return {
      doc,
      similarity: cosineSimilarity(contentEmbedding, embedding),
    };
  });

  // Get best matches
  const bestMatches = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  const maxSimilarity = bestMatches[0]?.similarity || 0;

  // If no good matches, content might be hallucinated
  if (maxSimilarity < 0.6) {
    return {
      severity: HallucinationSeverity.MEDIUM,
      score: 1 - maxSimilarity,
      confidence: 0.7,
      findings: [
        {
          type: 'ungrounded',
          description: 'Content could not be verified against trusted sources',
          severity: HallucinationSeverity.MEDIUM,
        },
      ],
      isHallucination: maxSimilarity < 0.5,
    };
  }

  // Verify content against best matches
  const groundingCheck = await verifyAgainstSources(
    content,
    bestMatches.map((m) => ({
      title: m.doc.title,
      content: m.doc.content,
      similarity: m.similarity,
    })),
    userId
  );

  return groundingCheck;
};

// Self-consistency check (ask same question multiple times)
const runSelfConsistencyCheck = async (
  content: string,
  originalPrompt?: string,
  userId?: string
): Promise<HallucinationCheckResult> => {
  if (!originalPrompt) {
    return {
      severity: HallucinationSeverity.NONE,
      score: 0,
      confidence: 0.3,
      findings: [],
      isHallucination: false,
    };
  }

  // Generate multiple responses to same prompt
  const responses: string[] = [];

  for (let i = 0; i < 3; i++) {
    const response = await chatCompletion(
      [{ role: 'user', content: originalPrompt }],
      { temperature: 0.7, maxTokens: 500 },
      userId
    );
    responses.push(response.content);
  }

  // Compare original content with new responses
  const consistencyPrompt = `Compare the original response with alternative responses.
Identify any facts or claims in the original that are NOT present or contradicted in the alternatives.

Original response:
${content}

Alternative responses:
${responses.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}

Respond in JSON:
{
  "consistencyScore": 0-1 (1 = fully consistent),
  "inconsistencies": [
    {
      "claim": "the inconsistent claim",
      "issue": "description of the inconsistency"
    }
  ]
}`;

  const analysis = await chatCompletion(
    [{ role: 'user', content: consistencyPrompt }],
    { temperature: 0.1, maxTokens: 500 },
    userId
  );

  try {
    const jsonMatch = analysis.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      const inconsistencies = result.inconsistencies || [];

      return {
        severity: inconsistencies.length > 0 ? HallucinationSeverity.MEDIUM : HallucinationSeverity.NONE,
        score: 1 - (result.consistencyScore || 1),
        confidence: 0.75,
        findings: inconsistencies.map((i: { claim: string; issue: string }) => ({
          type: 'inconsistent',
          description: i.issue,
          evidence: i.claim,
          severity: HallucinationSeverity.MEDIUM,
        })),
        isHallucination: result.consistencyScore < 0.6,
      };
    }
  } catch {
    // Parse failed
  }

  return {
    severity: HallucinationSeverity.NONE,
    score: 0,
    confidence: 0.5,
    findings: [],
    isHallucination: false,
  };
};

// Consistency check against provided context
const runConsistencyCheck = async (
  content: string,
  context?: Record<string, unknown>
): Promise<HallucinationCheckResult> => {
  if (!context) {
    return {
      severity: HallucinationSeverity.NONE,
      score: 0,
      confidence: 0.3,
      findings: [],
      isHallucination: false,
    };
  }

  const prompt = `Check if the generated content is consistent with the provided context.
Identify any information in the content that contradicts or is not supported by the context.

Context:
${JSON.stringify(context, null, 2)}

Generated content:
${content}

Respond in JSON:
{
  "isConsistent": true/false,
  "score": 0-1 (1 = fully consistent),
  "inconsistencies": [
    {
      "contentClaim": "what the content says",
      "contextFact": "what the context says",
      "severity": "LOW|MEDIUM|HIGH"
    }
  ]
}`;

  const response = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.1, maxTokens: 500 }
  );

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);

      return {
        severity: result.isConsistent ? HallucinationSeverity.NONE : HallucinationSeverity.HIGH,
        score: 1 - (result.score || 1),
        confidence: 0.85,
        findings: (result.inconsistencies || []).map((i: { contentClaim: string; contextFact: string; severity: string }) => ({
          type: 'context_mismatch',
          description: `Content says "${i.contentClaim}" but context says "${i.contextFact}"`,
          severity: (i.severity as HallucinationSeverity) || HallucinationSeverity.MEDIUM,
        })),
        isHallucination: !result.isConsistent,
      };
    }
  } catch {
    // Parse failed
  }

  return {
    severity: HallucinationSeverity.NONE,
    score: 0,
    confidence: 0.5,
    findings: [],
    isHallucination: false,
  };
};

// RAG-based check
const runRAGCheck = async (
  content: string,
  context?: Record<string, unknown>,
  userId?: string
): Promise<HallucinationCheckResult> => {
  // First get relevant documents
  const sourceGrounding = await runSourceGroundingCheck(content, userId);

  // Then check consistency with context
  const consistencyCheck = await runConsistencyCheck(content, context);

  // Combine results
  const combinedScore = (sourceGrounding.score + consistencyCheck.score) / 2;
  const allFindings = [...sourceGrounding.findings, ...consistencyCheck.findings];

  return {
    severity: determineSeverity(combinedScore, allFindings),
    score: combinedScore,
    confidence: Math.max(sourceGrounding.confidence, consistencyCheck.confidence),
    findings: allFindings,
    isHallucination: combinedScore > 0.5,
  };
};

// ==================== HELPER FUNCTIONS ====================

// Verify content against source documents
const verifyAgainstSources = async (
  content: string,
  sources: GroundingDoc[],
  userId?: string
): Promise<HallucinationCheckResult> => {
  const sourceText = sources
    .map((s) => `[${s.title}]: ${s.content}`)
    .join('\n\n');

  const prompt = `Verify if the claims in the content are supported by the source documents.

Source Documents:
${sourceText}

Content to verify:
${content}

Identify any claims that are:
1. Not supported by any source
2. Contradicted by sources
3. Exaggerated beyond what sources say

Respond in JSON:
{
  "verificationScore": 0-1 (1 = fully verified),
  "unsupportedClaims": [
    {
      "claim": "the unsupported claim",
      "issue": "not_found|contradicted|exaggerated",
      "severity": "LOW|MEDIUM|HIGH"
    }
  ]
}`;

  const response = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.1, maxTokens: 800 },
    userId
  );

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      const claims = result.unsupportedClaims || [];

      return {
        severity: claims.length > 0 ? HallucinationSeverity.MEDIUM : HallucinationSeverity.NONE,
        score: 1 - (result.verificationScore || 1),
        confidence: 0.8,
        findings: claims.map((c: { claim: string; issue: string; severity: string }) => ({
          type: c.issue,
          description: `Claim: "${c.claim}"`,
          severity: (c.severity as HallucinationSeverity) || HallucinationSeverity.MEDIUM,
        })),
        isHallucination: result.verificationScore < 0.6,
      };
    }
  } catch {
    // Parse failed
  }

  return {
    severity: HallucinationSeverity.NONE,
    score: 0,
    confidence: 0.5,
    findings: [],
    isHallucination: false,
  };
};

// Correct hallucinated content
const correctContent = async (
  content: string,
  findings: HallucinationFinding[],
  userId?: string
): Promise<string> => {
  const findingsText = findings
    .map((f) => `- ${f.type}: ${f.description}`)
    .join('\n');

  const prompt = `The following content contains potential inaccuracies.
Please rewrite it to remove or correct the problematic parts while maintaining the overall message.

Original content:
${content}

Issues found:
${findingsText}

Instructions:
1. Remove any unverifiable claims
2. Correct factual errors
3. Add appropriate hedging language where needed
4. Keep the helpful and informative tone

Provide only the corrected content, no explanations.`;

  const response = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.3, maxTokens: 1000 },
    userId
  );

  return response.content;
};

// Determine severity based on score and findings
const determineSeverity = (
  score: number,
  findings: HallucinationFinding[]
): HallucinationSeverity => {
  // Check for critical findings
  if (findings.some((f) => f.severity === HallucinationSeverity.CRITICAL)) {
    return HallucinationSeverity.CRITICAL;
  }

  // Check for dangerous content
  if (findings.some((f) => f.type === 'dangerous')) {
    return HallucinationSeverity.CRITICAL;
  }

  // Score-based severity
  if (score >= 0.8) return HallucinationSeverity.HIGH;
  if (score >= 0.5) return HallucinationSeverity.MEDIUM;
  if (score >= 0.2) return HallucinationSeverity.LOW;
  return HallucinationSeverity.NONE;
};

// Cosine similarity
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (!a || !b || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dotProduct += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// ==================== GROUNDING DOCUMENT MANAGEMENT ====================

// Add grounding document
export const addGroundingDocument = async (data: {
  title: string;
  content: string;
  sourceType: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
}) => {
  // Create content hash for deduplication
  const contentHash = createContentHash(data.content);

  // Check if already exists
  const existing = await prisma.grounding_documents.findUnique({
    where: { contentHash },
  });

  if (existing) {
    return existing;
  }

  // Create embedding
  const embedding = await createEmbedding(data.content, data.userId);

  return prisma.grounding_documents.create({
    data: {
      title: data.title,
      content: data.content,
      contentHash,
      sourceType: data.sourceType,
      sourceUrl: data.sourceUrl,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
      embedding,
      embeddingModel: 'text-embedding-ada-002',
    },
  });
};

// Update grounding document
export const updateGroundingDocument = async (
  documentId: string,
  data: {
    title?: string;
    content?: string;
    isActive?: boolean;
    userId?: string;
  }
) => {
  const updateData: Record<string, unknown> = {};

  if (data.title) updateData.title = data.title;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (data.content) {
    updateData.content = data.content;
    updateData.contentHash = createContentHash(data.content);
    updateData.embedding = await createEmbedding(data.content, data.userId);
  }

  return prisma.grounding_documents.update({
    where: { id: documentId },
    data: updateData,
  });
};

// Get grounding documents by type
export const getGroundingDocuments = async (
  sourceType?: string,
  limit: number = 100
) => {
  return prisma.grounding_documents.findMany({
    where: {
      isActive: true,
      ...(sourceType && { sourceType }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

// Seed yoga-specific grounding documents
export const seedYogaGroundingDocuments = async () => {
  const documents = [
    {
      title: 'Basic Yoga Safety Guidelines',
      content: `
        Always warm up before practicing yoga poses.
        Never force your body into a position that causes pain.
        Modifications are available for most poses.
        Consult a healthcare provider before starting yoga if you have injuries or health conditions.
        Stay hydrated during practice.
        Use props like blocks and straps when needed.
        Listen to your body and rest when needed.
        Avoid inverted poses if you have high blood pressure, glaucoma, or neck injuries.
      `,
      sourceType: 'yoga_safety',
    },
    {
      title: 'Contraindications for Common Poses',
      content: `
        Headstand (Sirsasana): Avoid with neck injuries, high blood pressure, glaucoma, pregnancy after first trimester.
        Shoulderstand (Sarvangasana): Avoid with neck injuries, high blood pressure, menstruation (traditionally).
        Wheel Pose (Urdhva Dhanurasana): Avoid with wrist injuries, back injuries, high blood pressure.
        Forward Folds: Modify with bent knees if you have hamstring injuries or lower back issues.
        Twists: Be gentle with spinal issues; avoid deep twists during pregnancy.
      `,
      sourceType: 'contraindications',
    },
    {
      title: 'Scientific Benefits of Yoga',
      content: `
        Yoga has been shown to reduce stress and anxiety through activation of the parasympathetic nervous system.
        Regular practice can improve flexibility, balance, and strength.
        Studies suggest yoga may help with chronic pain management.
        Breathing practices (pranayama) can improve respiratory function.
        Yoga may help improve sleep quality.
        Note: Yoga is complementary to medical treatment, not a replacement.
      `,
      sourceType: 'research',
    },
  ];

  for (const doc of documents) {
    await addGroundingDocument(doc);
  }

  return { added: documents.length };
};

// Create simple hash for content deduplication
const createContentHash = (content: string): string => {
  // Simple hash using reduce
  const hash = content.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  return hash.toString(16);
};

// ==================== VALIDATION FUNCTIONS ====================

// Validate AI response before sending to user
export const validateAIResponse = async (
  content: string,
  responseType: string,
  responseId?: string,
  userId?: string
): Promise<{
  isValid: boolean;
  validatedContent: string;
  warnings: string[];
}> => {
  const warnings: string[] = [];
  let validatedContent = content;

  // 1. Content moderation
  const moderation = await moderateContent(content);
  const isSafe = !moderation.flagged;
  if (!isSafe) {
    return {
      isValid: false,
      validatedContent: '',
      warnings: ['Content flagged by moderation'],
    };
  }

  // 2. Hallucination check
  const hallucinationCheck = await checkForHallucination(content, {
    contentType: responseType,
    userId,
  });

  if (hallucinationCheck.isHallucination) {
    if (hallucinationCheck.severity === HallucinationSeverity.CRITICAL) {
      return {
        isValid: false,
        validatedContent: '',
        warnings: ['Critical hallucination detected'],
      };
    }

    if (hallucinationCheck.correctedContent) {
      validatedContent = hallucinationCheck.correctedContent;
      warnings.push('Content was corrected to remove potential inaccuracies');
    } else {
      warnings.push('Content may contain unverified information');
    }
  }

  // 3. Check for PII
  const piiCheck = checkForPII(content);
  if (piiCheck.hasPII) {
    validatedContent = removePII(validatedContent);
    warnings.push('Personal information was removed');
  }

  // Save validation result
  await prisma.ai_response_validations.create({
    data: {
      responseId: responseId || 'unknown',
      responseType,
      content,
      checks: {
        moderation: isSafe,
        hallucination: hallucinationCheck,
        pii: piiCheck,
      } as unknown as Prisma.InputJsonValue,
      qualityScore: 1 - hallucinationCheck.score,
      relevanceScore: 0.8, // Would need context to calculate
      safetyScore: isSafe ? 1 : 0,
      factualityScore: 1 - hallucinationCheck.score,
      hasHallucination: hallucinationCheck.isHallucination,
      hasUnsafeContent: !isSafe,
      hasOffTopic: false,
      hasPII: piiCheck.hasPII,
      wasBlocked: !isSafe || hallucinationCheck.severity === HallucinationSeverity.CRITICAL,
      wasModified: validatedContent !== content,
      modifiedContent: validatedContent !== content ? validatedContent : null,
      validatorModel: 'gpt-4',
    },
  });

  return {
    isValid: true,
    validatedContent,
    warnings,
  };
};

// Check for personally identifiable information
const checkForPII = (content: string): { hasPII: boolean; types: string[] } => {
  const patterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  };

  const types: string[] = [];

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      types.push(type);
    }
  }

  return {
    hasPII: types.length > 0,
    types,
  };
};

// Remove PII from content
const removePII = (content: string): string => {
  return content
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]');
};

// ==================== STATISTICS ====================

// Get hallucination statistics
export const getHallucinationStats = async (
  startDate: Date,
  endDate: Date
) => {
  const checks = await prisma.hallucination_checks.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      severity: true,
      score: true,
      wasFiltered: true,
      wasCorrected: true,
      contentType: true,
    },
  });

  const totalChecks = checks.length;
  const hallucinationsDetected = checks.filter((c) => c.score > 0.5).length;
  const filtered = checks.filter((c) => c.wasFiltered).length;
  const corrected = checks.filter((c) => c.wasCorrected).length;

  const severityCounts = {
    NONE: checks.filter((c) => c.severity === HallucinationSeverity.NONE).length,
    LOW: checks.filter((c) => c.severity === HallucinationSeverity.LOW).length,
    MEDIUM: checks.filter((c) => c.severity === HallucinationSeverity.MEDIUM).length,
    HIGH: checks.filter((c) => c.severity === HallucinationSeverity.HIGH).length,
    CRITICAL: checks.filter((c) => c.severity === HallucinationSeverity.CRITICAL).length,
  };

  return {
    totalChecks,
    hallucinationsDetected,
    hallucinationRate: totalChecks > 0 ? hallucinationsDetected / totalChecks : 0,
    filtered,
    corrected,
    severityCounts,
    averageScore: checks.reduce((sum, c) => sum + c.score, 0) / totalChecks || 0,
  };
};
