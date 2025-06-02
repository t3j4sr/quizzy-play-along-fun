
interface RealtimeEvent {
  type: 'player_joined' | 'player_left' | 'game_started' | 'question_started' | 'answer_submitted' | 'game_ended';
  payload: any;
  timestamp: number;
  gamePin: string;
}

interface GameSubscription {
  pin: string;
  callback: (event: RealtimeEvent) => void;
}

class RealtimeManager {
  private subscriptions: Map<string, GameSubscription[]> = new Map();
  private eventHistory: Map<string, RealtimeEvent[]> = new Map();
  private storageEventListener: ((e: StorageEvent) => void) | null = null;

  constructor() {
    this.initializeStorageListener();
  }

  private initializeStorageListener() {
    this.storageEventListener = (e: StorageEvent) => {
      if (e.key?.startsWith('game_event_')) {
        try {
          const event: RealtimeEvent = JSON.parse(e.newValue || '{}');
          this.handleStorageEvent(event);
        } catch (error) {
          console.error('Error parsing storage event:', error);
        }
      }
    };
    window.addEventListener('storage', this.storageEventListener);
  }

  private handleStorageEvent(event: RealtimeEvent) {
    const subscribers = this.subscriptions.get(event.gamePin) || [];
    subscribers.forEach(sub => {
      try {
        sub.callback(event);
      } catch (error) {
        console.error('Error in realtime callback:', error);
      }
    });
  }

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

  // Emit event to all subscribers via localStorage
  emit(pin: string, type: RealtimeEvent['type'], payload: any): void {
    const event: RealtimeEvent = {
      type,
      payload,
      timestamp: Date.now(),
      gamePin: pin
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

    // Emit via localStorage to reach other tabs/devices on same network
    const eventKey = `game_event_${pin}_${Date.now()}`;
    localStorage.setItem(eventKey, JSON.stringify(event));
    
    // Clean up old events
    setTimeout(() => {
      localStorage.removeItem(eventKey);
    }, 5000);

    // Notify local subscribers immediately
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

  // Cleanup on destroy
  destroy(): void {
    if (this.storageEventListener) {
      window.removeEventListener('storage', this.storageEventListener);
    }
  }
}

export const realtimeManager = new RealtimeManager();
