const express = require('express')
const Controll=require('../Controllers/Login')
const multer=require('multer')
const router = express.Router();
const upload1=require('../middleware/multer');



router.post('/addLocation',Controll.AddLocation)
router.get('/getlocations',Controll.GetLocation)
router.delete('/deletezone/:id',Controll.DeleteZoneById)


// Storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './upload'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); 
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
router.get('/getsubcat/:categoryId',Controll.GetSubCategories);
router.get('/getsubsubcat/:subcatId',Controll.GetSubSubCategories);

router.delete('/delete/:id',Controll.DeleteCategories)
router.delete('/delete-subcategory/:id', Controll.DeleteSubCategory);
router.delete('/deletesubsubcat/:id', Controll.DeleteSubSubCategory);


router.delete('/deleteCity/:id',Controll.DeleteCityData)
router.get('/addcitydata',Controll.CityData)
router.post('/login',Controll.Login)
router.post('/otp',Controll.VeryfyOtp)
router.post('/addcitydata',Controll.AddCityData)
router.get('/getcitydata',Controll.GetAvalibleCityData)
router.get('/api/search-location', Controll.SearchLocation);


//Category Add

router.post('/addMainCategory',upload1, Controll.addMainCategory);
router.post('/addSubCategory', upload1, Controll.addSubCategory);
router.post('/addSubSubCategory', upload1, Controll.addSubSubCategory);

//Category Get

router.get('/getMainCategory',Controll.getMainCategory);
router.post('/postTax',Controll.PostTax)
router.get('/getTax',Controll.GetTax)
router.put('/addvarient/:id',Controll.AddVarient)
router.delete('/deleteVarient/:id',Controll.DeleteVarient)
router.delete('/deleteBrand/:id',Controll.BrandDelete)
router.put('/brandEdit/:id',Controll.BrandEdit)
router.put('/edit-category/:id',upload1,Controll.EditCategory)
router.put('/editsubsub/:id',upload1,Controll.EditSubSubCategory)
router.put('/update-attribute/:id',Controll.UpdateAttribute)
router.delete('/bannerdelete/:id',Controll.BannerDelete)
router.get('/getAllproducts',Controll.GetAllProducts)
router.delete('/deleteTax/:id',Controll.handleDelteTax)
router.put('/edit-tax/:id',Controll.EditTax)




module.exports = router;
