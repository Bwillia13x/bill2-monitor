#!/usr/bin/env node
/**
 * Data Retention Cleanup Job
 * Runs daily at 3:00 AM MST
 * Purges old data according to retention policies
 */

import { supabase } from '../src/integrations/supabase/client';

async function main() {
  console.log('=== Data Retention Cleanup Job Started ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    let totalDeleted = 0;
    
    // 1. Clean up old rate limit records (30+ days old)
    console.log('Cleaning up old rate limits...');
    const { data: rateLimitResult, error: rateLimitError } = await supabase
      .rpc('cleanup_old_rate_limits');
    
    if (rateLimitError) {
      console.error('Error cleaning rate limits:', rateLimitError);
    } else {
      console.log(`  ✓ Deleted ${rateLimitResult || 0} old rate limit records`);
      totalDeleted += rateLimitResult || 0;
    }
    
    // 2. Clean up old ASN submission records (7+ days old)
    console.log('Cleaning up old ASN submissions...');
    const { data: asnResult, error: asnError } = await supabase
      .rpc('cleanup_old_asn_submissions');
    
    if (asnError) {
      console.error('Error cleaning ASN submissions:', asnError);
    } else {
      console.log(`  ✓ Deleted ${asnResult || 0} old ASN submission records`);
      totalDeleted += asnResult || 0;
    }
    
    // 3. Clean up old audit logs (1+ year old)
    console.log('Cleaning up old audit logs...');
    const { data: auditResult, error: auditError } = await supabase
      .rpc('cleanup_old_audit_logs');
    
    if (auditError) {
      console.error('Error cleaning audit logs:', auditError);
    } else {
      console.log(`  ✓ Deleted ${auditResult || 0} old audit log records`);
      totalDeleted += auditResult || 0;
    }
    
    // 4. Clean up old stories (90+ days old)
    console.log('Cleaning up old stories...');
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { error: storyError, count: storyCount } = await supabase
      .from('stories')
      .delete({ count: 'exact' })
      .lt('created_at', ninetyDaysAgo.toISOString());
    
    if (storyError) {
      console.error('Error cleaning stories:', storyError);
    } else {
      console.log(`  ✓ Deleted ${storyCount || 0} old story records`);
      totalDeleted += storyCount || 0;
    }
    
    // 5. Clean up old video references (180+ days old)
    console.log('Cleaning up old video references...');
    const oneEightyDaysAgo = new Date();
    oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);
    
    const { error: videoError, count: videoCount } = await supabase
      .from('story_videos')
      .delete({ count: 'exact' })
      .lt('created_at', oneEightyDaysAgo.toISOString());
    
    if (videoError) {
      console.error('Error cleaning videos:', videoError);
    } else {
      console.log(`  ✓ Deleted ${videoCount || 0} old video references`);
      totalDeleted += videoCount || 0;
    }
    
    console.log('');
    console.log('Summary:');
    console.log(`  Total records deleted: ${totalDeleted}`);
    console.log('=== Data Retention Cleanup Job Completed ===');
    process.exit(0);
    
  } catch (error) {
    console.error('Fatal error in retention cleanup job:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as retentionCleanupJob };
