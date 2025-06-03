
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Clock } from 'lucide-react';
import { Player } from '@/lib/gameManager';

interface HostLeaderboardProps {
  players: Player[];
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLeft: number;
}

export function HostLeaderboard({ players, currentQuestionIndex, totalQuestions, timeLeft }: HostLeaderboardProps) {
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    // Sort players by score in descending order
    const sorted = [...players].sort((a, b) => b.score - a.score);
    setSortedPlayers(sorted);

    // Count how many players answered the current question
    const currentQuestionId = `question_${currentQuestionIndex}`;
    const answered = players.filter(player => 
      player.answers.some(answer => answer.questionId === currentQuestionId)
    ).length;
    setAnsweredCount(answered);

    console.log('HostLeaderboard: Updated stats -', {
      totalPlayers: players.length,
      answeredCount: answered,
      topPlayer: sorted[0]?.name,
      topScore: sorted[0]?.score
    });
  }, [players, currentQuestionIndex]);

  const getPositionIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  const getPositionStyle = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
    if (index === 1) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
    if (index === 2) return 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/30';
    return 'bg-black/30 border-white/20';
  };

  return (
    <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Live Leaderboard
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Users className="h-4 w-4 mr-1" />
              {answeredCount}/{players.length} answered
            </Badge>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              <Clock className="h-4 w-4 mr-1" />
              {timeLeft}s
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedPlayers.slice(0, 10).map((player, index) => (
            <div
              key={player.id}
              className={`rounded-lg p-4 border transition-all duration-300 ${getPositionStyle(index)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold w-8">
                    {getPositionIcon(index)}
                  </span>
                  <div>
                    <h3 className="font-bold text-lg text-white">{player.name}</h3>
                    <p className="text-white/70 text-sm">
                      {player.answers.length} questions answered
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {player.score.toLocaleString()}
                  </div>
                  <div className="text-white/60 text-sm">points</div>
                </div>
              </div>
            </div>
          ))}
          
          {players.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">No players yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
