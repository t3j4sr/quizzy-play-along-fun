
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, Zap, Users, RefreshCw, Target } from 'lucide-react';
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
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);

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
    isLoading,
    refreshGameData
  } = useGameState({ 
    pin: pin || undefined,
    playerId: playerId || undefined 
  });

  // Manual refresh for better connectivity
  const handleManualRefresh = () => {
    console.log('PlayGame: Manual refresh triggered');
    if (pin) {
      refreshGameData();
      toast({ title: 'Refreshing game...' });
    }
  };

  // Auto-refresh every 2 seconds for better real-time feel
  useEffect(() => {
    const interval = setInterval(() => {
      if (pin && isConnected) {
        refreshGameData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pin, refreshGameData, isConnected]);

  // Handle game status changes and question changes
  useEffect(() => {
    console.log('PlayGame: Game status update:', { 
      status: game?.status, 
      isGameActive, 
      currentQuestionIndex: game?.currentQuestionIndex,
      playerName: currentPlayer?.name,
      isConnected,
      hasCurrentQuestion: !!currentQuestion,
      currentQuestionId: currentQuestion?.id,
      previousQuestionId: currentQuestionId
    });

    // Reset answer state when question changes (compare actual question IDs)
    if (isGameActive && currentQuestion && currentQuestion.id !== currentQuestionId) {
      console.log('PlayGame: New question detected, resetting state');
      setIsAnswered(false);
      setSelectedAnswer(null);
      setPointsEarned(0);
      setTimeLeft(currentQuestion.timeLimit);
      setCurrentQuestionId(currentQuestion.id);
      console.log('PlayGame: New question loaded:', currentQuestion.question);
    }
  }, [game?.status, game?.currentQuestionIndex, isGameActive, currentQuestion, currentPlayer, isConnected, currentQuestionId]);

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
    
    console.log('PlayGame: Submitting answer:', { 
      questionId: currentQuestion.id, 
      answerId, 
      timeSpent: currentQuestion.timeLimit - timeLeft,
      currentQuestionIndex: game.currentQuestionIndex
    });
    
    setSelectedAnswer(answerId);
    setIsAnswered(true);
    
    const timeSpent = currentQuestion.timeLimit - timeLeft;
    // Use the actual question ID from the current question
    const success = await submitAnswer(currentQuestion.id, answerId || '', timeSpent);
    
    if (success && answerId) {
      const correctAnswer = currentQuestion.answers.find(a => a.id === answerId);
      if (correctAnswer?.isCorrect) {
        // Calculate points like Kahoot: base points + speed bonus
        const basePoints = Math.floor((currentQuestion.points || 1000) * 0.5);
        const timeBonus = Math.floor(basePoints * (timeLeft / currentQuestion.timeLimit));
        const totalPoints = basePoints + timeBonus;
        setPointsEarned(totalPoints);
        console.log('PlayGame: Points calculated:', { basePoints, timeBonus, totalPoints });
      }
    }

    if (!success) {
      console.error('PlayGame: Failed to submit answer');
      toast({ title: 'Failed to submit answer', variant: 'destructive' });
      // Reset answer state on failure to allow retry
      setIsAnswered(false);
      setSelectedAnswer(null);
    }
  };

  const getAnswerStyle = (answer: any) => {
    if (!isAnswered) {
      return selectedAnswer === answer.id 
        ? "bg-white text-black scale-105 shadow-lg border-2 border-white transform transition-all duration-200" 
        : "bg-black/50 text-white hover:bg-black/70 hover:scale-105 border border-white/30 transition-all duration-200";
    }
    
    if (answer.isCorrect) {
      return "bg-green-500 text-white border-2 border-green-300 shadow-lg";
    }
    
    if (selectedAnswer === answer.id && !answer.isCorrect) {
      return "bg-red-500 text-white border-2 border-red-300 shadow-lg";
    }
    
    return "bg-gray-500 text-gray-300 border border-gray-400";
  };

  // Loading states
  if (isLoading || !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-2 sm:px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-8 sm:py-12">
            <div className="text-white text-lg sm:text-xl mb-4">
              {isLoading ? 'Connecting to Quizora...' : 'Loading...'}
            </div>
            <Button
              onClick={handleManualRefresh}
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

  // Error state
  if (error && !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-2 sm:px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-8 sm:py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Connection Error</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <div className="space-y-3">
              <Button 
                onClick={handleManualRefresh}
                className="w-full bg-white text-black"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Game
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="w-full bg-black/30 border-white/30 text-white hover:bg-white/20"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game not found
  if (!game || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-2 sm:px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-8 sm:py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Game Not Found</h2>
            <p className="text-white/70 mb-6">Could not connect to the game</p>
            <div className="space-y-3">
              <Button 
                onClick={handleManualRefresh}
                className="w-full bg-white text-black"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Game
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="w-full bg-black/30 border-white/30 text-white hover:bg-white/20"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting for game to start
  if (game?.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-2 sm:px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-8 sm:py-12 space-y-4 sm:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto border border-white/30">
              <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Waiting for host to start...</h2>
            <p className="text-white/70 text-sm sm:text-base">
              {currentPlayer?.name}, you're ready to play Quizora!
            </p>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 border border-white/20">
              <p className="text-white/80 text-sm sm:text-base">
                Game PIN: <span className="font-bold text-lg sm:text-xl">{game.pin}</span>
              </p>
              <p className="text-white/60 text-xs sm:text-sm mt-2">{game.players.length} players joined</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-white/70 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
              
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                className="w-full bg-black/30 border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game finished
  if (isGameFinished) {
    const playerRank = game?.players.sort((a, b) => b.score - a.score).findIndex(p => p.id === currentPlayer?.id) + 1;
    const totalPlayers = game?.players.length || 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-2 sm:px-4">
        <Card className="w-full max-w-2xl bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-8 sm:py-12">
            <Trophy className="h-16 w-16 sm:h-24 sm:w-24 text-white mx-auto mb-4 sm:mb-6" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Quizora Complete!</h1>
            <p className="text-lg sm:text-xl text-white/80 mb-4 sm:mb-6">
              Well done, {currentPlayer?.name}!
            </p>
            
            <div className="bg-gradient-to-r from-white to-gray-200 text-black rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm font-semibold mb-1">Final Score</p>
                  <p className="text-2xl sm:text-3xl font-bold">{currentPlayer?.score.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Your Rank</p>
                  <p className="text-2xl sm:text-3xl font-bold">#{playerRank}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Players</p>
                  <p className="text-2xl sm:text-3xl font-bold">{totalPlayers}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black font-bold"
              >
                Play Another Quizora
              </Button>
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                className="w-full bg-black/30 border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No current question available
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-2 sm:px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-8 sm:py-12">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Loading Question...</h2>
            <p className="text-white/70 mb-6">Please wait while the next question loads</p>
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              className="w-full bg-black/30 border-white/30 text-white hover:bg-white/20"
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
    const isCorrect = selectedAnswer && currentQuestion?.answers.find(a => a.id === selectedAnswer)?.isCorrect;
    const correctAnswer = currentQuestion?.answers.find(a => a.isCorrect);
    const playerRank = game?.players.sort((a, b) => b.score - a.score).findIndex(p => p.id === currentPlayer?.id) + 1;
    
    return (
      <div className={`min-h-screen flex items-center justify-center px-2 sm:px-4 ${
        isCorrect ? 'bg-gradient-to-br from-green-900 via-green-800 to-black' : 'bg-gradient-to-br from-red-900 via-red-800 to-black'
      }`}>
        <Card className="w-full max-w-2xl bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-8 sm:py-12">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 ${
              isCorrect ? 'bg-green-500 border-2 border-green-300' : 'bg-red-500 border-2 border-red-300'
            }`}>
              {isCorrect ? (
                <Zap className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              ) : (
                <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              )}
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              {isCorrect ? 'Correct!' : selectedAnswer ? 'Incorrect!' : 'Time\'s Up!'}
            </h2>
            
            {!isCorrect && (
              <p className="text-lg sm:text-xl mb-4 text-white/80">
                The correct answer was: <strong>{correctAnswer?.text}</strong>
              </p>
            )}
            
            {isCorrect && pointsEarned > 0 && (
              <p className="text-lg sm:text-xl text-white/80 mb-4">
                +{pointsEarned.toLocaleString()} points!
              </p>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
              <div className="bg-white/10 rounded-lg p-3 sm:p-4 border border-white/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-white" />
                  <span className="text-white font-semibold">Your Score</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {currentPlayer?.score.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 sm:p-4 border border-white/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-white" />
                  <span className="text-white font-semibold">Your Rank</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  #{playerRank}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-white/60 text-sm">Waiting for next question...</p>
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                className="bg-black/30 border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active question display
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-2 sm:p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 text-white gap-3">
          <div className="order-2 sm:order-1">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
              Question {(game?.currentQuestionIndex || 0) + 1} of {quiz?.questions.length || 0}
            </Badge>
          </div>
          <div className="text-center order-1 sm:order-2">
            <p className="text-base sm:text-lg font-semibold">{currentPlayer?.name}</p>
            <p className="text-xs sm:text-sm opacity-75">Score: {currentPlayer?.score.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 order-3">
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              className="bg-black/30 border-white/30 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xl sm:text-2xl font-bold">{timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <Progress 
            value={(timeLeft / (currentQuestion?.timeLimit || 30)) * 100} 
            className="h-2 sm:h-3 bg-white/20"
          />
        </div>

        {/* Question */}
        <Card className="bg-black/50 backdrop-blur-sm shadow-2xl mb-6 sm:mb-8 border border-white/20">
          <CardContent className="py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-white mb-6 sm:mb-8">
              {currentQuestion?.question}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {currentQuestion?.answers.map((answer, index) => (
                <Button
                  key={answer.id}
                  onClick={() => !isAnswered && handleAnswerSubmit(answer.id)}
                  disabled={isAnswered}
                  className={`h-16 sm:h-20 text-base sm:text-lg font-semibold ${getAnswerStyle(answer)}`}
                  variant="outline"
                >
                  <span className="mr-2 sm:mr-3 text-lg sm:text-xl">{String.fromCharCode(65 + index)}</span>
                  <span className="text-left">{answer.text}</span>
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
