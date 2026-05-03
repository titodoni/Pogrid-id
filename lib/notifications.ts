import { db } from './db';
import { ADMIN_NOTIFICATION_ROLES } from './constants';
import { departmentNameToOperatorRole, getNextStage, parseWorkType } from './domain';
import type { ItemStatus, NotificationType } from './types';

type NotificationTarget = {
  roles?: readonly string[];
  userIds?: readonly string[];
};

type CreateRoleNotificationInput = NotificationTarget & {
  type: NotificationType;
  message: string;
  itemId?: string;
  poId?: string;
};

export async function createNotificationsForUsers(input: CreateRoleNotificationInput) {
  const userIds = new Set(input.userIds ?? []);

  if (input.roles?.length) {
    const users = await db.user.findMany({
      where: {
        role: { in: [...input.roles] },
        isActive: true,
      },
      select: { id: true },
    });

    users.forEach((user) => userIds.add(user.id));
  }

  if (userIds.size === 0) return { count: 0 };

  return db.notification.createMany({
    data: [...userIds].map((userId) => ({
      userId,
      type: input.type,
      message: input.message,
      itemId: input.itemId,
      poId: input.poId,
    })),
  });
}

export async function notifyAdmins(input: Omit<CreateRoleNotificationInput, 'roles' | 'userIds'>) {
  return createNotificationsForUsers({ ...input, roles: ADMIN_NOTIFICATION_ROLES });
}

export function getStageAdvanceRecipientRoles(nextStage: ItemStatus, departmentNames: string[] = []) {
  if (nextStage === 'DRAFTING') return ['DRAFTER'];
  if (nextStage === 'PURCHASING') return ['PURCHASING'];
  if (nextStage === 'QC') return ['QC'];
  if (nextStage === 'DELIVERY') return ['DELIVERY'];
  if (nextStage === 'PRODUCTION') return departmentNames.map(departmentNameToOperatorRole);
  return [];
}

export function getNextStageRecipientRoles(currentStage: ItemStatus, departmentNames: string[] = []) {
  const nextStage = getNextStage(currentStage);
  return nextStage ? getStageAdvanceRecipientRoles(nextStage, departmentNames) : [];
}

export function getNewPORecipientRoles(workType: string, departmentNameById: Map<string, string>) {
  return parseWorkType(workType)
    .map((departmentId) => departmentNameById.get(departmentId))
    .filter((departmentName): departmentName is string => Boolean(departmentName))
    .map(departmentNameToOperatorRole);
}
