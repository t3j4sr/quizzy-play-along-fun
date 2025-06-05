
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, Zap, Users, RefreshCw } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { toast } from '@/hooks/use-toast';

const PlayGame = () => {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pin = searchParams.get('pin');
  const playerId = searchParams.get('playerId');
  
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const { 
    game, 
    quiz, 
    currentPlayer, 
    currentQuestion, 
    submitAnswer, 
    isGameActive,
    isGameFinished,
    error,
    isConnected,
    isLoading
  } = useGameState({ 
    pin: pin || undefined,
    playerId: playerId || undefined 
  });

  // Handle game status changes
  useEffect(() => {
    console.log('PlayGame: Game status update:', { 
      status: game?.status, 
      isGameActive, 
      currentQuestionIndex: game?.currentQuestionIndex,
      playerName: currentPlayer?.name,
      isConnected,
      hasCurrentQuestion: !!currentQuestion
    });

    // Reset answer state when question changes
    if (isGameActive && currentQuestion) {
      setIsAnswered(false);
      setSelectedAnswer(null);
      setPointsEarned(0);
      setTimeLeft(currentQuestion.timeLimit);
      console.log('PlayGame: New question loaded:', currentQuestion.question);
    }
  }, [game?.status, game?.currentQuestionIndex, isGameActive, currentQuestion, currentPlayer, isConnected]);

  // Handle timer countdown
  useEffect(() => {
    if (isGameActive && currentQuestion && timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered && currentQuestion) {
      handleAnswerSubmit(null);
    }
  }, [timeLeft, isAnswered, currentQuestion, isGameActive]);

  // Show error messages
  useEffect(() => {
    if (error) {
      toast({ title: error, variant: 'destructive' });
    }
  }, [error]);

  const handleAnswerSubmit = async (answerId: string | null) => {
    if (isAnswered || !currentQuestion || !currentPlayer || !game) return;
    
    console.log('PlayGame: Submitting answer:', { answerId, timeSpent: currentQuestion.timeLimit - timeLeft });
    
    setSelectedAnswer(answerId);
    setIsAnswered(true);
    
    const timeSpent = currentQuestion.timeLimit - timeLeft;
    const success = await submitAnswer(currentQuestion.id, answerId || '', timeSpent);
    
    if (success && answerId) {
      const correctAnswer = currentQuestion.answers.find(a => a.id === answerId);
      if (correctAnswer?.isCorrect) {
        // Calculate points like Kahoot: base points + speed bonus
        const basePoints = Math.floor((currentQuestion.points || 1000) * 0.5);
        const timeBonus = Math.floor(basePoints * (timeLeft / currentQuestion.timeLimit));
        const totalPoints = basePoints + timeBonus;
        setPointsEarned(totalPoints);
      }
    }

    if (!success) {
      toast({ title: 'Failed to submit answer', variant: 'destructive' });
    }
  };

  const getAnswerStyle = (answer: any) => {
    if (!isAnswered) {
      return selectedAnswer === answer.id 
        ? "bg-white text-black scale-105 shadow-lg border-2 border-white" 
        : "bg-black/50 text-white hover:bg-black/70 hover:scale-105 border border-white/30";
    }
    
    if (answer.isCorrect) {
      return "bg-green-500 text-white border-2 border-green-300";
    }
    
    if (selectedAnswer === answer.id && !answer.isCorrect) {
      return "bg-red-500 text-white border-2 border-red-300";
    }
    
    return "bg-gray-500 text-gray-300 border border-gray-400";
  };

  const handleReload = () => {
    window.location.reload();
  };

  // Loading states
  if (isLoading || !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">
          {isLoading ? 'Connecting to game...' : 'Loading...'}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Connection Error</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="bg-white text-black">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game not found
  if (!game || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Game not found or player not connected</div>
      </div>
    );
  }

  // Waiting for game to start
  if (game.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/30">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Waiting for host to start...</h2>
            <p className="text-white/70 mb-6">
              {currentPlayer.name}, you're ready to play!
            </p>
            <div className="bg-white/10 rounded-lg p-4 border border-white/20 mb-4">
              <p className="text-white/80">Game PIN: <span className="font-bold text-xl">{game.pin}</span></p>
              <p className="text-white/60 text-sm mt-2">{game.players.length} players joined</p>
            </div>
            <Button
              onClick={handleReload}
              variant="outline"
              className="bg-black/30 border-white/30 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game finished
  if (isGameFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-2xl bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-12">
            <Trophy className="h-24 w-24 text-white mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Game Complete!</h1>
            <p className="text-xl text-white/80 mb-6">
              Well done, {currentPlayer.name}!
            </p>
            <div className="bg-gradient-to-r from-white to-gray-200 text-black rounded-lg p-6 mb-6">
              <p className="text-lg mb-2 font-semibold">Final Score</p>
              <p className="text-5xl font-bold">{currentPlayer.score.toLocaleString()}</p>
            </div>
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black"
            >
              Play Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No current question available
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Loading Question...</h2>
            <p className="text-white/70 mb-6">Please wait while the next question loads</p>
            <Button
              onClick={handleReload}
              variant="outline"
              className="bg-black/30 border-white/30 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show results after answering
  if (isAnswered) {
    const isCorrect = selectedAnswer && currentQuestion.answers.find(a => a.id === selectedAnswer)?.isCorrect;
    const correctAnswer = currentQuestion.answers.find(a => a.isCorrect);
    
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${
        isCorrect ? 'bg-gradient-to-br from-green-900 via-green-800 to-black' : 'bg-gradient-to-br from-red-900 via-red-800 to-black'
      }`}>
        <Card className="w-full max-w-2xl bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-12">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isCorrect ? 'bg-green-500 border-2 border-green-300' : 'bg-red-500 border-2 border-red-300'
            }`}>
              {isCorrect ? (
                <Zap className="h-12 w-12 text-white" />
              ) : (
                <Clock className="h-12 w-12 text-white" />
              )}
            </div>
            <h2 className="text-4xl font-bold mb-4 text-white">
              {isCorrect ? 'Correct!' : selectedAnswer ? 'Incorrect!' : 'Time\'s Up!'}
            </h2>
            {!isCorrect && (
              <p className="text-xl mb-4 text-white/80">
                The correct answer was: <strong>{correctAnswer?.text}</strong>
              </p>
            )}
            {isCorrect && pointsEarned > 0 && (
              <p className="text-xl text-white/80 mb-4">
                +{pointsEarned.toLocaleString()} points!
              </p>
            )}
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-lg text-white">
                Your Score: <strong>{currentPlayer.score.toLocaleString()}</strong>
              </p>
            </div>
            <p className="text-white/60 text-sm mt-4">Waiting for next question...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active question display
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 text-white">
          <div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Question {(game.currentQuestionIndex || 0) + 1} of {quiz?.questions.length || 0}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{currentPlayer.name}</p>
            <p className="text-sm opacity-75">Score: {currentPlayer.score.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleReload}
              variant="outline"
              size="sm"
              className="bg-black/30 border-white/30 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-2xl font-bold">{timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress 
            value={(timeLeft / currentQuestion.timeLimit) * 100} 
            className="h-3 bg-white/20"
          />
        </div>

        {/* Question */}
        <Card className="bg-black/50 backdrop-blur-sm shadow-2xl mb-8 border border-white/20">
          <CardContent className="py-8">
            <h1 className="text-3xl font-bold text-center text-white mb-8">
              {currentQuestion.question}
            </h1>
            
            <div className="grid md:grid-cols-2 gap-4">
              {currentQuestion.answers.map((answer, index) => (
                <Button
                  key={answer.id}
                  onClick={() => !isAnswered && handleAnswerSubmit(answer.id)}
                  disabled={isAnswered}
                  className={`h-20 text-lg font-semibold transition-all duration-300 ${getAnswerStyle(answer)}`}
                  variant="outline"
                >
                  <span className="mr-3 text-xl">{String.fromCharCode(65 + index)}</span>
                  {answer.text}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlayGame;
