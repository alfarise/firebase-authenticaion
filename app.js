const express = require('express');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const notFoundRouter = require('./routes/notFound');

const app = express();

const {
  NODE_ENV,
} = process.env;

app.use(logger(
  NODE_ENV === 'production' ? 'common' : 'dev'
));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/*', notFoundRouter);

module.exports = app;
