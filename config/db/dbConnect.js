const mongoose = require('mongoose');

const dbConnect = async () => {
    try{
     await mongoose.connect(process.env.MONGODB_URL, {

         useUnifiedTopology:true,
         useNewUrlParser:true
     });
     console.log("db is connected succesfully")
    }catch(error){
        // console.log(`Error ${error.message}`);
        console.log(`Error ${error.message}`)
    }
}

module.exports = dbConnect