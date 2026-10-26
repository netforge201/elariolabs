import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const roles = [
    {
      name: 'Editor',
      permissions: [
        'applications.view',
        'applications.manage',
        'content.manage',
        'media.manage',
        'releases.manage',
      ],
    },
    {
      name: 'Support',
      permissions: [
        'inquiries.manage',
        'support.manage',
      ],
    },
  ];

  for (const role of roles) {
    await db.role.upsert({
      where: { name: role.name },
      update: { permissions: role.permissions },
      create: { name: role.name, permissions: role.permissions },
    });
    console.log(`Configured ${role.name}`);
  }

  await db.role.update({
    where: { name: 'Super Admin' },
    data: { permissions: ['*'] },
  });
  console.log('Configured Super Admin: full access');

  const result = await db.role.findMany({
    select: {
      name: true,
      permissions: true,
      _count: { select: { users: true } },
    },
    orderBy: { name: 'asc' },
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
