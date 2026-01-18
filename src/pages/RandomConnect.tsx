import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRandomConnect } from '@/hooks/useRandomConnect';
import { ModeSelector } from '@/components/randomconnect/ModeSelector';
import { SearchingView } from '@/components/randomconnect/SearchingView';
import { AudioConnect } from '@/components/randomconnect/AudioConnect';
import { VideoConnect } from '@/components/randomconnect/VideoConnect';
import { TextConnect } from '@/components/randomconnect/TextConnect';
import { EndedView } from '@/components/randomconnect/EndedView';
import { TextMemory } from '@/components/randomconnect/TextMemory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, BookOpen } from 'lucide-react';

const RandomConnect: React.FC = () => {
  const { user } = useAuth();
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
    messages,
    conversationStarter,
    textMemory,
    isBanned,
    startSearching,
    cancelSearch,
    endSession,
    skipToNext,
    sendMessage
  } = useRandomConnect();

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
            <BookOpen className="w-4 h-4" /> Memory
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
              onSkip={skipToNext}
              onEnd={endSession}
            />
          )}

          {status === 'connected' && mode === 'video' && (
            <VideoConnect
              myPseudoName={myPseudoName}
              partnerPseudoName={partnerPseudoName}
              conversationStarter={conversationStarter}
              onSkip={skipToNext}
              onEnd={endSession}
            />
          )}

          {status === 'connected' && mode === 'text' && (
            <TextConnect
              myPseudoName={myPseudoName}
              partnerPseudoName={partnerPseudoName}
              conversationStarter={conversationStarter}
              messages={messages}
              onSendMessage={sendMessage}
              onSkip={skipToNext}
              onEnd={endSession}
            />
          )}

          {status === 'ended' && (
            <EndedView onNewConnection={startSearching} />
          )}
        </TabsContent>

        <TabsContent value="memory" className="mt-0 h-[70vh]">
          <TextMemory memory={textMemory} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RandomConnect;
