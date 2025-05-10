const { default: Connection }=require('../Connection/ConnectDb');
const {ObjectId, Collection}=require('mongodb')


const AddLocation = async (req, res) => {
    try{
      const db=await Connection();
      const collection=db.collection("Locations");
      const {address}=req.body;
      if(!address){
        return res.status(400).json({ message: 'Address Required' });
      }
      const result=await collection.insertOne({address});
      if(result.acknowledged){
        res.status(200).send({
            message:"Success",
            address:result
        })
      }
    }
    catch(err){
        res.send('Error')
    }
    }


 const GetLocation = async (req, res) => {
    try{
        const db=await Connection();
        const collection=db.collection("Locations");
         const result = await collection.find().toArray();
            if (result) {
               return res.status(200).send({
                result:result
               })
            }
            else {
                return res.status(400).json({ message: 'Location not find' });
            }
    }
    catch(err){
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


const Delete=async(req,res)=>{
  try{
    const db=await Connection();
    const collection=db.collection("Locations");
    const id=req.params;
    const result=await collection.findOneAndDelete({_id:new ObjectId(id)});
    if(result){
      return res.status(200).json({
        message: "Zone Deleted Successfully",
        result: {
            id: id,
        }
    })
    }
    else{
      return res.status(400).json({ message: 'Zone not found' });
    }
  }
  catch(err){
     res.send(err)
  }
}


// Add Categories (with file upload)
const Categories = async (req, res) => {
  try {
    const db = await Connection();
    const collection = db.collection('Categories');
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const filePath = file.path.replace(/\\/g, '/'); // Normalize file path
    const { name, description } = req.body;

    const result = await collection.insertOne({
      name,
      description,
       file: `/uploads/${filePath.split('upload/')[1]}`
    });

    if (result.acknowledged) {
      res.status(200).send({
        message: "Category added successfully",
        result:result
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


const DeleteCategories=async(req,res)=>{
   try{
    const db=await Connection();
    const collection=db.collection("Categories");
    const id=req.params;
    const result=await collection.findOneAndDelete({_id:new ObjectId(id)});
    if(result){
      return res.status(200).json({
        message: "Categories Deleted Successfully",
        result: {
            id: id,
        }
    })
    }
    else{
      return res.status(400).json({ message: 'Not found' });
    }
  }
  catch(err){
     res.send(err)
  }
}



module.exports={AddLocation,GetLocation,Delete,Categories,GetCategories,DeleteCategories}

