import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with balance
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: integer("balance").notNull().default(1000), // Initial balance of 1000 Telegram Stars
  avatarColor: text("avatar_color").default("#FFD700"), // Default avatar color (gold)
  createdAt: timestamp("created_at").defaultNow(),
});

// Game history table (records of all games played)
export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: text("game_type").notNull(), // "crash" or "mines"
  betAmount: integer("bet_amount").notNull(),
  multiplier: real("multiplier").notNull(), // The final multiplier
  profit: integer("profit").notNull(), // Can be negative for losses
  gameData: jsonb("game_data"), // Additional game-specific data (mine positions, etc.)
  timestamp: timestamp("timestamp").defaultNow(),
});

// Crash game states (for ongoing crash games)
export const crashGames = pgTable("crash_games", {
  id: serial("id").primaryKey(),
  crashPoint: real("crash_point").notNull(), // The point at which the game will crash
  startTime: timestamp("start_time").defaultNow(),
  hasEnded: boolean("has_ended").default(false),
  result: real("result").default(0), // Final multiplier when ended
});

// Crash bets (linked to a specific crash game)
export const crashBets = pgTable("crash_bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameId: integer("game_id").notNull().references(() => crashGames.id),
  betAmount: integer("bet_amount").notNull(),
  autoCashoutAt: real("auto_cashout_at"), // Optional auto cashout multiplier
  cashedOutAt: real("cashed_out_at"), // Null if not cashed out yet
  profit: integer("profit"), // Null if game not ended yet
});

// Mines game sessions
export const minesGames = pgTable("mines_games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  betAmount: integer("bet_amount").notNull(),
  mineCount: integer("mine_count").notNull(),
  minePositions: jsonb("mine_positions").notNull(), // Array of positions (0-24)
  revealedPositions: jsonb("revealed_positions").notNull(), // Array of revealed positions
  isCompleted: boolean("is_completed").default(false),
  isCashedOut: boolean("is_cashed_out").default(false),
  currentMultiplier: real("current_multiplier").notNull().default(1.0),
  profit: integer("profit"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  avatarColor: true,
});

export const insertGameHistorySchema = createInsertSchema(gameHistory).omit({
  id: true,
  timestamp: true,
});

export const insertCrashGameSchema = createInsertSchema(crashGames).omit({
  id: true,
  startTime: true,
  hasEnded: true,
  result: true,
});

export const insertCrashBetSchema = createInsertSchema(crashBets).omit({
  id: true,
  cashedOutAt: true,
  profit: true,
});

export const insertMinesGameSchema = createInsertSchema(minesGames).omit({
  id: true,
  revealedPositions: true,
  isCompleted: true,
  isCashedOut: true,
  currentMultiplier: true,
  profit: true,
  timestamp: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type GameHistory = typeof gameHistory.$inferSelect;
export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;

export type CrashGame = typeof crashGames.$inferSelect;
export type InsertCrashGame = z.infer<typeof insertCrashGameSchema>;

export type CrashBet = typeof crashBets.$inferSelect;
export type InsertCrashBet = z.infer<typeof insertCrashBetSchema>;

export type MinesGame = typeof minesGames.$inferSelect;
export type InsertMinesGame = z.infer<typeof insertMinesGameSchema>;
