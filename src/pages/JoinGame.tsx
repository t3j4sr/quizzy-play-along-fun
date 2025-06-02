
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Users, Clock, Zap, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGameState } from '@/hooks/useGameState';

const JoinGame = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(null);
  
  const { game, connect, joinGame, isConnected, error } = useGameState({ 
    pin,
    playerId: currentPlayer?.id,
    autoConnect: true 
  });

  useEffect(() => {
    if (error) {
      toast({ title: error, variant: "destructive" });
    }
  }, [error]);

  // Auto-redirect when game starts
  useEffect(() => {
    if (game && game.status === 'playing' && currentPlayer) {
      navigate(`/play/game?pin=${pin}&playerId=${currentPlayer.id}`);
    }
  }, [game, currentPlayer, navigate, pin]);

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }

    if (!pin) {
      toast({ title: "Invalid game PIN", variant: "destructive" });
      return;
    }

    const player = await joinGame(pin, playerName.trim());
    if (player) {
      setCurrentPlayer(player);
    }
  };

  if (!isConnected && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardContent className="text-center py-12">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-4 border-white/30 rounded-full animate-spin border-t-white"></div>
              </div>
              <Sparkles className="w-8 h-8 text-white mx-auto animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connecting to Game</h2>
            <p className="text-white/80">Finding your quiz room...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentPlayer && game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl animate-scale-in">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-white to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="h-10 w-10 text-black" />
            </div>
            <CardTitle className="text-3xl text-white mb-2">You're In!</CardTitle>
            <div className="bg-black/30 rounded-lg p-3 border border-white/20">
              <p className="text-xl font-bold text-white">{currentPlayer.name}</p>
              <p className="text-white/80">Game PIN: {pin}</p>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-black/30 rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Clock className="h-6 w-6 text-white/80" />
                <span className="text-white font-semibold">Waiting for host to start...</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Users className="h-5 w-5 text-white/60" />
                <span className="text-white/80">{game.players.length} players joined</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-white/70 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-white/20 to-gray-300/20 rounded-lg p-4 border border-white/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">Ready to Play!</span>
                </div>
                <p className="text-sm text-white/70">The game will start automatically when the host begins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-black/50 backdrop-blur-xl border border-white/20 shadow-2xl animate-fade-in">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-white to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <User className="h-10 w-10 text-black" />
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-2">Join the Game</CardTitle>
          <div className="bg-black/30 rounded-lg p-4 border border-white/30">
            <p className="text-white/80 text-sm mb-1">Game PIN</p>
            <p className="font-bold text-3xl text-white tracking-wider">{pin}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-white/80 text-sm font-medium">Your Name</label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="text-center text-xl h-14 bg-black/30 border-white/30 text-white placeholder-white/50 focus:border-white/50 focus:bg-black/40"
              maxLength={20}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
            />
          </div>
          
          <Button 
            onClick={handleJoinGame}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black shadow-lg hover:shadow-xl transition-all duration-300 border-0"
            disabled={!playerName.trim()}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Join Game
          </Button>

          {game && (
            <div className="text-center bg-black/30 rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-white/60" />
                <span className="text-white/80 font-medium">
                  {game.players.length} players ready
                </span>
              </div>
              {game.players.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {game.players.slice(0, 3).map((player) => (
                    <span key={player.id} className="bg-white/20 px-3 py-1 rounded-full text-sm text-white border border-white/30">
                      {player.name}
                    </span>
                  ))}
                  {game.players.length > 3 && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm text-white border border-white/30">
                      +{game.players.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinGame;
