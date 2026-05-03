import { db } from './db';
import { ItemStatus } from './types';

export async function getDashboardKPIs() {
  const [totalPOs, totalItems, lateItems, activeItems] = await Promise.all([
    db.pO.count({ where: { status: 'ACTIVE' } }),
    db.item.count(),
    db.item.count({ 
      where: { 
        status: { not: 'DONE' }, 
        po: { due_date: { lt: new Date() } } 
      } 
    }),
    db.item.count({ where: { status: { not: 'DONE' } } }),
  ]);

  return {
    totalPOs,
    totalItems,
    lateItems,
    activeItems,
  };
}
