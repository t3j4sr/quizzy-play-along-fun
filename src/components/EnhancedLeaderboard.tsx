
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Clock, Zap, Target, TrendingUp } from 'lucide-react';
import { Player } from '@/lib/gameManager';

interface EnhancedLeaderboardProps {
  players: Player[];
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLeft: number;
  showDetailedStats?: boolean;
}

export function EnhancedLeaderboard({ 
  players, 
  currentQuestionIndex, 
  totalQuestions, 
  timeLeft,
  showDetailedStats = false 
}: EnhancedLeaderboardProps) {
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    // Sort players by score, then by answer speed
    const sorted = [...players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // If scores are equal, sort by number of correct answers
      const aCorrect = a.answers.filter(ans => ans.isCorrect).length;
      const bCorrect = b.answers.filter(ans => ans.isCorrect).length;
      if (bCorrect !== aCorrect) return bCorrect - aCorrect;
      // If still equal, sort by average response time (faster is better)
      const aAvgTime = a.answers.length > 0 ? a.answers.reduce((sum, ans) => sum + ans.timeSpent, 0) / a.answers.length : 999;
      const bAvgTime = b.answers.length > 0 ? b.answers.reduce((sum, ans) => sum + ans.timeSpent, 0) / b.answers.length : 999;
      return aAvgTime - bAvgTime;
    });
    setSortedPlayers(sorted);

    // Count answered players for current question
    const currentQuestionId = `question_${currentQuestionIndex}`;
    const answered = players.filter(player => 
      player.answers.some(answer => answer.questionId === currentQuestionId)
    ).length;
    setAnsweredCount(answered);

    // Calculate average score
    const avgScore = players.length > 0 
      ? players.reduce((sum, p) => sum + p.score, 0) / players.length 
      : 0;
    setAverageScore(avgScore);
  }, [players, currentQuestionIndex]);

  const getPositionIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const getPositionStyle = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 border-yellow-500/50 shadow-lg scale-[1.02]';
    if (index === 1) return 'bg-gradient-to-r from-gray-400/30 to-gray-500/30 border-gray-400/50 shadow-md';
    if (index === 2) return 'bg-gradient-to-r from-amber-600/30 to-amber-700/30 border-amber-600/50 shadow-md';
    return 'bg-black/40 border-white/20 hover:bg-black/50';
  };

  const getPlayerStats = (player: Player) => {
    const correctAnswers = player.answers.filter(a => a.isCorrect).length;
    const totalAnswers = player.answers.length;
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    const avgResponseTime = totalAnswers > 0 
      ? Math.round(player.answers.reduce((sum, a) => sum + a.timeSpent, 0) / totalAnswers)
      : 0;
    
    return { correctAnswers, totalAnswers, accuracy, avgResponseTime };
  };

  return (
    <Card className="bg-black/60 backdrop-blur-xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="text-xl font-bold">Live Leaderboard</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-blue-500/30 text-blue-300 border-blue-500/50 px-3 py-1">
              <Users className="h-4 w-4 mr-1" />
              {answeredCount}/{players.length}
            </Badge>
            <Badge className="bg-red-500/30 text-red-300 border-red-500/50 px-3 py-1">
              <Clock className="h-4 w-4 mr-1" />
              {timeLeft}s
            </Badge>
            {showDetailedStats && (
              <Badge className="bg-green-500/30 text-green-300 border-green-500/50 px-3 py-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                Avg: {Math.round(averageScore)}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid gap-2 max-h-96 overflow-y-auto pr-2">
          {sortedPlayers.slice(0, 12).map((player, index) => {
            const stats = getPlayerStats(player);
            return (
              <div
                key={player.id}
                className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.01] ${getPositionStyle(index)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <span className="text-2xl font-bold w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        {getPositionIcon(index)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-lg text-white truncate">
                        {player.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-white/80">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {stats.correctAnswers}/{stats.totalAnswers}
                        </span>
                        {showDetailedStats && (
                          <>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {stats.accuracy}%
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {stats.avgResponseTime}s
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-white">
                      {player.score.toLocaleString()}
                    </div>
                    <div className="text-white/60 text-sm">points</div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {players.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/60 text-lg">No players yet</p>
              <p className="text-white/40 text-sm">Waiting for players to join...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
