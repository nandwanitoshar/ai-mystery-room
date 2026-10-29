import { GoogleGenAI } from '@google/genai';
import { caseGenerationSchema } from '../schemas/caseGenerationSchema.js';

const DEFAULT_PREMISES = [
  'A priceless antique clock vanishes from the study during the reading of a tycoon’s will.',
  'An experimental cyber-security drive is stolen from a top-secret tech summit in Berlin.',
  'The museum curator is found locked in the vault, and the ancient Venetian medallion is missing.',
  'During a private dinner party in an isolated mountain lodge, the host’s diamond ring disappears.',
];

/**
 * Curated procedural fallback cases ensuring 100% playability when external AI quota is exhausted.
 */
function generateProceduralFallbackCase(premise, difficulty) {
  const cleanPremise =
    premise && premise.trim().length >= 5
      ? premise.trim()
      : 'A high-stakes crime has taken place behind locked doors.';

  if (difficulty === 'easy') {
    return {
      title: 'The Stolen Renaissance Cameo',
      premise: cleanPremise,
      crimeSceneSummary:
        'A shattered glass display case in the private salon. Rain streaks the french doors, and a single velvet ribbon lies by the hearth.',
      difficulty: 'easy',
      suspects: [
        {
          id: 'suspect-1',
          name: 'Vincent Drake',
          role: 'Private Appraiser',
          bio: 'A distinguished art historian whose recent auction house failed with massive debt.',
          alibi: 'Claims he was in the conservatory cataloging the oil paintings until midnight.',
          potentialMotive: 'Desperate to liquidate the cameo to settle pressing debts with European collectors.',
        },
        {
          id: 'suspect-2',
          name: 'Clara Sterling',
          role: 'Estate Archivist',
          bio: 'Meticulous curator of the estate who has spent ten years organizing the family archives.',
          alibi: 'Insists she was upstairs cataloging historical letters in the east library wing.',
          potentialMotive: 'Believed the cameo rightfully belonged to a public cultural institution.',
        },
        {
          id: 'suspect-3',
          name: 'Roland Hayes',
          role: 'Head of Estate Security',
          bio: 'Former detective hired to oversee the updated biometric security system.',
          alibi: 'Claims he was patrolling the perimeter gates during the scheduled electrical test.',
          potentialMotive: 'Possessed the bypass overrides and knowledge of the surveillance blind spots.',
        },
      ],
      clues: [
        {
          id: 'clue-1',
          title: 'Fine Glass Cutter Score Mark',
          description: 'A circular diamond score mark on the display glass indicating professional tools, not a brute smash.',
          type: 'physical',
          locationFound: 'Main Display Pedestal',
          relatedSuspectId: 'suspect-1',
        },
        {
          id: 'clue-2',
          title: 'Conservatory French Door Latch',
          description: 'The latch was unlocked from the inside, with wet garden soil tracked toward the salon.',
          type: 'physical',
          locationFound: 'Conservatory Entrance',
          relatedSuspectId: 'suspect-1',
        },
        {
          id: 'clue-3',
          title: 'Library Computer Search History',
          description: 'Search records showing inquiries regarding maritime customs laws and Swiss banking.',
          type: 'digital',
          locationFound: 'Archivist Workstation',
          relatedSuspectId: 'suspect-2',
        },
        {
          id: 'clue-4',
          title: 'Security Control Log',
          description: 'System log recording camera feeds in the salon were paused manually for precisely four minutes at 11:45 PM.',
          type: 'digital',
          locationFound: 'Security Substation',
          relatedSuspectId: 'suspect-3',
        },
        {
          id: 'clue-5',
          title: 'Smear of Jeweler’s Rouge',
          description: 'Traces of red abrasive paste used exclusively for gemstone appraisal found on a velvet curtain.',
          type: 'forensic',
          locationFound: 'Salon Window Drape',
          relatedSuspectId: 'suspect-1',
        },
      ],
      hints: [
        {
          id: 'hint-1',
          order: 1,
          text: 'Notice that the glass was precision-cut with an expert tool rather than broken by force.',
        },
        {
          id: 'hint-2',
          order: 2,
          text: 'Jeweler’s rouge is a specialized polishing compound unique to certified appraisers.',
        },
      ],
      solution: {
        culpritId: 'suspect-1',
        culpritName: 'Vincent Drake',
        motive: 'Vincent Drake was facing financial ruin and needed the priceless cameo to pay off underground debts.',
        method: 'He used an appraisal diamond cutter to remove the case glass, using the electrical test as cover.',
        explanation:
          'Vincent Drake claimed to be in the conservatory, but garden soil and specialized jeweler’s rouge tied him directly to the salon pedestal. The diamond scoring confirmed professional appraiser equipment.',
      },
    };
  }

  if (difficulty === 'hard') {
    return {
      title: 'The Blackwood Cipher Conspiracy',
      premise: cleanPremise,
      crimeSceneSummary:
        'The fortified vault stands ajar with no biometric alarm triggered. A puddle of molten wax and an encrypted terminal are left behind.',
      difficulty: 'hard',
      suspects: [
        {
          id: 'suspect-1',
          name: 'Dr. Gregory Vance',
          role: 'Chief Cryptographer',
          bio: 'Architect of the quantum encryption protocols securing the corporate safe.',
          alibi: 'Claims he was running algorithmic simulations in the sub-basement server farm.',
          potentialMotive: 'Faced impending termination and sought to sell proprietary ciphers overseas.',
        },
        {
          id: 'suspect-2',
          name: 'Evelyn Cross',
          role: 'Executive Director',
          bio: 'Ambitious board member maneuvering to force a hostile buyout of the conglomerate.',
          alibi: 'Attending a corporate banquet in the penthouse dining room until 1:00 AM.',
          potentialMotive: 'The disappearance of the ledger exposes financial irregularities of her rivals.',
        },
        {
          id: 'suspect-3',
          name: 'Marcus Brody',
          role: 'Hardware Engineer',
          bio: 'Specialist responsible for the physical biometric sensors and magnetic door seals.',
          alibi: 'Calibrating backup generators in the utility wing during the power fluctuation.',
          potentialMotive: 'Deep personal resentment after his patent rights were acquired by the firm.',
        },
        {
          id: 'suspect-4',
          name: 'Sonia Chen',
          role: 'Senior Compliance Auditor',
          bio: 'Independent auditor reviewing internal transactions for international regulators.',
          alibi: 'Reviewing physical trade invoices in the third-floor conference suite.',
          potentialMotive: 'Blackmailed by an external syndicate threatening her family.',
        },
        {
          id: 'suspect-5',
          name: 'Arthur Pendelton',
          role: 'Facilities Custodian',
          bio: 'Thirty-year veteran of the facility with unrestricted physical master keys.',
          alibi: 'Refilling chemical sanitizers in the second-floor maintenance closet.',
          potentialMotive: 'Approaching retirement with inadequate pension provisions.',
        },
      ],
      clues: [
        {
          id: 'clue-1',
          title: 'Custom Logic Analyzer Probe',
          description: 'A microscopic probe soldered directly onto the magnetic lock sensor bus.',
          type: 'digital',
          locationFound: 'Vault Door Panel',
          relatedSuspectId: 'suspect-3',
        },
        {
          id: 'clue-2',
          title: 'Burned Optical Fiber Sheath',
          description: 'High-temperature thermal degradation on the optical bypass relay.',
          type: 'physical',
          locationFound: 'Sub-ceiling Cable Tray',
          relatedSuspectId: 'suspect-3',
        },
        {
          id: 'clue-3',
          title: 'Encrypted USB Key Left in Terminal',
          description: 'A hardware token containing an automated key-exchange script.',
          type: 'digital',
          locationFound: 'Vault Control Console',
          relatedSuspectId: 'suspect-1',
        },
        {
          id: 'clue-4',
          title: 'Discarded Solder Wick',
          description: 'Copper desoldering braid soaked with lead-free rosin flux.',
          type: 'physical',
          locationFound: 'Air Return Grate',
          relatedSuspectId: 'suspect-3',
        },
        {
          id: 'clue-5',
          title: 'Synthetic Glove Residue',
          description: 'Conductive carbon-fiber glove imprint on the lock enclosure.',
          type: 'forensic',
          locationFound: 'Security Interface',
          relatedSuspectId: 'suspect-3',
        },
        {
          id: 'clue-6',
          title: 'Banquet Guest Sign-In Sheet',
          description: 'Timestamp confirming Evelyn Cross was on stage giving a keynote at 11:30 PM.',
          type: 'testimonial',
          locationFound: 'Penthouse Reception',
          relatedSuspectId: 'suspect-2',
        },
        {
          id: 'clue-7',
          title: 'Server Access Timestamp',
          description: 'Logs proving Dr. Vance’s credentials performed remote calculations from the server room.',
          type: 'digital',
          locationFound: 'Mainframe Log',
          relatedSuspectId: 'suspect-1',
        },
        {
          id: 'clue-8',
          title: 'Conference Room Door Swipe',
          description: 'Electronic audit trail proving Sonia Chen remained locked in the conference suite all evening.',
          type: 'digital',
          locationFound: 'Third Floor Access',
          relatedSuspectId: 'suspect-4',
        },
        {
          id: 'clue-9',
          title: 'Flux Residue on Tool Belt',
          description: 'Matching rosin chemical composition identified on Marcus Brody’s precision multimeter.',
          type: 'forensic',
          locationFound: 'Utility Locker 4',
          relatedSuspectId: 'suspect-3',
        },
      ],
      hints: [
        {
          id: 'hint-1',
          order: 1,
          text: 'The vault was bypassed at the hardware level rather than decrypted through software.',
        },
        {
          id: 'hint-2',
          order: 2,
          text: 'Notice the presence of copper solder braid and flux near the physical relay.',
        },
        {
          id: 'hint-3',
          order: 3,
          text: 'Only an engineer with access to the physical multimeter and soldering gear could bridge the magnetic lock.',
        },
      ],
      solution: {
        culpritId: 'suspect-3',
        culpritName: 'Marcus Brody',
        motive: 'Marcus Brody wanted retribution against the company for profiting off his biometric lock patents.',
        method: 'He physically spliced a logic probe into the sensor bus, spoofing an authenticated biometric state.',
        explanation:
          'While Dr. Vance was suspected due to the terminal scripts, server logs confirmed he was physically in the server room. The copper solder wick and flux residue matched Marcus Brody’s tool belt, proving he physically bridged the lock.',
      },
    };
  }

  // Medium (Default)
  return {
    title: 'The Midnight Express Poisoning',
    premise: cleanPremise,
    crimeSceneSummary:
      'A private passenger carriage stalled in an alpine snowstorm. The courier is slumped over a mahogany tea table with a shattered pocket watch.',
    difficulty: 'medium',
    suspects: [
      {
        id: 'suspect-1',
        name: 'Dr. Alistair Thorne',
        role: 'Traveling Toxicologist',
        bio: 'An eccentric researcher en route to a medical symposium in Zurich.',
        alibi: 'Claims he was resting in passenger carriage A reading scientific journals.',
        potentialMotive: 'The courier carried documentation that could revoke Thorne’s medical license.',
      },
      {
        id: 'suspect-2',
        name: 'Elena Rostova',
        role: 'Diplomatic Envoy',
        bio: 'A high-ranking diplomat traveling under diplomatic immunity with sensitive dossiers.',
        alibi: 'States she was having dinner in the dining car with the train conductor.',
        potentialMotive: 'The courier was transporting confidential diplomatic memos opposing her party.',
      },
      {
        id: 'suspect-3',
        name: 'Hugo Mercer',
        role: 'Train Steward',
        bio: 'A veteran attendant with access to all compartments and passenger catering supplies.',
        alibi: 'Claims he was preparing coffee in the galley service kitchen down the hall.',
        potentialMotive: 'Owed large gambling sums to a syndicate bribing him to intercept the pouch.',
      },
      {
        id: 'suspect-4',
        name: 'Julian Croft',
        role: 'Antiquities Dealer',
        bio: 'A quiet businessman seated in the adjoining sleeper compartment.',
        alibi: 'Claims he was asleep throughout the duration of the blizzard stop.',
        potentialMotive: 'Attempting to reclaim a stolen Byzantine artifact carried by the courier.',
      },
    ],
    clues: [
      {
        id: 'clue-1',
        title: 'Silver Tea Urn Smudge',
        description: 'A faint powdery residue containing bitter almond scent on the tea dispenser spout.',
        type: 'forensic',
        locationFound: 'Galley Service Counter',
        relatedSuspectId: 'suspect-3',
      },
      {
        id: 'clue-2',
        title: 'Adjoining Compartment Keycard',
        description: 'A cloned electronic keycard found slipped beneath the hallway carpet runner.',
        type: 'digital',
        locationFound: 'Corridor Runner',
        relatedSuspectId: 'suspect-3',
      },
      {
        id: 'clue-3',
        title: 'Medical Journal Annotation',
        description: 'Margin notes discussing acute cardiac arrest symptoms induced by prussic acid.',
        type: 'physical',
        locationFound: 'Carriage A Berth',
        relatedSuspectId: 'suspect-1',
      },
      {
        id: 'clue-4',
        title: 'Conductor Dining Receipt',
        description: 'Handwritten receipt confirming Elena Rostova was dining from 10:15 PM to 11:30 PM.',
        type: 'testimonial',
        locationFound: 'Dining Car Register',
        relatedSuspectId: 'suspect-2',
      },
      {
        id: 'clue-5',
        title: 'Sleeper Partition Vent Latch',
        description: 'The partition vent between Julian Croft’s compartment and the victim was latched securely from inside.',
        type: 'physical',
        locationFound: 'Compartment Wall Vent',
        relatedSuspectId: 'suspect-4',
      },
      {
        id: 'clue-6',
        title: 'Steward’s Apron Pocket Stain',
        description: 'Chemical trace of crushed peach pit extract identified on the corner of Hugo’s linen apron.',
        type: 'forensic',
        locationFound: 'Steward Locker',
        relatedSuspectId: 'suspect-3',
      },
      {
        id: 'clue-7',
        title: 'Unpunched Service Ticket',
        description: 'A service ticket proving Hugo Mercer entered the victim’s compartment at 10:45 PM under the guise of delivering tea.',
        type: 'physical',
        locationFound: 'Tea Service Tray',
        relatedSuspectId: 'suspect-3',
      },
    ],
    hints: [
      {
        id: 'hint-1',
        order: 1,
        text: 'The poison was delivered via the hot beverage service rather than an aerosol or physical struggle.',
      },
      {
        id: 'hint-2',
        order: 2,
        text: 'Review the steward’s linen apron and galley tea dispenser.',
      },
      {
        id: 'hint-3',
        order: 3,
        text: 'Hugo Mercer had exclusive access to the tea service and unpunched compartment tickets.',
      },
    ],
    solution: {
      culpritId: 'suspect-3',
      culpritName: 'Hugo Mercer',
      motive: 'Hugo Mercer was bribed with a massive sum by an underground syndicate to assassinate the courier.',
      method: 'He introduced cyanide into the courier’s private tea urn during the late evening service delivery.',
      explanation:
        'While Dr. Thorne possessed toxicological knowledge, his notes were academic. Elena Rostova had an airtight dining alibi, and Croft’s partition was locked. Chemical traces on Hugo Mercer’s apron and his unpunched service ticket conclusively prove he poisoned the tea.',
    },
  };
}

/**
 * Custom error classes for fine-grained error responses
 */
export class GeminiConfigError extends Error {
  constructor(message = 'Gemini API key is not configured in backend environment.') {
    super(message);
    this.name = 'GeminiConfigError';
    this.statusCode = 503;
  }
}

export class GeminiGenerationError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = 'GeminiGenerationError';
    this.statusCode = statusCode;
  }
}

/**
 * Builds the structured system instruction and prompt for mystery synthesis
 */
function buildMysteryPrompt(premise, difficulty) {
  const rules = {
    easy: {
      suspects: 3,
      clues: 5,
      hints: 2,
      suspectIds: 'suspect-1, suspect-2, suspect-3',
      clueIds: 'clue-1, clue-2, clue-3, clue-4, clue-5',
      hintIds: 'hint-1, hint-2',
    },
    medium: {
      suspects: 4,
      clues: 7,
      hints: 3,
      suspectIds: 'suspect-1, suspect-2, suspect-3, suspect-4',
      clueIds: 'clue-1 through clue-7',
      hintIds: 'hint-1, hint-2, hint-3',
    },
    hard: {
      suspects: 5,
      clues: 9,
      hints: 3,
      suspectIds: 'suspect-1 through suspect-5',
      clueIds: 'clue-1 through clue-9',
      hintIds: 'hint-1, hint-2, hint-3',
    },
  }[difficulty];

  return `You are the Lead Narrative Architect for the AI Mystery Room game.
Craft a complete, original, fair-play detective mystery investigation case based on the provided premise.

PREMISE: "${premise}"
DIFFICULTY LEVEL: "${difficulty}"

STRICT STRUCTURAL REQUIREMENTS FOR "${difficulty.toUpperCase()}":
1. Suspects: Exactly ${rules.suspects} suspects with IDs: ${rules.suspectIds}.
   - Each suspect must have: id, name, role, bio (personality/background), alibi, potentialMotive.
2. Clues: Exactly ${rules.clues} clues with IDs: ${rules.clueIds}.
   - Each clue must have: id, title, description, type (one of: "physical", "testimonial", "forensic", "digital"), locationFound, relatedSuspectId (optional suspect ID or null).
3. Hints: Exactly ${rules.hints} progressive hints with IDs: ${rules.hintIds}.
   - Hint 1: Subtle observation pointing out an inconsistency.
   - Hint 2: Points towards physical or digital evidence connection.
   ${rules.hints === 3 ? '- Hint 3: Clarifies the key contradiction that unmasks the culprit without giving away the answer directly.' : ''}
4. Solution:
   - culpritId: Must be EXACTLY ONE of the generated suspect IDs (e.g., "suspect-2").
   - culpritName: Full name of the culprit.
   - motive: Clear explanation of why they committed the crime.
   - method: How they executed the crime, including how they bypassed security or staged alibis.
   - explanation: A coherent step-by-step deduction explaining how the clues logically prove their guilt while exonerating the innocent suspects.

FAIR-PLAY LOGICAL INTEGRITY:
- The crime must be solvable through logical deduction from the clues.
- Every clue must be truthful (even if circumstantial).
- Innocent suspects must have credible alibis corroborated by other evidence.
- The culprit's alibi must contain a subtle flaw exposed by at least one clue.

OUTPUT FORMAT:
Return pure JSON matching this exact structure with NO markdown fences, NO preamble, and NO trailing text:
{
  "title": "Case Title",
  "premise": "${premise}",
  "crimeSceneSummary": "Atmospheric description of the crime scene and situation.",
  "difficulty": "${difficulty}",
  "suspects": [ ... ],
  "clues": [ ... ],
  "hints": [ ... ],
  "solution": {
    "culpritId": "suspect-X",
    "culpritName": "...",
    "motive": "...",
    "method": "...",
    "explanation": "..."
  }
}`;
}

/**
 * Strips markdown code block wrappers (e.g. ```json ... ```) if returned by the LLM
 */
function extractJSON(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Core mystery generation service with AI attempt and seamless procedural fallback.
 * Guarantees zero downtime and 100% gameplay readiness regardless of external API quota status.
 */
export async function generateMysteryCase({ premise, difficulty = 'medium', allowFallback = true }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    if (!allowFallback) {
      throw new GeminiConfigError('GEMINI_API_KEY is not configured in backend environment.');
    }
  }

  const effectivePremise =
    premise && premise.trim().length >= 5
      ? premise.trim()
      : DEFAULT_PREMISES[Math.floor(Math.random() * DEFAULT_PREMISES.length)];

  // If Gemini API Key is present, attempt live AI synthesis
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
    const configuredModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildMysteryPrompt(effectivePremise, difficulty);

    try {
      console.log(`[Gemini Service] Attempting live AI generation with model: ${configuredModel}...`);
      const generatePromise = ai.models.generateContent({
        model: configuredModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after 2500ms waiting for ${configuredModel}`)), 2500)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const rawText = response.text;
      if (rawText) {
        const parsed = JSON.parse(extractJSON(rawText));
        const validation = caseGenerationSchema.safeParse(parsed);
        if (validation.success) {
          console.log(`[Gemini Service] Successfully generated mystery "${validation.data.title}" via live Gemini AI (${configuredModel})`);
          return {
            caseData: validation.data,
            source: 'gemini_ai',
            modelUsed: configuredModel,
          };
        }
      }
    } catch (err) {
      console.warn(`[Gemini Service] Live AI attempt with ${configuredModel} failed (${err.message}). Transitioning to procedural engine...`);
    }
  }

  // Graceful Fallback: Generate curated procedural mystery conforming 100% to schema
  console.log(`[Gemini Service] Generating procedural mystery dossier for difficulty: ${difficulty} (Source: procedural_engine)...`);
  const rawFallback = generateProceduralFallbackCase(effectivePremise, difficulty);
  const validatedFallback = caseGenerationSchema.parse(rawFallback);

  return {
    caseData: validatedFallback,
    source: 'procedural_engine',
    modelUsed: 'procedural_fallback_v1',
  };
}

export default {
  generateMysteryCase,
  GeminiConfigError,
  GeminiGenerationError,
};
