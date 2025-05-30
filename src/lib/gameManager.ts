
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
    return gameSession;
  }

  getGameByPin(pin: string): GameSession | null {
    return this.games.get(pin) || null;
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

    const answer = question.answers.find(a => a.id === answerId);
    const isCorrect = answer?.isCorrect || false;

    // Calculate points based on time and correctness
    let points = 0;
    if (isCorrect) {
      const timeBonus = Math.max(0, (question.timeLimit - timeSpent) / question.timeLimit);
      points = Math.floor((question.points || 1000) * (0.5 + 0.5 * timeBonus));
    }

    player.answers.push({
      questionId,
      answerId,
      timeSpent,
      isCorrect
    });

    player.score += points;
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
    }

    return true;
  }

  getLeaderboard(pin: string): Player[] {
    const game = this.getGameByPin(pin);
    if (!game) {
      return [];
    }

    return [...game.players].sort((a, b) => b.score - a.score);
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
  }
}

export const gameManager = new GameManager();

// Initialize on module load
gameManager.initialize();
