
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, SkipForward, Clock, RefreshCw } from 'lucide-react';
import { gameManager } from '@/lib/gameManager';
import { toast } from '@/hooks/use-toast';

interface HostGameControlProps {
  gamePin: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  questionTimeLimit: number;
  onQuestionComplete: () => void;
  timeLeft: number;
  setTimeLeft: (time: number) => void;
}

export function HostGameControl({ 
  gamePin, 
  currentQuestionIndex, 
  totalQuestions, 
  questionTimeLimit,
  onQuestionComplete,
  timeLeft,
  setTimeLeft
}: HostGameControlProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<'question' | 'leaderboard'>('question');

  useEffect(() => {
    setTimeLeft(questionTimeLimit);
    setIsRunning(true);
    setPhase('question');
    console.log('HostGameControl: Starting new question timer for', questionTimeLimit, 'seconds');
  }, [currentQuestionIndex, questionTimeLimit, setTimeLeft]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0 && phase === 'question') {
      interval = setInterval(() => {
        const newTime = timeLeft - 1;
        console.log('HostGameControl: Timer tick, time left:', newTime);
        if (newTime <= 0) {
          setIsRunning(false);
          setPhase('leaderboard');
          setTimeLeft(0);
          console.log('HostGameControl: Time up! Moving to leaderboard phase');
          toast({ title: 'Time\'s up! Showing leaderboard...' });
        } else {
          setTimeLeft(newTime);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, phase, setTimeLeft]);

  const handleNextQuestion = async () => {
    try {
      console.log('HostGameControl: Moving to next question');
      const success = await gameManager.nextQuestion(gamePin);
      if (success) {
        toast({ title: 'Moving to next question...' });
        onQuestionComplete();
        setPhase('question');
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error moving to next question:', error);
      toast({ title: 'Failed to move to next question', variant: 'destructive' });
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    console.log('HostGameControl: Timer', isRunning ? 'paused' : 'resumed');
  };

  const skipToLeaderboard = () => {
    setIsRunning(false);
    setPhase('leaderboard');
    setTimeLeft(0);
    console.log('HostGameControl: Manually moved to leaderboard phase');
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>Question Control</span>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleReload}
              variant="outline"
              size="sm"
              className="bg-black/30 border-white/30 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
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
          {phase === 'question' && (
            <>
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
              >
                <Clock className="h-4 w-4 mr-2" />
                Show Results
              </Button>
            </>
          )}
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
