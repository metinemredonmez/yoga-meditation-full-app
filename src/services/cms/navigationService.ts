import { prisma } from '../../utils/database';
import { Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

// ============================================
// Navigation Menus
// ============================================

export async function getMenus() {
  return prisma.navigation_menus.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { navigation_items: true } },
    },
  });
}

export async function getMenu(menuId: string) {
  const menu = await prisma.navigation_menus.findUnique({
    where: { id: menuId },
    include: {
      navigation_items: {
        where: { parentId: null },
        orderBy: { sortOrder: 'asc' },
        include: {
          other_navigation_items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              other_navigation_items: { orderBy: { sortOrder: 'asc' } },
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
  const menu = await prisma.navigation_menus.findUnique({
    where: { slug },
    include: {
      navigation_items: {
        where: { parentId: null, isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          other_navigation_items: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              other_navigation_items: {
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
  const existing = await prisma.navigation_menus.findUnique({ where: { slug: data.slug } });
  if (existing) throw new HttpError(400, 'Menu with this slug already exists');

  return prisma.navigation_menus.create({
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
  const menu = await prisma.navigation_menus.findUnique({ where: { id: menuId } });
  if (!menu) throw new HttpError(404, 'Menu not found');

  if (data.slug && data.slug !== menu.slug) {
    const existing = await prisma.navigation_menus.findUnique({ where: { slug: data.slug } });
    if (existing) throw new HttpError(400, 'Menu with this slug already exists');
  }

  return prisma.navigation_menus.update({
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
  const menu = await prisma.navigation_menus.findUnique({
    where: { id: menuId },
    include: { _count: { select: { navigation_items: true } } },
  });

  if (!menu) throw new HttpError(404, 'Menu not found');
  if (menu._count.navigation_items > 0) {
    throw new HttpError(400, 'Menu must be empty before deletion');
  }

  await prisma.navigation_menus.delete({ where: { id: menuId } });
  return { deleted: true };
}

// ============================================
// Navigation Items
// ============================================

export async function getMenuItems(menuId: string) {
  return prisma.navigation_items.findMany({
    where: { menuId, parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      other_navigation_items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          other_navigation_items: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });
}

export async function getMenuItem(itemId: string) {
  const item = await prisma.navigation_items.findUnique({
    where: { id: itemId },
    include: {
      navigation_menus: { select: { id: true, name: true, slug: true } },
      navigation_items: { select: { id: true, label: true } },
      other_navigation_items: { orderBy: { sortOrder: 'asc' } },
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
  const menu = await prisma.navigation_menus.findUnique({ where: { id: data.menuId } });
  if (!menu) throw new HttpError(404, 'Menu not found');

  if (data.parentId) {
    const parent = await prisma.navigation_items.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new HttpError(404, 'Parent item not found');
    if (parent.menuId !== data.menuId) {
      throw new HttpError(400, 'Parent item must be in the same menu');
    }
  }

  return prisma.navigation_items.create({
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
      navigation_menus: { select: { id: true, name: true } },
      navigation_items: { select: { id: true, label: true } },
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
  const item = await prisma.navigation_items.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'Menu item not found');

  if (data.parentId === itemId) {
    throw new HttpError(400, 'Item cannot be its own parent');
  }

  if (data.parentId) {
    const parent = await prisma.navigation_items.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new HttpError(404, 'Parent item not found');
    if (parent.menuId !== item.menuId) {
      throw new HttpError(400, 'Parent item must be in the same menu');
    }
  }

  return prisma.navigation_items.update({
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
      navigation_menus: { select: { id: true, name: true } },
      navigation_items: { select: { id: true, label: true } },
    },
  });
}

export async function deleteMenuItem(itemId: string) {
  const item = await prisma.navigation_items.findUnique({
    where: { id: itemId },
    include: { _count: { select: { other_navigation_items: true } } },
  });

  if (!item) throw new HttpError(404, 'Menu item not found');
  if (item._count.other_navigation_items > 0) {
    throw new HttpError(400, 'Item has children. Delete or move children first.');
  }

  await prisma.navigation_items.delete({ where: { id: itemId } });
  return { deleted: true };
}

export async function reorderMenuItems(itemIds: string[]) {
  const updates = itemIds.map((id, index) =>
    prisma.navigation_items.update({
      where: { id },
      data: { sortOrder: index },
    })
  );

  await prisma.$transaction(updates);
  return { success: true };
}

export async function moveMenuItem(itemId: string, newParentId: string | null, newMenuId?: string) {
  const item = await prisma.navigation_items.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'Menu item not found');

  if (newParentId === itemId) {
    throw new HttpError(400, 'Item cannot be its own parent');
  }

  const menuId = newMenuId || item.menuId;

  if (newParentId) {
    const parent = await prisma.navigation_items.findUnique({ where: { id: newParentId } });
    if (!parent) throw new HttpError(404, 'Parent item not found');
    if (parent.menuId !== menuId) {
      throw new HttpError(400, 'Parent item must be in the same menu');
    }
  }

  return prisma.navigation_items.update({
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
  const menu = await prisma.navigation_menus.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      navigation_items: {
        where: { parentId: null, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          label: true,
          url: true,
          target: true,
          icon: true,
          other_navigation_items: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              label: true,
              url: true,
              target: true,
              icon: true,
              other_navigation_items: {
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
  return prisma.navigation_menus.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      navigation_items: {
        where: { parentId: null, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          label: true,
          url: true,
          target: true,
          icon: true,
          other_navigation_items: {
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
