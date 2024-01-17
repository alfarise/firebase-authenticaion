const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const { initializeApp: clientApp } = require('firebase/app');
const { initializeApp: adminApp, cert } = require('firebase-admin/app');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const notFoundRouter = require('./routes/notFound');

const app = express();

const {
  NODE_ENV,
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_BUCKET_STORAGE,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} = process.env;

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_BUCKET_STORAGE,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

const firebaseAdminAccount = require('./firebase-admin-key.json');

try {
  clientApp(firebaseConfig);
  adminApp({
    credential: cert(firebaseAdminAccount),
  });
} catch (error) {
  console.log(error);
}

app.use(logger(
  NODE_ENV === 'production' ? 'common' : 'dev',
));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/v1/auth', authRouter);
app.use('/*', notFoundRouter);

module.exports = app;
