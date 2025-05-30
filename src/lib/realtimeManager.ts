interface RealtimeEvent {
  type: 'player_joined' | 'player_left' | 'game_started' | 'question_started' | 'answer_submitted' | 'game_ended';
  payload: any;
  timestamp: number;
}

interface GameSubscription {
  pin: string;
  callback: (event: RealtimeEvent) => void;
}

class RealtimeManager {
  private subscriptions: Map<string, GameSubscription[]> = new Map();
  private eventHistory: Map<string, RealtimeEvent[]> = new Map();

  // Subscribe to game events
  subscribe(pin: string, callback: (event: RealtimeEvent) => void): () => void {
    if (!this.subscriptions.has(pin)) {
      this.subscriptions.set(pin, []);
    }

    const subscription: GameSubscription = { pin, callback };
    this.subscriptions.get(pin)!.push(subscription);

    // Send recent events to new subscriber
    const history = this.eventHistory.get(pin) || [];
    history.slice(-5).forEach(event => callback(event));

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(pin);
      if (subs) {
        const index = subs.indexOf(subscription);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  // Emit event to all subscribers
  emit(pin: string, type: RealtimeEvent['type'], payload: any): void {
    const event: RealtimeEvent = {
      type,
      payload,
      timestamp: Date.now()
    };

    // Store in history
    if (!this.eventHistory.has(pin)) {
      this.eventHistory.set(pin, []);
    }
    this.eventHistory.get(pin)!.push(event);

    // Keep only last 50 events
    const history = this.eventHistory.get(pin)!;
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    // Notify all subscribers
    const subscribers = this.subscriptions.get(pin) || [];
    subscribers.forEach(sub => {
      try {
        sub.callback(event);
      } catch (error) {
        console.error('Error in realtime callback:', error);
      }
    });
  }

  // Player events
  playerJoined(pin: string, player: { id: string; name: string }): void {
    this.emit(pin, 'player_joined', player);
  }

  playerLeft(pin: string, playerId: string): void {
    this.emit(pin, 'player_left', { playerId });
  }

  // Game events
  gameStarted(pin: string): void {
    this.emit(pin, 'game_started', {});
  }

  questionStarted(pin: string, questionIndex: number, timeLimit: number): void {
    this.emit(pin, 'question_started', { questionIndex, timeLimit });
  }

  answerSubmitted(pin: string, playerId: string, answerId: string): void {
    this.emit(pin, 'answer_submitted', { playerId, answerId });
  }

  gameEnded(pin: string, finalScores: any[]): void {
    this.emit(pin, 'game_ended', { finalScores });
  }

  // Cleanup old game data
  cleanup(pin: string): void {
    this.subscriptions.delete(pin);
    this.eventHistory.delete(pin);
  }
}

export const realtimeManager = new RealtimeManager();
