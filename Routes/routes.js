const express = require('express')
const Controll=require('../Controllers/Login')
const multer=require('multer')
const router = express.Router();


router.post('/addLocation',Controll.AddLocation)
router.get('/getlocations',Controll.GetLocation)
router.delete('/deletezone/:id',Controll.Delete)

// Storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './upload'); // Save files in 'upload' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Unique file names
  }
});

const upload = multer({ storage: storage });
router.post(
  '/addcategories',
  upload.fields([
    { name: 'file', maxCount: 1 },         
    { name: 'subImages' },                 
  ]),
  Controll.Categories
);
router.get('/getCategories', Controll.GetCategories);
router.delete('/delete/:id',Controll.DeleteCategories)
router.delete('/deleteCity/:id',Controll.DeleteCityData)
router.get('/addcitydata',Controll.CityData)
router.post('/login',Controll.Login)
router.post('/otp',Controll.VeryfyOtp)
router.post('/addcitydata',Controll.AddCityData)
router.get('/getcitydata',Controll.GetAvalibleCityData)
router.get('/api/search-location', Controll.SearchLocation);


//Category Add

router.post('/addMainCategory', upload.single('image'), Controll.addMainCategory);
router.post('/addSubCategory', upload.single('image'), Controll.addSubCategory);
router.post('/addSubSubCategory', upload.single('image'), Controll.addSubSubCategory);

//Category Get

router.get('/getMainCategory',Controll.getMainCategory);
router.post('/postTax',Controll.PostTax)
router.get('/getTax',Controll.GetTax)



module.exports = router;
