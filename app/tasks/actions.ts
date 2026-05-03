'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import type { ItemStatus } from '@/lib/types';

// ========== Progress Update ==========

export async function updateProgressAction(formData: FormData) {
  const session = await requireSession();
  const role = session.role!;

  const itemId = formData.get('itemId') as string;
  const departmentId = formData.get('departmentId') as string;
  const progress = Number(formData.get('progress'));

  if (!itemId || !departmentId || isNaN(progress) || progress < 0 || progress > 100) {
    return { error: 'Invalid input' };
  }

  // Verify item exists and is in PRODUCTION stage
  const item = await db.item.findUnique({
    where: { id: itemId },
    include: { po: true },
  });

  if (!item || item.status !== 'PRODUCTION') return { error: 'Item not found or not in production' };

  // Verify operator has permission for this department
  if (role.startsWith('OPERATOR_')) {
    const dept = await db.department.findUnique({ where: { id: departmentId } });
    if (!dept) return { error: 'Department not found' };
    const { operatorRoleToDepartmentName } = await import('@/lib/domain');
    const deptName = operatorRoleToDepartmentName(role);
    if (deptName !== dept.name) return { error: 'Unauthorized for this department' };
  } else if (role !== 'ADMIN') {
    return { error: 'Unauthorized' };
  }

  // Upsert progress
  await db.itemProgress.upsert({
    where: {
      itemId_departmentId: { itemId, departmentId },
    },
    update: { progress, updatedAt: new Date() },
    create: { itemId, departmentId, progress },
  });

  // Log audit
  await db.auditLog.create({
    data: {
      action: 'PROGRESS_UPDATE',
      itemId,
      userId: session.userId!,
      metadata: JSON.stringify({ departmentId, progress, role }),
    },
  });

  revalidatePath('/tasks');
  return { success: true };
}

// ========== Drafter Actions ==========

export async function approveDrawingAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== 'DRAFTER' && session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const itemId = formData.get('itemId') as string;
  const item = await db.item.findUnique({ where: { id: itemId } });

  if (!item || item.status !== 'DRAFTING') return { error: 'Invalid item' };

  await db.item.update({
    where: { id: itemId },
    data: {
      drawing_approved: true,
      status: 'PURCHASING',
      purchasing_started_at: new Date(),
      purchasing_progress: 0,
    },
  });

  await db.auditLog.create({
    data: {
      action: 'DRAWING_APPROVED',
      itemId,
      userId: session.userId!,
    },
  });

  revalidatePath('/tasks');
  return { success: true };
}

export async function requestRedrawAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== 'DRAFTER' && session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const itemId = formData.get('itemId') as string;
  const item = await db.item.findUnique({ where: { id: itemId } });

  if (!item || item.status !== 'DRAFTING') return { error: 'Invalid item' };

  // Create problem
  await db.problem.create({
    data: {
      itemId,
      source: 'OPERATOR',
      category: 'Gambar/spesifikasi tidak jelas',
      note: 'Perlu redraw dari drafter',
      resolved: false,
      reportedBy: session.userId!,
    },
  });

  await db.auditLog.create({
    data: {
      action: 'DRAWING_REDRAW',
      itemId,
      userId: session.userId!,
    },
  });

  // Notify Admin/Manager/Owner
  const users = await db.user.findMany({
    where: { role: { in: ['ADMIN', 'MANAGER', 'OWNER'] }, isActive: true },
  });

  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.username,
      type: 'DRAWING_REDRAW',
      message: `Gambar perlu direvisi untuk item ${item.name}`,
      link: `/tasks`,
    })),
  });

  revalidatePath('/tasks');
  return { success: true };
}

// ========== Purchasing Actions ==========

export async function updatePurchasingProgressAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== 'PURCHASING' && session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const itemId = formData.get('itemId') as string;
  const progress = Number(formData.get('progress'));

  if (!itemId || isNaN(progress) || progress < 0 || progress > 100) {
    return { error: 'Invalid input' };
  }

  const item = await db.item.findUnique({ where: { id: itemId } });

  if (!item || item.status !== 'PURCHASING') return { error: 'Invalid item' };

  const updateData: { purchasing_progress: number; status?: ItemStatus; production_started_at?: Date } = {
    purchasing_progress: progress,
  };

  // Advance to PRODUCTION when reaching 100%
  if (progress >= 100) {
    const workType = JSON.parse(item.work_type) as string[];
    updateData.status = 'PRODUCTION';
    updateData.production_started_at = new Date();

    // Create initial progress entries for each department
    const departments = await db.department.findMany({
      where: { id: { in: workType } },
    });

    await db.$transaction([
      db.item.update({ where: { id: itemId }, data: updateData }),
      db.itemProgress.createMany({
        data: departments.map((dept) => ({
          itemId,
          departmentId: dept.id,
          progress: 0,
        })),
      }),
    ]);
  } else {
    await db.item.update({ where: { id: itemId }, data: updateData });
  }

  await db.auditLog.create({
    data: {
      action: 'PROGRESS_UPDATE',
      itemId,
      userId: session.userId!,
      metadata: JSON.stringify({ progress, stage: 'PURCHASING' }),
    },
  });

  revalidatePath('/tasks');
  return { success: true };
}

// ========== QC Actions ==========

export async function submitQCResultAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== 'QC' && session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const itemId = formData.get('itemId') as string;
  const lolos = Number(formData.get('lolos'));
  const minor = Number(formData.get('minor'));
  const mayor = Number(formData.get('mayor'));

  if (!itemId || isNaN(lolos) || isNaN(minor) || isNaN(mayor) || lolos < 0 || minor < 0 || mayor < 0) {
    return { error: 'Invalid input' };
  }

  const item = await db.item.findUnique({ where: { id: itemId } });

  if (!item || item.status !== 'QC') return { error: 'Invalid item' };
  if (lolos + minor + mayor !== item.qty) return { error: 'Total qty must match item qty' };

  // Handle different scenarios
  if (mayor > 0) {
    // Major fail - spawn new item to PRODUCTION
    const newItem = await db.item.create({
      data: {
        poId: item.poId,
        name: `${item.name} (REWORK)`,
        qty: mayor,
        work_type: item.work_type,
        status: 'PRODUCTION',
        source: 'REWORK',
        parentItemId: item.id,
        production_started_at: new Date(),
      },
    });

    // Create progress entries for new item
    const departments = await db.department.findMany({
      where: { id: { in: JSON.parse(item.work_type) as string[] } },
    });

    await db.itemProgress.createMany({
      data: departments.map((dept) => ({
        itemId: newItem.id,
        departmentId: dept.id,
        progress: 0,
      })),
    });

    await db.auditLog.create({
      data: {
        action: 'REWORK_SPAWNED',
        itemId,
        userId: session.userId!,
        metadata: JSON.stringify({ newItemId: newItem.id, qty: mayor, type: 'MAJOR' }),
      },
    });
  }

  if (minor > 0) {
    // Minor fail - reset progress to 0, add REWORK badge
    await db.item.update({
      where: { id: itemId },
      data: {
        is_rework: true,
        // Reset progress for all departments
      },
    });

    await db.itemProgress.updateMany({
      where: { itemId },
      data: { progress: 0 },
    });

    await db.auditLog.create({
      data: {
        action: 'QC_MINOR_FAIL',
        itemId,
        userId: session.userId!,
        metadata: JSON.stringify({ qty: minor }),
      },
    });
  }

  // If lolos + minor = total and no mayor, advance to DELIVERY
  if (mayor === 0 && lolos + minor === item.qty) {
    await db.item.update({
      where: { id: itemId },
      data: {
        status: 'DELIVERY',
        delivery_started_at: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        action: 'QC_PASS',
        itemId,
        userId: session.userId!,
        metadata: JSON.stringify({ qty: lolos }),
      },
    });
  }

  revalidatePath('/tasks');
  return { success: true };
}

// ========== Delivery Actions ==========

export async function confirmDeliveryAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== 'DELIVERY' && session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const itemId = formData.get('itemId') as string;
  const item = await db.item.findUnique({ where: { id: itemId } });

  if (!item || item.status !== 'DELIVERY') return { error: 'Invalid item' };

  await db.item.update({
    where: { id: itemId },
    data: {
      status: 'DONE',
      done_at: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      action: 'DELIVERY_CONFIRM',
      itemId,
      userId: session.userId!,
    },
  });

  // Notify Finance
  const financeUsers = await db.user.findMany({
    where: { role: 'FINANCE', isActive: true },
  });

  await db.notification.createMany({
    data: financeUsers.map((u) => ({
      userId: u.username,
      type: 'ITEM_DONE',
      message: `Item ${item.name} telah selesai dan siap diinvoice`,
      link: `/finance`,
    })),
  });

  revalidatePath('/tasks');
  return { success: true };
}

// ========== Problem Reporting ==========

export async function reportProblemAction(formData: FormData) {
  const session = await requireSession();

  const itemId = formData.get('itemId') as string;
  const category = formData.get('category') as string;
  const note = formData.get('note') as string | null;

  if (!itemId || !category) {
    return { error: 'Invalid input' };
  }

  await db.problem.create({
    data: {
      itemId,
      source: 'OPERATOR',
      category,
      note: note || undefined,
      resolved: false,
      reportedBy: session.userId!,
    },
  });

  // Notify Admin/Manager/Owner
  const users = await db.user.findMany({
    where: { role: { in: ['ADMIN', 'MANAGER', 'OWNER'] }, isActive: true },
  });

  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.username,
      type: 'PROBLEM_REPORTED',
      message: `Masalah: ${category}`,
      link: `/tasks`,
    })),
  });

  revalidatePath('/tasks');
  return { success: true };
}
