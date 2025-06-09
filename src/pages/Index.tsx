
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Plus, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-16">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Quizora
            </span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-white/80 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Create engaging quizzes and play with friends in real-time. 
            The ultimate quiz platform for education and entertainment.
          </p>
          
          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center max-w-md mx-auto">
            <Button
              onClick={() => navigate('/create')}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto"
            >
              <Plus className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Create Quiz
            </Button>
            <Button
              onClick={() => navigate('/game/join')}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-black/30 border-white/30 text-white hover:bg-white/20 font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto"
            >
              <Play className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Join Game
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          <Card className="bg-black/50 backdrop-blur-sm border border-white/20 shadow-2xl hover:bg-black/60 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6 border border-blue-500/30">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Real-time Gaming</h3>
              <p className="text-white/70 text-sm sm:text-base">
                Experience seamless real-time quiz gameplay with instant scoring and live leaderboards.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/50 backdrop-blur-sm border border-white/20 shadow-2xl hover:bg-black/60 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6 border border-green-500/30">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Multiplayer Fun</h3>
              <p className="text-white/70 text-sm sm:text-base">
                Join friends and compete in exciting quiz battles with up to unlimited players.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/50 backdrop-blur-sm border border-white/20 shadow-2xl hover:bg-black/60 transition-all duration-300 hover:scale-105 md:col-span-2 lg:col-span-1">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6 border border-purple-500/30">
                <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Easy Creation</h3>
              <p className="text-white/70 text-sm sm:text-base">
                Create custom quizzes with photos, multiple choice questions, and flexible time limits.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center mt-16 sm:mt-24">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8 sm:mb-12">
            How Quizora Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white border border-white/30">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Create or Join</h3>
              <p className="text-white/70 text-sm sm:text-base">
                Host a quiz or join an existing game with a simple PIN code.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white border border-white/30">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Play Together</h3>
              <p className="text-white/70 text-sm sm:text-base">
                Answer questions in real-time and watch the leaderboard update live.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white border border-white/30">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Win & Celebrate</h3>
              <p className="text-white/70 text-sm sm:text-base">
                Earn points for speed and accuracy, then celebrate your victory!
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 sm:mt-24">
          <Card className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 shadow-2xl max-w-2xl mx-auto">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                Ready to Start Your Quiz Adventure?
              </h3>
              <p className="text-white/70 mb-4 sm:mb-6 text-sm sm:text-base">
                Join thousands of players who are already enjoying Quizora. Create your first quiz or jump into a game right now!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={() => navigate('/create')}
                  className="bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black font-bold"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Quiz
                </Button>
                <Button
                  onClick={() => navigate('/game/join')}
                  variant="outline"
                  className="bg-black/30 border-white/30 text-white hover:bg-white/20 font-bold"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Join a Game Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
