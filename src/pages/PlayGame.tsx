import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, Zap } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';

const PlayGame = () => {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pin = searchParams.get('pin');
  const playerId = searchParams.get('playerId');
  const isHost = searchParams.get('host') === 'true';
  
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [gamePhase, setGamePhase] = useState('question');
  const [isAnswered, setIsAnswered] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const { 
    game, 
    quiz, 
    currentPlayer, 
    currentQuestion, 
    submitAnswer, 
    getLeaderboard,
    isGameActive,
    isGameFinished 
  } = useGameState({ 
    pin: pin || undefined,
    playerId: playerId || undefined 
  });

  // Monitor game status changes for real-time updates
  useEffect(() => {
    console.log('Game status changed:', { 
      status: game?.status, 
      isGameActive, 
      currentQuestionIndex: game?.currentQuestionIndex,
      playerName: currentPlayer?.name 
    });

    // If game becomes active and we're a player, ensure we're in the right state
    if (isGameActive && !isHost && currentPlayer) {
      console.log('Game is now active for player:', currentPlayer.name);
      setGamePhase('question');
      setIsAnswered(false);
      setSelectedAnswer(null);
    }
  }, [game?.status, isGameActive, currentPlayer, isHost]);

  useEffect(() => {
    if (!game || !currentQuestion) return;

    setTimeLeft(currentQuestion.timeLimit);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setGamePhase('question');
    setPointsEarned(0);
  }, [game?.currentQuestionIndex, currentQuestion]);

  useEffect(() => {
    if (gamePhase === 'question' && timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleAnswerSubmit(null);
    }
  }, [timeLeft, gamePhase, isAnswered]);

  const handleAnswerSubmit = async (answerId) => {
    if (isAnswered || !currentQuestion || !currentPlayer) return;
    
    setSelectedAnswer(answerId);
    setIsAnswered(true);
    
    const timeSpent = currentQuestion.timeLimit - timeLeft;
    const success = await submitAnswer(currentQuestion.id, answerId || '', timeSpent);
    
    if (success && answerId && currentQuestion.answers.find(a => a.id === answerId)?.isCorrect) {
      // Calculate points like Kahoot: base points + speed bonus
      const basePoints = Math.floor((currentQuestion.points || 1000) * 0.5);
      const timeBonus = Math.floor(basePoints * (timeLeft / currentQuestion.timeLimit));
      const totalPoints = basePoints + timeBonus;
      setPointsEarned(totalPoints);
    }

    setGamePhase('result');
    
    setTimeout(() => {
      if (game && game.currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
        setGamePhase('leaderboard');
        setTimeout(() => {
          // Wait for next question from host
        }, 3000);
      } else {
        setGamePhase('final');
      }
    }, 3000);
  };

  const getAnswerStyle = (answer) => {
    if (!isAnswered) {
      return selectedAnswer === answer.id 
        ? "bg-white text-black scale-105 shadow-lg border-2 border-white" 
        : "bg-black/50 text-white hover:bg-black/70 hover:scale-105 border border-white/30";
    }
    
    if (answer.isCorrect) {
      return "bg-white text-black border-2 border-white";
    }
    
    if (selectedAnswer === answer.id && !answer.isCorrect) {
      return "bg-red-500 text-white border-2 border-red-300";
    }
    
    return "bg-gray-500 text-gray-300 border border-gray-400";
  };

  // Show loading if game/quiz not loaded yet
  if (!game || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">
          {!game ? 'Connecting to game...' : 'Loading quiz...'}
        </div>
      </div>
    );
  }

  // If game is waiting and we're a player, show waiting screen
  if (game.status === 'waiting' && !isHost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/30">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Waiting for host to start...</h2>
            <p className="text-white/70 mb-6">
              {currentPlayer?.name}, you're ready to play!
            </p>
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-white/80">Game PIN: <span className="font-bold text-xl">{game.pin}</span></p>
              <p className="text-white/60 text-sm mt-2">{game.players.length} players joined</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no current question available yet, show loading
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading question...</div>
      </div>
    );
  }

  if (isGameFinished || gamePhase === 'final') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-2xl bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-12">
            <Trophy className="h-24 w-24 text-white mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Game Complete!</h1>
            <p className="text-xl text-white/80 mb-6">
              Well done, {currentPlayer?.name || 'Player'}!
            </p>
            <div className="bg-gradient-to-r from-white to-gray-200 text-black rounded-lg p-6 mb-6">
              <p className="text-lg mb-2 font-semibold">Final Score</p>
              <p className="text-5xl font-bold">{(currentPlayer?.score || 0).toLocaleString()}</p>
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

  if (gamePhase === 'leaderboard') {
    const leaderboard = getLeaderboard();
    const playerRank = leaderboard.findIndex(p => p.id === currentPlayer?.id) + 1;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Leaderboard</h2>
            <div className="space-y-3 mb-6">
              {leaderboard.slice(0, 5).map((player, index) => (
                <div
                  key={player.id}
                  className={`rounded-lg p-4 border ${
                    player.id === currentPlayer?.id
                      ? 'bg-gradient-to-r from-white to-gray-200 text-black border-white'
                      : index === 0
                      ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white border-gray-500'
                      : 'bg-black/30 text-white border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {index + 1}. {player.name}
                      {player.id === currentPlayer?.id && ' (You)'}
                    </span>
                    <span className="font-bold">{player.score.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            {playerRank > 5 && (
              <div className="bg-white/20 rounded-lg p-3 mb-4 border border-white/30">
                <p className="text-white">Your rank: #{playerRank}</p>
              </div>
            )}
            <p className="text-sm text-white/60">Next question loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gamePhase === 'result') {
    const isCorrect = selectedAnswer && currentQuestion.answers.find(a => a.id === selectedAnswer)?.isCorrect;
    const correctAnswer = currentQuestion.answers.find(a => a.isCorrect);
    
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${
        isCorrect ? 'bg-gradient-to-br from-gray-100 via-white to-gray-200' : 'bg-gradient-to-br from-gray-800 via-black to-gray-900'
      }`}>
        <Card className={`w-full max-w-2xl backdrop-blur-sm shadow-2xl border ${
          isCorrect ? 'bg-white/90 border-gray-300' : 'bg-black/50 border-white/20'
        }`}>
          <CardContent className="text-center py-12">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isCorrect ? 'bg-white border-2 border-gray-300' : 'bg-red-500 border-2 border-red-300'
            }`}>
              {isCorrect ? (
                <Zap className="h-12 w-12 text-black" />
              ) : (
                <Clock className="h-12 w-12 text-white" />
              )}
            </div>
            <h2 className={`text-4xl font-bold mb-4 ${isCorrect ? 'text-black' : 'text-white'}`}>
              {isCorrect ? 'Correct!' : selectedAnswer ? 'Incorrect!' : 'Time\'s Up!'}
            </h2>
            {!isCorrect && (
              <p className={`text-xl mb-4 ${isCorrect ? 'text-gray-700' : 'text-white/80'}`}>
                The correct answer was: <strong>{correctAnswer?.text}</strong>
              </p>
            )}
            {isCorrect && pointsEarned > 0 && (
              <p className="text-xl text-gray-700 mb-4">
                +{pointsEarned.toLocaleString()} points!
              </p>
            )}
            <div className={`rounded-lg p-4 border ${isCorrect ? 'bg-gray-100 border-gray-300' : 'bg-white/10 border-white/20'}`}>
              <p className={`text-lg ${isCorrect ? 'text-gray-700' : 'text-white'}`}>
                Your Score: <strong>{(currentPlayer?.score || 0).toLocaleString()}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 text-white">
          <div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Question {(game.currentQuestionIndex || 0) + 1} of {quiz.questions.length}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{currentPlayer?.name || 'Player'}</p>
            <p className="text-sm opacity-75">Score: {(currentPlayer?.score || 0).toLocaleString()}</p>
          </div>
          <div className="text-right">
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
