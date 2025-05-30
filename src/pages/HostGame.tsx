
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Play, BarChart3, Trophy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: any[];
}

interface Player {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
}

const HostGame = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [gamePin, setGamePin] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (quizId) {
      const savedQuiz = localStorage.getItem(`quiz_${quizId}`);
      if (savedQuiz) {
        setQuiz(JSON.parse(savedQuiz));
        // Generate a 6-digit game PIN
        setGamePin(Math.floor(100000 + Math.random() * 900000).toString());
      } else {
        toast({ title: "Quiz not found", variant: "destructive" });
        navigate('/');
      }
    }
  }, [quizId, navigate]);

  const startGame = () => {
    if (players.length === 0) {
      toast({ title: "Need at least one player to start", variant: "destructive" });
      return;
    }
    setGameStarted(true);
    navigate(`/play/${quizId}?pin=${gamePin}`);
  };

  const addDemoPlayer = () => {
    const demoNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const availableNames = demoNames.filter(name => !players.some(p => p.name === name));
    
    if (availableNames.length === 0) {
      toast({ title: "Maximum demo players reached", variant: "destructive" });
      return;
    }

    const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: randomName,
      score: 0,
      joinedAt: Date.now()
    };

    setPlayers(prev => [...prev, newPlayer]);
    toast({ title: `${randomName} joined the game!` });
  };

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading quiz...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">{quiz.title}</h1>
          <p className="text-xl text-white/90 mb-6">{quiz.description}</p>
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-white/80 text-lg mb-2">Game PIN</p>
            <p className="text-6xl font-bold text-white tracking-wider">{gamePin}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Info */}
          <div className="lg:col-span-1">
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Game Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Questions:</span>
                  <Badge variant="secondary">{quiz.questions.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Players:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {players.length}
                  </Badge>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={addDemoPlayer}
                    variant="outline"
                    className="w-full mb-3"
                  >
                    Add Demo Player
                  </Button>
                  <Button
                    onClick={startGame}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    disabled={players.length === 0}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Players List */}
          <div className="lg:col-span-2">
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players Waiting ({players.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Waiting for players to join...</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Players can join by entering the game PIN: <strong>{gamePin}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {players.map((player, index) => (
                      <div
                        key={player.id}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white animate-scale-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{player.name}</h3>
                            <p className="text-white/80 text-sm">
                              Joined {new Date(player.joinedAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Trophy className="h-6 w-6 text-yellow-300" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl mt-6">
              <CardHeader>
                <CardTitle>How to Join</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Go to the QuizMaster homepage</li>
                  <li>Enter the game PIN: <strong className="text-2xl text-purple-600">{gamePin}</strong></li>
                  <li>Click "Join Game" and enter your name</li>
                  <li>Wait for the host to start the game</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostGame;
