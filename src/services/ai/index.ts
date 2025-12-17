// AI Services Index
// Sprint 26: AI Recommendations & AI Services System

// OpenAI Core Services
export {
  getClient,
  chatCompletion,
  createEmbedding,
  moderateContent,
  trackUsage,
  ChatMessage,
  ChatCompletionOptions,
} from './openaiService';

// Text-to-Speech Services (OpenAI)
export {
  generateSpeech,
  generateSpeechAndSave,
  getAvailableVoices,
  estimateCost as estimateTTSCost,
  createVoiceOverJob,
  processVoiceOverJob,
  getVoiceOverJob,
  getUserVoiceOverJobs,
  processPendingVoiceOverJobs,
  TTSOptions,
  OpenAIVoice,
} from './ttsService';

// Speech-to-Text Services (OpenAI Whisper)
export {
  transcribeAudio,
  transcribeAudioFile,
  createTranscriptionJob,
  processTranscriptionJob,
  getTranscriptionJob,
  getUserTranscriptionJobs,
  processPendingTranscriptionJobs,
  detectLanguage,
  extractSegments,
  TranscriptionOptions,
  TranscriptionResult,
  TranscriptionSegment,
  TranscriptionWord,
} from './sttService';

// ElevenLabs TTS Services
export {
  getElevenLabsVoices,
  syncElevenLabsVoices,
  getVoice as getElevenLabsVoice,
  getActiveVoices as getActiveElevenLabsVoices,
  generateElevenLabsSpeech,
  generateElevenLabsSpeechAndSave,
  createElevenLabsJob,
  processElevenLabsJob,
  getElevenLabsJob,
  getUserElevenLabsJobs,
  processPendingElevenLabsJobs,
  getElevenLabsUsageStats,
  setVoiceYogaCategory,
  getRecommendedVoice,
  ElevenLabsVoiceSettings,
  ElevenLabsTTSOptions,
} from './elevenLabsService';

// Recommendation Services
export {
  generateRecommendations,
  getPersonalizedFeed,
  getContinueWatching,
  recordRecommendationView,
  recordRecommendationClick,
  recordRecommendationDismiss,
  getSimilarContent,
  refreshAllRecommendations,
  cleanupExpiredRecommendations,
} from './recommendationService';

// Chat/Conversation Services
export {
  createConversation,
  getConversation,
  getUserConversations,
  sendMessage,
  sendVoiceMessage,
  generateResponse,
  deleteConversation,
  getConversationMessages,
  buildUserContext,
  buildClassContext,
  getSystemPrompt,
} from './chatService';

// Daily Insight Services
export {
  generateDailyInsight,
  getDailyInsight,
  markInsightViewed,
  getInsightHistory,
  generateInsightAudio,
  generateAllDailyInsights,
} from './insightService';

// Workflow Engine (LangGraph-like)
export {
  // Workflow CRUD
  createWorkflow,
  getWorkflow,
  getWorkflowBySlug,
  updateWorkflowStatus,
  // Node Management
  addNode,
  updateNode,
  deleteNode,
  // Edge Management
  addEdge,
  deleteEdge,
  // Execution
  startWorkflowExecution,
  executeWorkflow,
  getExecution,
  getUserExecutions,
  resumeExecution,
  cancelExecution,
  // Types
  WorkflowState,
  NodeResult,
  WorkflowContext,
} from './workflowEngine';

// Hallucination Detection Services
export {
  checkForHallucination,
  validateAIResponse,
  addGroundingDocument,
  updateGroundingDocument,
  getGroundingDocuments,
  seedYogaGroundingDocuments,
  getHallucinationStats,
  HallucinationCheckResult,
  HallucinationFinding,
} from './hallucinationService';

// Service factory for unified access
export const AIServices = {
  // Core
  chat: {
    completion: async (messages: import('./openaiService').ChatMessage[], options?: import('./openaiService').ChatCompletionOptions, userId?: string) => {
      const { chatCompletion } = await import('./openaiService');
      return chatCompletion(messages, options, userId);
    },
    moderate: async (content: string) => {
      const { moderateContent } = await import('./openaiService');
      return moderateContent(content);
    },
  },

  // TTS (unified interface for OpenAI and ElevenLabs)
  tts: {
    generateOpenAI: async (text: string, options?: import('./ttsService').TTSOptions, userId?: string) => {
      const { generateSpeechAndSave } = await import('./ttsService');
      return generateSpeechAndSave(text, options, userId);
    },
    generateElevenLabs: async (text: string, options: import('./elevenLabsService').ElevenLabsTTSOptions, userId?: string) => {
      const { generateElevenLabsSpeechAndSave } = await import('./elevenLabsService');
      return generateElevenLabsSpeechAndSave(text, options, userId);
    },
    getVoices: async (provider: 'openai' | 'elevenlabs' = 'openai') => {
      if (provider === 'elevenlabs') {
        const { getActiveVoices } = await import('./elevenLabsService');
        return getActiveVoices();
      }
      const { getAvailableVoices } = await import('./ttsService');
      return getAvailableVoices();
    },
  },

  // STT
  stt: {
    transcribe: async (audioUrl: string, options?: import('./sttService').TranscriptionOptions, userId?: string) => {
      const { transcribeAudio } = await import('./sttService');
      return transcribeAudio(audioUrl, options, userId);
    },
  },

  // Recommendations
  recommendations: {
    generate: async (userId: string, context: import('@prisma/client').RecommendationContext, limit?: number) => {
      const { generateRecommendations } = await import('./recommendationService');
      return generateRecommendations(userId, context, limit);
    },
    getFeed: async (userId: string, page?: number, limit?: number) => {
      const { getPersonalizedFeed } = await import('./recommendationService');
      return getPersonalizedFeed(userId, page, limit);
    },
  },

  // Conversations
  conversations: {
    create: async (userId: string, type: import('@prisma/client').ConversationType, context?: { contextType?: string; contextId?: string; title?: string }) => {
      const { createConversation } = await import('./chatService');
      return createConversation(userId, type, context);
    },
    sendMessage: async (conversationId: string, content: string, audioUrl?: string) => {
      const { sendMessage } = await import('./chatService');
      return sendMessage(conversationId, content, audioUrl);
    },
  },

  // Insights
  insights: {
    generateDaily: async (userId: string) => {
      const { generateDailyInsight } = await import('./insightService');
      return generateDailyInsight(userId);
    },
    get: async (userId: string, date?: Date) => {
      const { getDailyInsight } = await import('./insightService');
      return getDailyInsight(userId, date);
    },
  },

  // Workflow
  workflow: {
    execute: async (workflowId: string, input: Record<string, unknown>, userId?: string) => {
      const { startWorkflowExecution } = await import('./workflowEngine');
      return startWorkflowExecution(workflowId, input, userId, 'api');
    },
    get: async (executionId: string) => {
      const { getExecution } = await import('./workflowEngine');
      return getExecution(executionId);
    },
  },

  // Validation
  validation: {
    checkHallucination: async (content: string, options?: Parameters<typeof import('./hallucinationService').checkForHallucination>[1]) => {
      const { checkForHallucination } = await import('./hallucinationService');
      return checkForHallucination(content, options);
    },
    validateResponse: async (content: string, responseType: string, responseId?: string, userId?: string) => {
      const { validateAIResponse } = await import('./hallucinationService');
      return validateAIResponse(content, responseType, responseId, userId);
    },
  },
};

export default AIServices;
