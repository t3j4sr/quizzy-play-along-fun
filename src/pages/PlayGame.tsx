
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, Zap } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  answers: { id: string; text: string; isCorrect: boolean }[];
  timeLimit: number;
}

const demoQuestions: Question[] = [
  {
    id: '1',
    question: 'What is the capital of France?',
    answers: [
      { id: '1', text: 'London', isCorrect: false },
      { id: '2', text: 'Berlin', isCorrect: false },
      { id: '3', text: 'Paris', isCorrect: true },
      { id: '4', text: 'Madrid', isCorrect: false }
    ],
    timeLimit: 20
  },
  {
    id: '2',
    question: 'Which planet is known as the Red Planet?',
    answers: [
      { id: '1', text: 'Venus', isCorrect: false },
      { id: '2', text: 'Mars', isCorrect: true },
      { id: '3', text: 'Jupiter', isCorrect: false },
      { id: '4', text: 'Saturn', isCorrect: false }
    ],
    timeLimit: 15
  },
  {
    id: '3',
    question: 'What is 2 + 2?',
    answers: [
      { id: '1', text: '3', isCorrect: false },
      { id: '2', text: '4', isCorrect: true },
      { id: '3', text: '5', isCorrect: false },
      { id: '4', text: '6', isCorrect: false }
    ],
    timeLimit: 10
  }
];

const PlayGame = () => {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerName = searchParams.get('player') || 'Player';
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [gamePhase, setGamePhase] = useState<'question' | 'result' | 'leaderboard' | 'final'>('question');
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = demoQuestions[currentQuestionIndex];

  useEffect(() => {
    if (gamePhase === 'question' && timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleAnswerSubmit(null);
    }
  }, [timeLeft, gamePhase, isAnswered]);

  const handleAnswerSubmit = (answerId: string | null) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerId);
    setIsAnswered(true);
    
    if (answerId && currentQuestion.answers.find(a => a.id === answerId)?.isCorrect) {
      const points = Math.max(100, Math.floor((timeLeft / currentQuestion.timeLimit) * 1000));
      setScore(prev => prev + points);
    }

    setGamePhase('result');
    
    setTimeout(() => {
      if (currentQuestionIndex < demoQuestions.length - 1) {
        setGamePhase('leaderboard');
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
          setTimeLeft(demoQuestions[currentQuestionIndex + 1]?.timeLimit || 20);
          setSelectedAnswer(null);
          setIsAnswered(false);
          setGamePhase('question');
        }, 3000);
      } else {
        setGamePhase('final');
      }
    }, 3000);
  };

  const getAnswerStyle = (answer: any) => {
    if (!isAnswered) {
      return selectedAnswer === answer.id 
        ? "bg-blue-500 text-white scale-105 shadow-lg" 
        : "bg-white hover:bg-gray-50 hover:scale-105";
    }
    
    if (answer.isCorrect) {
      return "bg-green-500 text-white";
    }
    
    if (selectedAnswer === answer.id && !answer.isCorrect) {
      return "bg-red-500 text-white";
    }
    
    return "bg-gray-200 text-gray-500";
  };

  if (gamePhase === 'final') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center px-4">
        <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardContent className="text-center py-12">
            <Trophy className="h-24 w-24 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Game Complete!</h1>
            <p className="text-xl text-gray-600 mb-6">Well done, {playerName}!</p>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6 mb-6">
              <p className="text-lg mb-2">Final Score</p>
              <p className="text-5xl font-bold">{score.toLocaleString()}</p>
            </div>
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Play Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gamePhase === 'leaderboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Leaderboard</h2>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">1. {playerName}</span>
                  <span className="font-bold">{score.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center text-gray-700">
                  <span>2. Alice</span>
                  <span>{(score - 150).toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-center text-gray-600">
                  <span>3. Bob</span>
                  <span>{(score - 300).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Next question loading...</p>
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
        isCorrect ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-red-400 to-red-600'
      }`}>
        <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardContent className="text-center py-12">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isCorrect ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {isCorrect ? (
                <Zap className="h-12 w-12 text-white" />
              ) : (
                <Clock className="h-12 w-12 text-white" />
              )}
            </div>
            <h2 className={`text-4xl font-bold mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? 'Correct!' : selectedAnswer ? 'Incorrect!' : 'Time\'s Up!'}
            </h2>
            {!isCorrect && (
              <p className="text-xl text-gray-600 mb-4">
                The correct answer was: <strong>{correctAnswer?.text}</strong>
              </p>
            )}
            {isCorrect && (
              <p className="text-xl text-gray-600 mb-4">
                +{Math.max(100, Math.floor((timeLeft / currentQuestion.timeLimit) * 1000))} points!
              </p>
            )}
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-lg text-gray-700">Your Score: <strong>{score.toLocaleString()}</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 text-white">
          <div>
            <Badge variant="secondary" className="bg-white/20 text-white border-none">
              Question {currentQuestionIndex + 1} of {demoQuestions.length}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{playerName}</p>
            <p className="text-sm opacity-75">Score: {score.toLocaleString()}</p>
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
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl mb-8">
          <CardContent className="py-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
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
