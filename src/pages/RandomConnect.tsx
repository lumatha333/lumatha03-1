import React, { useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRandomConnect } from '@/hooks/useRandomConnect';
import { useRandomConnectMemories } from '@/hooks/useRandomConnectMemories';
import { ModeSelector } from '@/components/randomconnect/ModeSelector';
import { SearchingView } from '@/components/randomconnect/SearchingView';
import { AudioConnect } from '@/components/randomconnect/AudioConnect';
import { VideoConnect } from '@/components/randomconnect/VideoConnect';
import { TextConnect } from '@/components/randomconnect/TextConnect';
import { EndedView } from '@/components/randomconnect/EndedView';
import { SavedMemories } from '@/components/randomconnect/SavedMemories';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Clock } from 'lucide-react';

const RandomConnect: React.FC = () => {
  const { user } = useAuth();
  const sessionStartRef = useRef<number>(0);
  
  const {
    status,
    mode,
    setMode,
    language,
    setLanguage,
    region,
    setRegion,
    myPseudoName,
    partnerPseudoName,
    session,
    messages,
    conversationStarter,
    textMemory,
    isBanned,
    startSearching,
    cancelSearch,
    skipToNext,
    sendMessage,
    recordViolation,
    clearTextMemory
  } = useRandomConnect();

  const {
    memories,
    saveMemory,
    clearMemory,
    clearAllMemories,
    sendReconnectRequest,
    respondToReconnect
  } = useRandomConnectMemories();

  // Track session start time
  React.useEffect(() => {
    if (status === 'connected') {
      sessionStartRef.current = Date.now();
    }
  }, [status]);

  // Save memory when session ends (via skip)
  const handleSkip = useCallback(() => {
    if (session && partnerPseudoName) {
      const durationSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      saveMemory(session.id, partnerPseudoName, mode, durationSeconds);
    }
    skipToNext();
  }, [session, partnerPseudoName, mode, skipToNext, saveMemory]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Heart className="w-16 h-16 text-primary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Random Connect</h2>
        <p className="text-muted-foreground">Please sign in to connect with others.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Tabs defaultValue="connect" className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-4">
          <TabsTrigger value="connect" className="gap-2">
            <Heart className="w-4 h-4" /> Connect
          </TabsTrigger>
          <TabsTrigger value="memory" className="gap-2">
            <Clock className="w-4 h-4" /> Memories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connect" className="mt-0">
          {status === 'idle' && (
            <ModeSelector
              mode={mode}
              setMode={setMode}
              language={language}
              setLanguage={setLanguage}
              region={region}
              setRegion={setRegion}
              onStart={startSearching}
              isBanned={isBanned}
            />
          )}

          {status === 'searching' && (
            <SearchingView
              mode={mode}
              myPseudoName={myPseudoName}
              onCancel={cancelSearch}
            />
          )}

          {status === 'connected' && mode === 'audio' && (
            <AudioConnect
              myPseudoName={myPseudoName}
              partnerPseudoName={partnerPseudoName}
              conversationStarter={conversationStarter}
              onSkip={handleSkip}
              onViolation={recordViolation}
              sessionId={session?.id}
              partnerId={session?.user1_id === user.id ? session?.user2_id : session?.user1_id}
            />
          )}

          {status === 'connected' && mode === 'video' && (
            <VideoConnect
              myPseudoName={myPseudoName}
              partnerPseudoName={partnerPseudoName}
              conversationStarter={conversationStarter}
              onSkip={handleSkip}
              onViolation={recordViolation}
              sessionId={session?.id}
              partnerId={session?.user1_id === user.id ? session?.user2_id : session?.user1_id}
            />
          )}

          {status === 'connected' && mode === 'text' && (
            <TextConnect
              myPseudoName={myPseudoName}
              partnerPseudoName={partnerPseudoName}
              conversationStarter={conversationStarter}
              messages={messages}
              sessionId={session?.id || null}
              textMemory={textMemory}
              onSendMessage={sendMessage}
              onSkip={handleSkip}
              onViolation={recordViolation}
              onClearMemory={clearTextMemory}
              partnerId={session?.user1_id === user.id ? session?.user2_id : session?.user1_id}
            />
          )}

          {status === 'ended' && (
            <EndedView onNewConnection={startSearching} />
          )}
        </TabsContent>

        <TabsContent value="memory" className="mt-0 h-[70vh]">
          <SavedMemories
            memories={memories}
            onClearMemory={clearMemory}
            onClearAll={clearAllMemories}
            onSendReconnect={sendReconnectRequest}
            onRespondReconnect={respondToReconnect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RandomConnect;
