
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Plus, Trophy, Users, Zap, Sparkles, Crown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [gamePin, setGamePin] = useState('');
  const navigate = useNavigate();

  const handleJoinGame = () => {
    if (gamePin.trim()) {
      navigate(`/game/${gamePin}`);
    }
  };

  const handleCreateQuiz = () => {
    navigate('/create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/3 rounded-full blur-lg animate-pulse delay-500"></div>
        <div className="absolute top-1/3 right-1/3 w-28 h-28 bg-white/3 rounded-full blur-lg animate-pulse delay-700"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-white to-gray-200 rounded-full flex items-center justify-center shadow-lg">
            <Crown className="h-7 w-7 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            QuizMaster
          </h1>
        </div>
        <Button 
          variant="secondary" 
          onClick={handleCreateQuiz}
          className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm border shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Crown className="w-20 h-20 text-white mx-auto mb-4 animate-pulse drop-shadow-lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 border-2 border-white/20 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
            <h1 className="text-7xl md:text-9xl font-bold text-white mb-6 drop-shadow-2xl bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Quiz<span className="text-transparent bg-gradient-to-r from-gray-300 to-white bg-clip-text">Master</span>
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 mb-8 max-w-3xl mx-auto font-light">
              Create engaging quizzes and play with friends in real-time. The most fun way to learn and compete!
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 w-full max-w-5xl">
          {/* Join Game Card */}
          <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 animate-scale-in">
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-white to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/30">
                <Play className="h-10 w-10 text-black" />
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-3">Join a Game</CardTitle>
              <CardDescription className="text-white/80 text-lg">
                Enter a game PIN to join an existing quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter Game PIN"
                  value={gamePin}
                  onChange={(e) => setGamePin(e.target.value)}
                  className="text-center text-3xl font-bold h-16 border-2 border-white/30 focus:border-white/50 bg-black/30 text-white placeholder:text-white/50 backdrop-blur-sm"
                  maxLength={6}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>
              </div>
              <Button 
                onClick={handleJoinGame}
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black shadow-xl hover:shadow-2xl transition-all duration-300 border-0"
                disabled={!gamePin.trim()}
              >
                <Sparkles className="w-6 h-6 mr-2" />
                Join Game
              </Button>
            </CardContent>
          </Card>

          {/* Create Quiz Card */}
          <Card className="bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 animate-scale-in" style={{animationDelay: '0.2s'}}>
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-white to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/30">
                <Plus className="h-10 w-10 text-black" />
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-3">Create Quiz</CardTitle>
              <CardDescription className="text-white/80 text-lg">
                Build your own interactive quiz game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleCreateQuiz}
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black shadow-xl hover:shadow-2xl transition-all duration-300 border-0"
              >
                <Star className="w-6 h-6 mr-2" />
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 w-full max-w-5xl">
          <div className="text-center text-white group">
            <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 group-hover:scale-110 transition-transform shadow-lg">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-xl mb-3">Multiplayer Fun</h3>
            <p className="text-white/70 text-lg">Play with friends in real-time across devices</p>
          </div>
          <div className="text-center text-white group">
            <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 group-hover:scale-110 transition-transform shadow-lg">
              <Trophy className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-xl mb-3">Live Leaderboard</h3>
            <p className="text-white/70 text-lg">Track scores and compete for the top spot</p>
          </div>
          <div className="text-center text-white group">
            <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 group-hover:scale-110 transition-transform shadow-lg">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-xl mb-3">Instant Results</h3>
            <p className="text-white/70 text-lg">Get immediate feedback and scoring</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-8 text-white/60">
        <p className="text-lg">Experience the future of interactive learning</p>
      </div>
    </div>
  );
};

export default Index;
