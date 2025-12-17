import {
  PrismaClient,
  Prisma,
  WorkflowNodeType,
  WorkflowEdgeType,
  WorkflowStatus,
  WorkflowExecutionStatus,
  AIProvider,
  AIServiceType,
} from '@prisma/client';
import { chatCompletion, createEmbedding, ChatMessage } from './openaiService';

const prisma = new PrismaClient();

// Types for workflow execution
export interface WorkflowState {
  [key: string]: unknown;
  messages?: ChatMessage[];
  context?: Record<string, unknown>;
}

export interface NodeResult {
  output: unknown;
  nextState: WorkflowState;
  nextNodes?: string[]; // For conditional routing
}

export interface WorkflowContext {
  executionId: string;
  workflowId: string;
  userId?: string;
  state: WorkflowState;
  variables: Record<string, unknown>;
}

// ==================== WORKFLOW CRUD ====================

// Create a new workflow
export const createWorkflow = async (data: {
  name: string;
  slug: string;
  description?: string;
  type: string;
  config?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  createdById: string;
}) => {
  return prisma.aIWorkflow.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      type: data.type,
      config: (data.config || {}) as Prisma.InputJsonValue,
      variables: (data.variables || {}) as Prisma.InputJsonValue,
      createdById: data.createdById,
    },
  });
};

// Get workflow by ID
export const getWorkflow = async (workflowId: string) => {
  return prisma.aIWorkflow.findUnique({
    where: { id: workflowId },
    include: {
      nodes: {
        orderBy: { createdAt: 'asc' },
      },
      edges: true,
    },
  });
};

// Get workflow by slug
export const getWorkflowBySlug = async (slug: string) => {
  return prisma.aIWorkflow.findUnique({
    where: { slug },
    include: {
      nodes: true,
      edges: true,
    },
  });
};

// Update workflow status
export const updateWorkflowStatus = async (
  workflowId: string,
  status: WorkflowStatus
) => {
  return prisma.aIWorkflow.update({
    where: { id: workflowId },
    data: { status },
  });
};

// ==================== NODE MANAGEMENT ====================

// Add node to workflow
export const addNode = async (
  workflowId: string,
  data: {
    nodeKey: string;
    name: string;
    description?: string;
    type: WorkflowNodeType;
    positionX?: number;
    positionY?: number;
    config: Record<string, unknown>;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    promptTemplate?: string;
    model?: string;
    toolName?: string;
    toolParams?: Record<string, unknown>;
    conditionLogic?: Record<string, unknown>;
    vectorStoreId?: string;
    retrievalConfig?: Record<string, unknown>;
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
  }
) => {
  return prisma.aIWorkflowNode.create({
    data: {
      workflowId,
      nodeKey: data.nodeKey,
      name: data.name,
      description: data.description,
      type: data.type,
      positionX: data.positionX || 0,
      positionY: data.positionY || 0,
      config: data.config as Prisma.InputJsonValue,
      inputSchema: data.inputSchema as Prisma.InputJsonValue | undefined,
      outputSchema: data.outputSchema as Prisma.InputJsonValue | undefined,
      promptTemplate: data.promptTemplate,
      model: data.model,
      toolName: data.toolName,
      toolParams: data.toolParams as Prisma.InputJsonValue | undefined,
      conditionLogic: data.conditionLogic as Prisma.InputJsonValue | undefined,
      vectorStoreId: data.vectorStoreId,
      retrievalConfig: data.retrievalConfig as Prisma.InputJsonValue | undefined,
      maxRetries: data.maxRetries ?? 3,
      retryDelay: data.retryDelay ?? 1000,
      timeout: data.timeout,
    },
  });
};

// Update node
export const updateNode = async (
  nodeId: string,
  data: Partial<{
    name: string;
    description: string;
    config: Record<string, unknown>;
    promptTemplate: string;
    model: string;
    positionX: number;
    positionY: number;
  }>
) => {
  const updateData: Prisma.AIWorkflowNodeUpdateInput = {
    name: data.name,
    description: data.description,
    promptTemplate: data.promptTemplate,
    model: data.model,
    positionX: data.positionX,
    positionY: data.positionY,
  };
  if (data.config) {
    updateData.config = data.config as Prisma.InputJsonValue;
  }
  return prisma.aIWorkflowNode.update({
    where: { id: nodeId },
    data: updateData,
  });
};

// Delete node
export const deleteNode = async (nodeId: string) => {
  // Delete associated edges first
  await prisma.aIWorkflowEdge.deleteMany({
    where: {
      OR: [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }],
    },
  });

  return prisma.aIWorkflowNode.delete({
    where: { id: nodeId },
  });
};

// ==================== EDGE MANAGEMENT ====================

// Add edge between nodes
export const addEdge = async (
  workflowId: string,
  data: {
    sourceNodeId: string;
    targetNodeId: string;
    type: WorkflowEdgeType;
    label?: string;
    condition?: Record<string, unknown>;
    priority?: number;
    dataMapping?: Record<string, unknown>;
  }
) => {
  return prisma.aIWorkflowEdge.create({
    data: {
      workflowId,
      sourceNodeId: data.sourceNodeId,
      targetNodeId: data.targetNodeId,
      type: data.type,
      label: data.label,
      condition: data.condition as Prisma.InputJsonValue | undefined,
      priority: data.priority ?? 0,
      dataMapping: data.dataMapping as Prisma.InputJsonValue | undefined,
    },
  });
};

// Delete edge
export const deleteEdge = async (edgeId: string) => {
  return prisma.aIWorkflowEdge.delete({
    where: { id: edgeId },
  });
};

// ==================== WORKFLOW EXECUTION ====================

// Start workflow execution
export const startWorkflowExecution = async (
  workflowId: string,
  input: Record<string, unknown>,
  triggeredBy?: string,
  triggerType?: string
): Promise<string> => {
  const workflow = await getWorkflow(workflowId);

  if (!workflow || workflow.status !== WorkflowStatus.ACTIVE) {
    throw new Error('Workflow not found or not active');
  }

  // Create execution record
  const execution = await prisma.aIWorkflowExecution.create({
    data: {
      workflowId,
      input: input as Prisma.InputJsonValue,
      triggeredBy,
      triggerType: triggerType || 'manual',
      status: WorkflowExecutionStatus.PENDING,
      state: {} as Prisma.InputJsonValue,
      startedAt: new Date(),
    },
  });

  // Execute workflow asynchronously
  executeWorkflow(execution.id).catch((error) => {
    console.error(`Workflow execution ${execution.id} failed:`, error);
  });

  return execution.id;
};

// Main workflow execution logic
export const executeWorkflow = async (executionId: string): Promise<void> => {
  const execution = await prisma.aIWorkflowExecution.findUnique({
    where: { id: executionId },
    include: {
      workflow: {
        include: {
          nodes: true,
          edges: true,
        },
      },
    },
  });

  if (!execution) {
    throw new Error('Execution not found');
  }

  // Update status to running
  await prisma.aIWorkflowExecution.update({
    where: { id: executionId },
    data: {
      status: WorkflowExecutionStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  const workflow = execution.workflow;
  const nodes = new Map(workflow.nodes.map((n) => [n.nodeKey, n]));
  const edges = workflow.edges;

  // Find start node
  const startNode = workflow.nodes.find((n) => n.type === WorkflowNodeType.START);
  if (!startNode) {
    throw new Error('No start node found');
  }

  // Initialize state
  let state: WorkflowState = {
    input: execution.input,
    ...(execution.state as WorkflowState || {}),
  };

  const context: WorkflowContext = {
    executionId,
    workflowId: workflow.id,
    userId: execution.triggeredBy || undefined,
    state,
    variables: (workflow.variables as Record<string, unknown>) || {},
  };

  let currentNodeKey = startNode.nodeKey;
  let totalTokens = 0;
  let totalCost = 0;

  try {
    while (currentNodeKey) {
      const currentNode = nodes.get(currentNodeKey);
      if (!currentNode) {
        throw new Error(`Node not found: ${currentNodeKey}`);
      }

      // Check for END node
      if (currentNode.type === WorkflowNodeType.END) {
        break;
      }

      // Update current node
      await prisma.aIWorkflowExecution.update({
        where: { id: executionId },
        data: { currentNodeId: currentNode.id },
      });

      // Execute node with retry
      const result = await executeNodeWithRetry(
        currentNode,
        context,
        currentNode.maxRetries
      );

      // Record node execution
      await prisma.aIWorkflowNodeExecution.create({
        data: {
          executionId,
          nodeId: currentNode.id,
          input: context.state as Prisma.InputJsonValue,
          output: result.output as Prisma.InputJsonValue | undefined,
          status: WorkflowExecutionStatus.COMPLETED,
          startedAt: new Date(),
          completedAt: new Date(),
          promptTokens: (result.output as { tokens?: { prompt?: number } })?.tokens?.prompt,
          completionTokens: (result.output as { tokens?: { completion?: number } })?.tokens?.completion,
        },
      });

      // Update state
      context.state = result.nextState;

      // Track tokens
      const outputTokens = result.output as { tokens?: { total?: number } };
      if (outputTokens?.tokens?.total) {
        totalTokens += outputTokens.tokens.total;
      }

      // Save checkpoint
      await saveCheckpoint(executionId, currentNodeKey, context.state);

      // Find next node(s)
      const outgoingEdges = edges.filter(
        (e) => e.sourceNodeId === currentNode.id
      );

      if (outgoingEdges.length === 0) {
        break; // No more nodes
      }

      // Handle different edge types
      if (result.nextNodes && result.nextNodes.length > 0) {
        // Node specified next nodes (for conditional)
        currentNodeKey = result.nextNodes[0] || '';
      } else if (outgoingEdges.length === 1) {
        // Single edge - follow it
        const firstEdge = outgoingEdges[0];
        const nextNode = firstEdge ? nodes.get(
          workflow.nodes.find((n) => n.id === firstEdge.targetNodeId)?.nodeKey || ''
        ) : undefined;
        currentNodeKey = nextNode?.nodeKey || '';
      } else {
        // Multiple edges - evaluate conditions
        const nextNodeId = await evaluateConditions(outgoingEdges, context.state);
        const nextNode = workflow.nodes.find((n) => n.id === nextNodeId);
        currentNodeKey = nextNode?.nodeKey || '';
      }
    }

    // Mark execution as completed
    await prisma.aIWorkflowExecution.update({
      where: { id: executionId },
      data: {
        status: WorkflowExecutionStatus.COMPLETED,
        output: context.state as Prisma.InputJsonValue,
        state: context.state as Prisma.InputJsonValue,
        completedAt: new Date(),
        totalTokens,
        totalCost,
      },
    });
  } catch (error) {
    // Mark execution as failed
    await prisma.aIWorkflowExecution.update({
      where: { id: executionId },
      data: {
        status: WorkflowExecutionStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
        totalTokens,
        totalCost,
      },
    });

    throw error;
  }
};

// Execute a single node with retry logic
const executeNodeWithRetry = async (
  node: {
    id: string;
    type: WorkflowNodeType;
    config: unknown;
    promptTemplate: string | null;
    model: string | null;
    toolName: string | null;
    toolParams: unknown;
    conditionLogic: unknown;
    maxRetries: number;
    retryDelay: number;
  },
  context: WorkflowContext,
  maxRetries: number
): Promise<NodeResult> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await executeNode(node, context);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, node.retryDelay * attempt)
        );
      }
    }
  }

  throw lastError || new Error('Node execution failed');
};

// Execute a single node based on its type
const executeNode = async (
  node: {
    id: string;
    type: WorkflowNodeType;
    config: unknown;
    promptTemplate: string | null;
    model: string | null;
    toolName: string | null;
    toolParams: unknown;
    conditionLogic: unknown;
  },
  context: WorkflowContext
): Promise<NodeResult> => {
  const config = node.config as Record<string, unknown>;

  switch (node.type) {
    case WorkflowNodeType.START:
      return {
        output: { started: true },
        nextState: context.state,
      };

    case WorkflowNodeType.LLM_CALL:
      return executeLLMNode(node, context);

    case WorkflowNodeType.TOOL_CALL:
      return executeToolNode(node, context);

    case WorkflowNodeType.CONDITION:
      return executeConditionNode(node, context);

    case WorkflowNodeType.RETRIEVAL:
      return executeRetrievalNode(node, context);

    case WorkflowNodeType.TRANSFORMATION:
      return executeTransformationNode(node, context);

    case WorkflowNodeType.HUMAN_FEEDBACK:
      return executeHumanFeedbackNode(node, context);

    case WorkflowNodeType.AGGREGATION:
      return executeAggregationNode(node, context);

    case WorkflowNodeType.END:
      return {
        output: { completed: true },
        nextState: context.state,
      };

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
};

// Execute LLM call node
const executeLLMNode = async (
  node: {
    promptTemplate: string | null;
    model: string | null;
    config: unknown;
  },
  context: WorkflowContext
): Promise<NodeResult> => {
  const config = node.config as Record<string, unknown>;

  // Build prompt from template
  const prompt = interpolateTemplate(
    node.promptTemplate || '',
    context.state
  );

  // Build messages
  const messages: ChatMessage[] = [
    ...(context.state.messages || []),
    { role: 'user', content: prompt },
  ];

  // Add system prompt if configured
  if (config.systemPrompt) {
    messages.unshift({
      role: 'system',
      content: config.systemPrompt as string,
    });
  }

  // Call LLM
  const response = await chatCompletion(
    messages,
    {
      model: node.model || 'gpt-4',
      temperature: (config.temperature as number) || 0.7,
      maxTokens: (config.maxTokens as number) || 1000,
    },
    context.userId
  );

  // Update state with response
  const newState: WorkflowState = {
    ...context.state,
    lastResponse: response.content,
    messages: [
      ...(context.state.messages || []),
      { role: 'user', content: prompt },
      { role: 'assistant', content: response.content },
    ],
  };

  return {
    output: {
      response: response.content,
      tokens: response.usage,
    },
    nextState: newState,
  };
};

// Execute tool call node
const executeToolNode = async (
  node: {
    toolName: string | null;
    toolParams: unknown;
    config: unknown;
  },
  context: WorkflowContext
): Promise<NodeResult> => {
  const toolName = node.toolName;
  const params = interpolateParams(
    (node.toolParams as Record<string, unknown>) || {},
    context.state
  );

  // Execute tool based on name
  let result: unknown;

  switch (toolName) {
    case 'search_poses':
      result = await searchPosesTool(params);
      break;
    case 'get_user_progress':
      result = await getUserProgressTool(params, context.userId);
      break;
    case 'create_recommendation':
      result = await createRecommendationTool(params, context.userId);
      break;
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }

  return {
    output: { toolResult: result },
    nextState: {
      ...context.state,
      lastToolResult: result,
    },
  };
};

// Execute condition node
const executeConditionNode = async (
  node: {
    conditionLogic: unknown;
    config: unknown;
  },
  context: WorkflowContext
): Promise<NodeResult> => {
  const logic = node.conditionLogic as {
    field: string;
    operator: string;
    value: unknown;
    trueNode: string;
    falseNode: string;
  };

  const fieldValue = getNestedValue(context.state, logic.field);
  let conditionMet = false;

  switch (logic.operator) {
    case 'equals':
      conditionMet = fieldValue === logic.value;
      break;
    case 'not_equals':
      conditionMet = fieldValue !== logic.value;
      break;
    case 'greater_than':
      conditionMet = (fieldValue as number) > (logic.value as number);
      break;
    case 'less_than':
      conditionMet = (fieldValue as number) < (logic.value as number);
      break;
    case 'contains':
      conditionMet = String(fieldValue).includes(String(logic.value));
      break;
    case 'exists':
      conditionMet = fieldValue !== undefined && fieldValue !== null;
      break;
    default:
      throw new Error(`Unknown operator: ${logic.operator}`);
  }

  return {
    output: { conditionMet, value: fieldValue },
    nextState: context.state,
    nextNodes: [conditionMet ? logic.trueNode : logic.falseNode],
  };
};

// Execute retrieval node (RAG)
const executeRetrievalNode = async (
  node: {
    config: unknown;
  },
  context: WorkflowContext
): Promise<NodeResult> => {
  const config = node.config as {
    query: string;
    topK?: number;
    threshold?: number;
  };

  const query = interpolateTemplate(config.query, context.state);

  // Create embedding for query
  const queryEmbedding = await createEmbedding(query, context.userId);

  // Search grounding documents
  const documents = await prisma.groundingDocument.findMany({
    where: { isActive: true },
    take: 100,
  });

  // Calculate similarities
  const results = documents
    .map((doc) => {
      const embedding = doc.embedding as number[];
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return { doc, similarity };
    })
    .filter((r) => r.similarity >= (config.threshold || 0.7))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, config.topK || 5);

  const retrievedDocs = results.map((r) => ({
    title: r.doc.title,
    content: r.doc.content,
    similarity: r.similarity,
  }));

  return {
    output: { documents: retrievedDocs },
    nextState: {
      ...context.state,
      retrievedDocuments: retrievedDocs,
      context: {
        ...((context.state.context as Record<string, unknown>) || {}),
        documents: retrievedDocs,
      },
    },
  };
};

// Execute transformation node
const executeTransformationNode = async (
  node: {
    config: unknown;
  },
  context: WorkflowContext
): Promise<NodeResult> => {
  const config = node.config as {
    transformations: Array<{
      type: string;
      source: string;
      target: string;
      params?: Record<string, unknown>;
    }>;
  };

  let newState = { ...context.state };

  for (const transform of config.transformations || []) {
    const sourceValue = getNestedValue(newState, transform.source);

    let transformedValue: unknown;

    switch (transform.type) {
      case 'extract_json':
        transformedValue = extractJSON(sourceValue as string);
        break;
      case 'format_string':
        transformedValue = formatString(
          sourceValue as string,
          transform.params
        );
        break;
      case 'split':
        transformedValue = (sourceValue as string).split(
          (transform.params?.delimiter as string) || ','
        );
        break;
      case 'join':
        transformedValue = (sourceValue as string[]).join(
          (transform.params?.delimiter as string) || ', '
        );
        break;
      case 'map':
        transformedValue = (sourceValue as unknown[]).map(
          (item) => getNestedValue(item as Record<string, unknown>, transform.params?.field as string)
        );
        break;
      default:
        transformedValue = sourceValue;
    }

    setNestedValue(newState, transform.target, transformedValue);
  }

  return {
    output: { transformed: true },
    nextState: newState,
  };
};

// Execute human feedback node (pauses workflow)
const executeHumanFeedbackNode = async (
  node: {
    config: unknown;
  },
  context: WorkflowContext
): Promise<NodeResult> => {
  // This node pauses execution until human feedback is received
  await prisma.aIWorkflowExecution.update({
    where: { id: context.executionId },
    data: {
      status: WorkflowExecutionStatus.WAITING_HUMAN,
    },
  });

  throw new Error('WAITING_FOR_HUMAN_FEEDBACK');
};

// Execute aggregation node
const executeAggregationNode = async (
  node: {
    config: unknown;
  },
  context: WorkflowContext
): Promise<NodeResult> => {
  const config = node.config as {
    source: string;
    operation: 'concat' | 'merge' | 'summarize';
    target: string;
  };

  const sourceValue = getNestedValue(context.state, config.source) as unknown[];
  let result: unknown;

  switch (config.operation) {
    case 'concat':
      result = sourceValue.flat();
      break;
    case 'merge':
      result = Object.assign({}, ...sourceValue);
      break;
    case 'summarize':
      // Use LLM to summarize
      const summaryPrompt = `Summarize the following items:\n${JSON.stringify(sourceValue)}`;
      const response = await chatCompletion(
        [{ role: 'user', content: summaryPrompt }],
        { maxTokens: 500 },
        context.userId
      );
      result = response.content;
      break;
  }

  const newState = { ...context.state };
  setNestedValue(newState, config.target, result);

  return {
    output: { aggregated: result },
    nextState: newState,
  };
};

// ==================== HELPER FUNCTIONS ====================

// Save execution checkpoint
const saveCheckpoint = async (
  executionId: string,
  nodeKey: string,
  state: WorkflowState
) => {
  const execution = await prisma.aIWorkflowExecution.findUnique({
    where: { id: executionId },
  });

  if (!execution) return;

  const checkpoints = (execution.checkpoints as unknown[]) || [];
  checkpoints.push({
    nodeKey,
    state,
    timestamp: new Date().toISOString(),
  });

  await prisma.aIWorkflowExecution.update({
    where: { id: executionId },
    data: {
      checkpoints: checkpoints as Prisma.InputJsonValue[],
      state: state as Prisma.InputJsonValue,
    },
  });
};

// Evaluate conditional edges
const evaluateConditions = async (
  edges: Array<{
    id: string;
    targetNodeId: string;
    condition: unknown;
    priority: number;
    label: string | null;
  }>,
  state: WorkflowState
): Promise<string> => {
  // Sort by priority
  const sortedEdges = [...edges].sort((a, b) => b.priority - a.priority);

  for (const edge of sortedEdges) {
    if (!edge.condition) {
      return edge.targetNodeId; // Default edge
    }

    const condition = edge.condition as {
      field: string;
      operator: string;
      value: unknown;
    };

    const fieldValue = getNestedValue(state, condition.field);
    let matches = false;

    switch (condition.operator) {
      case 'equals':
        matches = fieldValue === condition.value;
        break;
      case 'not_equals':
        matches = fieldValue !== condition.value;
        break;
      case 'contains':
        matches = String(fieldValue).includes(String(condition.value));
        break;
      default:
        matches = false;
    }

    if (matches) {
      return edge.targetNodeId;
    }
  }

  // Return first edge if no conditions match
  return sortedEdges[0]?.targetNodeId || '';
};

// Template interpolation
const interpolateTemplate = (
  template: string,
  state: WorkflowState
): string => {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const value = getNestedValue(state, path.trim());
    return String(value ?? '');
  });
};

// Interpolate params
const interpolateParams = (
  params: Record<string, unknown>,
  state: WorkflowState
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.startsWith('{{')) {
      const path = value.slice(2, -2).trim();
      result[key] = getNestedValue(state, path);
    } else {
      result[key] = value;
    }
  }

  return result;
};

// Get nested value from object
const getNestedValue = (obj: unknown, path: string): unknown => {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
};

// Set nested value in object
const setNestedValue = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void => {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key && !(key in current)) {
      current[key] = {};
    }
    if (key) {
      current = current[key] as Record<string, unknown>;
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    current[lastKey] = value;
  }
};

// Extract JSON from string
const extractJSON = (text: string): unknown => {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
  return null;
};

// Format string
const formatString = (
  str: string,
  params?: Record<string, unknown>
): string => {
  if (!params) return str;

  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''));
};

// Cosine similarity
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// ==================== TOOL IMPLEMENTATIONS ====================

const searchPosesTool = async (params: Record<string, unknown>) => {
  const query = params.query as string;
  const limit = (params.limit as number) || 5;

  return prisma.pose.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sanskritName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: limit,
  });
};

const getUserProgressTool = async (
  params: Record<string, unknown>,
  userId?: string
) => {
  if (!userId) return null;

  const [classes, challenges, level] = await Promise.all([
    prisma.videoProgress.count({
      where: { userId, completed: true },
    }),
    prisma.challengeEnrollment.count({
      where: { userId, status: 'COMPLETED' },
    }),
    prisma.userLevel.findUnique({
      where: { userId },
    }),
  ]);

  return {
    completedClasses: classes,
    completedChallenges: challenges,
    level: level?.level || 1,
    xp: level?.totalXP || 0,
    streak: level?.currentStreak || 0,
  };
};

const createRecommendationTool = async (
  params: Record<string, unknown>,
  userId?: string
) => {
  if (!userId) return null;

  return prisma.recommendation.create({
    data: {
      userId,
      type: (params.type as string) || 'FOR_YOU',
      entityType: params.entityType as string,
      entityId: params.entityId as string,
      score: (params.score as number) || 0.8,
      confidence: (params.confidence as number) || 0.7,
      reasons: (params.reasons as string[]) || [],
      context: 'HOME_FEED',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
};

// ==================== EXECUTION MANAGEMENT ====================

// Get execution by ID
export const getExecution = async (executionId: string) => {
  return prisma.aIWorkflowExecution.findUnique({
    where: { id: executionId },
    include: {
      workflow: true,
      nodeExecutions: {
        include: { node: true },
        orderBy: { startedAt: 'asc' },
      },
    },
  });
};

// Get user executions
export const getUserExecutions = async (
  userId: string,
  limit: number = 20
) => {
  return prisma.aIWorkflowExecution.findMany({
    where: { triggeredBy: userId },
    include: { workflow: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

// Resume workflow from checkpoint
export const resumeExecution = async (
  executionId: string,
  humanFeedback?: Record<string, unknown>
) => {
  const execution = await prisma.aIWorkflowExecution.findUnique({
    where: { id: executionId },
  });

  if (!execution) {
    throw new Error('Execution not found');
  }

  if (execution.status !== WorkflowExecutionStatus.WAITING_HUMAN) {
    throw new Error('Execution is not waiting for human feedback');
  }

  // Update state with human feedback
  const newState = {
    ...(execution.state as WorkflowState),
    humanFeedback,
  };

  await prisma.aIWorkflowExecution.update({
    where: { id: executionId },
    data: {
      status: WorkflowExecutionStatus.RUNNING,
      state: newState,
    },
  });

  // Continue execution
  await executeWorkflow(executionId);
};

// Cancel execution
export const cancelExecution = async (executionId: string) => {
  return prisma.aIWorkflowExecution.update({
    where: { id: executionId },
    data: {
      status: WorkflowExecutionStatus.CANCELLED,
      completedAt: new Date(),
    },
  });
};
