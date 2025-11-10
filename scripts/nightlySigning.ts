#!/usr/bin/env node
/**
 * Nightly Signing Job
 * Runs daily at 2:00 AM MST
 * Signs district aggregates with Ed25519
 */

import { performNightlySigning } from '../src/lib/integrity/dataSigner';
import { supabase } from '../src/integrations/supabase/client';

async function main() {
  console.log('=== Nightly Signing Job Started ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Get yesterday's date (we sign data from the previous day)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    console.log('Signing data for date:', dateStr);
    
    // Fetch district aggregates for the date
    // This would normally come from a dedicated aggregation function
    const { data: submissions, error } = await supabase
      .from('cci_submissions')
      .select('district, job_satisfaction, work_exhaustion, tenure')
      .gte('created_at', dateStr + ' 00:00:00')
      .lt('created_at', dateStr + ' 23:59:59');
    
    if (error) {
      console.error('Error fetching submissions:', error);
      process.exit(1);
    }
    
    if (!submissions || submissions.length === 0) {
      console.log('No submissions found for date:', dateStr);
      console.log('Skipping signing.');
      process.exit(0);
    }
    
    // Group by district and calculate aggregates
    const districtMap = new Map<string, Array<{ satisfaction: number; exhaustion: number }>>();
    
    for (const sub of submissions) {
      if (!districtMap.has(sub.district)) {
        districtMap.set(sub.district, []);
      }
      districtMap.get(sub.district)!.push({
        satisfaction: sub.job_satisfaction,
        exhaustion: sub.work_exhaustion
      });
    }
    
    // Calculate district aggregates
    const aggregates = Array.from(districtMap.entries()).map(([district, records]) => {
      const n = records.length;
      const avgSatisfaction = records.reduce((sum, r) => sum + r.satisfaction, 0) / n;
      const avgExhaustion = records.reduce((sum, r) => sum + r.exhaustion, 0) / n;
      const avgCCI = 10 * (0.4 * avgSatisfaction + 0.6 * (10 - avgExhaustion));
      
      // Calculate confidence intervals (simplified - real implementation would use bootstrap)
      const stdDev = Math.sqrt(records.reduce((sum, r) => {
        const cci = 10 * (0.4 * r.satisfaction + 0.6 * (10 - r.exhaustion));
        return sum + Math.pow(cci - avgCCI, 2);
      }, 0) / n);
      
      const margin = 1.96 * stdDev / Math.sqrt(n); // 95% CI
      
      return {
        district,
        date: dateStr,
        nSignals: n,
        avgCCI: Math.round(avgCCI * 10) / 10,
        ciLower: Math.round((avgCCI - margin) * 10) / 10,
        ciUpper: Math.round((avgCCI + margin) * 10) / 10
      };
    });
    
    console.log(`Found ${aggregates.length} districts with data`);
    
    // Perform signing
    const result = await performNightlySigning(aggregates);
    
    if (result.success) {
      console.log('✓ Signing completed successfully');
      console.log('  Signed aggregates:', result.signedAggregates.length);
      console.log('  Public key:', result.publicKey.substring(0, 32) + '...');
      console.log('  Timestamp:', result.timestamp);
    } else {
      console.error('✗ Signing failed');
      process.exit(1);
    }
    
    console.log('=== Nightly Signing Job Completed ===');
    process.exit(0);
    
  } catch (error) {
    console.error('Fatal error in nightly signing job:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as nightlySigningJob };
