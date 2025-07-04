
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

  // Enhanced refresh with better error handling and logging
  const refreshGameData = useCallback(async () => {
    if (!pin) return;
    
    console.log('useGameState: Refreshing game data for PIN:', pin);
    try {
      const game = await gameManager.getGameByPin(pin);
      if (game) {
        const quiz = await gameManager.getQuiz(game.quizId);
        const currentPlayer = playerId 
          ? game.players.find(p => p.id === playerId) || null
          : null;

        console.log('useGameState: Updated game data:', { 
          status: game.status,
          currentQuestionIndex: game.currentQuestionIndex,
          playerCount: game.players.length, 
          currentPlayer: currentPlayer?.name,
          playerScore: currentPlayer?.score,
          playerAnswers: currentPlayer?.answers.length
        });

        setState(prev => ({
          ...prev,
          game,
          quiz: quiz || prev.quiz,
          currentPlayer,
          error: null,
          isConnected: true
        }));
      } else {
        console.warn('useGameState: Game not found for PIN:', pin);
        setState(prev => ({
          ...prev,
          error: 'Game not found'
        }));
      }
    } catch (error) {
      console.error('useGameState: Error refreshing game data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to refresh game data'
      }));
    }
  }, [pin, playerId]);

  // Connect to game with simplified real-time updates
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

      // Set up Supabase real-time subscription with aggressive refresh
      channelRef.current = supabase
        .channel(`game_realtime_${gamePin}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_sessions',
            filter: `pin=eq.${gamePin}`
          },
          async (payload) => {
            console.log('useGameState: Supabase real-time update:', payload.eventType);
            // Multiple refreshes to ensure data sync
            setTimeout(() => refreshGameData(), 50);
            setTimeout(() => refreshGameData(), 200);
            setTimeout(() => refreshGameData(), 500);
          }
        )
        .subscribe((status) => {
          console.log('useGameState: Supabase subscription status:', status);
        });

      // Subscribe to localStorage events for same-device updates
      const unsubscribe = realtimeManager.subscribe(gamePin, async (event) => {
        console.log('useGameState: RealtimeManager event:', event.type);
        // Multiple refreshes for critical events
        setTimeout(() => refreshGameData(), 50);
        setTimeout(() => refreshGameData(), 200);

        // Show notifications for players
        if (playerId) {
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
              if (event.payload.playerId !== playerId) {
                toast({ title: 'Another player answered!' });
              }
              // Force refresh when any answer is submitted
              setTimeout(() => refreshGameData(), 100);
              break;
          }
        }
      });

      unsubscribeRef.current = unsubscribe;

    } catch (error) {
      console.error('useGameState: Connection error:', error);
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
        refreshGameData();
      }, 200);
      
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

    console.log('useGameState: Starting game:', state.game.pin);
    const success = await gameManager.startGame(state.game.pin);
    if (success) {
      toast({ title: 'Game started!' });
      // Force immediate refresh
      setTimeout(() => {
        refreshGameData();
      }, 200);
    } else {
      toast({ title: 'Failed to start game', variant: 'destructive' });
    }
    return success;
  }, [state.game, refreshGameData]);

  const submitAnswer = useCallback(async (questionId: string, answerId: string, timeSpent: number) => {
    if (!state.game || !state.currentPlayer) {
      console.error('useGameState: Cannot submit answer - no game or player');
      return false;
    }

    console.log('useGameState: Submitting answer:', { 
      gamePin: state.game.pin,
      playerId: state.currentPlayer.id,
      questionId, 
      answerId, 
      timeSpent 
    });

    try {
      const success = await gameManager.submitAnswer(
        state.game.pin, 
        state.currentPlayer.id, 
        questionId, 
        answerId, 
        timeSpent
      );

      if (success) {
        console.log('useGameState: Answer submitted successfully');
        toast({ title: 'Answer submitted!' });
        
        // Multiple aggressive refreshes to ensure score updates
        setTimeout(() => refreshGameData(), 50);
        setTimeout(() => refreshGameData(), 200);
        setTimeout(() => refreshGameData(), 500);
        setTimeout(() => refreshGameData(), 1000);
        
        return true;
      } else {
        console.error('useGameState: Failed to submit answer');
        toast({ title: 'Failed to submit answer', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      console.error('useGameState: Error submitting answer:', error);
      toast({ title: 'Error submitting answer', variant: 'destructive' });
      return false;
    }
  }, [state.game, state.currentPlayer, refreshGameData]);

  // Auto-connect if pin provided
  useEffect(() => {
    if (pin && autoConnect && !state.isConnected && !state.isLoading) {
      console.log('useGameState: Auto-connecting to game:', pin);
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
    startGame,
    submitAnswer,
    refreshGameData,
    // Computed values
    isHost: Boolean(state.game && !playerId),
    canStart: Boolean(state.game && state.game.status === 'waiting' && state.game.players.length > 0),
    currentQuestion: state.quiz?.questions[state.game?.currentQuestionIndex || 0] || null,
    isGameActive: state.game?.status === 'playing',
    isGameFinished: state.game?.status === 'finished'
  };
}
