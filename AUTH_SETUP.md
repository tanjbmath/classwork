# Student sign-in and work history setup

This branch adds Google sign-in and a student history dashboard to the existing single-page Classwork app.

## Firebase setup required before testing

1. In Firebase Console, open **Authentication → Sign-in method** and enable **Google**.
2. Under **Authentication → Settings → Authorized domains**, ensure the deployed GitHub Pages domain and any custom domain are listed.
3. Publish `firestore.rules` in **Firestore Database → Rules**. Review the rules for your intended class and teacher workflow before using real student data.
4. In Firestore, create/update `users/<your Firebase Auth UID>` and set `role: "teacher"` for each trusted teacher. Assign this role manually in the console; never let a user assign their own role.
5. Confirm your assignment documents include `teacherId` matching that teacher's Firebase UID. Existing assignment documents without this field will not be writable by the teacher under these rules.
6. Host and test the feature branch separately from production before merging.

## Data behavior

- New sign-ins use Google Authentication and a stable Firebase UID.
- New work is stored under `assignments/<assignmentId>/students/<uid>/slides/<slideId>`.
- A history index is written under `users/<uid>/submissions/<assignmentId>`.
- Legacy timestamp-ID student records are intentionally left untouched and are not automatically attributed to a Google account.
- The current canvas image is still stored as a data URL in Firestore. Moving large drawings to Cloud Storage is a follow-up improvement.

## Smoke-test checklist

- [ ] Sign in with Google; refresh the page and confirm the session persists.
- [ ] Join a test assignment and draw on slide 1 and slide 2.
- [ ] Wait for the save confirmation / check Firestore, then sign out and sign back in.
- [ ] Open **Student Portal → My Past Work → Reopen work** and verify both slides restore.
- [ ] Sign in with a second test account and confirm the first account's history is not visible or readable.
- [ ] Verify an unprivileged account cannot create assignments or access teacher-only work.
- [ ] Verify a teacher with a manually assigned role can create assignments and inspect student work.

Automated browser integration tests have not been run by this repository edit. Complete this checklist in a Firebase test project before production use.
