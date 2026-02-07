import { prisma } from '../../src/libs/prisma';
import { Seed_MasterData_User } from './auth/user';

const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  const seconds = ms / 1000;
  return seconds < 60
    ? `${seconds.toFixed(2)}s`
    : `${(seconds / 60).toFixed(2)}min`;
};

const seedData = async () => {
  const seeds: (() => Promise<void>)[] = [Seed_MasterData_User];

  try {
    console.log('🚀 Starting database seeding process...');
    console.log(`📊 Total seeds to process: ${seeds.length}`);
    console.log('');

    const startTotal = performance.now();

    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      if (!seed) continue;

      const seedName = seed.name.replace('Seed_', '');
      console.log(`[${i + 1}/${seeds.length}] 🌱 Starting: ${seedName}...`);

      const startTime = performance.now();

      try {
        await seed();
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(
          `[${i + 1}/${seeds.length}] ✅ Completed: ${seedName} (${formatTime(duration)})`
        );
      } catch (error) {
        console.error(
          `[${i + 1}/${seeds.length}] ❌ Failed: ${seedName}`,
          error
        );
        throw error;
      }

      console.log('');
    }

    const endTotal = performance.now();
    const totalDuration = endTotal - startTotal;
    console.log(
      `Total seeding process completed in ${formatTime(totalDuration)}`
    );
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

seedData();
