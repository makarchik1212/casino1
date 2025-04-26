// Function to calculate crash multiplier based on elapsed time and crash point
export function calculateCrashMultiplier(
  startTime: number,
  currentTime: number,
  duration: number,
  crashPoint: number
): number {
  const elapsedRatio = Math.min(1, (currentTime - startTime) / duration);
  let currentMultiplier = 1 + (crashPoint - 1) * elapsedRatio;
  
  // Round to 2 decimal places
  return Math.floor(currentMultiplier * 100) / 100;
}

// Function to calculate mines game multiplier based on revealed cells and mine count
export function calculateMinesMultiplier(
  mineCount: number,
  revealedCount: number
): number {
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

// Function to calculate next multiplier in mines game when revealing a safe cell
export function calculateNextMinesMultiplier(
  mineCount: number,
  revealedCount: number
): number {
  return calculateMinesMultiplier(mineCount, revealedCount + 1);
}

// Function to calculate potential profit for mines game
export function calculateMinesPotentialProfit(
  betAmount: number,
  multiplier: number
): number {
  return Math.floor(betAmount * multiplier) - betAmount;
}

// Function to calculate crash game duration based on crash point
export function calculateCrashDuration(crashPoint: number): number {
  // Base duration is 3 seconds (representing a 1.0x multiplier)
  const baseDuration = 3000; // 3 seconds
  return baseDuration * Math.log2(crashPoint + 1);
}

// Function to generate crash graph height percentage based on current multiplier
export function getCrashGraphHeight(multiplier: number, maxMultiplier: number = 10): number {
  // Cap at maxMultiplier for visual purposes
  const cappedMultiplier = Math.min(multiplier, maxMultiplier);
  
  // Calculate height percentage (1.0 = 0%, maxMultiplier = 100%)
  const heightPercentage = ((cappedMultiplier - 1) / (maxMultiplier - 1)) * 100;
  
  return Math.min(100, Math.max(0, heightPercentage));
}

// Function to calculate mine probability for a cell
export function calculateMineProbability(
  mineCount: number,
  totalCells: number = 25,
  revealedPositions: number[] = []
): number {
  const remainingCells = totalCells - revealedPositions.length;
  return mineCount / remainingCells;
}

// Function to get color class based on multiplier
export function getMultiplierColorClass(multiplier: number): string {
  if (multiplier <= 1.5) return "bg-primary"; // red
  if (multiplier <= 3.0) return "bg-yellow-500"; // yellow
  return "bg-secondary"; // green
}

// Generate random mine positions for client-side prediction
// Note: The actual positions are determined server-side
export function generateClientMinePositions(count: number, totalCells: number = 25): number[] {
  const positions: number[] = [];
  
  while (positions.length < count) {
    const position = Math.floor(Math.random() * totalCells);
    if (!positions.includes(position)) {
      positions.push(position);
    }
  }
  
  return positions;
}

// Helper function to determine if the game is risky to continue
// Used for UI hints in Mines game
export function isGameRisky(
  mineCount: number,
  revealedCount: number,
  totalCells: number = 25
): boolean {
  const remainingCells = totalCells - revealedCount;
  const probability = mineCount / remainingCells;
  
  // Consider risky if chance of hitting mine is > 33%
  return probability > 0.33;
}
