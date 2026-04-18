import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useRandomConnectReporting = () => {
  const { user } = useAuth();
  const [reportBanned, setReportBanned] = useState(false);
  const [reportCount, setReportCount] = useState(0);

  // Check if user is report-banned (3+ unique reporters)
  const checkReportBan = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_random_connect_report_count', {
        check_user_id: user.id
      });

      if (!error && data !== null) {
        setReportCount(data);
        setReportBanned(data >= 3);
      }
    } catch (error) {
      console.error('Error checking report ban:', error);
    }
  }, [user]);

  // Submit a report
  const submitReport = useCallback(async (
    reportedUserId: string,
    sessionId: string,
    reason: string
  ) => {
    if (!user) return false;

    try {
      // Check if user already reported this person in this session
      const { data: existingReport } = await supabase
        .from('random_connect_reports')
        .select('id')
        .eq('reporter_id', user.id)
        .eq('reported_user_id', reportedUserId)
        .eq('session_id', sessionId)
        .single();

      if (existingReport) {
        toast.error('You have already reported this user in this session');
        return false;
      }

      await supabase
        .from('random_connect_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          session_id: sessionId,
          reason
        });

      // Check if the reported user now has 3+ unique reporters
      const { data: banCheck } = await supabase.rpc('check_random_connect_ban', {
        check_user_id: reportedUserId
      });

      if (banCheck === true) {
        // Update the violations table to mark as report-banned
        const { data: existing } = await supabase
          .from('random_connect_violations')
          .select('id')
          .eq('user_id', reportedUserId)
          .single();

        if (existing) {
          await supabase
            .from('random_connect_violations')
            .update({
              permanent_ban: true,
              report_ban: true,
              last_violation_at: new Date().toISOString()
            })
            .eq('user_id', reportedUserId);
        } else {
          await supabase
            .from('random_connect_violations')
            .insert({
              user_id: reportedUserId,
              violation_type: 'report_ban',
              violation_count: 3,
              permanent_ban: true,
              report_ban: true
            });
        }
      }

      toast.success('Report submitted. Thank you for keeping Random Connect safe.');
      return true;
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
      return false;
    }
  }, [user]);

  useEffect(() => {
    checkReportBan();
  }, [checkReportBan]);

  return {
    reportBanned,
    reportCount,
    submitReport,
    checkReportBan
  };
};
