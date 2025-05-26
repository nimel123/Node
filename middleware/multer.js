const multer = require('multer');
const{CloudinaryStorage} = require('multer-storage-cloudinary');
const cloudinary=require('../config/cloudinary')

const storage = new CloudinaryStorage({
    cloudinary,
    params:{
        folder:"goru-Gallery",
        allowed_formats:['jpg','png','jpeg','svg','gif','webp','avif']
    }
})

const upload1 = multer({storage});

module.exports = upload1.fields([
  { name: "categoryImage", maxCount: 1 },
   { name: "image", maxCount: 4 },
  { name: "subImages", maxCount: 10 }
])