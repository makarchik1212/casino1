import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// WebSockets disabled for now due to deployment issues
// import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertCrashBetSchema, 
  insertMinesGameSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Game state storage for polling (replacing WebSockets)
  const gameState = {
    currentCrashGame: null as any,
    currentMultiplier: 1.0,
    lastUpdate: Date.now(),
    gameHistory: [] as any[]
  };
  
  // Helper function to update game state (replacing broadcast)
  const updateGameState = (data: any) => {
    try {
      // Update the appropriate state based on the type
      if (data.type === 'crash_update') {
        gameState.currentMultiplier = data.currentMultiplier;
        gameState.lastUpdate = Date.now();
      } else if (data.type === 'crash_ended') {
        // Keep track of game history (most recent 10 games)
        if (gameState.gameHistory.length >= 10) {
          gameState.gameHistory.shift();
        }
        gameState.gameHistory.push({
          id: data.gameId,
          crashPoint: data.crashPoint,
          timestamp: Date.now()
        });
      } else if (data.type === 'crash_new_game') {
        gameState.currentCrashGame = { id: data.gameId };
        gameState.currentMultiplier = 1.0;
      }
      
      console.log(`Game state updated: ${data.type}`);
    } catch (err) {
      console.error("Error updating game state:", err);
    }
  };
  
  // Polling endpoint for game updates
  app.get("/api/game-state", (req, res) => {
    res.json(gameState);
  });
  
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
        startCrashGameTimer(newGame.id, crashPoint, updateGameState);
        
        // Update game state
        gameState.currentCrashGame = newGame;
        gameState.currentMultiplier = 1.0;
        
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
        if (game.result !== null && multiplier > game.result) {
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
  app.get("/api/mines/active/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check for active game
      const activeGame = await storage.getActiveMinesGame(userId);
      if (!activeGame) {
        return res.status(404).json({ message: "No active game found" });
      }
      
      // Return game without mine positions unless game is over
      if (activeGame.isCompleted) {
        res.json(activeGame);
      } else {
        const { minePositions, ...gameWithoutMines } = activeGame;
        res.json(gameWithoutMines);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get active game" });
    }
  });
  
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
        message: `Cashed out successfully! You won ${updatedGame.profit} stars.`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to cashout game" });
    }
  });
  
  return httpServer;
}

// Helper function to generate a crash point (1.0 to 100.0)
function generateCrashPoint(): number {
  // 70% chance of low values (1.01 to 2.00)
  // 20% chance of medium values (2.01 to 5.00)
  // 10% chance of high values (5.01 to 50.00)
  const randValue = Math.random();
  
  if (randValue < 0.70) {
    // Low values: more concentrated around 1.01-1.50
    const baseValue = 1.01;
    const lowRandom = Math.random(); 
    // Use square to concentrate more values near the beginning
    const skewedLowRandom = lowRandom * lowRandom;
    return baseValue + skewedLowRandom * 0.99; // 1.01 to 2.00
  } else if (randValue < 0.90) {
    // Medium values
    return 2.01 + Math.random() * 2.99; // 2.01 to 5.00
  } else {
    // High values - exponential distribution for rare high crashes
    const baseHigh = 5.01;
    const exponential = Math.log(1 - Math.random()) / -0.2;
    const highValue = baseHigh + exponential * 3;
    
    // Round to 2 decimal places
    const rounded = Math.floor(highValue * 100) / 100;
    
    // Cap at 50.0 for a better user experience
    return Math.min(rounded, 50.0);
  }
}

// Helper function to start crash game timer
function startCrashGameTimer(
  gameId: number, 
  crashPoint: number,
  updateGameState: (data: any) => void
) {
  try {
    console.log(`Starting crash game timer for game ${gameId} with crash point ${crashPoint}`);
    
    // Calculate how long the game should last in milliseconds
    // The duration increases with higher crash points to build tension
    // Base duration is 3 seconds (representing a 1.0x multiplier)
    const baseDuration = 3000; // 3 seconds
    const duration = baseDuration * Math.log2(crashPoint + 1);
    
    // Start time
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    // Send updates 5 times per second (reduced from 10 to lower server load)
    const interval = setInterval(async () => {
      try {
        const currentTime = Date.now();
        
        // Calculate current multiplier based on elapsed time
        const elapsedRatio = (currentTime - startTime) / duration;
        let currentMultiplier = 1 + (crashPoint - 1) * elapsedRatio;
        
        // Round to 2 decimal places
        currentMultiplier = Math.floor(currentMultiplier * 100) / 100;
        
        // Update game state
        updateGameState({
          type: "crash_update",
          gameId,
          currentMultiplier,
          hasEnded: false
        });
        
        // Check if it's time to crash
        if (currentTime >= endTime) {
          clearInterval(interval);
          
          try {
            // End the game
            const storage = (await import("./storage")).storage;
            await storage.endCrashGame(gameId, crashPoint);
            
            // Update game state with crash event
            updateGameState({
              type: "crash_ended",
              gameId,
              crashPoint,
              hasEnded: true
            });
            
            // Start a new game after a brief pause
            setTimeout(async () => {
              try {
                const newCrashPoint = generateCrashPoint();
                const newGame = await storage.createCrashGame({ crashPoint: newCrashPoint });
                
                // Update game state with new game
                updateGameState({
                  type: "crash_new_game",
                  gameId: newGame.id
                });
                
                // Start timer for new game
                startCrashGameTimer(newGame.id, newCrashPoint, updateGameState);
              } catch (err) {
                console.error("Error starting new crash game:", err);
              }
            }, 5000); // 5 second pause between games
          } catch (err) {
            console.error("Error ending crash game:", err);
          }
        }
      } catch (err) {
        console.error("Error in crash game interval:", err);
      }
    }, 200); // 5 updates per second
  } catch (err) {
    console.error("Error setting up crash game timer:", err);
  }
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
