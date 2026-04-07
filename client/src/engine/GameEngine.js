/**
 * Core Game Engine — manages scenario state, choices, and scoring.
 * Pure logic, no React dependency.
 */

export function createGameState(characterId, scenarioData) {
  return {
    characterId,
    currentNodeId: scenarioData.startNode,
    score: 0,
    maxPossibleScore: 0,
    history: [],
    knowledgeGained: [],
    startTime: Date.now(),
    isComplete: false,
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

  // Calculate max possible score from this node
  const bestScore = Math.max(...currentNode.choices.map(c => c.scoreChange || 0));

  const newKnowledge = choice.knowledgeGained
    ? [...gameState.knowledgeGained, choice.knowledgeGained]
    : gameState.knowledgeGained;

  const nextNode = scenarioData.nodes[choice.nextNode];

  return {
    ...gameState,
    currentNodeId: choice.nextNode,
    score: gameState.score + (choice.scoreChange || 0),
    maxPossibleScore: gameState.maxPossibleScore + bestScore,
    history: [
      ...gameState.history,
      {
        nodeId: currentNode.id,
        nodeTitle: currentNode.title,
        choiceText: choice.text,
        consequence: choice.consequence,
        scoreChange: choice.scoreChange || 0,
      },
    ],
    knowledgeGained: newKnowledge,
    isComplete: nextNode ? !!nextNode.isEnding : true,
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
