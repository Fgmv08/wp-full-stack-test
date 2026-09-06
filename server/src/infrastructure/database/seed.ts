import 'reflect-metadata';
import { AppDataSource } from './AppDataSource';
import { runAutoSeed } from './seeders/autoSeeder';

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  await runAutoSeed();
  await AppDataSource.destroy();
  console.log('✅ Manual seed execution complete');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
