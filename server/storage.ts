import { 
  users, type User, type InsertUser,
  gameHistory, type GameHistory, type InsertGameHistory,
  crashGames, type CrashGame, type InsertCrashGame,
  crashBets, type CrashBet, type InsertCrashBet,
  minesGames, type MinesGame, type InsertMinesGame
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: number): Promise<User | undefined>;
  
  // Game history operations
  getGameHistory(userId: number, limit?: number): Promise<GameHistory[]>;
  createGameHistory(history: InsertGameHistory): Promise<GameHistory>;
  
  // Crash game operations
  createCrashGame(game: InsertCrashGame): Promise<CrashGame>;
  getCrashGame(id: number): Promise<CrashGame | undefined>;
  getCurrentCrashGame(): Promise<CrashGame | undefined>;
  endCrashGame(id: number, result: number): Promise<CrashGame | undefined>;
  
  // Crash bet operations
  createCrashBet(bet: InsertCrashBet): Promise<CrashBet>;
  getCrashBet(id: number): Promise<CrashBet | undefined>;
  getCrashBetsByGameId(gameId: number): Promise<CrashBet[]>;
  getCrashBetsByUserId(userId: number): Promise<CrashBet[]>;
  cashoutCrashBet(id: number, cashedOutAt: number): Promise<CrashBet | undefined>;
  
  // Mines game operations
  createMinesGame(game: InsertMinesGame): Promise<MinesGame>;
  getMinesGame(id: number): Promise<MinesGame | undefined>;
  getActiveMinesGame(userId: number): Promise<MinesGame | undefined>;
  revealMineCell(gameId: number, position: number): Promise<MinesGame | undefined>;
  cashoutMinesGame(gameId: number): Promise<MinesGame | undefined>;
  
  // Leaderboard operations
  getTopPlayers(limit?: number): Promise<(User & { totalWinnings: number, bestMultiplier: number })[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameHistory: Map<number, GameHistory>;
  private crashGames: Map<number, CrashGame>;
  private crashBets: Map<number, CrashBet>;
  private minesGames: Map<number, MinesGame>;
  
  private userId = 1;
  private gameHistoryId = 1;
  private crashGameId = 1;
  private crashBetId = 1;
  private minesGameId = 1;

  constructor() {
    this.users = new Map();
    this.gameHistory = new Map();
    this.crashGames = new Map();
    this.crashBets = new Map();
    this.minesGames = new Map();
    
    // Create a demo user
    this.createUser({
      username: "demo",
      password: "password",
      avatarColor: "#3498db"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const timestamp = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      balance: 1000, // Initial balance
      createdAt: timestamp
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, balance: newBalance };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Game history operations
  async getGameHistory(userId: number, limit: number = 10): Promise<GameHistory[]> {
    return Array.from(this.gameHistory.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createGameHistory(history: InsertGameHistory): Promise<GameHistory> {
    const id = this.gameHistoryId++;
    const timestamp = new Date();
    const newHistory: GameHistory = { ...history, id, timestamp };
    this.gameHistory.set(id, newHistory);
    return newHistory;
  }

  // Crash game operations
  async createCrashGame(game: InsertCrashGame): Promise<CrashGame> {
    const id = this.crashGameId++;
    const startTime = new Date();
    const newGame: CrashGame = { 
      ...game, 
      id, 
      startTime, 
      hasEnded: false,
      result: 0
    };
    this.crashGames.set(id, newGame);
    return newGame;
  }

  async getCrashGame(id: number): Promise<CrashGame | undefined> {
    return this.crashGames.get(id);
  }

  async getCurrentCrashGame(): Promise<CrashGame | undefined> {
    return Array.from(this.crashGames.values())
      .filter(game => !game.hasEnded)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];
  }

  async endCrashGame(id: number, result: number): Promise<CrashGame | undefined> {
    const game = await this.getCrashGame(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, hasEnded: true, result };
    this.crashGames.set(id, updatedGame);
    return updatedGame;
  }

  // Crash bet operations
  async createCrashBet(bet: InsertCrashBet): Promise<CrashBet> {
    const id = this.crashBetId++;
    const newBet: CrashBet = { 
      ...bet, 
      id,
      cashedOutAt: null,
      profit: null
    };
    this.crashBets.set(id, newBet);
    return newBet;
  }

  async getCrashBet(id: number): Promise<CrashBet | undefined> {
    return this.crashBets.get(id);
  }

  async getCrashBetsByGameId(gameId: number): Promise<CrashBet[]> {
    return Array.from(this.crashBets.values())
      .filter(bet => bet.gameId === gameId);
  }

  async getCrashBetsByUserId(userId: number): Promise<CrashBet[]> {
    return Array.from(this.crashBets.values())
      .filter(bet => bet.userId === userId);
  }

  async cashoutCrashBet(id: number, cashedOutAt: number): Promise<CrashBet | undefined> {
    const bet = await this.getCrashBet(id);
    if (!bet) return undefined;
    
    const profit = Math.floor(bet.betAmount * cashedOutAt) - bet.betAmount;
    const updatedBet = { ...bet, cashedOutAt, profit };
    this.crashBets.set(id, updatedBet);
    
    // Update user balance
    const user = await this.getUser(bet.userId);
    if (user) {
      await this.updateUserBalance(user.id, user.balance + profit + bet.betAmount);
    }
    
    return updatedBet;
  }

  // Mines game operations
  async createMinesGame(game: InsertMinesGame): Promise<MinesGame> {
    const id = this.minesGameId++;
    const timestamp = new Date();
    const newGame: MinesGame = { 
      ...game, 
      id,
      revealedPositions: [],
      isCompleted: false,
      isCashedOut: false,
      currentMultiplier: 1.0,
      profit: null,
      timestamp
    };
    this.minesGames.set(id, newGame);
    
    // Deduct bet amount from user balance
    const user = await this.getUser(game.userId);
    if (user) {
      await this.updateUserBalance(user.id, user.balance - game.betAmount);
    }
    
    return newGame;
  }

  async getMinesGame(id: number): Promise<MinesGame | undefined> {
    return this.minesGames.get(id);
  }

  async getActiveMinesGame(userId: number): Promise<MinesGame | undefined> {
    return Array.from(this.minesGames.values())
      .find(game => game.userId === userId && !game.isCompleted);
  }

  async revealMineCell(gameId: number, position: number): Promise<MinesGame | undefined> {
    const game = await this.getMinesGame(gameId);
    if (!game || game.isCompleted) return undefined;
    
    // Check if position already revealed
    if (game.revealedPositions.includes(position)) {
      return game;
    }
    
    // Check if mine hit
    const isMine = (game.minePositions as number[]).includes(position);
    let updatedGame: MinesGame;
    
    if (isMine) {
      // Game over - mine hit
      updatedGame = { 
        ...game, 
        revealedPositions: [...game.revealedPositions, position],
        isCompleted: true,
        profit: -game.betAmount
      };
      
      // Create game history record
      await this.createGameHistory({
        userId: game.userId,
        gameType: "mines",
        betAmount: game.betAmount,
        multiplier: 0,
        profit: -game.betAmount,
        gameData: {
          mineCount: game.mineCount,
          minePositions: game.minePositions,
          revealedPositions: updatedGame.revealedPositions
        }
      });
      
    } else {
      // Safe cell - calculate new multiplier
      const totalCells = 25;
      const safeCellsRemaining = totalCells - game.mineCount - game.revealedPositions.length;
      
      // Using formula based on grid size (5x5=25), mines, and revealed cells
      const newMultiplier = this.calculateMinesMultiplier(
        game.mineCount, 
        game.revealedPositions.length + 1
      );
      
      updatedGame = {
        ...game,
        revealedPositions: [...game.revealedPositions, position],
        currentMultiplier: newMultiplier
      };
    }
    
    this.minesGames.set(gameId, updatedGame);
    return updatedGame;
  }

  // Calculate mines multiplier based on revealed safe cells
  private calculateMinesMultiplier(mineCount: number, revealedCount: number): number {
    const totalCells = 25;
    const totalSafeCells = totalCells - mineCount;
    
    // Base multiplier calculation
    // The formula accounts for increasing risk as more cells are revealed
    let multiplier = (totalCells / (totalCells - mineCount)) * (revealedCount / totalSafeCells) * 2;
    
    // Add multiplier boost based on mine count (higher risk, higher reward)
    const mineBoost = 1 + (mineCount / totalCells);
    multiplier *= mineBoost;
    
    // Round to 2 decimal places
    return Math.round(multiplier * 100) / 100;
  }

  async cashoutMinesGame(gameId: number): Promise<MinesGame | undefined> {
    const game = await this.getMinesGame(gameId);
    if (!game || game.isCompleted || game.isCashedOut) return undefined;
    
    const profit = Math.floor(game.betAmount * game.currentMultiplier) - game.betAmount;
    const updatedGame: MinesGame = {
      ...game,
      isCompleted: true,
      isCashedOut: true,
      profit
    };
    
    // Update game in storage
    this.minesGames.set(gameId, updatedGame);
    
    // Update user balance
    const user = await this.getUser(game.userId);
    if (user) {
      await this.updateUserBalance(
        user.id, 
        user.balance + game.betAmount + profit
      );
    }
    
    // Create game history record
    await this.createGameHistory({
      userId: game.userId,
      gameType: "mines",
      betAmount: game.betAmount,
      multiplier: game.currentMultiplier,
      profit,
      gameData: {
        mineCount: game.mineCount,
        minePositions: game.minePositions,
        revealedPositions: game.revealedPositions
      }
    });
    
    return updatedGame;
  }

  // Leaderboard operations
  async getTopPlayers(limit: number = 5): Promise<(User & { totalWinnings: number, bestMultiplier: number })[]> {
    // Get all users
    const users = Array.from(this.users.values());
    
    // Build player statistics
    const playerStats = users.map(user => {
      const userGames = Array.from(this.gameHistory.values())
        .filter(history => history.userId === user.id);
      
      const totalWinnings = userGames
        .reduce((sum, game) => sum + (game.profit > 0 ? game.profit : 0), 0);
      
      const bestMultiplier = userGames.length > 0 
        ? Math.max(...userGames.map(game => game.multiplier))
        : 0;
      
      return {
        ...user,
        totalWinnings,
        bestMultiplier
      };
    });
    
    // Sort by total winnings and take top players
    return playerStats
      .sort((a, b) => b.totalWinnings - a.totalWinnings)
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
