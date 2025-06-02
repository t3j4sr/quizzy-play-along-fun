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
    return newQuiz;
  }

  getQuiz(quizId: string): Quiz | null {
    return this.quizzes.get(quizId) || null;
  }

  // Game Session Management
  createGameSession(quizId: string): GameSession {
    const quiz = this.getQuiz(quizId);
    if (!quiz) {
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

    this.games.set(gameSession.pin, gameSession);
    this.saveGameToStorage(gameSession);
    return gameSession;
  }

  getGameByPin(pin: string): GameSession | null {
    // Try from memory first
    let game = this.games.get(pin);
    
    // If not in memory, try to load from localStorage
    if (!game) {
      game = this.loadGameFromStorage(pin);
      if (game) {
        this.games.set(pin, game);
      }
    }
    
    return game || null;
  }

  // Player Management
  addPlayerToGame(pin: string, playerName: string): { success: boolean; player?: Player; error?: string } {
    const game = this.getGameByPin(pin);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'waiting') {
      return { success: false, error: 'Game already started' };
    }

    // Check if name already exists
    if (game.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
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
    
    // Emit real-time event
    realtimeManager.playerJoined(pin, { id: player.id, name: player.name });
    
    return { success: true, player };
  }

  // Game Flow
  startGame(pin: string): boolean {
    const game = this.getGameByPin(pin);
    if (!game || game.status !== 'waiting') {
      return false;
    }

    game.status = 'playing';
    game.startedAt = Date.now();
    this.saveGameToStorage(game);
    
    // Emit real-time event
    realtimeManager.gameStarted(pin);
    
    return true;
  }

  submitAnswer(pin: string, playerId: string, questionId: string, answerId: string, timeSpent: number): boolean {
    const game = this.getGameByPin(pin);
    const quiz = game ? this.getQuiz(game.quizId) : null;
    
    if (!game || !quiz || game.status !== 'playing') {
      return false;
    }

    const player = game.players.find(p => p.id === playerId);
    const question = quiz.questions.find(q => q.id === questionId);
    
    if (!player || !question) {
      return false;
    }

    // Check if player already answered this question
    if (player.answers.some(a => a.questionId === questionId)) {
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
    
    // Emit real-time event
    realtimeManager.answerSubmitted(pin, playerId, answerId);
    
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
      realtimeManager.gameEnded(pin, finalScores);
    } else {
      // Emit new question event
      const currentQuestion = quiz.questions[game.currentQuestionIndex];
      realtimeManager.questionStarted(pin, game.currentQuestionIndex, currentQuestion.timeLimit);
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
      console.warn('Failed to save game to localStorage:', error);
    }
  }

  private loadGameFromStorage(pin: string): GameSession | null {
    try {
      const data = localStorage.getItem(`game_${pin}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load game from localStorage:', error);
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
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private loadFromStorage(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }

  // Initialize from localStorage
  initialize(): void {
    const savedQuizzes = this.loadFromStorage('quizzes');
    if (savedQuizzes && Array.isArray(savedQuizzes)) {
      savedQuizzes.forEach(quiz => {
        this.quizzes.set(quiz.id, quiz);
      });
    }

    // Load active games
    const gamesList = this.loadFromStorage('games_list') || [];
    gamesList.forEach((gameInfo: any) => {
      const game = this.loadGameFromStorage(gameInfo.pin);
      if (game) {
        this.games.set(game.pin, game);
      }
    });
  }
}

export const gameManager = new GameManager();

// Initialize on module load
gameManager.initialize();
