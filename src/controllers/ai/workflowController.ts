import { Request, Response } from 'express';
import { WorkflowNodeType, WorkflowEdgeType, WorkflowStatus } from '@prisma/client';
import {
  createWorkflow,
  getWorkflow,
  getWorkflowBySlug,
  updateWorkflowStatus,
  addNode,
  updateNode,
  deleteNode,
  addEdge,
  deleteEdge,
  startWorkflowExecution,
  getExecution,
  getUserExecutions,
  resumeExecution,
  cancelExecution,
} from '../../services/ai/workflowEngine';

// Create new workflow
export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, slug, description, type, config, variables } = req.body;

    const workflow = await createWorkflow({
      name,
      slug,
      description,
      type,
      config,
      variables,
      createdById: userId,
    });

    res.status(201).json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow',
    });
  }
};

// Get workflow by ID
export const getById = async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.workflowId as string;

    const workflow = await getWorkflow(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow',
    });
  }
};

// Get workflow by slug
export const getBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    const workflow = await getWorkflowBySlug(slug);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Get workflow by slug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow',
    });
  }
};

// Update workflow status
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.workflowId as string;
    const { status } = req.body;

    const workflow = await updateWorkflowStatus(
      workflowId,
      status as WorkflowStatus
    );

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Update workflow status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow status',
    });
  }
};

// Add node to workflow
export const createNode = async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.workflowId as string;
    const nodeData = req.body;

    const node = await addNode(workflowId, {
      ...nodeData,
      type: nodeData.type as WorkflowNodeType,
    });

    res.status(201).json({
      success: true,
      data: node,
    });
  } catch (error) {
    console.error('Create node error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create node',
    });
  }
};

// Update node
export const updateNodeById = async (req: Request, res: Response) => {
  try {
    const nodeId = req.params.nodeId as string;
    const nodeData = req.body;

    const node = await updateNode(nodeId, nodeData);

    res.json({
      success: true,
      data: node,
    });
  } catch (error) {
    console.error('Update node error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update node',
    });
  }
};

// Delete node
export const deleteNodeById = async (req: Request, res: Response) => {
  try {
    const nodeId = req.params.nodeId as string;

    await deleteNode(nodeId);

    res.json({
      success: true,
      message: 'Node deleted',
    });
  } catch (error) {
    console.error('Delete node error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete node',
    });
  }
};

// Add edge to workflow
export const createEdge = async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.workflowId as string;
    const edgeData = req.body;

    const edge = await addEdge(workflowId, {
      ...edgeData,
      type: edgeData.type as WorkflowEdgeType,
    });

    res.status(201).json({
      success: true,
      data: edge,
    });
  } catch (error) {
    console.error('Create edge error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create edge',
    });
  }
};

// Delete edge
export const deleteEdgeById = async (req: Request, res: Response) => {
  try {
    const edgeId = req.params.edgeId as string;

    await deleteEdge(edgeId);

    res.json({
      success: true,
      message: 'Edge deleted',
    });
  } catch (error) {
    console.error('Delete edge error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete edge',
    });
  }
};

// Execute workflow
export const execute = async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.workflowId as string;
    const userId = req.user!.id;
    const { input } = req.body;

    const executionId = await startWorkflowExecution(
      workflowId,
      input,
      userId,
      'api'
    );

    res.status(202).json({
      success: true,
      data: {
        executionId,
        message: 'Workflow execution started',
      },
    });
  } catch (error) {
    console.error('Execute workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute workflow',
    });
  }
};

// Get execution status
export const getExecutionStatus = async (req: Request, res: Response) => {
  try {
    const executionId = req.params.executionId as string;

    const execution = await getExecution(executionId);

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found',
      });
    }

    res.json({
      success: true,
      data: execution,
    });
  } catch (error) {
    console.error('Get execution status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get execution status',
    });
  }
};

// Get user's executions
export const listUserExecutions = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = '20' } = req.query;

    const executions = await getUserExecutions(
      userId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: executions,
    });
  } catch (error) {
    console.error('Get user executions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get executions',
    });
  }
};

// Resume execution (after human feedback)
export const resume = async (req: Request, res: Response) => {
  try {
    const executionId = req.params.executionId as string;
    const { humanFeedback } = req.body;

    await resumeExecution(executionId, humanFeedback);

    res.json({
      success: true,
      message: 'Execution resumed',
    });
  } catch (error) {
    console.error('Resume execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume execution',
    });
  }
};

// Cancel execution
export const cancel = async (req: Request, res: Response) => {
  try {
    const executionId = req.params.executionId as string;

    await cancelExecution(executionId);

    res.json({
      success: true,
      message: 'Execution cancelled',
    });
  } catch (error) {
    console.error('Cancel execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel execution',
    });
  }
};
