const express = require('express')
const Controll=require('../Controllers/Login')
const multer=require('multer')
const router = express.Router();


router.post('/addLocation',Controll.AddLocation)
router.get('/getlocations',Controll.GetLocation)
router.delete('/deletezone/:id',Controll.Delete)

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './upload'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); 
  }
});

const upload = multer({ storage: storage });

// Routes
router.post('/addcategories', upload.single('file'), Controll.Categories);
router.get('/getCategories', Controll.GetCategories);
router.delete('/delete/:id',Controll.DeleteCategories)

module.exports = router;
