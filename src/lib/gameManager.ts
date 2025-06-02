
import { realtimeManager } from './realtimeManager';

export interface Player {
  id: string;
  name: string;
  score: number;
  answers: { questionId: string; answerId: string; timeSpent: number; isCorrect: boolean }[];
  joinedAt: number;
}

export interface GameSession {
  id: string;
  quizId: string;
  pin: string;
  status: 'waiting' | 'playing' | 'finished';
  currentQuestionIndex: number;
  players: Player[];
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: number;
  createdBy: string;
}

export interface Question {
  id: string;
  question: string;
  answers: Answer[];
  timeLimit: number;
  points: number;
}

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

class GameManager {
  private games: Map<string, GameSession> = new Map();
  private quizzes: Map<string, Quiz> = new Map();

  // Quiz Management
  createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Quiz {
    const newQuiz: Quiz = {
      ...quiz,
      id: this.generateId(),
      createdAt: Date.now()
    };
    
    this.quizzes.set(newQuiz.id, newQuiz);
    this.saveToStorage('quizzes', Array.from(this.quizzes.values()));
    console.log('GameManager: Created quiz:', newQuiz.id);
    return newQuiz;
  }

  getQuiz(quizId: string): Quiz | null {
    console.log('GameManager: Getting quiz:', quizId);
    let quiz = this.quizzes.get(quizId);
    
    // If not in memory, try to load from localStorage
    if (!quiz) {
      console.log('GameManager: Quiz not in memory, checking localStorage');
      const savedQuiz = this.loadFromStorage(`quiz_${quizId}`);
      if (savedQuiz) {
        console.log('GameManager: Found quiz in localStorage');
        quiz = { ...savedQuiz, id: quizId };
        this.quizzes.set(quizId, quiz);
      }
    }
    
    return quiz || null;
  }

  updateQuiz(quizId: string, updatedQuiz: Quiz): boolean {
    try {
      this.quizzes.set(quizId, updatedQuiz);
      this.saveToStorage('quizzes', Array.from(this.quizzes.values()));
      console.log('GameManager: Updated quiz:', quizId);
      return true;
    } catch (error) {
      console.error('GameManager: Error updating quiz:', error);
      return false;
    }
  }

  // Game Session Management
  createGameSession(quizId: string): GameSession {
    console.log('GameManager: Creating game session for quiz:', quizId);
    
    const quiz = this.getQuiz(quizId);
    if (!quiz) {
      console.error('GameManager: Quiz not found for ID:', quizId);
      throw new Error('Quiz not found');
    }

    const gameSession: GameSession = {
      id: this.generateId(),
      quizId,
      pin: this.generatePin(),
      status: 'waiting',
      currentQuestionIndex: 0,
      players: [],
      createdAt: Date.now()
    };

    console.log('GameManager: Created game session:', gameSession);
    this.games.set(gameSession.pin, gameSession);
    this.saveGameToStorage(gameSession);
    
    // Emit creation event
    setTimeout(() => {
      realtimeManager.emit(gameSession.pin, 'game_created', { pin: gameSession.pin });
    }, 100);
    
    return gameSession;
  }

  getGameByPin(pin: string): GameSession | null {
    console.log('GameManager: Getting game by PIN:', pin);
    
    // Try from memory first
    let game = this.games.get(pin);
    
    // If not in memory, try to load from localStorage
    if (!game) {
      console.log('GameManager: Game not in memory, checking localStorage');
      game = this.loadGameFromStorage(pin);
      if (game) {
        console.log('GameManager: Found game in localStorage');
        this.games.set(pin, game);
      }
    }
    
    return game || null;
  }

  // Player Management
  addPlayerToGame(pin: string, playerName: string): { success: boolean; player?: Player; error?: string } {
    console.log('GameManager: Adding player to game:', pin, playerName);
    
    const game = this.getGameByPin(pin);
    if (!game) {
      console.error('GameManager: Game not found for PIN:', pin);
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'waiting') {
      console.error('GameManager: Game already started');
      return { success: false, error: 'Game already started' };
    }

    // Check if name already exists
    if (game.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      console.error('GameManager: Name already taken:', playerName);
      return { success: false, error: 'Name already taken' };
    }

    const player: Player = {
      id: this.generateId(),
      name: playerName,
      score: 0,
      answers: [],
      joinedAt: Date.now()
    };

    game.players.push(player);
    this.saveGameToStorage(game);
    
    console.log('GameManager: Player added successfully:', player.id);
    
    // Emit real-time event
    setTimeout(() => {
      realtimeManager.playerJoined(pin, { id: player.id, name: player.name });
    }, 100);
    
    return { success: true, player };
  }

  // Game Flow
  startGame(pin: string): boolean {
    console.log('GameManager: Starting game:', pin);
    
    const game = this.getGameByPin(pin);
    if (!game || game.status !== 'waiting') {
      console.error('GameManager: Cannot start game - invalid state');
      return false;
    }

    game.status = 'playing';
    game.startedAt = Date.now();
    this.saveGameToStorage(game);
    
    console.log('GameManager: Game started successfully');
    
    // Emit real-time event
    setTimeout(() => {
      realtimeManager.gameStarted(pin);
    }, 100);
    
    return true;
  }

  submitAnswer(pin: string, playerId: string, questionId: string, answerId: string, timeSpent: number): boolean {
    console.log('GameManager: Submitting answer:', { pin, playerId, questionId, answerId, timeSpent });
    
    const game = this.getGameByPin(pin);
    const quiz = game ? this.getQuiz(game.quizId) : null;
    
    if (!game || !quiz || game.status !== 'playing') {
      console.error('GameManager: Invalid game or quiz state');
      return false;
    }

    const player = game.players.find(p => p.id === playerId);
    const question = quiz.questions.find(q => q.id === questionId);
    
    if (!player || !question) {
      console.error('GameManager: Player or question not found');
      return false;
    }

    // Check if player already answered this question
    if (player.answers.some(a => a.questionId === questionId)) {
      console.error('GameManager: Player already answered this question');
      return false;
    }

    const answer = question.answers.find(a => a.id === answerId);
    const isCorrect = answer?.isCorrect || false;

    // Calculate points based on time and correctness (like Kahoot)
    let points = 0;
    if (isCorrect) {
      // Base points for correct answer
      const basePoints = question.points || 1000;
      // Time bonus: faster answers get more points
      const timeRatio = Math.max(0, (question.timeLimit - timeSpent) / question.timeLimit);
      const timeBonus = Math.floor(basePoints * 0.5 * timeRatio); // Up to 50% bonus for speed
      points = Math.floor(basePoints * 0.5) + timeBonus; // 50% base + up to 50% time bonus
    }

    player.answers.push({
      questionId,
      answerId,
      timeSpent,
      isCorrect
    });

    player.score += points;
    this.saveGameToStorage(game);
    
    console.log('GameManager: Answer submitted, points awarded:', points);
    
    // Emit real-time event
    setTimeout(() => {
      realtimeManager.answerSubmitted(pin, playerId, answerId);
    }, 100);
    
    return true;
  }

  nextQuestion(pin: string): boolean {
    const game = this.getGameByPin(pin);
    const quiz = game ? this.getQuiz(game.quizId) : null;
    
    if (!game || !quiz) {
      return false;
    }

    game.currentQuestionIndex++;
    
    if (game.currentQuestionIndex >= quiz.questions.length) {
      game.status = 'finished';
      game.finishedAt = Date.now();
      
      // Emit game ended event
      const finalScores = this.getLeaderboard(pin);
      setTimeout(() => {
        realtimeManager.gameEnded(pin, finalScores);
      }, 100);
    } else {
      // Emit new question event
      const currentQuestion = quiz.questions[game.currentQuestionIndex];
      setTimeout(() => {
        realtimeManager.questionStarted(pin, game.currentQuestionIndex, currentQuestion.timeLimit);
      }, 100);
    }

    this.saveGameToStorage(game);
    return true;
  }

  getLeaderboard(pin: string): Player[] {
    const game = this.getGameByPin(pin);
    if (!game) {
      return [];
    }

    return [...game.players].sort((a, b) => b.score - a.score);
  }

  // Storage methods for persistence
  private saveGameToStorage(game: GameSession): void {
    try {
      console.log('GameManager: Saving game to storage:', game.pin);
      localStorage.setItem(`game_${game.pin}`, JSON.stringify(game));
      
      // Also save to a games list
      const gamesList = this.loadFromStorage('games_list') || [];
      const existingIndex = gamesList.findIndex((g: any) => g.pin === game.pin);
      if (existingIndex >= 0) {
        gamesList[existingIndex] = { pin: game.pin, createdAt: game.createdAt };
      } else {
        gamesList.push({ pin: game.pin, createdAt: game.createdAt });
      }
      this.saveToStorage('games_list', gamesList);
    } catch (error) {
      console.error('GameManager: Failed to save game to localStorage:', error);
    }
  }

  private loadGameFromStorage(pin: string): GameSession | null {
    try {
      const data = localStorage.getItem(`game_${pin}`);
      const game = data ? JSON.parse(data) : null;
      if (game) {
        console.log('GameManager: Loaded game from storage:', pin);
      }
      return game;
    } catch (error) {
      console.error('GameManager: Failed to load game from localStorage:', error);
      return null;
    }
  }

  // Analytics
  getGameStats(pin: string) {
    const game = this.getGameByPin(pin);
    const quiz = game ? this.getQuiz(game.quizId) : null;
    
    if (!game || !quiz) {
      return null;
    }

    const totalPlayers = game.players.length;
    const currentQuestion = quiz.questions[game.currentQuestionIndex];
    
    if (!currentQuestion) {
      return { totalPlayers, averageScore: 0, questionStats: [] };
    }

    const averageScore = totalPlayers > 0 
      ? game.players.reduce((sum, p) => sum + p.score, 0) / totalPlayers 
      : 0;

    const questionStats = quiz.questions.map(question => {
      const answers = game.players.map(p => 
        p.answers.find(a => a.questionId === question.id)
      ).filter(Boolean);

      const correctAnswers = answers.filter(a => a?.isCorrect).length;
      const totalAnswers = answers.length;
      
      return {
        questionId: question.id,
        question: question.question,
        correctAnswers,
        totalAnswers,
        accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
      };
    });

    return {
      totalPlayers,
      averageScore,
      questionStats
    };
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private saveToStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('GameManager: Failed to save to localStorage:', error);
    }
  }

  private loadFromStorage(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('GameManager: Failed to load from localStorage:', error);
      return null;
    }
  }

  // Initialize from localStorage
  initialize(): void {
    console.log('GameManager: Initializing...');
    
    const savedQuizzes = this.loadFromStorage('quizzes');
    if (savedQuizzes && Array.isArray(savedQuizzes)) {
      savedQuizzes.forEach(quiz => {
        this.quizzes.set(quiz.id, quiz);
      });
      console.log('GameManager: Loaded', savedQuizzes.length, 'quizzes from storage');
    }

    // Load active games
    const gamesList = this.loadFromStorage('games_list') || [];
    gamesList.forEach((gameInfo: any) => {
      const game = this.loadGameFromStorage(gameInfo.pin);
      if (game) {
        this.games.set(game.pin, game);
      }
    });
    console.log('GameManager: Loaded', gamesList.length, 'games from storage');
  }
}

export const gameManager = new GameManager();

// Initialize on module load
gameManager.initialize();
