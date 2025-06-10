import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, ArrowLeft, RefreshCw, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGameState } from '@/hooks/useGameState';
import { EnhancedLeaderboard } from '@/components/EnhancedLeaderboard';
import { HostGameControl } from '@/components/HostGameControl';
import { QuestionPhotoUpload } from '@/components/QuestionPhotoUpload';

const HostGame = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(30);
  const [gamePin, setGamePin] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [questionPhotos, setQuestionPhotos] = useState<{[key: string]: string}>({});

  const { 
    game, 
    quiz, 
    startGame, 
    canStart, 
    currentQuestion, 
    isGameActive, 
    isGameFinished,
    refreshGameData,
    connect,
    isConnected,
    error
  } = useGameState({ 
    pin: gamePin || undefined, 
    autoConnect: false 
  });

  // Show answers only when timer hits 0 or manually skipped to leaderboard
  useEffect(() => {
    if (timeLeft === 0) {
      setShowAnswers(true);
    } else if (timeLeft > 0) {
      setShowAnswers(false);
    }
  }, [timeLeft]);

  // Auto-refresh for better real-time sync
  useEffect(() => {
    if (!gamePin || !isConnected) return;

    const interval = setInterval(() => {
      refreshGameData();
    }, 1000); // Refresh every second for better real-time feel

    return () => clearInterval(interval);
  }, [gamePin, isConnected, refreshGameData]);

  // Initialize game session
  useEffect(() => {
    const initializeGame = async () => {
      if (!quizId) {
        toast({ title: 'Quiz ID is required', variant: 'destructive' });
        navigate('/');
        return;
      }

      setIsInitializing(true);
      console.log('HostGame: Initializing game for quiz:', quizId);

      try {
        // Try to load from localStorage first
        const savedQuiz = localStorage.getItem(`quiz_${quizId}`);
        if (!savedQuiz) {
          toast({ title: 'Quiz not found', variant: 'destructive' });
          navigate('/');
          return;
        }

        const quizData = JSON.parse(savedQuiz);
        console.log('HostGame: Loaded quiz:', quizData.title);
        
        // Import gameManager and create game session
        const { gameManager } = await import('@/lib/gameManager');
        
        // First create quiz in Supabase
        const createdQuiz = await gameManager.createQuiz({
          title: quizData.title,
          description: quizData.description || '',
          questions: quizData.questions.map(q => ({
            ...q,
            points: q.points || 1000
          })),
          createdBy: 'host'
        });

        console.log('HostGame: Created quiz in Supabase:', createdQuiz.id);

        // Then create game session
        const gameSession = await gameManager.createGameSession(createdQuiz.id);
        console.log('HostGame: Created game session with PIN:', gameSession.pin);
        
        // Set the PIN and connect
        setGamePin(gameSession.pin);
        
      } catch (error) {
        console.error('HostGame: Error setting up game:', error);
        toast({ title: 'Failed to setup game', variant: 'destructive' });
        setIsInitializing(false);
      }
    };

    initializeGame();
  }, [quizId, navigate]);

  // Connect once we have a PIN
  useEffect(() => {
    if (gamePin && !isConnected) {
      console.log('HostGame: Connecting to game:', gamePin);
      connect(gamePin).then(() => {
        setIsInitializing(false);
      });
    }
  }, [gamePin, isConnected, connect]);

  // Show error if connection fails
  useEffect(() => {
    if (error) {
      toast({ title: error, variant: 'destructive' });
    }
  }, [error]);

  const handleStartGame = async () => {
    console.log('HostGame: Starting game...');
    const success = await startGame();
    if (success) {
      toast({ title: 'Game started! Players can now answer questions.' });
      // Set initial timer when game starts
      if (currentQuestion) {
        setTimeLeft(currentQuestion.timeLimit);
      }
    } else {
      toast({ title: 'Failed to start game', variant: 'destructive' });
    }
  };

  const copyGamePin = () => {
    if (gamePin) {
      navigator.clipboard.writeText(gamePin);
      toast({ title: 'Game PIN copied to clipboard!' });
    }
  };

  const handleQuestionComplete = async () => {
    console.log('HostGame: Question completed, refreshing data...');
    await refreshGameData();
    
    // Reset timer and answers for next question
    if (currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit);
      setShowAnswers(false);
    }
  };

  const handleRefresh = async () => {
    if (gamePin) {
      console.log('HostGame: Manual refresh triggered');
      await refreshGameData();
      toast({ title: 'Game data refreshed' });
    }
  };

  const handleQuestionPhotoAdd = (questionId: string, photoUrl: string) => {
    setQuestionPhotos(prev => ({
      ...prev,
      [questionId]: photoUrl
    }));
  };

  const handleQuestionPhotoRemove = (questionId: string) => {
    setQuestionPhotos(prev => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Setting up your Quizora game...</div>
      </div>
    );
  }

  if (!game || !quiz || !gamePin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading Quizora session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-2 sm:p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 border border-white/20 order-2 sm:order-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white text-center order-1 sm:order-2">
            Quizora - {quiz.title}
          </h1>
          <Button 
            onClick={handleRefresh}
            variant="outline"
            className="bg-black/30 border-white/30 text-white hover:bg-white/20 order-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Game PIN */}
        <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl mb-6 sm:mb-8">
          <CardContent className="py-6 sm:py-8">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Game PIN</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <span className="text-4xl sm:text-6xl font-bold text-white tracking-wider">
                  {gamePin}
                </span>
                <Button
                  onClick={copyGamePin}
                  variant="outline"
                  className="bg-black/30 border-white/30 text-white hover:bg-white/20"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-white/70 mt-4 text-sm sm:text-base">
                Players can join at your Quizora website with this PIN
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Game Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
                <Users className="h-5 w-5" />
                Players ({game.players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {game.players.length}
              </div>
              <div className="space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                {game.players.length > 0 ? (
                  game.players.map(player => (
                    <div key={player.id} className="text-white/70 text-xs sm:text-sm bg-white/10 px-2 py-1 rounded">
                      {player.name} ({player.score} pts)
                    </div>
                  ))
                ) : (
                  <div className="text-white/50 text-sm">No players yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-base sm:text-lg">Game Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                className={`text-sm sm:text-lg px-3 sm:px-4 py-2 ${
                  game.status === 'waiting' 
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : game.status === 'playing'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {game.status === 'waiting' && 'Waiting to Start'}
                {game.status === 'playing' && 'Game Active'}
                {game.status === 'finished' && 'Game Finished'}
              </Badge>
              {game.status === 'waiting' && (
                <Button
                  onClick={handleStartGame}
                  disabled={!canStart}
                  className="w-full mt-4 bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black font-bold"
                >
                  {canStart ? 'Start Game' : 'Need at least 1 player'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-base sm:text-lg">Quiz Info</CardTitle>
            </CardHeader>
            <CardContent className="text-white/70">
              <div className="space-y-2 text-sm sm:text-base">
                <div>Questions: {quiz.questions.length}</div>
                {isGameActive && currentQuestion && (
                  <div>Current: Question {(game.currentQuestionIndex || 0) + 1}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Controls and Leaderboard */}
        {isGameActive && currentQuestion && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <HostGameControl
                gamePin={gamePin}
                currentQuestionIndex={game.currentQuestionIndex || 0}
                totalQuestions={quiz.questions.length}
                questionTimeLimit={currentQuestion.timeLimit}
                onQuestionComplete={handleQuestionComplete}
                timeLeft={timeLeft}
                setTimeLeft={setTimeLeft}
              />
              
              <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span>Current Question</span>
                    <Image className="h-5 w-5 text-white/60" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Question Photo Upload */}
                  <QuestionPhotoUpload
                    onPhotoAdd={(url) => handleQuestionPhotoAdd(currentQuestion.id, url)}
                    currentPhoto={questionPhotos[currentQuestion.id] || currentQuestion.imageUrl}
                    onPhotoRemove={() => handleQuestionPhotoRemove(currentQuestion.id)}
                  />
                  
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {currentQuestion.question}
                  </h3>

                  {/* Display question image if available */}
                  {(questionPhotos[currentQuestion.id] || currentQuestion.imageUrl) && (
                    <div className="rounded-lg overflow-hidden">
                      <img 
                        src={questionPhotos[currentQuestion.id] || currentQuestion.imageUrl} 
                        alt="Question visual" 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentQuestion.answers.map((answer, index) => (
                      <div
                        key={answer.id}
                        className={`p-2 sm:p-3 rounded-lg border text-sm sm:text-base ${
                          showAnswers && answer.isCorrect
                            ? 'bg-green-500/20 border-green-500/30 text-green-400'
                            : 'bg-white/10 border-white/20 text-white/70'
                        }`}
                      >
                        <span className="font-bold">{String.fromCharCode(65 + index)}.</span> {answer.text}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <EnhancedLeaderboard
              players={game.players}
              currentQuestionIndex={game.currentQuestionIndex || 0}
              totalQuestions={quiz.questions.length}
              timeLeft={timeLeft}
              showDetailedStats={true}
            />
          </div>
        )}

        {/* Final Results */}
        {isGameFinished && (
          <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-xl sm:text-2xl">Final Results</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedLeaderboard
                players={game.players}
                currentQuestionIndex={game.currentQuestionIndex || 0}
                totalQuestions={quiz.questions.length}
                timeLeft={0}
                showDetailedStats={true}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HostGame;
