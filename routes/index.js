const express = require('express');

const router = express.Router();

router.get('/', (_, res) => {
  res.status(200)
    .json({
      status: 'success',
      message: 'Service Running',
    })
    .end();
});

module.exports = router;
