const express = require('express');

const router = express.Router();

const {
  getAuth: clientGetAuth,
  signInWithEmailAndPassword,
  setPersistence,
  inMemoryPersistence,
} = require('firebase/auth');

const { getAuth: adminGetAuth } = require('firebase-admin/auth');

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
    res.status(500)
      .json({
        status: 'error',
        message: error.message,
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
