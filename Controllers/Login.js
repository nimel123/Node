const { default: Connection } = require('../Connection/ConnectDb');
const { ObjectId } = require('mongodb');
const citydata = require('./City');
const jwt = require('jsonwebtoken');


const jwtSecretKey = "ramesh@123";

// Add Location API
const AddLocation = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Locations");

    const { city, address, latitude, longitude, range } = req.body;

    if (!city || !address || !latitude || !longitude || !range) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const zone = {
      _id: new ObjectId(),
      address,
      latitude,
      longitude,
      range,
      createdAt: new Date()
    };

    // Try to update an existing city document by pushing new zone
    const result = await collection.updateOne(
      { city },
      { $push: { zones: zone } },
      { upsert: true } // If city doesn't exist, create it
    );

    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      res.status(200).json({
        message: "Zone saved successfully",
        city,
      });
    } else {
      res.status(500).json({ message: "Failed to save the zone" });
    }
  } catch (err) {
    console.error("Error saving location:", err);
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





const DeleteZoneById = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Locations");
     const zoneId = req.params.id; 
    if (!zoneId) {
      return res.status(400).json({ message: "Zone ID missing" });
    }

    const result = await collection.updateOne(
      { "zones._id": new ObjectId(zoneId) },  
      { $pull: { zones: { _id: new ObjectId(zoneId) } } }  
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({ message: "Zone deleted successfully" });
    } else {
      return res.status(404).json({ message: "Zone not found or already deleted" });
    }

  } catch (err) {
    console.error("Error deleting zone:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



// Add Categories (with file upload)
const Categories = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Categories");

    const files = req.files || {};
    const categoryImage = files?.file?.[0]; // Main category image
    const subImages = files?.subImages || []; // Subcategory images

    const { name, description, subcat, city, zones } = req.body;

    // Collect all missing fields
    const missingFields = [];

    if (!categoryImage) missingFields.push("Category image");
    if (!name || name.trim() === "") missingFields.push("Name");
    if (!description || description.trim() === "") missingFields.push("Description");
    if (!subcat || subcat.trim() === "") missingFields.push("Subcat");
    if (!city || city.trim() === "") missingFields.push("City");
    // For zones, check if array or string and if empty
    if (
      !zones ||
      (Array.isArray(zones) && zones.length === 0) ||
      (typeof zones === "string" && zones.trim() === "")
    )
      missingFields.push("Zones");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `The following fields are required and missing: ${missingFields.join(", ")}`,
      });
    }

    // Parse subcategory JSON string
    let parsedSubcat;
    try {
      parsedSubcat = JSON.parse(subcat);
    } catch (err) {
      return res.status(400).json({ message: "Invalid subcat JSON format" });
    }

    // Add image path to each subcategory
    const subcategoriesWithImages = parsedSubcat.map((sub, index) => ({
      ...sub,
      file: `/uploads/${subImages[index]?.filename || ""}`,
    }));

    // Insert the category into the database
    const result = await collection.insertOne({
      name,
      description,
      subcat: subcategoriesWithImages,
      file: `/uploads/${categoryImage.filename}`,
      city,
      zones, // Store zones as is
    });

    if (result.acknowledged) {
      res.status(200).json({
        message: "Category added successfully",
        result,
      });
    }
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).json({ message: "An error occurred while adding category" });
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



const AddCityData = async (req, res) => {
  try {
    const db = await Connection(); // your MongoDB connection function
    const { city, state, fullAddress, latitude, longitude } = req.body;

    const collection = db.collection("AvalibleCity");

    const dataToInsert = {
      city,
      state,
      fullAddress,
      latitude,
      longitude,
      createdAt: new Date()
    };
    const result = await collection.insertOne(dataToInsert);
    res.status(200).json({ message: "City added successfully", result: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding city", error: err.message });
  }
};

const GetAvalibleCityData = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("AvalibleCity");
    const result = await collection.find().toArray();
    if (result) {
      res.status(200).send({
        result: result
      })
    }
    else {
      res.status(400).send('Not')
    }
  }
  catch (err) {
    res.send(err)
  }
}

const DeleteCityData = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("AvalibleCity");
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Id parameter missing" });

    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
    if (result) {
      return res.status(200).json({
        message: "City Deleted Successfully",
      });
    } else {
      return res.status(404).json({ message: 'City not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};



const fetch = require('node-fetch');

const SearchLocation = async (req, res) => {
  const { query } = req.params;

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`, {
      headers: {
        'User-Agent': 'MyApp/1.0 (rnimel5@gmail.com)' // REQUIRED by Nominatim
      },
      timeout: 10000 // optional timeout (10s)
    });

    if (!response.ok) {
      throw new Error('Nominatim response not OK');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching from Nominatim:", error.message);
    res.status(500).json({ message: 'Failed to fetch data from Nominatim' });
  }
};


//Add Main Category

const addMainCategory = async (req, res) => {
  try {
    const { name, description, attribute } = req.body;

    const imageFile = req.file;  // multer ne req.file me image daal di

    if (!name || !description || !imageFile) {
      return res.status(400).json({ message: "Name, description and image are required" });
    }

    const db = await Connection();
    const collection = db.collection("Categories");

    const newCategory = {
      name,
      description,
      image: imageFile.path,
      subcat: [],
      attribute: attribute ? JSON.parse(attribute) : []
    };

    const result = await collection.insertOne(newCategory);

    res.status(201).json({ message: "Main Category added", id: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};




//Add Sub Category
const addSubCategory = async (req, res) => {
  try {
    const { name, description, mainCategoryId, attribute } = req.body;
    const imageFile = req.file;

    if (!name || !description || !imageFile || !mainCategoryId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = await Connection();
    const mainCategoryCollection = db.collection("Categories");

    // Subcategory object
    const newSubCategory = {
      _id: new ObjectId(),
      name,
      description,
      image: imageFile.path,
      subSubCat: [],
      attribute: attribute ? JSON.parse(attribute) : []
    };

    // Main category me subcategory add karni hai
    const result = await mainCategoryCollection.updateOne(
      { _id: new ObjectId(mainCategoryId) },
      { $push: { subcat: newSubCategory } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Main category not found" });
    }

    res.status(201).json({ message: "Sub Category added", subCategoryId: newSubCategory._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


//Add SubSub  Category  

const addSubSubCategory = async (req, res) => {
  try {
    const { subCategoryId, name, description, attribute } = req.body;
    const imageFile = req.file;

    if (!subCategoryId || !name || !description || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = await Connection();
    const collection = db.collection("Categories");

    const newSubSubCat = {
      _id: new ObjectId(),
      name,
      image: imageFile.path,
      description,
      attribute: attribute ? JSON.parse(attribute) : []
    };

    // Update: Find the document where subcat._id = subCategoryId and push to subsubcat
    const result = await collection.updateOne(
      { "subcat._id": new ObjectId(subCategoryId) },
      { $push: { "subcat.$.subsubcat": newSubSubCat } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Sub category not found" });
    }

    res.status(201).json({ message: "Sub-Sub Category added", subSubCategory: newSubSubCat });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getMainCategory = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Categories");
    const data = await collection.find().toArray();
    if (data) {
      res.status(200).send({
        message: "Success",
        result: data
      })
    }
    else {
      res.status(400).send({
        message: 'Something Wrong'
      })
    }
  }
  catch (err) {
    res.status(401).send(err)
  }
}



const PostTax = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Tax");
    const { value } = req.body;
    const result = await collection.insertOne({ value })
    if (result.acknowledged) {
      res.status(200).send({
        result: result
      })
    }
    else {
      res.status(400).send({
        message: 'Something Wrong'
      })
    }
  }
  catch (err) {
    res.send(err)
  }

}


const GetTax = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Tax");
    const result = await collection.find().toArray();
    if (result) {
      res.status(200).send({
        message: 'Success',
        result: result
      })
    }
    else {
      res.status(400).send({
        message: "Something wrong"
      })
    }
  }
  catch (err) {
    res.send(err)
  }
}



const AddVarient = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("attributes");

    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const doc = await collection.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return res.status(404).json({ message: "Attribute not found" });
    }

    // 👇 Correct spelling used: varient
    let varients = doc.varient || [];

    const existingIndex = varients.findIndex(
      (v) => v.name.toLowerCase() === name.toLowerCase()
    );

    if (existingIndex !== -1) {
      varients[existingIndex].name = name;
    } else {
      varients.push({ name, _id: new ObjectId() });
    }

    // 👇 Also use 'varient' when updating
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { varient: varients } }
    );

    res.status(200).json({ message: "Varient updated successfully" });
  } catch (err) {
    console.error("Error updating varient:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  AddLocation,
  GetLocation,
  Categories,
  GetCategories,
  DeleteCategories,
  CityData,
  GetCityData,
  Login,
  VeryfyOtp,
  AddCityData,
  GetAvalibleCityData,
  DeleteCityData,
  SearchLocation,
  addMainCategory,
  addSubCategory,
  addSubSubCategory,
  getMainCategory,
  PostTax,
  GetTax,
  DeleteZoneById,
  AddVarient
};
