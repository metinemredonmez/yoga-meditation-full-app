import {
  PrismaClient,
  ConversationType,
  MessageRole,
  Prisma,
} from '@prisma/client';
import { chatCompletion, ChatMessage } from './openaiService';
import { transcribeAudio } from './sttService';
import { generateSpeechAndSave, TTSOptions } from './ttsService';
import { SYSTEM_PROMPTS } from '../../config/aiPrompts';

const prisma = new PrismaClient();

const MAX_CONVERSATION_MESSAGES = 50;

// Create conversation
export const createConversation = async (
  userId: string,
  type: ConversationType,
  context?: {
    contextType?: string;
    contextId?: string;
    title?: string;
  }
) => {
  return prisma.ai_conversations.create({
    data: {
      userId,
      type,
      contextType: context?.contextType,
      contextId: context?.contextId,
      title: context?.title,
    },
  });
};

// Get conversation
export const getConversation = async (conversationId: string) => {
  return prisma.ai_conversations.findUnique({
    where: { id: conversationId },
    include: {
      ai_messages: {
        orderBy: { createdAt: 'asc' },
        take: MAX_CONVERSATION_MESSAGES,
      },
    },
  });
};

// Get user conversations
export const getUserConversations = async (
  userId: string,
  type?: ConversationType
) => {
  return prisma.ai_conversations.findMany({
    where: {
      userId,
      ...(type && { type }),
      isActive: true,
    },
    include: {
      ai_messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

// Send message
export const sendMessage = async (
  conversationId: string,
  content: string,
  audioUrl?: string
): Promise<{
  userMessage: Awaited<ReturnType<typeof prisma.ai_messages.create>>;
  assistantMessage: Awaited<ReturnType<typeof prisma.ai_messages.create>>;
  audioResponse?: { audioUrl: string; duration: number };
}> => {
  const conversation = await getConversation(conversationId);

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Save user message
  const userMessage = await prisma.ai_messages.create({
    data: {
      conversationId,
      role: MessageRole.USER,
      content,
      audioUrl,
    },
  });

  // Build conversation context
  const messages = buildConversationMessages(conversation);
  messages.push({ role: 'user', content });

  // Generate response
  const response = await chatCompletion(messages, {
    temperature: 0.7,
    maxTokens: 1000,
  }, conversation.userId);

  // Save assistant message
  const assistantMessage = await prisma.ai_messages.create({
    data: {
      conversationId,
      role: MessageRole.ASSISTANT,
      content: response.content,
      tokens: response.usage.totalTokens,
    },
  });

  // Update conversation
  await prisma.ai_conversations.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return { userMessage, assistantMessage };
};

// Send voice message (transcribe then respond)
export const sendVoiceMessage = async (
  conversationId: string,
  audioUrl: string
): Promise<{
  transcription: string;
  userMessage: Awaited<ReturnType<typeof prisma.ai_messages.create>>;
  assistantMessage: Awaited<ReturnType<typeof prisma.ai_messages.create>>;
  audioResponse: { audioUrl: string; duration: number };
}> => {
  const conversation = await getConversation(conversationId);

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Transcribe audio
  const transcription = await transcribeAudio(audioUrl, {}, conversation.userId);

  // Send as text message
  const { userMessage, assistantMessage } = await sendMessage(
    conversationId,
    transcription.text,
    audioUrl
  );

  // Generate audio response
  const userPreference = await prisma.user_ai_preferences.findUnique({
    where: { userId: conversation.userId },
  });

  const audioResponse = await generateSpeechAndSave(
    assistantMessage.content,
    {
      voice: (userPreference?.preferredVoice as TTSOptions['voice']) || 'nova',
      speed: userPreference?.voiceSpeed || 1.0,
    },
    conversation.userId
  );

  // Update assistant message with audio
  await prisma.ai_messages.update({
    where: { id: assistantMessage.id },
    data: {
      audioUrl: audioResponse.audioUrl,
      audioDuration: audioResponse.duration,
    },
  });

  return {
    transcription: transcription.text,
    userMessage,
    assistantMessage,
    audioResponse,
  };
};

// Build conversation messages for API
const buildConversationMessages = (
  conversation: {
    type: ConversationType;
    contextType?: string | null;
    contextId?: string | null;
    ai_messages: { role: MessageRole; content: string }[];
  }
): ChatMessage[] => {
  const systemPrompt = getSystemPrompt(conversation.type);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add conversation history
  for (const msg of conversation.ai_messages) {
    messages.push({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    });
  }

  return messages;
};

// Get system prompt based on conversation type
export const getSystemPrompt = (type: ConversationType): string => {
  switch (type) {
    case ConversationType.YOGA_COACH:
      return SYSTEM_PROMPTS.YOGA_COACH;
    case ConversationType.MEDITATION_GUIDE:
      return SYSTEM_PROMPTS.MEDITATION_GUIDE;
    case ConversationType.NUTRITION_ADVISOR:
      return SYSTEM_PROMPTS.NUTRITION_ADVISOR;
    case ConversationType.GENERAL_ASSISTANT:
      return SYSTEM_PROMPTS.GENERAL_ASSISTANT;
    case ConversationType.CLASS_FEEDBACK:
      return SYSTEM_PROMPTS.CLASS_FEEDBACK;
    default:
      return SYSTEM_PROMPTS.GENERAL_ASSISTANT;
  }
};

// Generate response (standalone, without saving)
export const generateResponse = async (
  type: ConversationType,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  userId?: string
): Promise<string> => {
  const systemPrompt = getSystemPrompt(type);

  const chatMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const response = await chatCompletion(chatMessages, {
    temperature: 0.7,
    maxTokens: 1000,
  }, userId);

  return response.content;
};

// Delete conversation
export const deleteConversation = async (conversationId: string) => {
  return prisma.ai_conversations.update({
    where: { id: conversationId },
    data: { isActive: false },
  });
};

// Get conversation messages
export const getConversationMessages = async (
  conversationId: string,
  page: number = 1,
  limit: number = 50
) => {
  return prisma.ai_messages.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    skip: (page - 1) * limit,
    take: limit,
  });
};

// Build user context for personalization
export const buildUserContext = async (userId: string): Promise<string> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      video_progress: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) return '';

  const contextParts: string[] = [];

  if (user.firstName) {
    contextParts.push(`User's name: ${user.firstName}`);
  }

  const completedClasses = user.video_progress.filter((p) => p.completed).length;
  if (completedClasses > 0) {
    contextParts.push(`User has completed ${completedClasses} classes`);
  }

  return contextParts.join('. ');
};

// Build class context for feedback
export const buildClassContext = async (classId: string): Promise<string> => {
  const classData = await prisma.classes.findUnique({
    where: { id: classId },
    include: {
      users: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!classData) return '';

  return `Class: ${classData.title}. Instructor: ${classData.users.firstName} ${classData.users.lastName}.`;
};
