
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Play, BarChart3, Trophy, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { gameManager } from '@/lib/gameManager';
import { useGameState } from '@/hooks/useGameState';

const HostGame = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [customPoints, setCustomPoints] = useState(1000);
  
  const { game, connect } = useGameState({ 
    pin: gameSession?.pin,
    autoConnect: false 
  });

  useEffect(() => {
    if (quizId) {
      const savedQuiz = localStorage.getItem(`quiz_${quizId}`);
      if (savedQuiz) {
        const parsedQuiz = JSON.parse(savedQuiz);
        setQuiz(parsedQuiz);
        
        // Create a new game session
        try {
          const newGameSession = gameManager.createGameSession(quizId);
          setGameSession(newGameSession);
          
          // Connect to track real-time updates
          setTimeout(() => connect(newGameSession.pin), 100);
        } catch (error) {
          toast({ title: "Failed to create game session", variant: "destructive" });
          navigate('/');
        }
      } else {
        toast({ title: "Quiz not found", variant: "destructive" });
        navigate('/');
      }
    }
  }, [quizId, navigate, connect]);

  const updateQuestionPoints = () => {
    if (!quiz || !customPoints) return;
    
    const updatedQuiz = {
      ...quiz,
      questions: quiz.questions.map(q => ({ ...q, points: customPoints }))
    };
    
    // Save updated quiz
    localStorage.setItem(`quiz_${quizId}`, JSON.stringify(updatedQuiz));
    setQuiz(updatedQuiz);
    toast({ title: `All questions now worth ${customPoints} points!` });
  };

  const startGame = () => {
    if (!game || game.players.length === 0) {
      toast({ title: "Need at least one player to start", variant: "destructive" });
      return;
    }
    
    const success = gameManager.startGame(game.pin);
    if (success) {
      navigate(`/play/${quizId}?pin=${game.pin}&host=true`);
    }
  };

  if (!quiz || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Setting up game...</div>
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
            <p className="text-6xl font-bold text-white tracking-wider">{game.pin}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Settings & Info */}
          <div className="lg:col-span-1">
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Points Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="points">Points per Question</Label>
                  <Input
                    id="points"
                    type="number"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(Number(e.target.value))}
                    min="100"
                    max="5000"
                    step="100"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Faster answers get bonus points (like Kahoot!)
                  </p>
                </div>
                <Button onClick={updateQuestionPoints} variant="outline" className="w-full">
                  Update All Questions
                </Button>
              </CardContent>
            </Card>

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
                    {game.players.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Points/Question:</span>
                  <Badge variant="secondary">{quiz.questions[0]?.points || 1000}</Badge>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={startGame}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    disabled={game.players.length === 0}
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
                  Players Joined ({game.players.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {game.players.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Waiting for players to join...</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Players can join by entering the game PIN: <strong>{game.pin}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {game.players.map((player, index) => (
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
                <CardTitle>How Players Join</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Players go to your deployed QuizMaster URL</li>
                  <li>Enter the game PIN: <strong className="text-2xl text-purple-600">{game.pin}</strong></li>
                  <li>Click "Join Game" and enter their name</li>
                  <li>Wait for you to start the game</li>
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
