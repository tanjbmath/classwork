const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// Rewards are calculated on a trusted server, never from XP values supplied by the browser.
exports.awardSubmissionXp = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to earn XP.');

  const assignmentId = String(request.data?.assignmentId || '').trim();
  if (!assignmentId || !/^[A-Za-z0-9_-]{1,150}$/.test(assignmentId)) {
    throw new HttpsError('invalid-argument', 'A valid assignment ID is required.');
  }

  const uid = request.auth.uid;
  const submissionRef = db.doc(`users/${uid}/submissions/${assignmentId}`);
  const eventRef = db.doc(`users/${uid}/gamification/events/submission_${assignmentId}`);
  const profileRef = db.doc(`users/${uid}/gamification/profile`);

  return db.runTransaction(async (tx) => {
    const [submissionSnap, eventSnap, profileSnap] = await Promise.all([
      tx.get(submissionRef), tx.get(eventRef), tx.get(profileRef)
    ]);

    if (!submissionSnap.exists || !['submitted', 'completed'].includes(submissionSnap.get('status'))) {
      throw new HttpsError('failed-precondition', 'Submit the assignment before claiming XP.');
    }

    if (eventSnap.exists) {
      return { awarded: false, reason: 'already-awarded', totalXp: Number(profileSnap.get('totalXp') || 0) };
    }

    const currentXp = Number(profileSnap.get('totalXp') || 0);
    const nextXp = currentXp + 20;
    tx.create(eventRef, {
      type: 'first-submission',
      assignmentId,
      xp: 20,
      createdAt: FieldValue.serverTimestamp()
    });
    tx.set(profileRef, {
      totalXp: nextXp,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return { awarded: true, xpAwarded: 20, totalXp: nextXp };
  });
});
