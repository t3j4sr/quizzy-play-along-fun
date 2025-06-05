
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
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Force refresh game data with better error handling
  const refreshGameData = useCallback(async (gamePin: string) => {
    console.log('Refreshing game data for PIN:', gamePin);
    try {
      const game = await gameManager.getGameByPin(gamePin);
      if (game) {
        const quiz = await gameManager.getQuiz(game.quizId);
        const currentPlayer = playerId 
          ? game.players.find(p => p.id === playerId) || null
          : null;

        console.log('Updated game data:', { 
          status: game.status,
          currentQuestionIndex: game.currentQuestionIndex,
          playerCount: game.players.length, 
          players: game.players.map(p => ({ id: p.id, name: p.name })),
          currentPlayer: currentPlayer?.name 
        });

        setState(prev => ({
          ...prev,
          game,
          quiz: quiz || prev.quiz,
          currentPlayer,
          error: null
        }));
      }
    } catch (error) {
      console.error('Error refreshing game data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to refresh game data'
      }));
    }
  }, [playerId]);

  // Connect to game with enhanced real-time updates
  const connect = useCallback(async (gamePin: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Clean up existing connections first
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

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
        isLoading: false,
        error: null
      }));

      // Set up Supabase real-time subscription with better error handling
      channelRef.current = supabase
        .channel(`game_${gamePin}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_sessions',
            filter: `pin=eq.${gamePin}`
          },
          async (payload) => {
            console.log('Supabase real-time update:', payload.eventType, payload);
            
            // Immediate refresh for any database changes
            await refreshGameData(gamePin);
          }
        )
        .subscribe((status) => {
          console.log('Supabase subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to game updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Supabase channel error');
            setState(prev => ({ ...prev, error: 'Real-time connection error' }));
          }
        });

      // Subscribe to localStorage events for same-device updates
      const unsubscribe = realtimeManager.subscribe(gamePin, async (event) => {
        console.log('RealtimeManager event:', event.type, event.payload);
        
        // Force immediate refresh for all events
        await refreshGameData(gamePin);

        // Show notifications
        switch (event.type) {
          case 'player_joined':
            if (event.payload.id !== playerId) {
              toast({ title: `${event.payload.name} joined!` });
            }
            break;
          case 'game_started':
            toast({ title: 'Game is starting!' });
            break;
          case 'question_started':
            toast({ title: `Question ${event.payload.questionIndex + 1} started!` });
            break;
          case 'answer_submitted':
            console.log('Player answered:', event.payload);
            break;
        }
      });

      unsubscribeRef.current = unsubscribe;

      // Set up aggressive refresh for active games
      const startRefreshInterval = () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = setInterval(() => {
          refreshGameData(gamePin);
        }, 1000); // Refresh every second for real-time feel
      };

      startRefreshInterval();

      // Clean up on disconnect
      const originalUnsubscribe = unsubscribeRef.current;
      unsubscribeRef.current = () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        originalUnsubscribe();
      };

    } catch (error) {
      console.error('Connection error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Connection failed',
        isLoading: false
      }));
    }
  }, [playerId, refreshGameData]);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (refreshTimeoutRef.current) {
      clearInterval(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
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

  const joinGame = useCallback(async (gamePin: string, playerName: string) => {
    const result = await gameManager.addPlayerToGame(gamePin, playerName);
    
    if (result.success && result.player) {
      toast({ title: `Welcome ${playerName}! You've joined the game.` });
      
      // Force immediate refresh after joining
      setTimeout(() => {
        refreshGameData(gamePin);
      }, 100);
      
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

  const startGame = useCallback(async () => {
    if (!state.game) return false;

    console.log('Starting game:', state.game.pin);
    const success = await gameManager.startGame(state.game.pin);
    if (success) {
      toast({ title: 'Game started!' });
      // Force immediate refresh
      setTimeout(() => {
        refreshGameData(state.game!.pin);
      }, 100);
    } else {
      toast({ title: 'Failed to start game', variant: 'destructive' });
    }
    return success;
  }, [state.game, refreshGameData]);

  const submitAnswer = useCallback(async (questionId: string, answerId: string, timeSpent: number) => {
    if (!state.game || !state.currentPlayer) return false;

    console.log('Submitting answer:', { questionId, answerId, timeSpent });
    const success = await gameManager.submitAnswer(
      state.game.pin, 
      state.currentPlayer.id, 
      questionId, 
      answerId, 
      timeSpent
    );

    if (success) {
      // Force immediate refresh to update score
      setTimeout(() => {
        refreshGameData(state.game!.pin);
      }, 100);
    }

    return success;
  }, [state.game, state.currentPlayer, refreshGameData]);

  // Auto-connect if pin provided
  useEffect(() => {
    if (pin && autoConnect && !state.isConnected && !state.isLoading) {
      console.log('Auto-connecting to game:', pin);
      connect(pin);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [pin, autoConnect, connect, state.isConnected, state.isLoading]);

  return {
    ...state,
    connect,
    disconnect,
    joinGame,
    startGame,
    submitAnswer,
    refreshGameData: () => pin ? refreshGameData(pin) : Promise.resolve(),
    // Computed values
    isHost: Boolean(state.game && !playerId),
    canStart: Boolean(state.game && state.game.status === 'waiting' && state.game.players.length > 0),
    currentQuestion: state.quiz?.questions[state.game?.currentQuestionIndex || 0] || null,
    isGameActive: state.game?.status === 'playing',
    isGameFinished: state.game?.status === 'finished'
  };
}
