import express from 'express';
import { connectDB, disconnectDB } from '../src/config/db.js';
import app from '../src/app.js';
import Case from '../src/models/Case.js';

let testResults = [];

function recordTest(name, passed, details) {
  testResults.push({ name, passed, details });
  console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${name} ${details ? `(${details})` : ''}`);
}

async function runGameplayTests() {
  console.log('\n=============================================');
  console.log('   PHASE 3C GAMEPLAY ENDPOINTS TEST SUITE');
  console.log('=============================================\n');

  await connectDB();
  const PORT = 5003;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}/api/cases`;

  let createdCaseId = null;
  let testCulpritId = null;
  let innocentSuspectId = null;

  try {
    // 1. Create a new Easy Case
    const createRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        premise: 'The ruby necklace was taken from the dressing room during the opera.',
        difficulty: 'easy',
      }),
    });
    const createData = await createRes.json();
    createdCaseId = createData.data?._id;

    recordTest(
      'Case Creation (POST /api/cases)',
      createRes.status === 201 && Boolean(createdCaseId),
      `Created Case ID: ${createdCaseId}`
    );

    // Verify secret fields are absent from creation response
    const secretLeakedOnCreate =
      createData.data.solution !== undefined ||
      createData.data.clues[0].description !== undefined ||
      createData.data.clues[0].relatedSuspectId !== undefined;
    recordTest(
      'Solution Concealment on Creation',
      !secretLeakedOnCreate,
      'Solution and unexamined clue secrets omitted from response'
    );

    // Retrieve underlying case from MongoDB to inspect actual culprit for testing
    const rawCaseInDb = await Case.findById(createdCaseId);
    testCulpritId = rawCaseInDb.solution.culpritId;
    innocentSuspectId = rawCaseInDb.suspects.find((s) => s.id !== testCulpritId).id;

    // 2. Retrieve In-Progress Case (GET /api/cases/:id)
    const getRes = await fetch(`${BASE_URL}/${createdCaseId}`);
    const getData = await getRes.json();
    recordTest(
      'Retrieve Case (GET /api/cases/:id)',
      getRes.status === 200 && getData.data.status === 'in_progress',
      'Retrieved case with status in_progress'
    );

    // 3. Discover Clue 1 (POST /api/cases/:id/clues/clue-1/discover)
    const d1Res = await fetch(`${BASE_URL}/${createdCaseId}/clues/clue-1/discover`, {
      method: 'POST',
    });
    const d1Data = await d1Res.json();
    recordTest(
      'Discover Clue 1',
      d1Res.status === 200 && d1Data.data.discoveredClue.isDiscovered === true && d1Data.data.totalDiscovered === 1,
      'Clue 1 marked discovered with full description revealed'
    );

    // 4. Duplicate Discovery Idempotency Test (clue-1 again)
    const dupRes = await fetch(`${BASE_URL}/${createdCaseId}/clues/clue-1/discover`, {
      method: 'POST',
    });
    const dupData = await dupRes.json();
    recordTest(
      'Duplicate Clue Discovery is Idempotent',
      dupRes.status === 200 && dupData.data.totalDiscovered === 1,
      'Points and discovered count not duplicated'
    );

    // 5. Discover Non-Existent Clue (clue-99)
    const badClueRes = await fetch(`${BASE_URL}/${createdCaseId}/clues/clue-99/discover`, {
      method: 'POST',
    });
    recordTest(
      'Reject Nonexistent Clue Discovery',
      badClueRes.status === 404,
      'Returns 404 for nonexistent clue'
    );

    // 6. Discover Clue 2
    await fetch(`${BASE_URL}/${createdCaseId}/clues/clue-2/discover`, { method: 'POST' });

    // 7. Request Hint 1 (POST /api/cases/:id/hints)
    const h1Res = await fetch(`${BASE_URL}/${createdCaseId}/hints`, { method: 'POST' });
    const h1Data = await h1Res.json();
    recordTest(
      'Request Hint 1',
      h1Res.status === 200 && h1Data.data.hintsUsedCount === 1,
      `Hint 1 revealed: "${h1Data.data.newHint.text.slice(0, 30)}..."`
    );

    // 8. Request Hint 2 (Easy max is 2)
    const h2Res = await fetch(`${BASE_URL}/${createdCaseId}/hints`, { method: 'POST' });
    const h2Data = await h2Res.json();
    recordTest(
      'Request Hint 2 (Reaching Limit)',
      h2Res.status === 200 && h2Data.data.hintsUsedCount === 2,
      'Hint 2 revealed (2/2 hints used)'
    );

    // 9. Request Hint 3 on Easy (Must be rejected with 400)
    const h3Res = await fetch(`${BASE_URL}/${createdCaseId}/hints`, { method: 'POST' });
    recordTest(
      'Reject Hint Beyond Difficulty Limit',
      h3Res.status === 400,
      'Returns 400: Maximum hints reached for this difficulty level'
    );

    // 10. Attempt GET /result while in_progress (Must be rejected with 400)
    const prematureResultRes = await fetch(`${BASE_URL}/${createdCaseId}/result`);
    recordTest(
      'Reject Result Query While In Progress',
      prematureResultRes.status === 400,
      'Returns 400: Results sealed until accusation rendered'
    );

    // 11. Submit Incorrect Accusation on a separate case to test score calculation & loss
    const caseFail = new Case({
      title: 'Scoring Test Case',
      premise: 'Test premise',
      crimeSceneSummary: 'Test crime summary with over twenty characters.',
      difficulty: 'easy',
      status: 'in_progress',
      suspects: [
        { id: 'suspect-1', name: 'Culprit', role: 'Role', bio: 'Bio 10 chars', alibi: 'Alibi 10 chars', potentialMotive: 'Motive' },
        { id: 'suspect-2', name: 'Innocent', role: 'Role', bio: 'Bio 10 chars', alibi: 'Alibi 10 chars', potentialMotive: 'Motive' },
        { id: 'suspect-3', name: 'Innocent2', role: 'Role', bio: 'Bio 10 chars', alibi: 'Alibi 10 chars', potentialMotive: 'Motive' },
      ],
      clues: [
        { id: 'clue-1', title: 'C1', description: 'Desc 10 chars', type: 'physical', locationFound: 'L1' },
      ],
      hints: [
        { id: 'hint-1', order: 1, text: 'Hint 10 chars' },
        { id: 'hint-2', order: 2, text: 'Hint 10 chars' },
      ],
      solution: {
        culpritId: 'suspect-1',
        culpritName: 'Culprit',
        motive: 'Motive 10 chars',
        method: 'Method 10 chars',
        explanation: 'Detailed explanation exceeding twenty characters.',
      },
      discoveredClueIds: ['clue-1'], // 1 clue = +5
      revealedHintIds: ['hint-1', 'hint-2'], // 2 hints = -20
    });
    await caseFail.save();

    // Accuse incorrect suspect: bonus = 0, clues = +5, hints = -20 -> 5 - 20 = -15 -> max(0, -15) = 0
    const failAccuseRes = await fetch(`${BASE_URL}/${caseFail._id}/accuse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspectId: 'suspect-2', rationale: 'I guessed wrong' }),
    });
    const failAccuseData = await failAccuseRes.json();
    recordTest(
      'Incorrect Accusation & Score Minimum Zero',
      failAccuseRes.status === 200 &&
        failAccuseData.data.verdict.isCorrect === false &&
        failAccuseData.data.score.total === 0,
      'Verdict isCorrect: false, score: 0 (floored from negative)'
    );

    // 12. Submit Correct Accusation on original case (createdCaseId)
    // Discovered 2 clues (+10), used 2 hints (-20), Easy bonus (+100) -> 100 + 10 - 20 = 90
    const correctAccuseRes = await fetch(`${BASE_URL}/${createdCaseId}/accuse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suspectId: testCulpritId,
        rationale: 'The clues definitively connected to their tools.',
      }),
    });
    const correctAccuseData = await correctAccuseRes.json();
    recordTest(
      'Correct Accusation & Score Calculation',
      correctAccuseRes.status === 200 &&
        correctAccuseData.data.verdict.isCorrect === true &&
        correctAccuseData.data.score.total === 90 &&
        correctAccuseData.data.solution !== undefined,
      'Score calculated to exactly 90 (100 bonus + 10 clues - 20 hints); solution revealed'
    );

    // 13. Re-Accusation Lock: Attempting to accuse again on sealed case
    const reAccuseRes = await fetch(`${BASE_URL}/${createdCaseId}/accuse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspectId: testCulpritId }),
    });
    recordTest(
      'Single Accusation Lock (Re-Accusation Rejected)',
      reAccuseRes.status === 400,
      'Returns 400: Case has already been closed. Re-accusation is prohibited.'
    );

    // 14. Action Lock: Attempting clue discovery on closed case
    const postCloseClueRes = await fetch(`${BASE_URL}/${createdCaseId}/clues/clue-3/discover`, {
      method: 'POST',
    });
    recordTest(
      'Reject Clue Discovery on Closed Case',
      postCloseClueRes.status === 400,
      'Returns 400: Case has already been closed'
    );

    // 15. Action Lock: Attempting hint request on closed case
    const postCloseHintRes = await fetch(`${BASE_URL}/${createdCaseId}/hints`, {
      method: 'POST',
    });
    recordTest(
      'Reject Hint Request on Closed Case',
      postCloseHintRes.status === 400,
      'Returns 400: Case has already been closed'
    );

    // 16. Results Endpoint on Closed Case (GET /api/cases/:id/result)
    const resultRes = await fetch(`${BASE_URL}/${createdCaseId}/result`);
    const resultData = await resultRes.json();
    recordTest(
      'Retrieve Final Result for Closed Case',
      resultRes.status === 200 &&
        resultData.data.isCorrect === true &&
        resultData.data.score.total === 90 &&
        Boolean(resultData.data.solution.explanation),
      'Returns full debrief, culprit identity, explanation, and itemized score'
    );

    // Clean up test documents
    await Case.findByIdAndDelete(createdCaseId);
    await Case.findByIdAndDelete(caseFail._id);
  } finally {
    server.close();
    await disconnectDB();
  }

  console.log('\n=============================================');
  console.log(`TEST RESULTS: ${testResults.filter((r) => r.passed).length}/${testResults.length} PASSED`);
  console.log('=============================================\n');

  if (testResults.some((r) => !r.passed)) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runGameplayTests();

