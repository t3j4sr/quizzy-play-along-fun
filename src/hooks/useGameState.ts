
import { useState, useEffect, useCallback, useRef } from 'react';
import { gameManager, type GameSession, type Player, type Quiz } from '@/lib/gameManager';
import { realtimeManager } from '@/lib/realtimeManager';
import { toast } from '@/hooks/use-toast';

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

      // Subscribe to real-time updates
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      const unsubscribe = realtimeManager.subscribe(gamePin, async (event) => {
        console.log('Real-time event received:', event);
        
        // Refresh game state from Supabase
        const updatedGame = await gameManager.getGameByPin(gamePin);
        if (updatedGame) {
          setState(prev => ({
            ...prev,
            game: updatedGame,
            currentPlayer: playerId 
              ? updatedGame.players.find(p => p.id === playerId) || prev.currentPlayer
              : prev.currentPlayer
          }));

          // Show toast notifications for events
          switch (event.type) {
            case 'player_joined':
              if (event.payload.id !== playerId) {
                toast({ title: `${event.payload.name} joined the game!` });
              }
              break;
            case 'game_started':
              toast({ title: 'Game is starting!' });
              break;
            case 'question_started':
              toast({ title: `Question ${event.payload.questionIndex + 1} started!` });
              break;
          }
        }
      });

      unsubscribeRef.current = unsubscribe;

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
    }
  }, [playerId]);

  // Disconnect from game
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
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
      return result.player;
    } else {
      toast({ 
        title: 'Failed to join game', 
        description: result.error,
        variant: 'destructive' 
      });
      return null;
    }
  }, []);

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
    };
  }, [pin, autoConnect, connect, state.isConnected, state.isLoading]);

  return {
    ...state,
    connect,
    disconnect,
    joinGame,
    startGame,
    submitAnswer,
    getLeaderboard,
    // Computed values
    isHost: Boolean(state.game && !playerId),
    canStart: Boolean(state.game && state.game.status === 'waiting' && state.game.players.length > 0),
    currentQuestion: state.quiz?.questions[state.game?.currentQuestionIndex || 0] || null,
    isGameActive: state.game?.status === 'playing',
    isGameFinished: state.game?.status === 'finished'
  };
}
