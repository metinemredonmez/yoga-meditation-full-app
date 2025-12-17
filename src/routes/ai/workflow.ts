import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import { z } from 'zod';
import {
  create,
  getById,
  getBySlug,
  updateStatus,
  createNode,
  updateNodeById,
  deleteNodeById,
  createEdge,
  deleteEdgeById,
  execute,
  getExecutionStatus,
  listUserExecutions,
  resume,
  cancel,
} from '../../controllers/ai/workflowController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createWorkflowBodySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  type: z.string(),
  config: z.record(z.string(), z.unknown()).optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
});

const updateStatusBodySchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']),
});

const createNodeBodySchema = z.object({
  nodeKey: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    'START',
    'END',
    'LLM_CALL',
    'TOOL_CALL',
    'CONDITION',
    'HUMAN_FEEDBACK',
    'RETRIEVAL',
    'TRANSFORMATION',
    'AGGREGATION',
    'PARALLEL',
    'SUBGRAPH',
  ]),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  config: z.record(z.string(), z.unknown()),
  inputSchema: z.record(z.string(), z.unknown()).optional(),
  outputSchema: z.record(z.string(), z.unknown()).optional(),
  promptTemplate: z.string().optional(),
  model: z.string().optional(),
  toolName: z.string().optional(),
  toolParams: z.record(z.string(), z.unknown()).optional(),
  conditionLogic: z.record(z.string(), z.unknown()).optional(),
  maxRetries: z.number().min(1).max(10).optional(),
  retryDelay: z.number().min(100).max(60000).optional(),
  timeout: z.number().min(1000).max(300000).optional(),
});

const createEdgeBodySchema = z.object({
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  type: z.enum(['SEQUENTIAL', 'CONDITIONAL', 'PARALLEL', 'LOOP', 'ERROR_HANDLER']),
  label: z.string().optional(),
  condition: z.record(z.string(), z.unknown()).optional(),
  priority: z.number().optional(),
  dataMapping: z.record(z.string(), z.unknown()).optional(),
});

const executeBodySchema = z.object({
  input: z.record(z.string(), z.unknown()),
});

const resumeBodySchema = z.object({
  humanFeedback: z.record(z.string(), z.unknown()).optional(),
});

// Workflow CRUD routes (Admin only)

/**
 * @route POST /api/ai/workflow
 * @desc Create new workflow
 * @access Admin
 */
router.post(
  '/',
  authorize('ADMIN'),
  validateRequest({ body: createWorkflowBodySchema }),
  create
);

/**
 * @route GET /api/ai/workflow/:workflowId
 * @desc Get workflow by ID
 * @access Admin
 */
router.get('/:workflowId', authorize('ADMIN'), getById);

/**
 * @route GET /api/ai/workflow/slug/:slug
 * @desc Get workflow by slug
 * @access Admin
 */
router.get('/slug/:slug', authorize('ADMIN'), getBySlug);

/**
 * @route PATCH /api/ai/workflow/:workflowId/status
 * @desc Update workflow status
 * @access Admin
 */
router.patch(
  '/:workflowId/status',
  authorize('ADMIN'),
  validateRequest({ body: updateStatusBodySchema }),
  updateStatus
);

// Node routes (Admin only)

/**
 * @route POST /api/ai/workflow/:workflowId/nodes
 * @desc Add node to workflow
 * @access Admin
 */
router.post(
  '/:workflowId/nodes',
  authorize('ADMIN'),
  validateRequest({ body: createNodeBodySchema }),
  createNode
);

/**
 * @route PATCH /api/ai/workflow/nodes/:nodeId
 * @desc Update node
 * @access Admin
 */
router.patch('/nodes/:nodeId', authorize('ADMIN'), updateNodeById);

/**
 * @route DELETE /api/ai/workflow/nodes/:nodeId
 * @desc Delete node
 * @access Admin
 */
router.delete('/nodes/:nodeId', authorize('ADMIN'), deleteNodeById);

// Edge routes (Admin only)

/**
 * @route POST /api/ai/workflow/:workflowId/edges
 * @desc Add edge to workflow
 * @access Admin
 */
router.post(
  '/:workflowId/edges',
  authorize('ADMIN'),
  validateRequest({ body: createEdgeBodySchema }),
  createEdge
);

/**
 * @route DELETE /api/ai/workflow/edges/:edgeId
 * @desc Delete edge
 * @access Admin
 */
router.delete('/edges/:edgeId', authorize('ADMIN'), deleteEdgeById);

// Execution routes (User accessible)

/**
 * @route POST /api/ai/workflow/:workflowId/execute
 * @desc Execute workflow
 * @access Private
 */
router.post(
  '/:workflowId/execute',
  validateRequest({ body: executeBodySchema }),
  execute
);

/**
 * @route GET /api/ai/workflow/executions/:executionId
 * @desc Get execution status
 * @access Private
 */
router.get('/executions/:executionId', getExecutionStatus);

/**
 * @route GET /api/ai/workflow/executions
 * @desc List user's executions
 * @access Private
 */
router.get('/executions', listUserExecutions);

/**
 * @route POST /api/ai/workflow/executions/:executionId/resume
 * @desc Resume execution after human feedback
 * @access Private
 */
router.post(
  '/executions/:executionId/resume',
  validateRequest({ body: resumeBodySchema }),
  resume
);

/**
 * @route POST /api/ai/workflow/executions/:executionId/cancel
 * @desc Cancel execution
 * @access Private
 */
router.post('/executions/:executionId/cancel', cancel);

export default router;
