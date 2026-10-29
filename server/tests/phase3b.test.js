import express from 'express';
import { z } from 'zod';
import { caseGenerationSchema } from '../src/schemas/caseGenerationSchema.js';
import { createCaseRequestSchema } from '../src/schemas/caseRequestSchemas.js';
import Case from '../src/models/Case.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { generateMysteryCase, GeminiConfigError } from '../src/services/geminiService.js';
import app from '../src/app.js';

let testResults = [];

function recordTest(name, passed, details) {
  testResults.push({ name, passed, details });
  console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${name} ${details ? `(${details})` : ''}`);
}

async function runTestSuite() {
  console.log('\n=============================================');
  console.log('   PHASE 3B COMPREHENSIVE TEST SUITE');
  console.log('=============================================\n');

  // Test 1: Request Schema - Missing or Invalid Difficulty
  try {
    const r1 = createCaseRequestSchema.safeParse({ premise: 'A valid premise', difficulty: 'super-hard' });
    recordTest('Reject invalid difficulty', !r1.success, 'Rejected "super-hard" as expected');
  } catch (e) {
    recordTest('Reject invalid difficulty', false, e.message);
  }

  // Test 2: Request Schema - Excessively long premise (> 300 chars)
  try {
    const longPremise = 'A'.repeat(305);
    const r2 = createCaseRequestSchema.safeParse({ premise: longPremise, difficulty: 'easy' });
    recordTest('Reject excessively long premise (> 300 chars)', !r2.success, 'Rejected 305-char premise');
  } catch (e) {
    recordTest('Reject excessively long premise', false, e.message);
  }

  // Test 3: Request Schema - Valid Easy, Medium, Hard requests
  try {
    const rEasy = createCaseRequestSchema.safeParse({ premise: 'Art theft', difficulty: 'easy' });
    const rMed = createCaseRequestSchema.safeParse({ premise: 'Bank robbery', difficulty: 'medium' });
    const rHard = createCaseRequestSchema.safeParse({ premise: 'Mansion poison', difficulty: 'hard' });
    recordTest('Accept valid request schemas', rEasy.success && rMed.success && rHard.success, 'Easy, Medium, Hard accepted');
  } catch (e) {
    recordTest('Accept valid request schemas', false, e.message);
  }

  // Test 4: AI Output Validation - Easy difficulty exact counts (3 suspects, 5 clues, 2 hints)
  try {
    const mockEasyValid = {
      title: 'The Vault Cipher',
      premise: 'The diamond was stolen from the vault.',
      crimeSceneSummary: 'Broken glass and an open vault door late at night.',
      difficulty: 'easy',
      suspects: [
        { id: 'suspect-1', name: 'Alice Vance', role: 'Lead Curator', bio: 'Longtime staff member at the city museum', alibi: 'Working late in the basement archive', potentialMotive: 'Mounting gambling debts to underground casino' },
        { id: 'suspect-2', name: 'Bob Jenkins', role: 'Security Guard', bio: 'Ex-military officer guarding the main perimeter', alibi: 'Stationed at the lobby reception desk', potentialMotive: 'Disgruntlement over denied promotion' },
        { id: 'suspect-3', name: 'Charlie Wu', role: 'Private Collector', bio: 'Wealthy overseas antiquities dealer', alibi: 'Browsing the Renaissance hall display', potentialMotive: 'Obsession with acquiring the rare medallion' },
      ],
      clues: [
        { id: 'clue-1', title: 'Muddy Boot Print', description: 'Fresh potting soil footprint on marble floor', type: 'physical', locationFound: 'Vault Threshold', relatedSuspectId: 'suspect-1' },
        { id: 'clue-2', title: 'Security Keycard Log', description: 'Access timestamp records entry at 11:42 PM', type: 'digital', locationFound: 'Access Terminal', relatedSuspectId: 'suspect-1' },
        { id: 'clue-3', title: 'Torn Uniform Thread', description: 'Navy blue wool fiber snagged on vault hinge', type: 'forensic', locationFound: 'Safe Hinge', relatedSuspectId: 'suspect-2' },
        { id: 'clue-4', title: 'Witness Testimony', description: 'Janitor heard hurried footsteps towards archives', type: 'testimonial', locationFound: 'Hallway', relatedSuspectId: null },
        { id: 'clue-5', title: 'Bypassed Breaker Switch', description: 'Power circuit manually tripped inside cabinet', type: 'physical', locationFound: 'Electrical Room', relatedSuspectId: null },
      ],
      hints: [
        { id: 'hint-1', order: 1, text: 'Look closely at the timing of the keycard swipe.' },
        { id: 'hint-2', order: 2, text: 'The potting soil matches the basement archives.' },
      ],
      solution: {
        culpritId: 'suspect-1',
        culpritName: 'Alice Vance',
        motive: 'Desperate to liquidate the diamond to satisfy debts.',
        method: 'Used duplicate keycard after staging a blackout.',
        explanation: 'Alice Vance used her access to the basement archives to stage the blackout and sneak into the vault.',
      },
    };
    const easyVal = caseGenerationSchema.safeParse(mockEasyValid);
    recordTest('AI Schema: Easy valid counts (3 suspects, 5 clues, 2 hints)', easyVal.success, '3 suspects, 5 clues, 2 hints validated');
  } catch (e) {
    recordTest('AI Schema: Easy valid counts', false, e.message);
  }

  // Test 5: AI Output Validation - Medium difficulty exact counts (4 suspects, 7 clues, 3 hints)
  try {
    const mockMediumValid = {
      title: 'The Midnight Express Poisoning',
      premise: 'A diplomatic courier is poisoned aboard the express.',
      crimeSceneSummary: 'A half-empty silver flask and spilled tea in compartment B.',
      difficulty: 'medium',
      suspects: [
        { id: 'suspect-1', name: 'S1', role: 'Doctor', bio: 'Physician traveling to Vienna conference', alibi: 'Sleeping in private compartment A', potentialMotive: 'Professional rivalry with victim' },
        { id: 'suspect-2', name: 'S2', role: 'Conductor', bio: 'Veteran railway officer on final run', alibi: 'Inspecting tickets in coach car 3', potentialMotive: 'Blackmailed by an unknown syndicate' },
        { id: 'suspect-3', name: 'S3', role: 'Diplomat', bio: 'Envoy carrying opposing peace treaty', alibi: 'Dining in the observation lounge', potentialMotive: 'Preventing the treaty delivery' },
        { id: 'suspect-4', name: 'S4', role: 'Journalist', bio: 'Investigative reporter tracking courier', alibi: 'Writing dispatch in the dining car', potentialMotive: 'Publishing explosive leak story' },
      ],
      clues: [
        { id: 'clue-1', title: 'C1', description: 'Desc 1 is very detailed', type: 'physical', locationFound: 'Loc 1', relatedSuspectId: 'suspect-1' },
        { id: 'clue-2', title: 'C2', description: 'Desc 2 is very detailed', type: 'forensic', locationFound: 'Loc 2', relatedSuspectId: null },
        { id: 'clue-3', title: 'C3', description: 'Desc 3 is very detailed', type: 'digital', locationFound: 'Loc 3', relatedSuspectId: 'suspect-2' },
        { id: 'clue-4', title: 'C4', description: 'Desc 4 is very detailed', type: 'testimonial', locationFound: 'Loc 4', relatedSuspectId: null },
        { id: 'clue-5', title: 'C5', description: 'Desc 5 is very detailed', type: 'physical', locationFound: 'Loc 5', relatedSuspectId: null },
        { id: 'clue-6', title: 'C6', description: 'Desc 6 is very detailed', type: 'forensic', locationFound: 'Loc 6', relatedSuspectId: 'suspect-3' },
        { id: 'clue-7', title: 'C7', description: 'Desc 7 is very detailed', type: 'testimonial', locationFound: 'Loc 7', relatedSuspectId: null },
      ],
      hints: [
        { id: 'hint-1', order: 1, text: 'Check the chemical residue on the tea cup.' },
        { id: 'hint-2', order: 2, text: 'Compare the conductor ticket punch times.' },
        { id: 'hint-3', order: 3, text: 'The diplomatic seal was broken from outside.' },
      ],
      solution: {
        culpritId: 'suspect-3',
        culpritName: 'S3',
        motive: 'Preventing delivery of opposing peace treaty.',
        method: 'Slipped cyanide into the silver flask in the corridor.',
        explanation: 'S3 slipped the poison into the flask while the courier was in the lounge.',
      },
    };
    const medVal = caseGenerationSchema.safeParse(mockMediumValid);
    recordTest('AI Schema: Medium valid counts (4 suspects, 7 clues, 3 hints)', medVal.success, '4 suspects, 7 clues, 3 hints validated');
  } catch (e) {
    recordTest('AI Schema: Medium valid counts', false, e.message);
  }

  // Test 6: AI Output Validation - Hard difficulty exact counts (5 suspects, 9 clues, 3 hints)
  try {
    const mockHardValid = {
      title: 'The Blackwood Manor Heist',
      premise: 'A priceless sapphire vanishes during the stormy ball.',
      crimeSceneSummary: 'The grand safe stands wide open without any forced lock damage.',
      difficulty: 'hard',
      suspects: [
        { id: 'suspect-1', name: 'S1', role: 'Butler', bio: 'Head of household staff for 20 years', alibi: 'Serving wine in the grand ballroom', potentialMotive: 'Deep debts to loan sharks' },
        { id: 'suspect-2', name: 'S2', role: 'Heir', bio: 'Eldest son disinherited in latest will', alibi: 'Smoking in the private conservatory', potentialMotive: 'Anger over losing inheritance' },
        { id: 'suspect-3', name: 'S3', role: 'Lawyer', bio: 'Family attorney managing estate affairs', alibi: 'Reviewing papers in the library', potentialMotive: 'Embezzlement cover up scheme' },
        { id: 'suspect-4', name: 'S4', role: 'Appraiser', bio: 'Gem expert hired to authenticate jewel', alibi: 'Taking phone call on the terrace', potentialMotive: 'Replaced gem with synthetic replica' },
        { id: 'suspect-5', name: 'S5', role: 'Chauffeur', bio: 'Personal driver with mechanic background', alibi: 'Waiting in the carriage house garage', potentialMotive: 'Bribed by rival syndicate' },
      ],
      clues: [
        { id: 'clue-1', title: 'C1', description: 'Desc 1 is very detailed', type: 'physical', locationFound: 'Loc 1', relatedSuspectId: 'suspect-1' },
        { id: 'clue-2', title: 'C2', description: 'Desc 2 is very detailed', type: 'forensic', locationFound: 'Loc 2', relatedSuspectId: null },
        { id: 'clue-3', title: 'C3', description: 'Desc 3 is very detailed', type: 'digital', locationFound: 'Loc 3', relatedSuspectId: 'suspect-2' },
        { id: 'clue-4', title: 'C4', description: 'Desc 4 is very detailed', type: 'testimonial', locationFound: 'Loc 4', relatedSuspectId: null },
        { id: 'clue-5', title: 'C5', description: 'Desc 5 is very detailed', type: 'physical', locationFound: 'Loc 5', relatedSuspectId: null },
        { id: 'clue-6', title: 'C6', description: 'Desc 6 is very detailed', type: 'forensic', locationFound: 'Loc 6', relatedSuspectId: 'suspect-3' },
        { id: 'clue-7', title: 'C7', description: 'Desc 7 is very detailed', type: 'testimonial', locationFound: 'Loc 7', relatedSuspectId: null },
        { id: 'clue-8', title: 'C8', description: 'Desc 8 is very detailed', type: 'digital', locationFound: 'Loc 8', relatedSuspectId: null },
        { id: 'clue-9', title: 'C9', description: 'Desc 9 is very detailed', type: 'physical', locationFound: 'Loc 9', relatedSuspectId: 'suspect-4' },
      ],
      hints: [
        { id: 'hint-1', order: 1, text: 'Look at the glass cutter residue.' },
        { id: 'hint-2', order: 2, text: 'The safe combination was typed correctly.' },
        { id: 'hint-3', order: 3, text: 'The synthetic gem was already prepared.' },
      ],
      solution: {
        culpritId: 'suspect-4',
        culpritName: 'S4',
        motive: 'Replaced gem with synthetic replica.',
        method: 'Swapped the stones during the appraisal session.',
        explanation: 'S4 had the skill and opportunity to substitute the replica.',
      },
    };
    const hardVal = caseGenerationSchema.safeParse(mockHardValid);
    recordTest('AI Schema: Hard valid counts (5 suspects, 9 clues, 3 hints)', hardVal.success, '5 suspects, 9 clues, 3 hints validated');
  } catch (e) {
    recordTest('AI Schema: Hard valid counts', false, e.message);
  }

  // Test 7: AI Output Validation - Rejects wrong suspect count
  try {
    const mockWrongSuspects = {
      title: 'The Vault Cipher',
      premise: 'The diamond was stolen.',
      crimeSceneSummary: 'Broken glass and an open vault door.',
      difficulty: 'easy',
      suspects: [
        { id: 'suspect-1', name: 'Alice', role: 'Curator', bio: 'Longtime staff', alibi: 'Office', potentialMotive: 'Debt' },
        { id: 'suspect-2', name: 'Bob', role: 'Guard', bio: 'Ex-military', alibi: 'Lobby', potentialMotive: 'Revenge' },
      ], // Only 2 suspects instead of 3
      clues: [
        { id: 'clue-1', title: 'C1', description: 'Desc 1', type: 'physical', locationFound: 'Loc 1' },
        { id: 'clue-2', title: 'C2', description: 'Desc 2', type: 'forensic', locationFound: 'Loc 2' },
        { id: 'clue-3', title: 'C3', description: 'Desc 3', type: 'digital', locationFound: 'Loc 3' },
        { id: 'clue-4', title: 'C4', description: 'Desc 4', type: 'testimonial', locationFound: 'Loc 4' },
        { id: 'clue-5', title: 'C5', description: 'Desc 5', type: 'physical', locationFound: 'Loc 5' },
      ],
      hints: [
        { id: 'hint-1', order: 1, text: 'Hint 1' },
        { id: 'hint-2', order: 2, text: 'Hint 2' },
      ],
      solution: {
        culpritId: 'suspect-1',
        culpritName: 'Alice',
        motive: 'Debt',
        method: 'Method',
        explanation: 'Explanation',
      },
    };
    const resWrong = caseGenerationSchema.safeParse(mockWrongSuspects);
    recordTest('AI Schema: Rejects invalid suspect count', !resWrong.success, 'Correctly rejected 2 suspects for Easy');
  } catch (e) {
    recordTest('AI Schema: Rejects invalid suspect count', false, e.message);
  }

  // Test 8: AI Output Validation - Rejects culprit not in suspects list
  try {
    const mockInvalidCulprit = {
      title: 'The Vault Cipher',
      premise: 'The diamond was stolen.',
      crimeSceneSummary: 'Broken glass and an open vault door.',
      difficulty: 'easy',
      suspects: [
        { id: 'suspect-1', name: 'Alice Vance', role: 'Curator', bio: 'Longtime staff at museum', alibi: 'Office working late', potentialMotive: 'Debt' },
        { id: 'suspect-2', name: 'Bob Jenkins', role: 'Guard', bio: 'Ex-military security officer', alibi: 'Lobby checking cameras', potentialMotive: 'Revenge' },
        { id: 'suspect-3', name: 'Charlie Wu', role: 'Visitor', bio: 'Art collector from overseas', alibi: 'Gallery viewing paintings', potentialMotive: 'Greed' },
      ],
      clues: [
        { id: 'clue-1', title: 'C1', description: 'Desc 1 is very detailed', type: 'physical', locationFound: 'Loc 1' },
        { id: 'clue-2', title: 'C2', description: 'Desc 2 is very detailed', type: 'forensic', locationFound: 'Loc 2' },
        { id: 'clue-3', title: 'C3', description: 'Desc 3 is very detailed', type: 'digital', locationFound: 'Loc 3' },
        { id: 'clue-4', title: 'C4', description: 'Desc 4 is very detailed', type: 'testimonial', locationFound: 'Loc 4' },
        { id: 'clue-5', title: 'C5', description: 'Desc 5 is very detailed', type: 'physical', locationFound: 'Loc 5' },
      ],
      hints: [
        { id: 'hint-1', order: 1, text: 'Look at the broken glass carefully' },
        { id: 'hint-2', order: 2, text: 'Check the digital log entries' },
      ],
      solution: {
        culpritId: 'suspect-99', // Non-existent suspect
        culpritName: 'Ghost',
        motive: 'Motive',
        method: 'Method',
        explanation: 'Explanation',
      },
    };
    const resCulprit = caseGenerationSchema.safeParse(mockInvalidCulprit);
    recordTest('AI Schema: Rejects culprit not in suspects', !resCulprit.success, 'Correctly flagged suspect-99 mismatch');
  } catch (e) {
    recordTest('AI Schema: Rejects culprit not in suspects', false, e.message);
  }

  // Test 9: Secret Concealment - toClientJSON() conceals culprit and solution
  try {
    const testDoc = new Case({
      title: 'Secret Protection Test',
      premise: 'A confidential crime.',
      crimeSceneSummary: 'Evidence everywhere.',
      difficulty: 'easy',
      status: 'in_progress',
      suspects: [
        { id: 'suspect-1', name: 'Alice', role: 'Curator', bio: 'Staff member', alibi: 'Office room', potentialMotive: 'Debt' },
        { id: 'suspect-2', name: 'Bob', role: 'Guard', bio: 'Staff member', alibi: 'Gate entrance', potentialMotive: 'Anger' },
        { id: 'suspect-3', name: 'Charlie', role: 'Guest', bio: 'Visitor guest', alibi: 'Lobby area', potentialMotive: 'Greed' },
      ],
      clues: [
        { id: 'clue-1', title: 'Mud', description: 'SECRET DESCRIPTION', type: 'physical', locationFound: 'Foyer', relatedSuspectId: 'suspect-1' },
      ],
      hints: [
        { id: 'hint-1', order: 1, text: 'SECRET HINT 1' },
        { id: 'hint-2', order: 2, text: 'SECRET HINT 2' },
      ],
      solution: {
        culpritId: 'suspect-1',
        culpritName: 'Alice',
        motive: 'Debt',
        method: 'Keycard clone',
        explanation: 'Alice did it using the keycard.',
      },
      discoveredClueIds: [],
      revealedHintIds: [],
    });

    const clientView = testDoc.toClientJSON();
    const solutionLeaked = 'solution' in clientView || clientView.solution !== undefined;
    const culpritLeaked = clientView.clues[0].relatedSuspectId !== undefined;
    const descriptionLeaked = clientView.clues[0].description !== undefined;
    const hintsLeaked = clientView.revealedHints && clientView.revealedHints.length > 0;

    recordTest(
      'Solution & Clues Concealment on In-Progress Case',
      !solutionLeaked && !culpritLeaked && !descriptionLeaked && !hintsLeaked,
      'Solution, culprit, clue description, and locked hints safely hidden'
    );
  } catch (e) {
    recordTest('Solution & Clues Concealment on In-Progress Case', false, e.message);
  }

  // Test 10: Missing Gemini API key handles safely
  try {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      await generateMysteryCase({ premise: 'Test', difficulty: 'easy', allowFallback: false });
      recordTest('Missing Gemini API key throws GeminiConfigError', false, 'Should have thrown error');
    } catch (err) {
      recordTest(
        'Missing Gemini API key throws GeminiConfigError',
        err instanceof GeminiConfigError || err.name === 'GeminiConfigError',
        `Caught expected error: ${err.message}`
      );
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  } catch (e) {
    recordTest('Missing Gemini API key handling', false, e.message);
  }

  // Test 11: Database Connection and Case Persistence in MongoDB Atlas
  try {
    console.log('\nConnecting to MongoDB Atlas for persistence test...');
    await connectDB();

    const sampleCase = new Case({
      title: 'Atlas Persistence Verification Case',
      premise: 'Testing persistence in MongoDB Atlas directly.',
      crimeSceneSummary: 'The ledger has been verified.',
      difficulty: 'easy',
      status: 'in_progress',
      suspects: [
        { id: 'suspect-1', name: 'S1', role: 'R1', bio: 'Bio 10 chars long', alibi: 'Alibi 10 chars', potentialMotive: 'Motive' },
        { id: 'suspect-2', name: 'S2', role: 'R2', bio: 'Bio 10 chars long', alibi: 'Alibi 10 chars', potentialMotive: 'Motive' },
        { id: 'suspect-3', name: 'S3', role: 'R3', bio: 'Bio 10 chars long', alibi: 'Alibi 10 chars', potentialMotive: 'Motive' },
      ],
      clues: [
        { id: 'clue-1', title: 'C1', description: 'Desc 10 chars long', type: 'physical', locationFound: 'L1' },
        { id: 'clue-2', title: 'C2', description: 'Desc 10 chars long', type: 'digital', locationFound: 'L2' },
        { id: 'clue-3', title: 'C3', description: 'Desc 10 chars long', type: 'testimonial', locationFound: 'L3' },
        { id: 'clue-4', title: 'C4', description: 'Desc 10 chars long', type: 'forensic', locationFound: 'L4' },
        { id: 'clue-5', title: 'C5', description: 'Desc 10 chars long', type: 'physical', locationFound: 'L5' },
      ],
      hints: [
        { id: 'hint-1', order: 1, text: 'Hint text 10 chars' },
        { id: 'hint-2', order: 2, text: 'Hint text 10 chars' },
      ],
      solution: {
        culpritId: 'suspect-1',
        culpritName: 'S1',
        motive: 'Motive 10 chars',
        method: 'Method 10 chars',
        explanation: 'Detailed explanation exceeding 20 chars.',
      },
    });

    const saved = await sampleCase.save();
    recordTest('Save Case to MongoDB Atlas', Boolean(saved._id), `Persisted with _id: ${saved._id}`);

    const retrieved = await Case.findById(saved._id);
    recordTest('Retrieve Case from MongoDB Atlas', retrieved && retrieved.title === sampleCase.title, 'Found document matching saved ID');

    // Clean up test document
    await Case.findByIdAndDelete(saved._id);
    console.log('Cleaned up test document from MongoDB Atlas.');

    await disconnectDB();
  } catch (e) {
    recordTest('MongoDB Atlas Persistence', false, e.message);
  }

  console.log('\n=============================================');
  console.log(`TEST RESULTS: ${testResults.filter(r => r.passed).length}/${testResults.length} PASSED`);
  console.log('=============================================\n');

  if (testResults.some((r) => !r.passed)) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
