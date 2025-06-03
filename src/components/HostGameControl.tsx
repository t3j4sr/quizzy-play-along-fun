
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, SkipForward, Clock } from 'lucide-react';
import { gameManager } from '@/lib/gameManager';
import { toast } from '@/hooks/use-toast';

interface HostGameControlProps {
  gamePin: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  questionTimeLimit: number;
  onQuestionComplete: () => void;
}

export function HostGameControl({ 
  gamePin, 
  currentQuestionIndex, 
  totalQuestions, 
  questionTimeLimit,
  onQuestionComplete 
}: HostGameControlProps) {
  const [timeLeft, setTimeLeft] = useState(questionTimeLimit);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<'question' | 'leaderboard'>('question');

  useEffect(() => {
    setTimeLeft(questionTimeLimit);
    setIsRunning(true);
    setPhase('question');
  }, [currentQuestionIndex, questionTimeLimit]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setPhase('leaderboard');
            toast({ title: 'Time\'s up! Showing leaderboard...' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleNextQuestion = async () => {
    try {
      const success = await gameManager.nextQuestion(gamePin);
      if (success) {
        toast({ title: 'Moving to next question...' });
        onQuestionComplete();
      }
    } catch (error) {
      console.error('Error moving to next question:', error);
      toast({ title: 'Failed to move to next question', variant: 'destructive' });
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const skipToLeaderboard = () => {
    setIsRunning(false);
    setPhase('leaderboard');
    setTimeLeft(0);
  };

  return (
    <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>Question Control</span>
          <span className="text-sm">
            {currentQuestionIndex + 1} of {totalQuestions}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-6xl font-bold text-white mb-2">
            {timeLeft}
          </div>
          <div className="text-white/60">seconds remaining</div>
        </div>

        <Progress 
          value={(timeLeft / questionTimeLimit) * 100} 
          className="h-3 bg-white/20"
        />

        <div className="flex gap-2">
          <Button
            onClick={toggleTimer}
            variant="outline"
            className="flex-1 bg-black/30 border-white/30 text-white hover:bg-white/20"
          >
            {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isRunning ? 'Pause' : 'Resume'}
          </Button>
          
          <Button
            onClick={skipToLeaderboard}
            variant="outline"
            className="bg-black/30 border-white/30 text-white hover:bg-white/20"
            disabled={phase === 'leaderboard'}
          >
            <Clock className="h-4 w-4 mr-2" />
            Show Results
          </Button>
        </div>

        {phase === 'leaderboard' && (
          <Button
            onClick={handleNextQuestion}
            className="w-full bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black font-bold"
            disabled={currentQuestionIndex >= totalQuestions - 1}
          >
            <SkipForward className="h-4 w-4 mr-2" />
            {currentQuestionIndex >= totalQuestions - 1 ? 'End Game' : 'Next Question'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
