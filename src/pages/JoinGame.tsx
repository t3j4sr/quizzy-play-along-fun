
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Users, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const JoinGame = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [waitingPlayers, setWaitingPlayers] = useState(3);

  useEffect(() => {
    // Simulate other players joining
    const interval = setInterval(() => {
      setWaitingPlayers(prev => prev + Math.floor(Math.random() * 2));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const joinGame = () => {
    if (!playerName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }

    setIsJoined(true);
    toast({ title: `Welcome ${playerName}! Waiting for game to start...` });
  };

  const startDemo = () => {
    // For demo purposes, navigate to play page
    navigate(`/play/demo?pin=${pin}&player=${encodeURIComponent(playerName)}`);
  };

  if (isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-800">You're In!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <p className="text-lg font-semibold text-gray-700">Welcome, {playerName}!</p>
              <p className="text-gray-600">Game PIN: {pin}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Waiting for host to start...</span>
              </div>
              <p className="text-sm text-gray-500">{waitingPlayers} players joined</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
              
              <Button 
                onClick={startDemo}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Start Demo Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-gray-800">Join the Game</CardTitle>
          <p className="text-gray-600">Game PIN: <span className="font-bold text-2xl text-blue-600">{pin}</span></p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="text-center text-xl h-12 border-2 border-gray-200 focus:border-blue-500"
              maxLength={20}
            />
          </div>
          
          <Button 
            onClick={joinGame}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={!playerName.trim()}
          >
            Join Game
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              {waitingPlayers} players have joined this game
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinGame;
