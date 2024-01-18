const express = require('express');

const router = express.Router();

const {
  getAuth: clientGetAuth,
  signInWithEmailAndPassword,
  setPersistence,
  inMemoryPersistence,
} = require('firebase/auth');

const { getAuth: adminGetAuth } = require('firebase-admin/auth');
const { FirebaseError } = require('firebase/app');

router.post('/login', async (req, res) => {
  const {
    email,
    password,
  } = req.body;

  const clientAuth = clientGetAuth();
  const adminAuth = adminGetAuth();

  try {
    await setPersistence(clientAuth, inMemoryPersistence);
    await signInWithEmailAndPassword(clientAuth, email, password);

    const idToken = await clientAuth.currentUser.getIdToken();
    await clientAuth.signOut();

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const options = { maxAge: expiresIn, httpOnly: true, secure: true };

    res.status(200)
      .cookie('session', sessionCookie, options)
      .json({
        status: 'success',
        message: 'Login Success',
      })
      .end();
  } catch (error) {
    let statusCode = 500;
    let errorCode = '';
    let message = '';

    if (error instanceof FirebaseError) {
      statusCode = 400;
      errorCode = error.code;

      switch (errorCode) {
        case 'auth/missing-email':
          message = 'Email Empty';
          break;
        case 'auth/missing-password':
          message = 'Password Empty';
          break;
        case 'auth/invalid-credential':
          message = 'Email or Password Wrong';
          break;
        default:
          message = `Error Code: (${errorCode})`;
      }
    }

    res.status(statusCode)
      .json({
        status: 'error',
        message: message || error.message,
      })
      .end();
  }
});

router.post('/verify', async (req, res) => {
  const sessionCookie = req.cookies.session || '';
  const adminAuth = adminGetAuth();

  try {
    if (sessionCookie === '') throw Error('Session Invalid');

    await adminAuth.verifySessionCookie(sessionCookie, true);

    res.status(200)
      .json({
        status: 'success',
        valid: true,
      })
      .end();
  } catch (error) {
    res.status(401)
      .json({
        status: 'error',
        valid: false,
      })
      .end();
  }
});

router.post('/logout', async (req, res) => {
  const sessionCookie = req.cookies.session || '';
  const adminAuth = adminGetAuth();

  try {
    if (sessionCookie === '') throw Error('Session Invalid');

    const { sub } = await adminAuth.verifySessionCookie(sessionCookie);
    await adminAuth.revokeRefreshTokens(sub);

    res.status(200)
      .json({
        status: 'success',
        message: 'Logout Success',
      })
      .end();
  } catch (error) {
    res.status(500)
      .json({
        status: 'error',
        message: error.message,
      })
      .end();
  }
});

module.exports = router;
