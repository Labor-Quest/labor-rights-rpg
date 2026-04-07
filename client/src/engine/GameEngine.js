/**
 * Core Game Engine — manages scenario state, choices, scoring, and RPG stats.
 * Pure logic, no React dependency.
 */

import { CHARACTER_STARTING_STATS, deriveStatChanges, applyStatChanges } from "./StatRules.js";
import { EXPENSE_INTERVAL, getExpenseEvent, rollForCrisis, applyDebtInterest } from "./CrisisEngine.js";

export function createGameState(characterId, scenarioData) {
  const startingStats = CHARACTER_STARTING_STATS[characterId] || { pera: 5000, confidence: 50, wellbeing: 75 };
  return {
    characterId,
    currentNodeId: scenarioData.startNode,
    score: 0,
    maxPossibleScore: 0,
    history: [],
    knowledgeGained: [],
    startTime: Date.now(),
    isComplete: false,
    // RPG stats
    stats: { ...startingStats },
    startingStats: { ...startingStats },
    lastStatChanges: null,
    nodesSinceLastExpense: 0,
    pendingExpense: null,
    pendingCrisis: null,
    forceWorstChoice: false,
  };
}

export function getCurrentNode(scenarioData, gameState) {
  return scenarioData.nodes[gameState.currentNodeId] || null;
}

export function makeChoice(scenarioData, gameState, choiceIndex) {
  const currentNode = getCurrentNode(scenarioData, gameState);
  if (!currentNode || !currentNode.choices || currentNode.isEnding) {
    return gameState;
  }

  const choice = currentNode.choices[choiceIndex];
  if (!choice) return gameState;

  const bestScore = Math.max(...currentNode.choices.map(c => c.scoreChange || 0));
  const scoreChange = choice.scoreChange || 0;

  // Derive RPG stat changes from theme + scoreChange
  const theme = currentNode.theme || "";
  const statChanges = deriveStatChanges(theme, scoreChange);
  const newStats = applyStatChanges(gameState.stats, statChanges);

  const newKnowledge = choice.knowledgeGained
    ? [...gameState.knowledgeGained, choice.knowledgeGained]
    : gameState.knowledgeGained;

  const nextNode = scenarioData.nodes[choice.nextNode];
  const newNodeCount = gameState.nodesSinceLastExpense + 1;

  // Check for expense interval
  let pendingExpense = null;
  let nodesSinceLastExpense = newNodeCount;
  if (newNodeCount >= EXPENSE_INTERVAL) {
    pendingExpense = getExpenseEvent(gameState.characterId);
    // Also apply debt interest if in debt
    if (newStats.pera < 0) {
      const interest = applyDebtInterest(newStats.pera);
      newStats.pera += interest;
    }
    nodesSinceLastExpense = 0;
  }

  // Check for crisis (don't stack with expense on same node)
  let pendingCrisis = null;
  if (!pendingExpense) {
    pendingCrisis = rollForCrisis(newStats.wellbeing, gameState.characterId);
  }

  return {
    ...gameState,
    currentNodeId: choice.nextNode,
    score: gameState.score + scoreChange,
    maxPossibleScore: gameState.maxPossibleScore + bestScore,
    history: [
      ...gameState.history,
      {
        nodeId: currentNode.id,
        nodeTitle: currentNode.title,
        choiceText: choice.text,
        consequence: choice.consequence,
        scoreChange,
      },
    ],
    knowledgeGained: newKnowledge,
    isComplete: nextNode ? !!nextNode.isEnding : true,
    stats: newStats,
    lastStatChanges: statChanges,
    nodesSinceLastExpense,
    pendingExpense,
    pendingCrisis,
    forceWorstChoice: pendingCrisis?.forceWorstChoice || false,
  };
}

/**
 * Apply an expense or crisis event to the game state.
 */
export function applyEvent(gameState, event) {
  const cost = event.cost || 0;
  const wellbeingLoss = event.wellbeingLoss || 0;
  const confidenceLoss = event.confidenceLoss || 0;

  return {
    ...gameState,
    stats: {
      pera: gameState.stats.pera - cost,
      confidence: Math.max(0, gameState.stats.confidence - confidenceLoss),
      wellbeing: Math.max(0, gameState.stats.wellbeing - wellbeingLoss),
    },
    lastStatChanges: {
      pera: -cost,
      confidence: -confidenceLoss,
      wellbeing: -wellbeingLoss,
    },
    pendingExpense: null,
    pendingCrisis: null,
  };
}

export function getScoreGrade(gameState) {
  if (gameState.maxPossibleScore === 0) return { grade: "N/A", pct: 0 };

  const pct = (gameState.score / gameState.maxPossibleScore) * 100;

  if (pct >= 90) return { grade: "A+", pct };
  if (pct >= 75) return { grade: "A", pct };
  if (pct >= 60) return { grade: "B", pct };
  if (pct >= 40) return { grade: "C", pct };
  return { grade: "D", pct };
}

export function getPlayTime(gameState) {
  const ms = Date.now() - gameState.startTime;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
