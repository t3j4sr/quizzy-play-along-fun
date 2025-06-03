
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGameState } from '@/hooks/useGameState';
import { HostLeaderboard } from '@/components/HostLeaderboard';
import { HostGameControl } from '@/components/HostGameControl';

const HostGame = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(30);

  const { 
    game, 
    quiz, 
    startGame, 
    canStart, 
    currentQuestion, 
    isGameActive, 
    isGameFinished,
    refreshGameData
  } = useGameState({ 
    pin: game?.pin, 
    autoConnect: false 
  });

  // Load quiz and create game session
  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) {
        toast({ title: 'Quiz ID is required', variant: 'destructive' });
        navigate('/');
        return;
      }

      // Try to load from localStorage first
      const savedQuiz = localStorage.getItem(`quiz_${quizId}`);
      if (!savedQuiz) {
        toast({ title: 'Quiz not found', variant: 'destructive' });
        navigate('/');
        return;
      }

      try {
        const quizData = JSON.parse(savedQuiz);
        console.log('HostGame: Loaded quiz:', quizData.title);
        
        // Create game session using gameManager
        const { gameManager } = await import('@/lib/gameManager');
        
        // First create quiz in Supabase
        const createdQuiz = await gameManager.createQuiz({
          title: quizData.title,
          description: quizData.description || '',
          questions: quizData.questions.map(q => ({
            ...q,
            points: 1000 // Default points
          })),
          createdBy: 'host'
        });

        // Then create game session
        const gameSession = await gameManager.createGameSession(createdQuiz.id);
        console.log('HostGame: Created game session with PIN:', gameSession.pin);
        
        // Connect to the game
        const { connect } = await import('@/hooks/useGameState');
        // The useGameState hook will handle the connection
        
      } catch (error) {
        console.error('HostGame: Error setting up game:', error);
        toast({ title: 'Failed to setup game', variant: 'destructive' });
      }
    };

    loadQuiz();
  }, [quizId, navigate]);

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
    if (game?.pin) {
      navigator.clipboard.writeText(game.pin);
      toast({ title: 'Game PIN copied to clipboard!' });
    }
  };

  const handleQuestionComplete = async () => {
    console.log('HostGame: Question completed, refreshing data...');
    await refreshGameData();
    
    // Reset timer for next question
    if (currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit);
    }
  };

  if (!game || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Setting up your game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 border border-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-white">{quiz.title}</h1>
          <Button 
            onClick={refreshGameData}
            variant="outline"
            className="bg-black/30 border-white/30 text-white hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Game PIN */}
        <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl mb-8">
          <CardContent className="py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Game PIN</h2>
              <div className="flex items-center justify-center gap-4">
                <span className="text-6xl font-bold text-white tracking-wider">
                  {game.pin}
                </span>
                <Button
                  onClick={copyGamePin}
                  variant="outline"
                  className="bg-black/30 border-white/30 text-white hover:bg-white/20"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-white/70 mt-4">
                Players can join at your quiz website with this PIN
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Game Status */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5" />
                Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {game.players.length}
              </div>
              <div className="space-y-2">
                {game.players.slice(0, 5).map(player => (
                  <div key={player.id} className="text-white/70 text-sm">
                    {player.name}
                  </div>
                ))}
                {game.players.length > 5 && (
                  <div className="text-white/50 text-sm">
                    +{game.players.length - 5} more...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">Game Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                className={`text-lg px-4 py-2 ${
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
              <CardTitle className="text-white">Quiz Info</CardTitle>
            </CardHeader>
            <CardContent className="text-white/70">
              <div className="space-y-2">
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
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <HostGameControl
                gamePin={game.pin}
                currentQuestionIndex={game.currentQuestionIndex || 0}
                totalQuestions={quiz.questions.length}
                questionTimeLimit={currentQuestion.timeLimit}
                onQuestionComplete={handleQuestionComplete}
                timeLeft={timeLeft}
                setTimeLeft={setTimeLeft}
              />
              
              <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white">Current Question</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {currentQuestion.question}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {currentQuestion.answers.map((answer, index) => (
                      <div
                        key={answer.id}
                        className={`p-3 rounded-lg border ${
                          answer.isCorrect
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

            <HostLeaderboard
              players={game.players}
              currentQuestionIndex={game.currentQuestionIndex || 0}
              totalQuestions={quiz.questions.length}
              timeLeft={timeLeft}
            />
          </div>
        )}

        {/* Final Results */}
        {isGameFinished && (
          <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">Final Results</CardTitle>
            </CardHeader>
            <CardContent>
              <HostLeaderboard
                players={game.players}
                currentQuestionIndex={game.currentQuestionIndex || 0}
                totalQuestions={quiz.questions.length}
                timeLeft={0}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HostGame;
