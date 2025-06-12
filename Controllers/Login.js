const { default: Connection } = require('../Connection/ConnectDb');
const { ObjectId, } = require('mongodb');
const citydata = require('./City');
const jwt = require('jsonwebtoken');


const jwtSecretKey = "ramesh@123";

// Add Location API
const AddLocation = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Locations");

    const { city, address, zoneTitle, latitude, longitude, range } = req.body;

    if (!city || !address || !latitude || !longitude || !range || !zoneTitle) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const zone = {
      _id: new ObjectId(),
      address,
      zoneTitle,
      latitude,
      longitude,
      range,
      status: true,
      cashOnDelivery: false,
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
    const categoryImage = files?.file?.[0];
    const subImages = files?.subImages || [];

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
    if (result) {
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
      }, jwtSecretKey, );

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
    const db = await Connection();
    const { city, state, fullAddress, latitude, longitude } = req.body;

    const collection = db.collection("AvalibleCity");

    const dataToInsert = {
      city,
      state,
      fullAddress,
      latitude,
      longitude,
      status: true,
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
    const { name, description, attribute, filter } = req.body;

    const image = req.files.image?.[0].path;

    if (!name || !description || !image) {
      console.log(name, image, description);

      return res.status(400).json({ message: "Name, description and image are required" });
    }

    const db = await Connection();
    const collection = db.collection("Categories");

    const newCategory = {
      name,
      description,
      image,
      subcat: [],
      status: true,
      attribute: attribute ? JSON.parse(attribute) : [],
      filter: filter ? JSON.parse(filter) : []
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
    const { name, description, mainCategoryId, attribute, filter } = req.body;
    const image = req.files.image?.[0].path;

    if (!name || !description || !image || !mainCategoryId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = await Connection();
    const mainCategoryCollection = db.collection("Categories");

    // Subcategory object
    const newSubCategory = {
      _id: new ObjectId(),
      name,
      description,
      image,
      status: true,
      subSubCat: [],
      attribute: attribute ? JSON.parse(attribute) : [],
      filter: filter ? JSON.parse(filter) : []
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
    const { subCategoryId, name, description, attribute, filter } = req.body;
    const image = req.files.image?.[0].path;

    if (!subCategoryId || !name || !description || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = await Connection();
    const collection = db.collection("Categories");

    const newSubSubCat = {
      _id: new ObjectId(),
      name,
      image,
      description,
      status: true,
      attribute: attribute ? JSON.parse(attribute) : [],
      filter: filter ? JSON.parse(filter) : []
    };


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


    let varients = doc.varient || [];

    const existingIndex = varients.findIndex(
      (v) => v.name.toLowerCase() === name.toLowerCase()
    );

    if (existingIndex !== -1) {
      varients[existingIndex].name = name;
    } else {
      varients.push({ name, _id: new ObjectId() });
    }

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




const DeleteVarient = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("attributes");

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid variant ID format" });
    }

    const variantObjectId = new ObjectId(id);

    // First, check if the variant exists inside any attribute
    const attributeWithVariant = await collection.findOne({ "varient._id": variantObjectId });

    if (!attributeWithVariant) {
      return res.status(404).json({ message: "Variant not found in any attribute" });
    }

 
    const result = await collection.findOneAndUpdate(
      { _id: attributeWithVariant._id },
      { $pull: { varient: { _id: variantObjectId } } },
      { returnDocument: "after" }
    );

    if (result) {
      res.status(200).json({
        message: "Variant deleted successfully",
        updatedAttribute: result.value,
      });
    } else {
      res.status(500).json({ message: "Failed to retrieve updated attribute after deletion" });
    }
  } catch (err) {
    console.error("Error deleting variant:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};


const BrandDelete = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('brands');
    const id = req.params.id;
    if (!id) {
      return res.status(400).send({
        message: "Please Enter Brand Id in Param"
      })
    }
    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
    if (result) {
      res.status(200).send({
        message: "Brand Deleted Successfully",
      })
    }
    else {
      res.status(500).send({
        message: "Something Wrong"
      })
    }
  }
  catch (err) {
    res.send(err)
  }
}

const BrandEdit = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('brands');
    const id = req.params.id;
    const { brandName, description } = req.body;
    const file = req.file;
    if (!id) {
      return res.status(501).send({
        message: "Invalid Id"
      })
    }
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          brandName: brandName,
          brandLogo: file,
          description: description,
        },
      },
      { returnDocument: 'after' }
    )
    if (result) {
      res.status(200).send({
        message: "Updated Success",
        result: result
      })
    }
  }
  catch (err) {
    res.send(err);
  }
}



const EditMainCategory = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Categories");
    const id = req.params.id;
    const { name, description } = req.body;
    const image = req.files?.image?.[0]?.path;
    if (!id) {
      return res.status(401).send({
        message: "Please Check ID"
      })
    }

    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).send({ message: "Category not found" });
    }

    const updateFields = {
      name: name || existing.name,
      description: description || existing.description,
      image: image || existing.image,
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
    );

    if (result) {
      res.status(200).send(
        { message: "Success", result: result }
      )
    }
  }
  catch (err) {
    res.send(err)
  }
}

const EditCategory = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Categories");

    const subcatId = req.params.id;
    const { name, description } = req.body;
    const image = req.files?.image?.[0]?.path;

    // Step 1: Find parent category by subcat._id
    const parentCategory = await collection.findOne({
      "subcat._id": new ObjectId(subcatId)
    });

    if (!parentCategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    // Prepare the update object
    const updateFields = {
      "subcat.$.name": name,
      "subcat.$.description": description
    };

    // Only update image if a new image is uploaded
    if (image) {
      updateFields["subcat.$.image"] = image;
    }

    // Step 2: Update the subcategory
    const result = await collection.updateOne(
      {
        _id: parentCategory._id,
        "subcat._id": new ObjectId(subcatId)
      },
      {
        $set: updateFields
      }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "Subcategory updated successfully" });
    } else {
      res.status(400).json({ error: "No changes were made" });
    }
  } catch (err) {
    console.error("EditSubCategory Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


const EditSubSubCategory = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Categories");

    const subsubcatId = req.params.id;
    const { name, description } = req.body;
    const image = req.files?.image?.[0]?.path;

    // Step 1: Find the parent category and subcat containing the subsubcat
    const category = await collection.findOne({
      "subcat.subsubcat._id": new ObjectId(subsubcatId)
    });

    if (!category) {
      return res.status(404).json({ error: "Sub-subcategory not found" });
    }

    // Step 2: Find subcat index that contains the subsubcat
    const subcatIndex = category.subcat.findIndex(sc =>
      Array.isArray(sc.subsubcat) &&
      sc.subsubcat.some(ssc => ssc._id.toString() === subsubcatId)
    );

    if (subcatIndex === -1) {
      return res.status(404).json({ error: "Sub-subcategory not found in subcat" });
    }

    // Step 3: Find subsubcat index inside the subcat
    const subsubcatIndex = category.subcat[subcatIndex].subsubcat.findIndex(
      ssc => ssc._id.toString() === subsubcatId
    );

    if (subsubcatIndex === -1) {
      return res.status(404).json({ error: "Sub-subcategory not found" });
    }

    // Step 4: Build update path
    const updateFields = {
      [`subcat.${subcatIndex}.subsubcat.${subsubcatIndex}.name`]: name,
      [`subcat.${subcatIndex}.subsubcat.${subsubcatIndex}.description`]: description
    };

    if (image) {
      updateFields[`subcat.${subcatIndex}.subsubcat.${subsubcatIndex}.image`] = image;
    }

    // Step 5: Update document
    const result = await collection.updateOne(
      { _id: category._id },
      { $set: updateFields }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "Sub-subcategory updated successfully" });
    } else {
      res.status(400).json({ error: "No changes were made" });
    }

  } catch (err) {
    console.error("EditSubSubCategory Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};



const DeleteSubCategory = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Categories");

    const subcatId = req.params.id;

    // Step 1: Find parent category containing this subcategory
    const parentCategory = await collection.findOne({
      "subcat._id": new ObjectId(subcatId)
    });

    if (!parentCategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    // Step 2: Pull the subcategory from subcat array
    const result = await collection.updateOne(
      { _id: parentCategory._id },
      {
        $pull: {
          subcat: { _id: new ObjectId(subcatId) }
        }
      }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "Subcategory deleted successfully" });
    } else {
      res.status(400).json({ error: "Failed to delete subcategory" });
    }
  } catch (error) {
    console.error("DeleteSubCategory Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



const DeleteSubSubCategory = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Categories");

    const subsubcatId = req.params.id;

    // Step 1: Find the category containing the subsubcat
    const category = await collection.findOne({
      "subcat.subsubcat._id": new ObjectId(subsubcatId)
    });

    if (!category) {
      return res.status(404).json({ error: "Sub-subcategory not found" });
    }

    // Step 2: Find the index of subcat containing this subsubcat
    const subcatIndex = category.subcat.findIndex(sc =>
      Array.isArray(sc.subsubcat) &&
      sc.subsubcat.some(ssc => ssc._id.toString() === subsubcatId)
    );

    if (subcatIndex === -1) {
      return res.status(404).json({ error: "Subcategory not found for sub-subcategory" });
    }

    // Step 3: Pull subsubcat from subcat.subsubcat array
    const result = await collection.updateOne(
      { _id: category._id },
      {
        $pull: {
          [`subcat.${subcatIndex}.subsubcat`]: { _id: new ObjectId(subsubcatId) }
        }
      }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "Sub-subcategory deleted successfully" });
    } else {
      res.status(400).json({ error: "Deletion failed" });
    }

  } catch (err) {
    console.error("DeleteSubSubCategory Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};




const GetSubCategories = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Categories");

    const categoryId = req.params.categoryId;

    // Step 1: Find category by _id
    const category = await collection.findOne({ _id: new ObjectId(categoryId) });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Step 2: Return subcat array
    res.status(200).json({ subcategories: category.subcat || [] });

  } catch (err) {
    console.error("GetSubCategories Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


const GetSubSubCategories = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection("Categories");

    const subcatId = req.params.subcatId;

    // Step 1: Find the category document that contains the given subcat _id
    const category = await collection.findOne({
      "subcat._id": new ObjectId(subcatId)
    });

    if (!category) {
      return res.status(404).json({ error: "SubCategory not found" });
    }

    // Step 2: Find that specific subcategory inside the array
    const subcategory = category.subcat.find(
      (item) => item._id.toString() === subcatId
    );

    if (!subcategory) {
      return res.status(404).json({ error: "SubCategory not found in category" });
    }

    res.status(200).json({ subsubcategories: subcategory.subsubcat || [] });

  } catch (err) {
    console.error("GetSubSubCategories Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const UpdateAttribute = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('attributes')
    const { Attribute_name } = req.body;
    const id = req.params.id;
    const result = await collection.findOneAndUpdate({ _id: new ObjectId(id) },
      {
        $set: { Attribute_name: Attribute_name }
      }
    )
    if (result) {
      res.status(200).send({
        message: "Success",
        result: result
      })
    }

  }
  catch (err) {
    res.send(err);

  }
}


const BannerDelete = async (req, res) => {
  try {
    const db = await Connection()
    const collection = db.collection('banners');
    const id = req.params.id;
    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
    if (result) {
      res.status(200).send({
        message: "Banner Deleted Successfully",
        result: result
      })
    }
    else {
      res.send('Banner Not Found')
    }
  }
  catch (err) {
    res.send(err)
  }
}

const GetAllProducts = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('products');
    const result = await collection.find().toArray();
    if (result) {
      res.status(200).send({
        message: "Success",
        result: result
      })
    }
    else {
      res.status(400).send('Error')
    }
  }
  catch (err) {
    res.send(err)
  }
}


const handleDelteTax = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('Tax');
    const id = req.params.id
    const response = await collection.findOneAndDelete({ _id: new ObjectId(id) })
    if (response) {
      res.status(200).send({
        message: "Success"
      })
    }
    else {
      res.status(500).send('Tax Not Found')
    }
  }
  catch (err) {
    res.send(err)
  }
}


const EditTax = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('Tax');
    const id = req.params.id;
    const value = req.body;
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: value },
    )
    if (result) {
      res.status(200).send({
        message: "Success"
      })
    }
    else {
      res.status(400).send({
        message: "error"
      })
    }
  }
  catch (err) {
    res.send(err)
  }
}

const EditUnit = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('units')
    const id = req.params.id;
    const { unitname } = req.body;
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { unitname: unitname }
      }
    )
    if (result) {
      res.status(200).send({
        message: 'success'
      })
    }
    else {
      res.send('Error')
    }
  }
  catch (err) {
    res.send(err)
  }
}



const ProductToggleUpdate = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('products');

    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }


    const product = await collection.findOne({ _id: new ObjectId(id) });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedStatus = !product.status;


    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: updatedStatus } }
    );

    if (result.modifiedCount === 1) {
      return res.status(200).json({
        message: `Product status updated successfully.`,
        status: updatedStatus
      });
    } else {
      return res.status(500).json({ message: 'Failed to update product status.' });
    }
  } catch (err) {
    console.error('Error updating product status:', err.message);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};


const GetFilter=async(req,res)=>{
  try{
   const db=await Connection();
   const collection=db.collection('filters')
   const id=req.params.id;
   const result=await collection.findOne({ _id: new ObjectId(id) })
   if(result){
    res.status(200).send({
      message:"Success",
      result:result
    })
   }
   else{
    res.status(400).send({
      message:'Something wrong'
    })
   }
  }
  catch(err){
    res.send(err)
  }
}




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
  AddVarient,
  DeleteVarient,
  BrandDelete,
  BrandEdit,
  EditMainCategory,
  EditCategory,
  EditSubSubCategory,
  DeleteSubCategory,
  DeleteSubSubCategory,
  GetSubCategories,
  GetSubSubCategories,
  UpdateAttribute,
  BannerDelete,
  GetAllProducts,
  handleDelteTax,
  EditTax,
  EditUnit,
  ProductToggleUpdate,
  GetFilter
};



