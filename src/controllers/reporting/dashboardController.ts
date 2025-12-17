import { Request, Response, NextFunction } from 'express';
import {
  getWidgets,
  getWidget,
  createWidget,
  updateWidget,
  deleteWidget,
  getWidgetData,
  getUserDashboard,
  updateWidgetPosition,
  addWidgetToDashboard,
  removeWidgetFromDashboard,
  resetDashboard,
  updateDashboardLayout,
} from '../../services/reporting/dashboardService';
import { WidgetType } from '@prisma/client';

// Get user's dashboard
export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const dashboard = await getUserDashboard(userId);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

// Update dashboard layout
export const updateDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { widgets } = req.body;

    if (!Array.isArray(widgets)) {
      return res.status(400).json({
        success: false,
        error: 'widgets must be an array',
      });
    }

    const dashboard = await updateDashboardLayout(userId, widgets);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

// Get all available widgets
export const listWidgets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const widgets = await getWidgets();

    res.json({
      success: true,
      data: widgets,
    });
  } catch (error) {
    next(error);
  }
};

// Add widget to dashboard
export const addWidget = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { widgetId, position } = req.body;

    if (!widgetId) {
      return res.status(400).json({
        success: false,
        error: 'widgetId is required',
      });
    }

    const placement = await addWidgetToDashboard(
      userId,
      widgetId,
      position || { x: 0, y: 0, width: 4, height: 2 }
    );

    res.status(201).json({
      success: true,
      data: placement,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

// Update widget position
export const updateWidgetPos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const widgetId = req.params.widgetId as string;
    const { x, y, width, height } = req.body;

    const updated = await updateWidgetPosition(userId, widgetId, {
      x,
      y,
      width,
      height,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Remove widget from dashboard
export const removeWidget = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const widgetId = req.params.widgetId as string;

    await removeWidgetFromDashboard(userId, widgetId);

    res.json({
      success: true,
      message: 'Widget removed from dashboard',
    });
  } catch (error) {
    next(error);
  }
};

// Reset dashboard to defaults
export const reset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const dashboard = await resetDashboard(userId);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

// Get widget data
export const getWidgetDataHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const widgetId = req.params.widgetId as string;
    const params = req.query;

    const data = await getWidgetData(widgetId, params as Record<string, unknown>);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

// Admin: Create widget
export const createWidgetAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      type,
      dataSource,
      query,
      chartType,
      chartConfig,
      refreshInterval,
      defaultWidth,
      defaultHeight,
      isDefault,
    } = req.body;

    const widget = await createWidget({
      name,
      description,
      type: type as WidgetType,
      dataSource,
      query,
      chartType,
      chartConfig,
      refreshInterval,
      defaultWidth,
      defaultHeight,
      isDefault,
    });

    res.status(201).json({
      success: true,
      data: widget,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update widget
export const updateWidgetAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const widget = await updateWidget(id, data);

    res.json({
      success: true,
      data: widget,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete widget
export const deleteWidgetAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    await deleteWidget(id);

    res.json({
      success: true,
      message: 'Widget deleted',
    });
  } catch (error) {
    next(error);
  }
};
