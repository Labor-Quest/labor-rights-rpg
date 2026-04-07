#!/usr/bin/env node

/**
 * Content Generation Script for Labor Rights RPG
 *
 * Calls the Claude API ONCE per character to generate branching scenario trees.
 * Output is saved as static JSON — zero runtime AI costs.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate.js
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate.js --character ofw
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data/scenarios");

const client = new Anthropic();

// Character definitions with detailed generation prompts
const CHARACTER_CONFIGS = {
  ofw: {
    id: "ofw",
    name: "Maria Santos",
    role: "Overseas Filipino Worker (Domestic Helper)",
    scenarioCount: 130,
    prompt: `You are generating scenarios for Maria Santos, a 28-year-old first-time OFW from Pampanga going to work as a domestic helper in the Middle East.

Generate a branching narrative tree covering these labor rights themes:
1. RECRUITMENT PHASE: Illegal recruitment, excessive placement fees (legal max is 1 month salary), fake job offers, unlicensed agencies
2. PRE-DEPARTURE: Contract substitution (different contract abroad vs what was signed in PH), PDOS attendance, POLO verification
3. ARRIVAL & WORK: Document/passport confiscation by employer, wage withholding, no days off, verbal/physical abuse
4. SEEKING HELP: Contacting Philippine embassy, OWWA assistance, filing complaints with DMW
5. RETURN & RESOLUTION: Filing cases with NLRC, claiming from recruitment agency bond, reintegration

Key Philippine laws to reference:
- RA 10022 (Migrant Workers Act): Illegal recruitment penalties, mandatory insurance, deployment ban for non-compliant countries
- RA 8042: Money claims against recruitment agencies, joint and solidary liability
- Standard Employment Contract: Minimum provisions (free food/accommodation, rest day, termination provisions)
- POEA rules: Maximum placement fee of 1 month salary, licensed agency verification`
  },

  rider: {
    id: "rider",
    name: "Jake Reyes",
    role: "Delivery Rider (Gig Worker)",
    scenarioCount: 130,
    prompt: `You are generating scenarios for Jake Reyes, a 24-year-old delivery rider in Metro Manila working for food delivery platforms.

Generate a branching narrative tree covering these labor rights themes:
1. ONBOARDING: Terms of service traps, "independent contractor" classification, required purchases (thermal bag, uniform)
2. DAILY WORK: Algorithmic pay cuts, surge pricing manipulation, unfair rating systems, account deactivation threats
3. ACCIDENTS: No insurance coverage, medical costs, liability issues, no workers' compensation
4. ORGANIZING: Rider groups and associations, collective bargaining attempts, platform retaliation
5. SEEKING RIGHTS: Filing misclassification complaints with DOLE, SSS/PhilHealth coverage claims

Key Philippine laws to reference:
- Labor Code Art. 295: Four-fold test for employer-employee relationship (selection, wages, dismissal, control)
- DOLE Department Order 174: Rules on contracting and subcontracting
- SSS Act (RA 11199): Coverage for self-employed and gig workers
- Occupational Safety and Health Standards Act (RA 11058)`
  },

  bpo: {
    id: "bpo",
    name: "Angela Cruz",
    role: "BPO/Call Center Worker",
    scenarioCount: 130,
    prompt: `You are generating scenarios for Angela Cruz, a 26-year-old call center agent in Makati working night shifts.

Generate a branching narrative tree covering these labor rights themes:
1. HIRING: Contractualization (endo), probationary abuse, misleading job postings
2. WORKING CONDITIONS: Forced overtime, night shift differential denial, no meal breaks, toxic metrics/KPIs
3. HEALTH: Mental health impact, repetitive strain, sleep disorders, denied sick leave
4. LABOR RIGHTS: Union organizing attempts, company surveillance, anti-union tactics, regularization fights
5. TERMINATION: Illegal dismissal, forced resignation, final pay withholding, certificate of employment denial

Key Philippine laws to reference:
- Labor Code Art. 87: Overtime pay (additional 25% for regular days, 30% for rest days)
- Labor Code Art. 86: Night shift differential (10% premium for 10PM-6AM)
- Labor Code Art. 295-296: Security of tenure, regular vs contractual employment
- DOLE DO 174: End of contractualization (endo) rules
- Mental Health Act (RA 11036): Workplace mental health policies`
  },

  construction: {
    id: "construction",
    name: "Roberto Dela Cruz",
    role: "Construction Worker",
    scenarioCount: 130,
    prompt: `You are generating scenarios for Roberto Dela Cruz, a 35-year-old construction worker in Cebu working for a subcontractor.

Generate a branching narrative tree covering these labor rights themes:
1. HIRING: No written contract, verbal agreements, "pakyaw" (piece-rate) payment, labor-only contracting
2. SAFETY: No PPE provided, no safety training, dangerous scaffolding, no fall protection
3. WAGES: Below minimum wage, delayed payments, illegal deductions for tools/materials, no 13th month pay
4. ACCIDENTS: Workplace injury with no SSS coverage, employer denying liability, no ECC (Employees Compensation Commission) benefits
5. FIGHTING BACK: Filing complaints with DOLE regional office, SENA mediation, NLRC arbitration

Key Philippine laws to reference:
- RA 11058 (OSH Act): Employer must provide PPE, safety training, penalties for violations
- Labor Code Art. 106-109: Labor-only contracting is prohibited, principal becomes employer
- Labor Code Art. 103: Wages must be paid at least every 2 weeks
- Labor Code Art. 113-116: Prohibited deductions from wages
- PD 626: Employees' Compensation Program for work-related injuries`
  }
};

const SYSTEM_PROMPT = `You are an expert on Philippine labor law and workers' rights. You are creating educational scenario content for a text-based RPG game that teaches Filipino workers about their legal rights.

IMPORTANT RULES:
1. Every scenario must be REALISTIC — based on actual situations Filipino workers face
2. All legal references must be ACCURATE — cite specific articles, RAs, and DOs
3. Choices should have CLEAR consequences — players learn by seeing outcomes
4. The "right" choice should always involve knowing and asserting legal rights
5. Include SPECIFIC details: amounts (peso values), timeframes, agency names
6. Tone should be empathetic but empowering — never preachy

OUTPUT FORMAT — Return valid JSON with this exact structure:
{
  "nodes": {
    "NODE_ID": {
      "id": "NODE_ID",
      "title": "Short scene title",
      "narrative": "2-4 paragraphs describing the situation the character faces. Be vivid and specific. Use Filipino cultural context (e.g., utang na loob, hiya, family pressure).",
      "theme": "one of: recruitment_scams | contract_substitution | wage_theft | unsafe_conditions | misclassification | forced_overtime | illegal_deductions | no_benefits | union_busting | contractualization | document_confiscation | health_hazards | no_contract | accident_liability | algorithmic_management",
      "choices": [
        {
          "text": "What the player chooses to do (1 sentence)",
          "nextNode": "NEXT_NODE_ID",
          "consequence": "Brief description of what happens",
          "scoreChange": <number from -10 to +15>,
          "knowledgeGained": "Specific legal fact the player learns (or null if negative choice)"
        }
      ],
      "isEnding": false
    }
  },
  "startNode": "CHARACTER_start"
}

SCORING GUIDE:
- +10 to +15: Player correctly identifies and asserts a specific legal right
- +5 to +9: Player takes a cautious/protective action
- 0: Neutral choice
- -5 to -1: Player makes a suboptimal but understandable choice
- -10 to -6: Player's choice leads to exploitation or danger

STRUCTURE REQUIREMENTS:
- Start node ID must be "CHARACTER_start" (e.g., "ofw_start")
- Generate at least NODE_COUNT scenario nodes total
- Create 5 major story arcs (branches) of ~25 nodes each
- Each arc should have 4-6 decision points with 2-3 choices each
- Some branches should converge at key moments
- Each arc must end with 2-3 ending nodes (isEnding: true) — good, mixed, and bad outcomes
- Ending nodes should summarize what the character learned and reference specific resources (DOLE, NLRC, etc.)

RETURN ONLY THE JSON. No markdown, no explanation, no code fences.`;

async function generateForCharacter(config) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Generating scenarios for: ${config.name} (${config.role})`);
  console.log(`Target: ${config.scenarioCount}+ nodes`);
  console.log(`${"=".repeat(60)}\n`);

  const userPrompt = `${config.prompt}

Generate the complete branching scenario tree with at least ${config.scenarioCount} nodes. Remember:
- Start node must be "${config.id}_start"
- Node IDs should follow the pattern: ${config.id}_<theme>_<number> (e.g., ${config.id}_recruitment_01)
- Create rich, detailed narratives that feel like real stories
- Every choice must teach something about labor rights
- Include at least 15 ending nodes across all branches

Return ONLY valid JSON.`;

  const startTime = Date.now();

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: SYSTEM_PROMPT.replace("NODE_COUNT", String(config.scenarioCount)),
      messages: [{ role: "user", content: userPrompt }]
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`API call completed in ${elapsed}s`);

    // Extract text content
    const rawText = message.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("");

    // Parse and validate JSON
    let scenarios;
    try {
      scenarios = JSON.parse(rawText);
    } catch (parseErr) {
      // Try to extract JSON from markdown code fences
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        scenarios = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error(`Failed to parse JSON response: ${parseErr.message}`);
      }
    }

    // Validate structure
    const nodeCount = Object.keys(scenarios.nodes).length;
    const endingCount = Object.values(scenarios.nodes).filter(n => n.isEnding).length;
    console.log(`Generated ${nodeCount} nodes (${endingCount} endings)`);

    if (!scenarios.startNode) {
      scenarios.startNode = `${config.id}_start`;
    }

    // Validate all nextNode references point to existing nodes
    let brokenLinks = 0;
    for (const node of Object.values(scenarios.nodes)) {
      if (node.choices) {
        for (const choice of node.choices) {
          if (choice.nextNode && !scenarios.nodes[choice.nextNode]) {
            brokenLinks++;
          }
        }
      }
    }
    if (brokenLinks > 0) {
      console.warn(`WARNING: ${brokenLinks} choices reference non-existent nodes`);
    }

    // Save to file
    const outputPath = path.join(DATA_DIR, `${config.id}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(scenarios, null, 2));
    console.log(`Saved to ${outputPath}`);

    return { id: config.id, nodeCount, endingCount, brokenLinks };

  } catch (error) {
    console.error(`ERROR generating ${config.id}:`, error.message);
    throw error;
  }
}

async function main() {
  // Parse CLI args
  const args = process.argv.slice(2);
  const characterFlag = args.indexOf("--character");
  const selectedCharacter = characterFlag !== -1 ? args[characterFlag + 1] : null;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: Set ANTHROPIC_API_KEY environment variable");
    console.error("Usage: ANTHROPIC_API_KEY=sk-... node scripts/generate.js");
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const configs = selectedCharacter
    ? [CHARACTER_CONFIGS[selectedCharacter]].filter(Boolean)
    : Object.values(CHARACTER_CONFIGS);

  if (configs.length === 0) {
    console.error(`Unknown character: ${selectedCharacter}`);
    console.error(`Available: ${Object.keys(CHARACTER_CONFIGS).join(", ")}`);
    process.exit(1);
  }

  console.log("Labor Rights RPG — Content Generator");
  console.log(`Generating for ${configs.length} character(s)...\n`);
  console.log("NOTE: Each API call may take 1-3 minutes. This is a one-time cost.\n");

  const results = [];

  // Generate sequentially to avoid rate limits
  for (const config of configs) {
    try {
      const result = await generateForCharacter(config);
      results.push(result);
    } catch (err) {
      console.error(`Skipping ${config.id} due to error`);
      results.push({ id: config.id, error: err.message });
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("GENERATION COMPLETE");
  console.log(`${"=".repeat(60)}`);

  let totalNodes = 0;
  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.id}: FAILED — ${r.error}`);
    } else {
      console.log(`  ${r.id}: ${r.nodeCount} nodes, ${r.endingCount} endings${r.brokenLinks ? `, ${r.brokenLinks} broken links` : ""}`);
      totalNodes += r.nodeCount;
    }
  }
  console.log(`\nTotal: ${totalNodes} scenario nodes generated`);
  console.log("Run 'npm run dev' to start the game!\n");
}

main();
