#!/usr/bin/env node
/**
 * Weekly Snapshot Generation Job
 * Runs every Monday at 2:00 AM MST
 * Generates CSV snapshots and calculates checksums
 */

import { runWeeklySnapshotTask } from '../src/lib/snapshotAutomation';

async function main() {
  console.log('=== Weekly Snapshot Job Started ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    await runWeeklySnapshotTask();
    
    console.log('=== Weekly Snapshot Job Completed ===');
    process.exit(0);
    
  } catch (error) {
    console.error('Fatal error in weekly snapshot job:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as weeklySnapshotJob };
