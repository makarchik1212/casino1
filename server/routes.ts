import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertCrashBetSchema, 
  insertMinesGameSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time game updates
  const wss = new WebSocketServer({ server: httpServer });
  
  // WebSocket clients
  const clients = new Map<string, WebSocket>();
  
  wss.on("connection", (ws) => {
    const id = Math.random().toString(36).substring(2, 10);
    clients.set(id, ws);
    
    ws.on("message", (message) => {
      // Handle WebSocket messages if needed
    });
    
    ws.on("close", () => {
      clients.delete(id);
    });
  });
  
  // Helper function to broadcast to all clients
  const broadcast = (data: any) => {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };
  
  // User Authentication Routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });
  
  // User Data Routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  // Game History Routes
  app.get("/api/history/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const history = await storage.getGameHistory(userId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to get game history" });
    }
  });
  
  // Leaderboard Routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const topPlayers = await storage.getTopPlayers(limit);
      
      // Return players without passwords
      const leaderboard = topPlayers.map(({ password, ...player }) => player);
      
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });
  
  // Crash Game Routes
  app.get("/api/crash/current", async (req, res) => {
    try {
      const currentGame = await storage.getCurrentCrashGame();
      if (!currentGame) {
        // Create a new crash game if none exists
        const crashPoint = generateCrashPoint();
        const newGame = await storage.createCrashGame({ crashPoint });
        
        // Start the crash game timer
        startCrashGameTimer(newGame.id, crashPoint, broadcast);
        
        return res.json(newGame);
      }
      
      res.json(currentGame);
    } catch (error) {
      res.status(500).json({ message: "Failed to get current crash game" });
    }
  });
  
  app.post("/api/crash/bet", async (req, res) => {
    try {
      const betData = insertCrashBetSchema.parse(req.body);
      
      // Verify user exists
      const user = await storage.getUser(betData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify crash game exists
      const crashGame = await storage.getCrashGame(betData.gameId);
      if (!crashGame) {
        return res.status(404).json({ message: "Crash game not found" });
      }
      
      // Check if game already ended
      if (crashGame.hasEnded) {
        return res.status(400).json({ message: "Game already ended" });
      }
      
      // Check if user has enough balance
      if (user.balance < betData.betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Update user balance
      await storage.updateUserBalance(user.id, user.balance - betData.betAmount);
      
      // Create the bet
      const bet = await storage.createCrashBet(betData);
      
      res.status(201).json(bet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to place bet" });
    }
  });
  
  app.post("/api/crash/cashout", async (req, res) => {
    try {
      const { betId, multiplier } = req.body;
      
      if (!betId || !multiplier) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get the bet
      const bet = await storage.getCrashBet(betId);
      if (!bet) {
        return res.status(404).json({ message: "Bet not found" });
      }
      
      // Get the game
      const game = await storage.getCrashGame(bet.gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Check if bet already cashed out
      if (bet.cashedOutAt) {
        return res.status(400).json({ message: "Bet already cashed out" });
      }
      
      // Check if game ended
      if (game.hasEnded) {
        // Check if multiplier is valid
        if (multiplier > game.result) {
          return res.status(400).json({ 
            message: "Invalid multiplier - game already crashed" 
          });
        }
      }
      
      // Cashout the bet
      const cashedOutBet = await storage.cashoutCrashBet(betId, multiplier);
      if (!cashedOutBet) {
        return res.status(500).json({ message: "Failed to cashout bet" });
      }
      
      // Create game history record
      await storage.createGameHistory({
        userId: bet.userId,
        gameType: "crash",
        betAmount: bet.betAmount,
        multiplier,
        profit: cashedOutBet.profit!,
        gameData: { gameId: game.id }
      });
      
      res.json(cashedOutBet);
    } catch (error) {
      res.status(500).json({ message: "Failed to cashout" });
    }
  });
  
  // Mines Game Routes
  app.post("/api/mines/start", async (req, res) => {
    try {
      const gameData = insertMinesGameSchema.parse(req.body);
      
      // Verify user exists
      const user = await storage.getUser(gameData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check for active game
      const activeGame = await storage.getActiveMinesGame(gameData.userId);
      if (activeGame) {
        return res.status(400).json({ 
          message: "You already have an active mines game",
          gameId: activeGame.id
        });
      }
      
      // Check if user has enough balance
      if (user.balance < gameData.betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Validate mine count
      if (gameData.mineCount < 1 || gameData.mineCount > 24) {
        return res.status(400).json({ message: "Invalid mine count (1-24)" });
      }
      
      // Generate random mine positions
      const minePositions = generateMinePositions(gameData.mineCount);
      
      // Create the mines game
      const game = await storage.createMinesGame({
        ...gameData,
        minePositions
      });
      
      // Return game without mine positions
      const { minePositions: _, ...gameWithoutMines } = game;
      
      res.status(201).json(gameWithoutMines);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to start mines game" });
    }
  });
  
  app.post("/api/mines/reveal", async (req, res) => {
    try {
      const { gameId, position } = req.body;
      
      if (!gameId || position === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Validate position
      if (position < 0 || position > 24) {
        return res.status(400).json({ message: "Invalid position (0-24)" });
      }
      
      // Get the game
      const game = await storage.getMinesGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Check if game completed
      if (game.isCompleted) {
        return res.status(400).json({ message: "Game already completed" });
      }
      
      // Reveal the cell
      const updatedGame = await storage.revealMineCell(gameId, position);
      if (!updatedGame) {
        return res.status(500).json({ message: "Failed to reveal cell" });
      }
      
      // Check if mine was hit
      const isMine = (updatedGame.minePositions as number[]).includes(position);
      
      // Return appropriate response
      if (isMine) {
        // Show all mine positions if game is over
        res.json({
          ...updatedGame,
          message: "Game over! You hit a mine."
        });
      } else {
        // Hide mine positions during gameplay
        const { minePositions, ...gameWithoutMines } = updatedGame;
        res.json({
          ...gameWithoutMines,
          message: "Safe cell revealed!"
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to reveal cell" });
    }
  });
  
  app.post("/api/mines/cashout", async (req, res) => {
    try {
      const { gameId } = req.body;
      
      if (!gameId) {
        return res.status(400).json({ message: "Missing game ID" });
      }
      
      // Get the game
      const game = await storage.getMinesGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Check if game completed or already cashed out
      if (game.isCompleted) {
        return res.status(400).json({ message: "Game already completed" });
      }
      
      // Cashout the game
      const updatedGame = await storage.cashoutMinesGame(gameId);
      if (!updatedGame) {
        return res.status(500).json({ message: "Failed to cashout game" });
      }
      
      // Return game with mine positions revealed
      res.json({
        ...updatedGame,
        message: `Cashed out successfully! You won ${updatedGame.profit} coins.`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to cashout game" });
    }
  });
  
  return httpServer;
}

// Helper function to generate a crash point (1.0 to 100.0)
function generateCrashPoint(): number {
  // House edge of approximately 5%
  // This creates a distribution where most crashes happen at lower values
  const houseEdge = 0.95;
  const randomValue = Math.random();
  
  // Formula that gives an exponential distribution
  // Minimum 1.0, with decreasing probability for higher values
  const crashPoint = Math.max(1.0, Math.floor((100 * houseEdge / randomValue) * 100) / 100);
  
  // Cap at 100.0 for a better user experience
  return Math.min(crashPoint, 100.0);
}

// Helper function to start crash game timer
function startCrashGameTimer(
  gameId: number, 
  crashPoint: number,
  broadcast: (data: any) => void
) {
  // Calculate how long the game should last in milliseconds
  // The duration increases with higher crash points to build tension
  // Base duration is 3 seconds (representing a 1.0x multiplier)
  const baseDuration = 3000; // 3 seconds
  const duration = baseDuration * Math.log2(crashPoint + 1);
  
  // Start time
  const startTime = Date.now();
  const endTime = startTime + duration;
  
  // Send updates 10 times per second
  const interval = setInterval(async () => {
    const currentTime = Date.now();
    
    // Calculate current multiplier based on elapsed time
    const elapsedRatio = (currentTime - startTime) / duration;
    let currentMultiplier = 1 + (crashPoint - 1) * elapsedRatio;
    
    // Round to 2 decimal places
    currentMultiplier = Math.floor(currentMultiplier * 100) / 100;
    
    // Broadcast current state
    broadcast({
      type: "crash_update",
      gameId,
      currentMultiplier,
      hasEnded: false
    });
    
    // Check if it's time to crash
    if (currentTime >= endTime) {
      clearInterval(interval);
      
      // End the game
      const storage = (await import("./storage")).storage;
      const endedGame = await storage.endCrashGame(gameId, crashPoint);
      
      // Broadcast crash event
      broadcast({
        type: "crash_ended",
        gameId,
        crashPoint,
        hasEnded: true
      });
      
      // Start a new game after a brief pause
      setTimeout(async () => {
        const newCrashPoint = generateCrashPoint();
        const newGame = await storage.createCrashGame({ crashPoint: newCrashPoint });
        
        // Broadcast new game
        broadcast({
          type: "crash_new_game",
          gameId: newGame.id
        });
        
        // Start timer for new game
        startCrashGameTimer(newGame.id, newCrashPoint, broadcast);
      }, 5000); // 5 second pause between games
    }
  }, 100); // 10 updates per second
}

// Helper function to generate random mine positions
function generateMinePositions(count: number): number[] {
  const positions: number[] = [];
  const totalCells = 25; // 5x5 grid
  
  while (positions.length < count) {
    const position = Math.floor(Math.random() * totalCells);
    if (!positions.includes(position)) {
      positions.push(position);
    }
  }
  
  return positions;
}
