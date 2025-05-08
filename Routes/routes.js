const express = require('express');
const Controll=require('../Controllers/Login')
const router = express.Router();

router.post('/addLocation',Controll.AddLocation)
router.get('/getlocations',Controll.GetLocation)
router.delete('/deletezone/:id',Controll.DELETE)
module.exports = router;
