import { Prisma } from '@prisma/client';

export type ItemWithRelations = Prisma.ItemGetPayload<{
  include: {
    po: {
      include: {
        client: true;
      };
    };
    progresses: {
      include: {
        department: true;
      };
    };
    problems: true;
    auditLogs: true;
  };
}>;

export type ItemProgressWithDepartment = Prisma.ItemProgressGetPayload<{
  include: {
    department: true;
  };
}>;
