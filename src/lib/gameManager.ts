
import { realtimeManager } from './realtimeManager';
import { supabase } from '@/integrations/supabase/client';

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
  async createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<Quiz> {
    console.log('GameManager: Creating quiz in Supabase:', quiz.title);
    
    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        created_by: quiz.createdBy
      })
      .select()
      .single();

    if (error) {
      console.error('GameManager: Error creating quiz:', error);
      throw new Error('Failed to create quiz: ' + error.message);
    }

    const newQuiz: Quiz = {
      id: data.id,
      title: data.title,
      description: data.description || '',
      questions: data.questions,
      createdAt: new Date(data.created_at).getTime(),
      createdBy: data.created_by
    };

    this.quizzes.set(newQuiz.id, newQuiz);
    console.log('GameManager: Created quiz:', newQuiz.id);
    return newQuiz;
  }

  async getQuiz(quizId: string): Promise<Quiz | null> {
    console.log('GameManager: Getting quiz:', quizId);
    
    // Check memory first
    let quiz = this.quizzes.get(quizId);
    if (quiz) {
      return quiz;
    }

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (error) {
      console.error('GameManager: Error fetching quiz:', error);
      return null;
    }

    if (data) {
      quiz = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        questions: data.questions,
        createdAt: new Date(data.created_at).getTime(),
        createdBy: data.created_by
      };
      this.quizzes.set(quizId, quiz);
      console.log('GameManager: Loaded quiz from Supabase:', quizId);
      return quiz;
    }

    return null;
  }

  async updateQuiz(quizId: string, updatedQuiz: Quiz): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({
          title: updatedQuiz.title,
          description: updatedQuiz.description,
          questions: updatedQuiz.questions
        })
        .eq('id', quizId);

      if (error) {
        console.error('GameManager: Error updating quiz:', error);
        return false;
      }

      this.quizzes.set(quizId, updatedQuiz);
      console.log('GameManager: Updated quiz:', quizId);
      return true;
    } catch (error) {
      console.error('GameManager: Error updating quiz:', error);
      return false;
    }
  }

  // Game Session Management
  async createGameSession(quizId: string): Promise<GameSession> {
    console.log('GameManager: Creating game session for quiz:', quizId);
    
    const quiz = await this.getQuiz(quizId);
    if (!quiz) {
      console.error('GameManager: Quiz not found for ID:', quizId);
      throw new Error('Quiz not found');
    }

    const pin = this.generatePin();
    
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        quiz_id: quizId,
        pin: pin,
        status: 'waiting',
        current_question_index: 0,
        players: []
      })
      .select()
      .single();

    if (error) {
      console.error('GameManager: Error creating game session:', error);
      throw new Error('Failed to create game session: ' + error.message);
    }

    const gameSession: GameSession = {
      id: data.id,
      quizId: data.quiz_id,
      pin: data.pin,
      status: data.status,
      currentQuestionIndex: data.current_question_index,
      players: data.players || [],
      createdAt: new Date(data.created_at).getTime(),
      startedAt: data.started_at ? new Date(data.started_at).getTime() : undefined,
      finishedAt: data.finished_at ? new Date(data.finished_at).getTime() : undefined
    };

    console.log('GameManager: Created game session:', gameSession);
    this.games.set(gameSession.pin, gameSession);
    
    // Emit creation event
    realtimeManager.emit(gameSession.pin, 'game_created', { pin: gameSession.pin });
    
    return gameSession;
  }

  async getGameByPin(pin: string): Promise<GameSession | null> {
    console.log('GameManager: Getting game by PIN:', pin);
    
    // Check memory first
    let game = this.games.get(pin);
    if (game) {
      return game;
    }

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('pin', pin)
      .single();

    if (error) {
      console.error('GameManager: Error fetching game session:', error);
      return null;
    }

    if (data) {
      game = {
        id: data.id,
        quizId: data.quiz_id,
        pin: data.pin,
        status: data.status,
        currentQuestionIndex: data.current_question_index,
        players: data.players || [],
        createdAt: new Date(data.created_at).getTime(),
        startedAt: data.started_at ? new Date(data.started_at).getTime() : undefined,
        finishedAt: data.finished_at ? new Date(data.finished_at).getTime() : undefined
      };
      this.games.set(pin, game);
      console.log('GameManager: Loaded game from Supabase:', pin);
      return game;
    }

    return null;
  }

  // Player Management
  async addPlayerToGame(pin: string, playerName: string): Promise<{ success: boolean; player?: Player; error?: string }> {
    console.log('GameManager: Adding player to game:', pin, playerName);
    
    const game = await this.getGameByPin(pin);
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

    const updatedPlayers = [...game.players, player];

    // Update in Supabase
    const { error } = await supabase
      .from('game_sessions')
      .update({ players: updatedPlayers })
      .eq('pin', pin);

    if (error) {
      console.error('GameManager: Error adding player:', error);
      return { success: false, error: 'Failed to join game' };
    }

    game.players = updatedPlayers;
    this.games.set(pin, game);
    
    console.log('GameManager: Player added successfully:', player.id);
    
    // Emit real-time event
    setTimeout(() => {
      realtimeManager.playerJoined(pin, { id: player.id, name: player.name });
    }, 100);
    
    return { success: true, player };
  }

  // Game Flow
  async startGame(pin: string): Promise<boolean> {
    console.log('GameManager: Starting game:', pin);
    
    const game = await this.getGameByPin(pin);
    if (!game || game.status !== 'waiting') {
      console.error('GameManager: Cannot start game - invalid state');
      return false;
    }

    const { error } = await supabase
      .from('game_sessions')
      .update({ 
        status: 'playing',
        started_at: new Date().toISOString()
      })
      .eq('pin', pin);

    if (error) {
      console.error('GameManager: Error starting game:', error);
      return false;
    }

    game.status = 'playing';
    game.startedAt = Date.now();
    this.games.set(pin, game);
    
    console.log('GameManager: Game started successfully');
    
    // Emit real-time event
    setTimeout(() => {
      realtimeManager.gameStarted(pin);
    }, 100);
    
    return true;
  }

  async submitAnswer(pin: string, playerId: string, questionId: string, answerId: string, timeSpent: number): Promise<boolean> {
    console.log('GameManager: Submitting answer:', { pin, playerId, questionId, answerId, timeSpent });
    
    const game = await this.getGameByPin(pin);
    const quiz = game ? await this.getQuiz(game.quizId) : null;
    
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
      const basePoints = question.points || 1000;
      const timeRatio = Math.max(0, (question.timeLimit - timeSpent) / question.timeLimit);
      const timeBonus = Math.floor(basePoints * 0.5 * timeRatio);
      points = Math.floor(basePoints * 0.5) + timeBonus;
    }

    player.answers.push({
      questionId,
      answerId,
      timeSpent,
      isCorrect
    });

    player.score += points;

    // Update in Supabase
    const { error } = await supabase
      .from('game_sessions')
      .update({ players: game.players })
      .eq('pin', pin);

    if (error) {
      console.error('GameManager: Error submitting answer:', error);
      return false;
    }

    this.games.set(pin, game);
    
    console.log('GameManager: Answer submitted, points awarded:', points);
    
    // Emit real-time event
    setTimeout(() => {
      realtimeManager.answerSubmitted(pin, playerId, answerId);
    }, 100);
    
    return true;
  }

  async nextQuestion(pin: string): Promise<boolean> {
    const game = await this.getGameByPin(pin);
    const quiz = game ? await this.getQuiz(game.quizId) : null;
    
    if (!game || !quiz) {
      return false;
    }

    const newQuestionIndex = game.currentQuestionIndex + 1;
    let updateData: any = { current_question_index: newQuestionIndex };
    
    if (newQuestionIndex >= quiz.questions.length) {
      updateData.status = 'finished';
      updateData.finished_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('game_sessions')
      .update(updateData)
      .eq('pin', pin);

    if (error) {
      console.error('GameManager: Error updating question:', error);
      return false;
    }

    game.currentQuestionIndex = newQuestionIndex;
    
    if (newQuestionIndex >= quiz.questions.length) {
      game.status = 'finished';
      game.finishedAt = Date.now();
      
      // Emit game ended event
      const finalScores = this.getLeaderboard(pin);
      setTimeout(() => {
        realtimeManager.gameEnded(pin, finalScores);
      }, 100);
    } else {
      // Emit new question event
      const currentQuestion = quiz.questions[newQuestionIndex];
      setTimeout(() => {
        realtimeManager.questionStarted(pin, newQuestionIndex, currentQuestion.timeLimit);
      }, 100);
    }

    this.games.set(pin, game);
    return true;
  }

  getLeaderboard(pin: string): Player[] {
    const game = this.games.get(pin);
    if (!game) {
      return [];
    }

    return [...game.players].sort((a, b) => b.score - a.score);
  }

  // Analytics
  async getGameStats(pin: string) {
    const game = await this.getGameByPin(pin);
    const quiz = game ? await this.getQuiz(game.quizId) : null;
    
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

  // Initialize from localStorage for backward compatibility
  async initialize(): Promise<void> {
    console.log('GameManager: Initializing...');
    // No need to load from localStorage anymore, Supabase handles persistence
  }
}

export const gameManager = new GameManager();

// Initialize on module load
gameManager.initialize();
