const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
//storage
const multerStorage = multer.memoryStorage();

//file type checking
const multerFilter = (req, file, cb) => {
    //check file types

    if(file.mimetype.startsWith('image')){
        cb(null, true);
    }else{
        //rejected file formar
        cb(
            {
                message:"Unsupported File Format"
            }, 
            false
        );
    }
};

const photoUpload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {fileSize:1000000}
});


//profile photo Image Resizing
const profilePhotoResize = async(req, res, next) => {

    //check if there is a picture file or not

    if(!req.file) return next();

    req.file.filename = `user-${Date.now(req.file.originalname)}`

    await sharp(req.file.buffer).resize(250, 250).toFormat('jpeg').jpeg({quality: 90}).toFile(path.join(`public/images/profile/${req.file.filename}`));
    next();


}

const postImageResize = async(req, res, next) => {

    //check if there is a picture file or not

    if(!req.file) return next();

    req.file.filename = `user-${Date.now(req.file.originalname)}`

    await sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({quality: 90}).toFile(path.join(`public/images/posts/${req.file.filename}`));
    next();


}


module.exports = {
    photoUpload,
    profilePhotoResize,
    postImageResize
}