
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
  imageUrl?: string;
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
        questions: quiz.questions as any,
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
      questions: Array.isArray(data.questions) ? data.questions as unknown as Question[] : [],
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
        questions: Array.isArray(data.questions) ? data.questions as unknown as Question[] : [],
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
          questions: updatedQuiz.questions as any
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
      status: data.status as 'waiting' | 'playing' | 'finished',
      currentQuestionIndex: data.current_question_index,
      players: Array.isArray(data.players) ? data.players as unknown as Player[] : [],
      createdAt: new Date(data.created_at).getTime(),
      startedAt: data.started_at ? new Date(data.started_at).getTime() : undefined,
      finishedAt: data.finished_at ? new Date(data.finished_at).getTime() : undefined
    };

    console.log('GameManager: Created game session:', gameSession);
    this.games.set(gameSession.pin, gameSession);
    
    // Emit creation event immediately
    realtimeManager.emit(gameSession.pin, 'game_created', { pin: gameSession.pin });
    
    return gameSession;
  }

  async getGameByPin(pin: string): Promise<GameSession | null> {
    console.log('GameManager: Getting game by PIN:', pin);
    
    // Always fetch fresh data from Supabase for real-time updates
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
      const game: GameSession = {
        id: data.id,
        quizId: data.quiz_id,
        pin: data.pin,
        status: data.status as 'waiting' | 'playing' | 'finished',
        currentQuestionIndex: data.current_question_index,
        players: Array.isArray(data.players) ? data.players as unknown as Player[] : [],
        createdAt: new Date(data.created_at).getTime(),
        startedAt: data.started_at ? new Date(data.started_at).getTime() : undefined,
        finishedAt: data.finished_at ? new Date(data.finished_at).getTime() : undefined
      };
      this.games.set(pin, game);
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
      .update({ players: updatedPlayers as any })
      .eq('pin', pin);

    if (error) {
      console.error('GameManager: Error adding player:', error);
      return { success: false, error: 'Failed to join game' };
    }

    game.players = updatedPlayers;
    this.games.set(pin, game);
    
    console.log('GameManager: Player added successfully:', player.id);
    
    // Emit real-time event immediately
    realtimeManager.playerJoined(pin, { id: player.id, name: player.name });
    
    return { success: true, player };
  }

  async removePlayerFromGame(pin: string, playerId: string): Promise<boolean> {
    console.log('GameManager: Removing player from game:', pin, playerId);
    
    const game = await this.getGameByPin(pin);
    if (!game) {
      return false;
    }

    const updatedPlayers = game.players.filter(p => p.id !== playerId);

    // Update in Supabase
    const { error } = await supabase
      .from('game_sessions')
      .update({ players: updatedPlayers as any })
      .eq('pin', pin);

    if (error) {
      console.error('GameManager: Error removing player:', error);
      return false;
    }

    game.players = updatedPlayers;
    this.games.set(pin, game);
    
    // Emit real-time event
    setTimeout(() => {
      realtimeManager.playerLeft(pin, playerId);
    }, 100);
    
    return true;
  }

  // Game Flow
  async startGame(pin: string): Promise<boolean> {
    console.log('GameManager: Starting game:', pin);
    
    const game = await this.getGameByPin(pin);
    if (!game || game.status !== 'waiting') {
      console.error('GameManager: Cannot start game - invalid state');
      return false;
    }

    if (game.players.length === 0) {
      console.error('GameManager: Cannot start game - no players');
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
    
    // Emit real-time events immediately with aggressive timing
    realtimeManager.gameStarted(pin);
    
    // Also emit question started event for the first question
    const quiz = await this.getQuiz(game.quizId);
    if (quiz && quiz.questions.length > 0) {
      const firstQuestion = quiz.questions[0];
      // Multiple events to ensure delivery
      setTimeout(() => realtimeManager.questionStarted(pin, 0, firstQuestion.timeLimit), 50);
      setTimeout(() => realtimeManager.questionStarted(pin, 0, firstQuestion.timeLimit), 150);
      setTimeout(() => realtimeManager.questionStarted(pin, 0, firstQuestion.timeLimit), 300);
    }
    
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
    // Use the current question from the game state instead of relying on questionId
    const currentQuestion = quiz.questions[game.currentQuestionIndex];
    
    if (!player || !currentQuestion) {
      console.error('GameManager: Player or current question not found');
      return false;
    }

    // Check if player already answered the current question using the actual question ID
    if (player.answers.some(a => a.questionId === currentQuestion.id)) {
      console.error('GameManager: Player already answered this question');
      return false;
    }

    const answer = currentQuestion.answers.find(a => a.id === answerId);
    const isCorrect = answer?.isCorrect || false;

    // Calculate points based on time and correctness (like Kahoot)
    let points = 0;
    if (isCorrect) {
      const basePoints = currentQuestion.points || 1000;
      const timeRatio = Math.max(0, (currentQuestion.timeLimit - timeSpent) / currentQuestion.timeLimit);
      const timeBonus = Math.floor(basePoints * 0.5 * timeRatio);
      points = Math.floor(basePoints * 0.5) + timeBonus;
    }

    // Use the actual question ID from the current question
    player.answers.push({
      questionId: currentQuestion.id,
      answerId,
      timeSpent,
      isCorrect
    });

    player.score += points;

    console.log('GameManager: Answer processed:', { 
      isCorrect, 
      points, 
      newScore: player.score,
      questionId: currentQuestion.id,
      currentQuestionIndex: game.currentQuestionIndex
    });

    // Update in Supabase with retry logic
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { error } = await supabase
          .from('game_sessions')
          .update({ players: game.players as any })
          .eq('pin', pin);

        if (error) {
          console.error(`GameManager: Error submitting answer (attempt ${attempt}):`, error);
          if (attempt === maxRetries) {
            return false;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          continue;
        }

        // Success - update local cache and emit events
        this.games.set(pin, game);
        
        console.log('GameManager: Answer submitted successfully, points awarded:', points);
        
        // Emit real-time event immediately
        realtimeManager.answerSubmitted(pin, playerId, answerId);
        
        return true;
      } catch (error) {
        console.error(`GameManager: Exception submitting answer (attempt ${attempt}):`, error);
        if (attempt === maxRetries) {
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }

    return false;
  }

  async nextQuestion(pin: string): Promise<boolean> {
    console.log('GameManager: Moving to next question for game:', pin);
    
    const game = await this.getGameByPin(pin);
    const quiz = game ? await this.getQuiz(game.quizId) : null;
    
    if (!game || !quiz) {
      console.error('GameManager: Game or quiz not found');
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
      realtimeManager.gameEnded(pin, finalScores);
    } else {
      // Emit new question event
      const currentQuestion = quiz.questions[newQuestionIndex];
      realtimeManager.questionStarted(pin, newQuestionIndex, currentQuestion.timeLimit);
    }

    this.games.set(pin, game);
    console.log('GameManager: Successfully moved to question', newQuestionIndex);
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

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async initialize(): Promise<void> {
    console.log('GameManager: Initializing...');
  }
}

export const gameManager = new GameManager();

gameManager.initialize();
