
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Play, BarChart3, Trophy, Settings, Zap, Crown, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { gameManager } from '@/lib/gameManager';
import { useGameState } from '@/hooks/useGameState';

const HostGame = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [customPoints, setCustomPoints] = useState(1000);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { game, connect } = useGameState({ 
    pin: gameSession?.pin,
    autoConnect: false 
  });

  useEffect(() => {
    console.log('HostGame: Starting initialization with quizId:', quizId);
    
    if (quizId) {
      setIsLoading(true);
      setError(null);
      
      const initializeQuiz = async () => {
        try {
          // First, try to load the quiz from localStorage for backward compatibility
          const savedQuiz = localStorage.getItem(`quiz_${quizId}`);
          console.log('HostGame: Loaded quiz from storage:', savedQuiz ? 'found' : 'not found');
          
          let parsedQuiz = null;
          
          if (savedQuiz) {
            parsedQuiz = JSON.parse(savedQuiz);
            console.log('HostGame: Parsed quiz from localStorage:', parsedQuiz);
            
            // Store in Supabase for cross-device access
            try {
              const supabaseQuiz = await gameManager.createQuiz({
                title: parsedQuiz.title,
                description: parsedQuiz.description || '',
                questions: parsedQuiz.questions.map(q => ({
                  ...q,
                  points: q.points || 1000
                })),
                createdBy: 'host'
              });
              
              // Update quizId to use the Supabase ID
              parsedQuiz = supabaseQuiz;
            } catch (supabaseError) {
              console.log('HostGame: Quiz might already exist in Supabase, trying to fetch...');
              // Try to get existing quiz
              parsedQuiz = await gameManager.getQuiz(quizId) || parsedQuiz;
            }
          } else {
            // Try to load from Supabase
            parsedQuiz = await gameManager.getQuiz(quizId);
            console.log('HostGame: Loaded quiz from Supabase:', parsedQuiz);
          }
          
          if (!parsedQuiz || !parsedQuiz.questions || !Array.isArray(parsedQuiz.questions)) {
            throw new Error('Quiz not found or invalid format');
          }
          
          setQuiz(parsedQuiz);
          
          // Create a new game session
          console.log('HostGame: Creating game session');
          const newGameSession = await gameManager.createGameSession(parsedQuiz.id);
          console.log('HostGame: Created game session:', newGameSession);
          setGameSession(newGameSession);
          
          // Connect to track real-time updates
          console.log('HostGame: Connecting to game session');
          connect(newGameSession.pin);
          
          setIsLoading(false);
        } catch (error) {
          console.error('HostGame: Error during initialization:', error);
          setError(error.message);
          setIsLoading(false);
          toast({ title: "Failed to load quiz", description: error.message, variant: "destructive" });
        }
      };
      
      initializeQuiz();
    }
  }, [quizId, navigate, connect]);

  const updateQuestionPoints = async () => {
    if (!quiz || !customPoints) {
      toast({ title: "Please enter valid points value", variant: "destructive" });
      return;
    }
    
    try {
      const updatedQuiz = {
        ...quiz,
        questions: quiz.questions.map(q => ({ ...q, points: customPoints }))
      };
      
      // Update in Supabase
      await gameManager.updateQuiz(quiz.id, updatedQuiz);
      setQuiz(updatedQuiz);
      
      toast({ title: `All questions now worth ${customPoints} points!` });
    } catch (error) {
      console.error('HostGame: Error updating points:', error);
      toast({ title: "Failed to update points", variant: "destructive" });
    }
  };

  const startGame = async () => {
    if (!game || game.players.length === 0) {
      toast({ title: "Need at least one player to start", variant: "destructive" });
      return;
    }
    
    try {
      console.log('HostGame: Starting game with PIN:', game.pin);
      const success = await gameManager.startGame(game.pin);
      if (success) {
        console.log('HostGame: Game started successfully, navigating to play page');
        navigate(`/play/${quiz.id}?pin=${game.pin}&host=true`);
      } else {
        console.error('HostGame: Failed to start game');
        toast({ title: "Failed to start game", variant: "destructive" });
      }
    } catch (error) {
      console.error('HostGame: Error starting game:', error);
      toast({ title: "Error starting game", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <Card className="bg-black/50 backdrop-blur-xl border border-white/20 p-8 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-white/30 rounded-full animate-spin border-t-white"></div>
            <div className="text-white text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Setting up your quiz room...
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !quiz || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <Card className="bg-black/50 backdrop-blur-xl border border-white/20 p-8 shadow-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Quiz</h2>
            <p className="text-white/80 mb-4">{error || 'There was an error loading your quiz session.'}</p>
            <Button onClick={() => navigate('/')} className="bg-white/20 hover:bg-white/30 text-white border border-white/30">
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header with Mirror Effect */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mb-6">
            <Crown className="w-16 h-16 text-white mx-auto mb-4 animate-pulse drop-shadow-lg" />
            <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent drop-shadow-2xl">
              {quiz.title}
            </h1>
            <p className="text-xl text-white/90 mb-6">{quiz.description}</p>
          </div>
          
          <div className="inline-block bg-black/60 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-white" />
              <p className="text-white/80 text-lg font-medium">Game PIN</p>
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <p className="text-7xl font-bold text-white tracking-wider drop-shadow-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {game.pin}
            </p>
            <p className="text-white/60 text-sm mt-2">Share this PIN with your students</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Enhanced Game Settings with Mirror Effect */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5 text-white/80" />
                  Quiz Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="points" className="text-white/80">Points per Question</Label>
                  <Input
                    id="points"
                    type="number"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(Number(e.target.value))}
                    min="100"
                    max="5000"
                    step="100"
                    className="bg-black/30 border-white/30 text-white placeholder:text-white/50 focus:border-white/50"
                  />
                  <p className="text-sm text-white/60 mt-1 flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Faster answers get bonus points!
                  </p>
                </div>
                <Button 
                  onClick={updateQuestionPoints} 
                  variant="outline" 
                  className="w-full bg-black/30 border-white/30 text-white hover:bg-white/20"
                >
                  Update All Questions
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5 text-white/80" />
                  Game Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-lg p-3 text-center border border-white/10">
                    <div className="text-2xl font-bold text-white">{quiz.questions.length}</div>
                    <div className="text-white/60 text-sm">Questions</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center border border-white/10">
                    <div className="text-2xl font-bold text-white">{game.players.length}</div>
                    <div className="text-white/60 text-sm">Players</div>
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-lg p-3 text-center border border-white/10">
                  <div className="text-xl font-bold text-white">{quiz.questions[0]?.points || customPoints}</div>
                  <div className="text-white/60 text-sm">Points per Question</div>
                </div>
                
                <Button
                  onClick={startGame}
                  className="w-full h-12 bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black font-bold shadow-lg border border-white/30"
                  disabled={game.players.length === 0}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Game ({game.players.length} players)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Players List with Mirror Effect */}
          <div className="lg:col-span-2">
            <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5 text-white/80" />
                  Players Joined ({game.players.length})
                  {game.players.length > 0 && (
                    <Badge className="bg-white text-black ml-2 animate-pulse">
                      LIVE
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {game.players.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative mb-6">
                      <Users className="h-20 w-20 text-white/30 mx-auto" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 border-2 border-white/20 rounded-full animate-ping"></div>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Waiting for Students</h3>
                    <p className="text-white/70 text-lg mb-4">
                      Students can join by entering PIN: <span className="font-bold text-white text-2xl">{game.pin}</span>
                    </p>
                    <div className="flex justify-center">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {game.players.map((player, index) => (
                      <div
                        key={player.id}
                        className="bg-gradient-to-r from-black/80 to-gray-800/80 backdrop-blur-sm rounded-xl p-4 text-white border border-white/20 shadow-lg animate-scale-in hover:scale-105 transition-transform"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                              <span className="font-bold text-lg">{player.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{player.name}</h3>
                              <p className="text-white/70 text-sm">
                                {new Date(player.joinedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Trophy className="h-6 w-6 text-white/60" />
                        </div>
                        <div className="bg-white/10 rounded-lg p-2 text-center border border-white/20">
                          <span className="text-sm text-white/80">Ready to play!</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Instructions with Mirror Effect */}
            <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl mt-6">
              <CardHeader>
                <CardTitle className="text-white">How Students Join</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold border border-white/30">1</div>
                      <span>Go to your quiz app</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold border border-white/30">2</div>
                      <span>Enter PIN: <strong className="text-white text-xl">{game.pin}</strong></span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold border border-white/30">3</div>
                      <span>Enter their name</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold border border-white/30">4</div>
                      <span>Wait for you to start!</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostGame;
