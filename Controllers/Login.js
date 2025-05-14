const { default: Connection } = require('../Connection/ConnectDb');
const { ObjectId, Collection } = require('mongodb')
const citydata = require('./City');
const jwt = require('jsonwebtoken');
let jwtSecretKey = "ramesh@123";


//Add-Location API
const AddLocation = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Locations");
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ message: 'Address Required' });
    }
    const result = await collection.insertOne({ address });
    if (result.acknowledged) {
      res.status(200).send({
        message: "Success",
        address: result
      })
    }
  }
  catch (err) {
    res.send('Error')
  }
}



//GetLocation-API
const GetLocation = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Locations");
    const result = await collection.find().toArray();
    if (result) {
      return res.status(200).send({
        result: result
      })
    }
    else {
      return res.status(400).json({ message: 'Location not find' });
    }
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


//LOcation Delete API
const Delete = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Locations");
    const id = req.params;
    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
    if (result) {
      return res.status(200).json({
        message: "Zone Deleted Successfully",
        result: {
          id: id,
        }
      })
    }
    else {
      return res.status(400).json({ message: 'Zone not found' });
    }
  }
  catch (err) {
    res.send(err)
  }
}


// Add Categories (with file upload)
const Categories = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('Categories');

    const files = req.files;
    const categoryImage = files?.file?.[0]; // Main category image
    const subImages = files?.subImages || []; // Subcategory images

    if (!categoryImage) {
      return res.status(400).json({ message: 'Category image is required' });
    }

    const { name, description, subcat, city, zones } = req.body;

    // Parse subcategory JSON string
    const parsedSubcat = JSON.parse(subcat);

    // Add image to each subcategory
    const subcategoriesWithImages = parsedSubcat.map((sub, index) => ({
      ...sub,
      file: `/uploads/${subImages[index]?.filename || ''}`
    }));

    // Check if city and zones are provided
    if (!city || !zones || zones.length === 0) {
      return res.status(400).json({ message: 'City and Zones are required' });
    }

    // Insert the category into the database
    const result = await collection.insertOne({
      name,
      description,
      subcat: subcategoriesWithImages,
      file: `/uploads/${categoryImage.filename}`,
      city,
      zones // Store the zones array as it is
    });

    if (result.acknowledged) {
      res.status(200).send({
        message: "Category added successfully",
        result
      });
    }
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).send({ message: 'An error occurred while adding category' });
  }
};


// Get Categories
const GetCategories = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('Categories');
    const result = await collection.find().toArray();
    if (result.length > 0) {
      res.status(200).send({
        message: "Categories fetched successfully",
        result: result
      });
    } else {
      res.status(404).send({ message: 'No categories available' });
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).send({
      message: 'An error occurred while fetching categories',
      error: err.message
    });
  }
};



//Delete Categories API
const DeleteCategories = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Categories");
    const id = req.params;
    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
    if (result) {
      return res.status(200).json({
        message: "Categories Deleted Successfully",
        result: {
          id: id,
        }
      })
    }
    else {
      return res.status(400).json({ message: 'Not found' });
    }
  }
  catch (err) {
    res.send(err)
  }
}


//City API
const CityData = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('CityData');
    const result = await collection.insertMany(citydata);
    if (result.acknowledged) {
      res.send(result);
    }
  }
  catch (err) {
    res.send(err)
  }
}

//GetCityData

const GetCityData = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('CityData');
    const result = await collection.find().toArray();
    if (result) {
      res.send(result);
    }
  }
  catch (err) {
    res.send(err)
  }
}



//LOGIN API

const Login = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('Login');
    const { phone } = req.body;
    const result = await collection.findOne({ phone });
    if (result) {
      const token = jwt.sign({
        data: result,
      }, jwtSecretKey, { expiresIn: '3h' }
      )
      res.status(200).send({
        data: result,
        message: 'Login Success',
        auth: token
      })
    }
    else {
      res.status(400).send({
        message: "'Plaease Enter Valid details'"
      })
    }
  }
  catch (err) {
    res.send(err)
  }

}

const VeryfyOtp=async(req,res)=>{
  const db = await Connection();
    const collection = db.collection('Login');
    const { otp } = req.body;
    const checkOtp=await collection.findOne({otp:otp})
    if(checkOtp){
      res.status(200).send({
        message:"Otp Verified Successfully",
        otp:checkOtp.otp
      })
    }
    else{
      res.status(400).send('Wrong OTP')
    }
}


module.exports = {
  AddLocation, GetLocation, Delete, Categories,
  GetCategories, DeleteCategories, CityData, GetCityData,
  Login,VeryfyOtp
}

