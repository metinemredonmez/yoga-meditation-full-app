import { prisma } from '../../utils/database';
import { Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

// ============================================
// Navigation Menus
// ============================================

export async function getMenus() {
  return prisma.navigationMenu.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { items: true } },
    },
  });
}

export async function getMenu(menuId: string) {
  const menu = await prisma.navigationMenu.findUnique({
    where: { id: menuId },
    include: {
      items: {
        where: { parentId: null },
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            orderBy: { sortOrder: 'asc' },
            include: {
              children: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!menu) throw new HttpError(404, 'Menu not found');
  return menu;
}

export async function getMenuBySlug(slug: string) {
  const menu = await prisma.navigationMenu.findUnique({
    where: { slug },
    include: {
      items: {
        where: { parentId: null, isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              children: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!menu) throw new HttpError(404, 'Menu not found');
  return menu;
}

export async function createMenu(
  _createdById: string,
  data: {
    name: string;
    slug: string;
    description?: string;
  }
) {
  const existing = await prisma.navigationMenu.findUnique({ where: { slug: data.slug } });
  if (existing) throw new HttpError(400, 'Menu with this slug already exists');

  return prisma.navigationMenu.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      isActive: true,
    },
  });
}

export async function updateMenu(
  menuId: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  const menu = await prisma.navigationMenu.findUnique({ where: { id: menuId } });
  if (!menu) throw new HttpError(404, 'Menu not found');

  if (data.slug && data.slug !== menu.slug) {
    const existing = await prisma.navigationMenu.findUnique({ where: { slug: data.slug } });
    if (existing) throw new HttpError(400, 'Menu with this slug already exists');
  }

  return prisma.navigationMenu.update({
    where: { id: menuId },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      isActive: data.isActive,
    },
  });
}

export async function deleteMenu(menuId: string) {
  const menu = await prisma.navigationMenu.findUnique({
    where: { id: menuId },
    include: { _count: { select: { items: true } } },
  });

  if (!menu) throw new HttpError(404, 'Menu not found');
  if (menu._count.items > 0) {
    throw new HttpError(400, 'Menu must be empty before deletion');
  }

  await prisma.navigationMenu.delete({ where: { id: menuId } });
  return { deleted: true };
}

// ============================================
// Navigation Items
// ============================================

export async function getMenuItems(menuId: string) {
  return prisma.navigationItem.findMany({
    where: { menuId, parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
        include: {
          children: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });
}

export async function getMenuItem(itemId: string) {
  const item = await prisma.navigationItem.findUnique({
    where: { id: itemId },
    include: {
      menu: { select: { id: true, name: true, slug: true } },
      parent: { select: { id: true, label: true } },
      children: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!item) throw new HttpError(404, 'Menu item not found');
  return item;
}

export async function createMenuItem(data: {
  menuId: string;
  label: string;
  url?: string;
  target?: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
  visibleTo?: string[];
}) {
  const menu = await prisma.navigationMenu.findUnique({ where: { id: data.menuId } });
  if (!menu) throw new HttpError(404, 'Menu not found');

  if (data.parentId) {
    const parent = await prisma.navigationItem.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new HttpError(404, 'Parent item not found');
    if (parent.menuId !== data.menuId) {
      throw new HttpError(400, 'Parent item must be in the same menu');
    }
  }

  return prisma.navigationItem.create({
    data: {
      menuId: data.menuId,
      label: data.label,
      url: data.url,
      target: data.target || '_self',
      icon: data.icon,
      parentId: data.parentId,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
      visibleTo: data.visibleTo || [],
    },
    include: {
      menu: { select: { id: true, name: true } },
      parent: { select: { id: true, label: true } },
    },
  });
}

export async function updateMenuItem(
  itemId: string,
  data: {
    label?: string;
    url?: string;
    target?: string;
    icon?: string;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    visibleTo?: string[];
  }
) {
  const item = await prisma.navigationItem.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'Menu item not found');

  if (data.parentId === itemId) {
    throw new HttpError(400, 'Item cannot be its own parent');
  }

  if (data.parentId) {
    const parent = await prisma.navigationItem.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new HttpError(404, 'Parent item not found');
    if (parent.menuId !== item.menuId) {
      throw new HttpError(400, 'Parent item must be in the same menu');
    }
  }

  return prisma.navigationItem.update({
    where: { id: itemId },
    data: {
      label: data.label,
      url: data.url,
      target: data.target,
      icon: data.icon,
      parentId: data.parentId,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      visibleTo: data.visibleTo,
    },
    include: {
      menu: { select: { id: true, name: true } },
      parent: { select: { id: true, label: true } },
    },
  });
}

export async function deleteMenuItem(itemId: string) {
  const item = await prisma.navigationItem.findUnique({
    where: { id: itemId },
    include: { _count: { select: { children: true } } },
  });

  if (!item) throw new HttpError(404, 'Menu item not found');
  if (item._count.children > 0) {
    throw new HttpError(400, 'Item has children. Delete or move children first.');
  }

  await prisma.navigationItem.delete({ where: { id: itemId } });
  return { deleted: true };
}

export async function reorderMenuItems(itemIds: string[]) {
  const updates = itemIds.map((id, index) =>
    prisma.navigationItem.update({
      where: { id },
      data: { sortOrder: index },
    })
  );

  await prisma.$transaction(updates);
  return { success: true };
}

export async function moveMenuItem(itemId: string, newParentId: string | null, newMenuId?: string) {
  const item = await prisma.navigationItem.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'Menu item not found');

  if (newParentId === itemId) {
    throw new HttpError(400, 'Item cannot be its own parent');
  }

  const menuId = newMenuId || item.menuId;

  if (newParentId) {
    const parent = await prisma.navigationItem.findUnique({ where: { id: newParentId } });
    if (!parent) throw new HttpError(404, 'Parent item not found');
    if (parent.menuId !== menuId) {
      throw new HttpError(400, 'Parent item must be in the same menu');
    }
  }

  return prisma.navigationItem.update({
    where: { id: itemId },
    data: {
      parentId: newParentId,
      menuId,
    },
  });
}

// ============================================
// Public Navigation API
// ============================================

export async function getPublicMenu(slug: string) {
  const menu = await prisma.navigationMenu.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      items: {
        where: { parentId: null, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          label: true,
          url: true,
          target: true,
          icon: true,
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              label: true,
              url: true,
              target: true,
              icon: true,
              children: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
                select: {
                  id: true,
                  label: true,
                  url: true,
                  target: true,
                  icon: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!menu) throw new HttpError(404, 'Menu not found');
  return menu;
}

export async function getMenusByLocation(_location: string) {
  // Note: The schema doesn't have a location field, this is a stub
  // In a real implementation, you might use slug pattern matching or metadata
  return prisma.navigationMenu.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      items: {
        where: { parentId: null, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          label: true,
          url: true,
          target: true,
          icon: true,
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              label: true,
              url: true,
              target: true,
              icon: true,
            },
          },
        },
      },
    },
  });
}
