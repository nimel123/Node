const { default: Connection } = require('../Connection/ConnectDb');
const { ObjectId } = require('mongodb');
const citydata = require('./City');
const jwt = require('jsonwebtoken');


const jwtSecretKey = "ramesh@123";

// Utility: Get location name from Google Maps API
const getLocationName = async (lat, lng) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;  // Make sure to set this in .env
    if (!apiKey) throw new Error("Google Maps API key not set in environment");

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching location name:", error.message);
    return null;
  }
};


// Add Location API
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
      res.status(200).json({
        message: "Success",
        address: result.insertedId
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Get Location API
const GetLocation = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Locations");
    const result = await collection.find().toArray();
    if (result.length > 0) {
      return res.status(200).json({
        result: result
      });
    } else {
      return res.status(404).json({ message: 'No Locations found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Location Delete API
const Delete = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Locations");
    const id = req.params.id;  // Correct extraction of id
    if (!id) return res.status(400).json({ message: "Id parameter missing" });

    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
    if (result.value) {
      return res.status(200).json({
        message: "Location Deleted Successfully",
        id: id
      });
    } else {
      return res.status(404).json({ message: 'Location not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Add Categories (with file upload)
const Categories = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('Categories');

    const files = req.files || {};
    const categoryImage = files?.file?.[0]; // Main category image
    const subImages = files?.subImages || []; // Subcategory images

    if (!categoryImage) {
      return res.status(400).json({ message: 'Category image is required' });
    }

    const { name, description, subcat, city, zones } = req.body;

    if (!name || !description || !subcat) {
      return res.status(400).json({ message: 'Name, description and subcat are required' });
    }

    // Parse subcategory JSON string
    let parsedSubcat;
    try {
      parsedSubcat = JSON.parse(subcat);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid subcat JSON format' });
    }

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
      res.status(200).json({
        message: "Category added successfully",
        result
      });
    }
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ message: 'An error occurred while adding category' });
  }
};


// Get Categories
const GetCategories = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('Categories');
    const result = await collection.find().toArray();
    if (result.length > 0) {
      res.status(200).json({
        message: "Categories fetched successfully",
        result: result
      });
    } else {
      res.status(404).json({ message: 'No categories available' });
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({
      message: 'An error occurred while fetching categories',
      error: err.message
    });
  }
};


// Delete Categories API
const DeleteCategories = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Categories");
    const id = req.params.id;  // Correct extraction of id
    if (!id) return res.status(400).json({ message: "Id parameter missing" });

    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
    if (result.value) {
      return res.status(200).json({
        message: "Category Deleted Successfully",
        id: id
      });
    } else {
      return res.status(404).json({ message: 'Category not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// City API - Insert bulk city data
const CityData = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('CityData');
    const result = await collection.insertMany(citydata);
    if (result.acknowledged) {
      res.status(200).json(result);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Get City Data API
const GetCityData = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('CityData');
    const result = await collection.find().toArray();
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: 'No City Data found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// LOGIN API
const Login = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('Login');
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone is required' });
    }

    const result = await collection.findOne({ phone });
    if (result) {
      const token = jwt.sign({
        data: result._id,
      }, jwtSecretKey, { expiresIn: '3h' });

      res.status(200).json({
        data: result,
        message: 'Login Success',
        auth: token
      });
    } else {
      res.status(400).json({
        message: "Please Enter Valid details"
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Verify OTP API
const VeryfyOtp = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('Login');
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP required' });
    }
    const checkOtp = await collection.findOne({ otp: otp });
    if (checkOtp) {
      res.status(200).json({
        message: "Otp Verified Successfully",
        otp: checkOtp.otp
      });
    } else {
      res.status(400).json({ message: 'Wrong OTP' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Live Location Tracker API
const LocationTracker = async (req, res) => {
  try {
    const db = await Connection();
    const { userId, latitude, longitude } = req.body;

    if (!userId || latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Get location name from Google API
    const locationName = await getLocationName(latitude, longitude);

    await db.collection("Live-Location").updateOne(
      { userId: userId },
      {
        $set: {
          latitude,
          longitude,
          locationName,   // <-- save human-readable location name here
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.status(200).json({ success: true, message: "Location saved", locationName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


module.exports = {
  AddLocation,
  GetLocation,
  Delete,
  Categories,
  GetCategories,
  DeleteCategories,
  CityData,
  GetCityData,
  Login,
  VeryfyOtp,
  LocationTracker,
};
