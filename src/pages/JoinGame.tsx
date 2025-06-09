
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Play, RefreshCw, Clock } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { toast } from '@/hooks/use-toast';

const JoinGame = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showWaiting, setShowWaiting] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  const { game, joinGame, isConnected, refreshGameData } = useGameState({
    pin: showWaiting ? pin : undefined,
    playerId: currentPlayerId || undefined,
    autoConnect: false
  });

  // Auto-refresh when waiting
  useEffect(() => {
    if (showWaiting && pin) {
      const interval = setInterval(() => {
        refreshGameData();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [showWaiting, pin, refreshGameData]);

  // Check if game starts
  useEffect(() => {
    if (game?.status === 'playing' && currentPlayerId) {
      navigate(`/play?pin=${pin}&playerId=${currentPlayerId}`);
    }
  }, [game?.status, currentPlayerId, pin, navigate]);

  const handleManualRefresh = () => {
    if (pin) {
      refreshGameData();
      toast({ title: 'Game refreshed!' });
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin.trim() || !playerName.trim()) {
      toast({ title: 'Please enter both PIN and name', variant: 'destructive' });
      return;
    }

    setIsJoining(true);
    
    try {
      const player = await joinGame(pin.trim(), playerName.trim());
      if (player) {
        setCurrentPlayerId(player.id);
        setShowWaiting(true);
        toast({ title: `Welcome to Quizora, ${playerName}!` });
      }
    } catch (error) {
      toast({ title: 'Failed to join game', variant: 'destructive' });
    } finally {
      setIsJoining(false);
    }
  };

  if (showWaiting && game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-2 sm:px-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="text-center py-8 sm:py-12 space-y-4 sm:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto border border-white/30">
              <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Waiting for host to start...</h2>
            <p className="text-white/70 text-sm sm:text-base">
              {playerName}, you're ready to play Quizora!
            </p>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 border border-white/20">
              <p className="text-white/80 text-sm sm:text-base">
                Game PIN: <span className="font-bold text-lg sm:text-xl">{game.pin}</span>
              </p>
              <p className="text-white/60 text-xs sm:text-sm mt-2">{game.players.length} players joined</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-white/70 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
              
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                className="w-full bg-black/30 border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-2 sm:px-4">
      <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm shadow-2xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-xl sm:text-2xl">Join Quizora</span>
            </div>
            <p className="text-sm sm:text-base text-white/70 font-normal">
              Enter the game PIN and your name to join
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinGame} className="space-y-4 sm:space-y-6">
            <div>
              <Input
                type="text"
                placeholder="Enter Game PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-xl sm:text-2xl font-bold tracking-wider bg-white/10 border-white/30 text-white placeholder:text-white/50 h-12 sm:h-14"
                maxLength={6}
              />
            </div>
            <div>
              <Input
                type="text"
                placeholder="Your Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 h-10 sm:h-12"
                maxLength={20}
              />
            </div>
            <Button
              type="submit"
              disabled={isJoining || !pin.trim() || !playerName.trim()}
              className="w-full bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black font-bold h-12 sm:h-14 text-base sm:text-lg"
            >
              {isJoining ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                  Joining...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                  Join Game
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinGame;
