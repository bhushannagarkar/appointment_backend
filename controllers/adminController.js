import jwt from 'jsonwebtoken';
import { registerSchema ,loginSchema,addDoctorSchema, sendVerificationCodeSchema} from '../middleware/validator.js';
import adminModel from '../models/adminModel.js';
import { comparePassword, hashPassword, hmacProcess } from '../utils/hashing.js';
import { v2 as cloudinary } from "cloudinary";
import doctorModel from '../models/doctorModel.js';
import transport from '../middleware/sendMail.js';
import csv from 'csvtojson';



const registerAdmin=async(req,res)=>{
    console.log(req.body);
    const {email,password}=req.body;
    try{
        
      const {error,value}=registerSchema.validate({email,password});

      if(error){
        return res
        .status(401)
        .json({success:false,message:error.details[0].message});
      }

      const existingAdmin=await adminModel.findOne();
      console.log(existingAdmin,'this is existing');

      if(existingAdmin){
        return res
        .status(401)
        .json({success:false,message:'Admin already exists!'})
      }
   const hashedPassword=await hashPassword(password,12);

   const admin=new adminModel(
    {
        email,
        password:hashedPassword
    }
   );
 const result=await admin.save();
 
 result.password=undefined;

 res.status(201).json({
    success:true,
    message:"Your account has been created successfully",
    result,
 })


    }catch(error){
        console.log(error);
        res.json({success:false,message:"Error in Register to admin"});

    }
}


const loginAdmin=async(req,res)=>{
    console.log(req.body);
    const {email,password}=req.body;
    try{
        
      const {error,value}=loginSchema.validate({email,password});

      if(error){
        return res
        .status(401)
        .json({success:false,message:error.details[0].message});
      }
      const existingAdmin=await adminModel.findOne({email}).select("+password");
      console.log(existingAdmin,'this is existing');

      if(!existingAdmin){
        return res
        .status(401)
        .json({success:false,message:'Your are not admin!'})
      }

      const result= await comparePassword(password, existingAdmin.password);

      if(!result){
        return res
        .status(401)
        .json({
            success:false,
            message:'Invalid credentials!'
        });
      }


    const token=jwt.sign({
        adminId:existingAdmin._id,
        email:existingAdmin.email,
        verified:existingAdmin.verified,
    },
    process.env.TOKEN_SECRET,
    {
        expiresIn:process.env.TOKEN_EXPIRE,
    }

);


res.cookie('admin','Bearer' + token,{
    expires:new Date(Date.now()+ 8 *3600000),
    httpOnly: process.env.NODE_ENV === 'production',
    secure: process.env.NODE_ENV === 'production',
}).json({
    success:true,
    token,
    message:"logged in successfully"
})


    }catch(error){
        console.log(error);
        res.json({success:false,message:"something went wrong in login admin"});

    }
}
 const logoutAdmin=async(req,res)=>{
    res.clearCookie('admin')
    .status(200)
    .json({success:true,message:"logged out successfully"
    });

 }
const addDoctorByAdmin=async(req,res)=>{

  const { name, email, password, speciality, degree, experience, about,  address } = req.body;
  
 const existingDoctor= await doctorModel.findOne({email});
 console.log(existingDoctor,"this is null");

 if(existingDoctor){
  return res.json({ success: false, message: "email already exist "})
 }

  try {
    const {error,value}=addDoctorSchema.validate({ name, email, password, speciality, degree, experience, about,  address});

    if(error){
      return res
      .status(401)
      .json({success:false,message:error.details[0].message});
    }

    const hashedPassword=await hashPassword(password,12);

    const doctorData = {
      name,
      email,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      address: JSON.parse(address),
      date: Date.now()
  }
    //upload image to cloudinary
    // const imageFile = req.file;
    if (req.file) {
      const { path: imageTempPath } = req.file; // Use req.file to access the uploaded image file
      
      console.log(req.file, "this is image"); // Log the file to check its properties
      
      if (imageTempPath) {
        try {
          const cloudinaryResponse = await cloudinary.uploader.upload(
            imageTempPath, // Use the file path or buffer
            { folder: "DOCTORS_IMAGES" }
          );
    
          if (!cloudinaryResponse || cloudinaryResponse.error) {
            return res.json({ success: false, message: "Failed to upload image to Cloudinary" });
          }
    
          doctorData.image = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
          };
    
        } catch (error) {
          return res.json({ success: false, message: "An error occurred while uploading the image" });
        }
      }
    }
    

      const newDoctor=new doctorModel(doctorData);
      await newDoctor.save();

      res.json({ success: true, message: 'Doctor Added' })
    

  }catch(error){
    return res.json({ success: false, message: error.message+"IN CATCH BLOCK"})
  }
 }

const uploadAllDoctorByAdmin=async(req,res)=>{
    try {
      console.log(req.file);

      if (req.file) {
       let doctorData=[];
       const response= await csv().fromFile(req.file.path);
    // console.log(response);

    for(let i=0;i<response.length;i++){
  
      doctorData.push({
      name:response[i].name,
      email:response[i].email,
      password:await hashPassword(response[i].password,12),
      speciality:response[i].speciality, 
      degree: response[i].degree,
      experience: response[i].experience,
      about:response[i].about,
      address:response[i].address,
      date: Date.now()

    })
}
 
// console.log(doctorData);
   await doctorModel.insertMany(doctorData);

     return res
     .status(201)
     .json({success:true ,message:"csv file imported"});
  }
    } catch (error) {
      return res
     .status(401)
     .json({success:true ,message:`error occured in upload all doctors ${error}`});
    }
  
 }

 const getAllDoctors = async (req, res) => {
  try {

      const doctors = await doctorModel.find({}).select('-password')
      res.json({ success: true, doctors })

  } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
  }
}


const sendVerificationCode=async(req,res)=>{
  const {email}=req.body;

  try{
    const {error,value}=sendVerificationCodeSchema.validate({email});
    if(error){
      return res
      .status(401)
      .json({success:false,message:error.details[0].message});
    }

    const existingAdmin=await adminModel.findOne({email});
    if(!existingAdmin){
      return res.status(404).json({
        success:false,
        message:"Admin does not exists!"
      });
    }
    if(existingAdmin.verified){
      return res
      .status(400)
      .json({success:false,message:'you are already verified'});
    }
//dont use this method in production any one can think this codevalue
    const codeValue=Math.floor(Math.random()*1000000).toString();

    let info= await transport.sendMail({
      from:process.env.NODEMAILER_SENDING_EMAIL_ADDRESS,
      to:existingAdmin.email,
      subject:'verification code',
      html:'<h1>'+codeValue +'</h1>'
    })

    if(info.accepted[0]===existingAdmin.email){
      const hashedCodeValue=hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingAdmin.verificationCode=hashedCodeValue;
      existingAdmin.verificationCodeValidation=Date.now();
      await existingAdmin.save();

      return res.status(200).json({success:true,message:"Code Sent!"})
    }
   return res.status(400).json({success:false,message:`${error}Code sent failed`});
  
  }catch(error){
   console.log(error);
   return res.status(400).json({success:false,message:`${error} error in last Code sent failed`});
  
  }
}

 

export {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    addDoctorByAdmin,
    uploadAllDoctorByAdmin,
    getAllDoctors,
    sendVerificationCode,
}

