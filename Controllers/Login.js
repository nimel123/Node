const { default: Connection }=require('../Connection/ConnectDb');

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

module.exports={AddLocation,GetLocation}

