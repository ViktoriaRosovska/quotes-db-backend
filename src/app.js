const express = require('express');
const app = express();
const jsonMiddleware = require('./middlewares/jsonMiddleware');
const corsMiddleware = require('./middlewares/corsMiddleware');
const quotesRouter = require('./routes/quotesRouter');
const categoriesRouter = require('./routes/categoriesRouter');
const errorMiddleware = require('./middlewares/errorMiddleware');

app.use(corsMiddleware);
// How to return response status 500 to client?

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Content-Type");
//   next();
// });
app.use(jsonMiddleware);

app.use('/quotes', quotesRouter);
app.use('/categories', categoriesRouter);

app.use(errorMiddleware);

module.exports = app;
