import { $Enums, Prisma } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { prisma } from '../../../src/libs/prisma';
import { SEED_BATCH_SIZE } from '../config';

const generateId = () => crypto.randomUUID().replace(/-/g, '');

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: $Enums.USER_ROLE;
  username?: string;
  displayUsername?: string;
};

const seedUsers: SeedUser[] = [
  {
    name: 'Jirapat',
    email: 'jirapat.sk@example.com',
    password: 'p@ssw0rd',
    role: $Enums.USER_ROLE.TEACHER,
    username: 'jirapat',
    displayUsername: 'Jirapat',
  },
  {
    name: 'Nina Teacher',
    email: 'nina.teacher@example.com',
    password: 'p@ssw0rd',
    role: $Enums.USER_ROLE.TEACHER,
    username: 'nina.teacher',
    displayUsername: 'NinaTeacher',
  },
  {
    name: 'Somchai Student',
    email: 'somchai.student@example.com',
    password: 'p@ssw0rd',
    role: $Enums.USER_ROLE.STUDENT,
    username: 'somchai.student',
    displayUsername: 'SomchaiStudent',
  },
];

export const Seed_MasterData_User = async () => {
  const users: Prisma.UserCreateManyInput[] = [];
  const accounts: Prisma.AccountCreateManyInput[] = [];

  for (const seed of seedUsers) {
    const userId = generateId();
    const accountId = generateId();
    const hashedPassword = await hashPassword(seed.password);
    const now = new Date();

    users.push({
      id: userId,
      name: seed.name,
      email: seed.email,
      emailVerified: false,
      role: seed.role,
      username: seed.username,
      displayUsername: seed.displayUsername,
      createdAt: now,
      updatedAt: now,
    });

    accounts.push({
      id: accountId,
      accountId: userId,
      providerId: 'credential',
      userId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`[User] Seeding ${users.length} users...`);
  for (let i = 0; i < users.length; i += SEED_BATCH_SIZE) {
    const end = Math.min(i + SEED_BATCH_SIZE, users.length);
    await prisma.user.createMany({
      data: users.slice(i, end),
      skipDuplicates: true,
    });
    console.log(`[User] Processed ${end}/${users.length}`);
  }

  console.log(`[Account] Seeding ${accounts.length} accounts...`);
  for (let i = 0; i < accounts.length; i += SEED_BATCH_SIZE) {
    const end = Math.min(i + SEED_BATCH_SIZE, accounts.length);
    await prisma.account.createMany({
      data: accounts.slice(i, end),
      skipDuplicates: true,
    });
    console.log(`[Account] Processed ${end}/${accounts.length}`);
  }
};
