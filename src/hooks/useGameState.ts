
import { useState, useEffect, useCallback, useRef } from 'react';
import { gameManager, type GameSession, type Player, type Quiz } from '@/lib/gameManager';
import { realtimeManager } from '@/lib/realtimeManager';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseGameStateOptions {
  pin?: string;
  playerId?: string;
  autoConnect?: boolean;
}

interface GameState {
  game: GameSession | null;
  quiz: Quiz | null;
  currentPlayer: Player | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useGameState(options: UseGameStateOptions = {}) {
  const { pin, playerId, autoConnect = true } = options;
  const [state, setState] = useState<GameState>({
    game: null,
    quiz: null,
    currentPlayer: null,
    isConnected: false,
    isLoading: false,
    error: null
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const channelRef = useRef<any>(null);

  // Force refresh game data
  const refreshGameData = useCallback(async (gamePin: string) => {
    console.log('Refreshing game data for PIN:', gamePin);
    try {
      const game = await gameManager.getGameByPin(gamePin);
      if (game) {
        const currentPlayer = playerId 
          ? game.players.find(p => p.id === playerId) || null
          : null;

        console.log('Updated game data:', { 
          playerCount: game.players.length, 
          players: game.players.map(p => p.name),
          currentPlayer: currentPlayer?.name 
        });

        setState(prev => ({
          ...prev,
          game,
          currentPlayer
        }));
      }
    } catch (error) {
      console.error('Error refreshing game data:', error);
    }
  }, [playerId]);

  // Connect to game with real-time updates
  const connect = useCallback(async (gamePin: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const game = await gameManager.getGameByPin(gamePin);
      if (!game) {
        throw new Error('Game not found');
      }

      const quiz = await gameManager.getQuiz(game.quizId);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      const currentPlayer = playerId 
        ? game.players.find(p => p.id === playerId) || null
        : null;

      setState(prev => ({
        ...prev,
        game,
        quiz,
        currentPlayer,
        isConnected: true,
        isLoading: false
      }));

      // Clean up existing subscriptions
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      // Subscribe to Supabase real-time updates
      channelRef.current = supabase
        .channel(`game_${gamePin}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_sessions',
            filter: `pin=eq.${gamePin}`
          },
          async (payload) => {
            console.log('Supabase real-time update:', payload);
            // Refresh game data when any change occurs
            await refreshGameData(gamePin);
          }
        )
        .subscribe((status) => {
          console.log('Supabase subscription status:', status);
        });

      // Subscribe to localStorage events for same-device updates
      const unsubscribe = realtimeManager.subscribe(gamePin, async (event) => {
        console.log('RealtimeManager event received:', event);
        
        // Refresh game data from Supabase
        await refreshGameData(gamePin);

        // Show toast notifications for events
        switch (event.type) {
          case 'player_joined':
            if (event.payload.id !== playerId) {
              toast({ title: `${event.payload.name} joined the game!` });
            }
            break;
          case 'player_left':
            if (event.payload.playerId !== playerId) {
              toast({ title: 'A player left the game' });
            }
            break;
          case 'game_started':
            toast({ title: 'Game is starting!' });
            break;
          case 'question_started':
            toast({ title: `Question ${event.payload.questionIndex + 1} started!` });
            break;
        }
      });

      unsubscribeRef.current = unsubscribe;

      // Set up periodic refresh as fallback
      const intervalId = setInterval(() => {
        refreshGameData(gamePin);
      }, 3000); // Refresh every 3 seconds

      // Clean up interval on unmount
      const originalUnsubscribe = unsubscribeRef.current;
      unsubscribeRef.current = () => {
        clearInterval(intervalId);
        originalUnsubscribe();
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
    }
  }, [playerId, refreshGameData]);

  // Disconnect from game
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setState({
      game: null,
      quiz: null,
      currentPlayer: null,
      isConnected: false,
      isLoading: false,
      error: null
    });
  }, []);

  // Join game as player
  const joinGame = useCallback(async (gamePin: string, playerName: string) => {
    const result = await gameManager.addPlayerToGame(gamePin, playerName);
    
    if (result.success && result.player) {
      toast({ title: `Welcome ${playerName}! You've joined the game.` });
      
      // Force immediate refresh after joining
      setTimeout(() => {
        refreshGameData(gamePin);
      }, 500);
      
      return result.player;
    } else {
      toast({ 
        title: 'Failed to join game', 
        description: result.error,
        variant: 'destructive' 
      });
      return null;
    }
  }, [refreshGameData]);

  // Remove player from game (for host)
  const removePlayer = useCallback(async (gamePin: string, playerId: string) => {
    const success = await gameManager.removePlayerFromGame(gamePin, playerId);
    if (success) {
      toast({ title: 'Player removed from game' });
      // Force immediate refresh after removing
      setTimeout(() => {
        refreshGameData(gamePin);
      }, 500);
    }
    return success;
  }, [refreshGameData]);

  // Start game (host only)
  const startGame = useCallback(async () => {
    if (!state.game) return false;

    const success = await gameManager.startGame(state.game.pin);
    if (success) {
      toast({ title: 'Game started!' });
    }
    return success;
  }, [state.game]);

  // Submit answer
  const submitAnswer = useCallback(async (questionId: string, answerId: string, timeSpent: number) => {
    if (!state.game || !state.currentPlayer) return false;

    const success = await gameManager.submitAnswer(
      state.game.pin, 
      state.currentPlayer.id, 
      questionId, 
      answerId, 
      timeSpent
    );

    return success;
  }, [state.game, state.currentPlayer]);

  // Get leaderboard
  const getLeaderboard = useCallback(() => {
    if (!state.game) return [];
    return gameManager.getLeaderboard(state.game.pin);
  }, [state.game]);

  // Auto-connect if pin provided
  useEffect(() => {
    if (pin && autoConnect && !state.isConnected && !state.isLoading) {
      connect(pin);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [pin, autoConnect, connect, state.isConnected, state.isLoading]);

  return {
    ...state,
    connect,
    disconnect,
    joinGame,
    removePlayer,
    startGame,
    submitAnswer,
    getLeaderboard,
    refreshGameData: () => pin ? refreshGameData(pin) : Promise.resolve(),
    // Computed values
    isHost: Boolean(state.game && !playerId),
    canStart: Boolean(state.game && state.game.status === 'waiting' && state.game.players.length > 0),
    currentQuestion: state.quiz?.questions[state.game?.currentQuestionIndex || 0] || null,
    isGameActive: state.game?.status === 'playing',
    isGameFinished: state.game?.status === 'finished'
  };
}
