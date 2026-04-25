import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generatePseudoName, getRandomConversationStarter } from '@/utils/pseudoNames';
import { toast } from 'sonner';

export type ConnectionMode = 'audio' | 'video' | 'text';
export type ConnectionStatus = 'idle' | 'searching' | 'connecting' | 'connected' | 'ended';

interface Session {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_pseudo_name: string;
  user2_pseudo_name: string;
  mode: ConnectionMode;
  conversation_starter: string;
  started_at: string;
}

interface TextMessage {
  id: string;
  session_id: string;
  sender_pseudo_name: string;
  content: string;
  created_at: string;
}

interface ViolationStatus {
  count: number;
  bannedUntil: Date | null;
  permanentBan: boolean;
  reportBan: boolean;
}

export const useRandomConnect = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [mode, setMode] = useState<ConnectionMode>('text');
  const [language, setLanguage] = useState('any');
  const [region, setRegion] = useState('any');
  const [interests, setInterests] = useState<string[]>(['all']);
  const [matchedInterests, setMatchedInterests] = useState<string[]>([]);
  const [myPseudoName, setMyPseudoName] = useState('');
  const [partnerPseudoName, setPartnerPseudoName] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<TextMessage[]>([]);
  const [conversationStarter, setConversationStarter] = useState('');
  const [violationStatus, setViolationStatus] = useState<ViolationStatus>({ 
    count: 0, bannedUntil: null, permanentBan: false, reportBan: false
  });
  const [textMemory, setTextMemory] = useState<{ content: string; isOwn: boolean }[]>([]);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const checkViolationStatus = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('random_connect_violations').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      setViolationStatus({
        count: data.violation_count || 0,
        bannedUntil: data.banned_until ? new Date(data.banned_until) : null,
        permanentBan: data.permanent_ban || false,
        reportBan: data.report_ban || false
      });
    } else {
      const { data: reportCount } = await supabase.rpc('get_random_connect_report_count', { check_user_id: user.id });
      if (reportCount && reportCount >= 3) {
        setViolationStatus(prev => ({ ...prev, reportBan: true, permanentBan: true }));
      }
    }
  }, [user]);

  const loadTextMemory = useCallback(async () => {
    if (!user) return;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase.from('random_connect_text_memory').select('*').eq('user_id', user.id)
      .gte('created_at', twentyFourHoursAgo).order('created_at', { ascending: false }).limit(200);
    if (data) {
      const sessionGroups = new Map<number, typeof data>();
      data.forEach(m => {
        if (!sessionGroups.has(m.session_index)) sessionGroups.set(m.session_index, []);
        sessionGroups.get(m.session_index)!.push(m);
      });
      const sessionIndices = Array.from(sessionGroups.keys()).sort((a, b) => b - a).slice(0, 10);
      const limitedMemory = sessionIndices.flatMap(idx => sessionGroups.get(idx) || []);
      setTextMemory(limitedMemory.map(m => ({ content: m.content, isOwn: m.is_own_message })).reverse());
    }
  }, [user]);

  const clearTextMemory = useCallback(async () => {
    if (!user) return;
    await supabase.from('random_connect_text_memory').delete().eq('user_id', user.id);
    setTextMemory([]);
  }, [user]);

  useEffect(() => { checkViolationStatus(); loadTextMemory(); }, [checkViolationStatus, loadTextMemory]);

  const isBanned = useCallback(() => {
    if (violationStatus.permanentBan) return true;
    if (violationStatus.reportBan) return true;
    if (violationStatus.bannedUntil && new Date() < violationStatus.bannedUntil) return true;
    return false;
  }, [violationStatus]);

  const recordViolation = useCallback(async (type: 'screenshot' | 'recording') => {
    if (!user) return;
    const newCount = violationStatus.count + 1;
    let bannedUntil: Date | null = null;
    let permanentBan = false;
    if (newCount >= 5) { permanentBan = true; toast.error('Permanently banned from Random Connect.'); }
    else if (newCount >= 3) { bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); toast.error('Temporarily banned for 24 hours.'); }
    else { toast.warning('Screenshot/Recording detected. Warning.'); }
    
    const { data: existing } = await supabase.from('random_connect_violations').select('id').eq('user_id', user.id).single();
    if (existing) {
      await supabase.from('random_connect_violations').update({
        violation_count: newCount, last_violation_at: new Date().toISOString(),
        banned_until: bannedUntil?.toISOString(), permanent_ban: permanentBan
      }).eq('user_id', user.id);
    } else {
      await supabase.from('random_connect_violations').insert({
        user_id: user.id, violation_type: type, violation_count: newCount,
        banned_until: bannedUntil?.toISOString(), permanent_ban: permanentBan
      });
    }
    setViolationStatus({ count: newCount, bannedUntil, permanentBan, reportBan: false });
    if (permanentBan || bannedUntil) endSession();
  }, [user, violationStatus.count]);

  // Compute shared interests between my interests and match's interests
  const computeSharedInterests = (myInterests: string[], theirInterests: string[]): string[] => {
    if (myInterests.includes('all') || theirInterests.length === 0) return [];
    if (theirInterests.includes('all') || myInterests.length === 0) return [];
    return myInterests.filter(i => theirInterests.includes(i));
  };

  const startSearching = useCallback(async () => {
    if (!user || isBanned()) { toast.error('You are currently banned.'); return; }
    const pseudoName = generatePseudoName();
    setMyPseudoName(pseudoName);
    setStatus('searching');
    setMatchedInterests([]);
    setConversationStarter(getRandomConversationStarter());
    
    const cleanInterests = interests.includes('all') ? [] : interests;
    
    await supabase.from('random_connect_queue').delete().eq('user_id', user.id);
    await supabase.from('random_connect_queue').insert({
      user_id: user.id, mode, language, region, pseudo_name: pseudoName, interests: cleanInterests
    } as any);
    
    const findMatch = async () => {
      const { data: matches } = await supabase.from('random_connect_queue').select('*')
        .eq('mode', mode).neq('user_id', user.id).order('created_at', { ascending: true }).limit(10);
      
      if (matches && matches.length > 0) {
        const scored = matches.map(m => {
          let score = 0;
          if (language === 'any' || m.language === 'any') score += 1;
          else if (m.language === language) score += 3;
          else if (language.includes('+') || (m.language && m.language.includes('+'))) {
            const myLangs = language.split('+');
            const theirLangs = (m.language || '').split('+');
            if (myLangs.some(l => theirLangs.includes(l))) score += 2;
          }
          if (region === 'any' || m.region === 'any') score += 1;
          else if (m.region === region) score += 3;
          
          const theirInterests = (m as any).interests || [];
          if (cleanInterests.length > 0 && theirInterests.length > 0) {
            const shared = cleanInterests.filter((i: string) => theirInterests.includes(i));
            score += shared.length * 2;
          } else { score += 1; }
          return { ...m, score };
        });
        scored.sort((a, b) => b.score - a.score);
        const match = scored[0];
        
        const starter = getRandomConversationStarter();
        const { data: newSession } = await supabase.from('random_connect_sessions').insert({
          user1_id: user.id, user2_id: match.user_id,
          user1_pseudo_name: pseudoName, user2_pseudo_name: match.pseudo_name,
          mode, conversation_starter: starter
        }).select().single();
        
        if (newSession) {
          await supabase.from('random_connect_queue').delete().in('user_id', [user.id, match.user_id]);
          const typedSession: Session = {
            id: newSession.id, user1_id: newSession.user1_id, user2_id: newSession.user2_id,
            user1_pseudo_name: newSession.user1_pseudo_name, user2_pseudo_name: newSession.user2_pseudo_name,
            mode: newSession.mode as ConnectionMode, conversation_starter: newSession.conversation_starter || '',
            started_at: newSession.started_at
          };
          setSession(typedSession);
          setPartnerPseudoName(match.pseudo_name);
          setConversationStarter(starter);
          
          // Compute shared interests
          const theirInterests = (match as any).interests || [];
          setMatchedInterests(computeSharedInterests(cleanInterests, theirInterests));
          
          setStatus('connected');
          return true;
        }
      }
      return false;
    };
    
    const found = await findMatch();
    if (!found) {
      const channel = supabase.channel('random-connect-queue')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'random_connect_sessions', filter: `user2_id=eq.${user.id}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const raw = payload.new;
              const newSession: Session = {
                id: raw.id, user1_id: raw.user1_id, user2_id: raw.user2_id,
                user1_pseudo_name: raw.user1_pseudo_name, user2_pseudo_name: raw.user2_pseudo_name,
                mode: raw.mode as ConnectionMode, conversation_starter: raw.conversation_starter || '',
                started_at: raw.started_at
              };
              setSession(newSession);
              setPartnerPseudoName(newSession.user1_pseudo_name);
              setConversationStarter(newSession.conversation_starter || '');
              setMatchedInterests([]); // Partner initiated, no interest data available here
              setStatus('connected');
              await supabase.from('random_connect_queue').delete().eq('user_id', user.id);
            }
          }).subscribe();
      channelRef.current = channel;
      searchTimeoutRef.current = setInterval(async () => {
        const found = await findMatch();
        if (found && searchTimeoutRef.current) { clearInterval(searchTimeoutRef.current); channel.unsubscribe(); }
      }, 3000);
    }
  }, [user, mode, language, region, interests, isBanned]);

  const cancelSearch = useCallback(async () => {
    if (searchTimeoutRef.current) clearInterval(searchTimeoutRef.current);
    if (channelRef.current) channelRef.current.unsubscribe();
    if (user) await supabase.from('random_connect_queue').delete().eq('user_id', user.id);
    setStatus('idle');
  }, [user]);

  const endSession = useCallback(async () => {
    if (session && user) {
      await supabase.from('random_connect_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', session.id);
    }
    if (channelRef.current) channelRef.current.unsubscribe();
    setSession(null); setPartnerPseudoName(''); setMessages([]); setMatchedInterests([]); setStatus('idle');
  }, [session, user]);

  const skipToNext = useCallback(async () => {
    if (session && user) {
      await supabase.from('random_connect_sessions').update({ status: 'skipped', ended_at: new Date().toISOString() }).eq('id', session.id);
    }
    if (channelRef.current) channelRef.current.unsubscribe();
    setSession(null); setPartnerPseudoName(''); setMessages([]); setMatchedInterests([]); setStatus('idle');
  }, [session, user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!session || !user || !myPseudoName) return;
    await supabase.from('random_connect_messages').insert({ session_id: session.id, sender_pseudo_name: myPseudoName, content });
    if (mode === 'text') {
      const { data: existingMemory } = await supabase.from('random_connect_text_memory').select('session_index')
        .eq('user_id', user.id).order('session_index', { ascending: false }).limit(1);
      const sessionIndex = existingMemory && existingMemory.length > 0 ? existingMemory[0].session_index : 0;
      await supabase.from('random_connect_text_memory').insert({ user_id: user.id, content, is_own_message: true, session_index: sessionIndex });
    }
  }, [session, user, myPseudoName, mode]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel(`session-${session.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'random_connect_messages', filter: `session_id=eq.${session.id}` },
        async (payload) => {
          const newMessage = payload.new as TextMessage;
          setMessages(prev => [...prev, newMessage]);
          if (mode === 'text' && user && newMessage.sender_pseudo_name !== myPseudoName) {
            const { data: existingMemory } = await supabase.from('random_connect_text_memory').select('session_index')
              .eq('user_id', user.id).order('session_index', { ascending: false }).limit(1);
            const sessionIndex = existingMemory && existingMemory.length > 0 ? existingMemory[0].session_index : 0;
            await supabase.from('random_connect_text_memory').insert({
              user_id: user.id, content: newMessage.content, is_own_message: false, session_index: sessionIndex
            });
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'random_connect_sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          const updatedSession = payload.new as any;
          if (updatedSession.status === 'ended' || updatedSession.status === 'skipped') {
            setSession(null); setPartnerPseudoName(''); setMessages([]); setMatchedInterests([]); setStatus('idle');
          }
        }).subscribe();
    return () => { channel.unsubscribe(); };
  }, [session, mode, user, myPseudoName]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearInterval(searchTimeoutRef.current);
      if (channelRef.current) channelRef.current.unsubscribe();
    };
  }, []);

  return {
    status, mode, setMode, language, setLanguage, region, setRegion,
    interests, setInterests, matchedInterests,
    myPseudoName, partnerPseudoName, session, messages,
    conversationStarter, textMemory, violationStatus,
    isBanned: isBanned(),
    startSearching, cancelSearch, endSession, skipToNext,
    sendMessage, recordViolation, clearTextMemory
  };
};
