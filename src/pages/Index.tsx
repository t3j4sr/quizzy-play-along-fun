
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Plus, Trophy, Users, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-500"></div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">QuizMaster</h1>
        </div>
        <Button 
          variant="secondary" 
          onClick={handleCreateQuiz}
          className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 drop-shadow-lg">
            Quiz<span className="text-yellow-300">Master</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Create engaging quizzes and play with friends in real-time. The most fun way to learn and compete!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Join Game Card */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Join a Game</CardTitle>
              <CardDescription className="text-gray-600">
                Enter a game PIN to join an existing quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Enter Game PIN"
                value={gamePin}
                onChange={(e) => setGamePin(e.target.value)}
                className="text-center text-2xl font-bold h-14 border-2 border-gray-200 focus:border-blue-500"
                maxLength={6}
              />
              <Button 
                onClick={handleJoinGame}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={!gamePin.trim()}
              >
                Join Game
              </Button>
            </CardContent>
          </Card>

          {/* Create Quiz Card */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Create Quiz</CardTitle>
              <CardDescription className="text-gray-600">
                Build your own interactive quiz game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleCreateQuiz}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
          <div className="text-center text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Multiplayer Fun</h3>
            <p className="text-white/80 text-sm">Play with friends in real-time</p>
          </div>
          <div className="text-center text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Live Leaderboard</h3>
            <p className="text-white/80 text-sm">Track scores and compete</p>
          </div>
          <div className="text-center text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Instant Results</h3>
            <p className="text-white/80 text-sm">Get immediate feedback</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
