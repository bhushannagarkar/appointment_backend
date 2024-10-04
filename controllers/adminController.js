import jwt from 'jsonwebtoken';
import { registerSchema ,loginSchema,addDoctorSchema, sendVerificationCodeSchema, acceptCodeSchema, sendForgotPasswordCodeSchema, acceptFPCodeSchema, changePasswordSchema} from '../middleware/validator.js';
import adminModel from '../models/adminModel.js';
import { comparePassword, hashPassword, hmacProcess } from '../utils/hashing.js';
import { v2 as cloudinary } from "cloudinary";
import doctorModel from '../models/doctorModel.js';
import transport from '../middleware/sendMail.js';
import csv from 'csvtojson';
import fs from 'fs';

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
res
.cookie('Authorization', 'Bearer ' + token, {
  // .cookie('Admin', 'Bearer ' + token, {
  expires: new Date(Date.now() + 8 * 3600000),
  httpOnly: process.env.NODE_ENV === 'production',
  secure: process.env.NODE_ENV === 'production',
})

.json({
  success: true,
  token,
  message: 'logged in successfully',
});


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
      
      console.log(req.file, "tempfile path",imageTempPath); // Log the file to check its properties
      
      if (imageTempPath) {
        try {
          const cloudinaryResponse = await cloudinary.uploader.upload(
            imageTempPath, // Use the file path or buffer
            { folder: "DOCTORS_IMAGES" }
          );
    
          if (!cloudinaryResponse || cloudinaryResponse.error) {
            fs.unlinkSync(imageTempPath);
            return res.json({ success: false, message: "Failed to upload image to Cloudinary" });
          }
    
          doctorData.image = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
          };         
          //for deleting a file from server after uploading
          fs.unlinkSync(imageTempPath);
        } catch (error) {
          //for deleting a file from server no need to store 
          fs.unlinkSync(imageTempPath);
          return res.json({ success: false, message: "An error occurred while uploading the image" });
        }
      }
    }
    

      const newDoctor=new doctorModel(doctorData);
      await newDoctor.save();

     return res.json({ success: true, message: 'Doctor Added' })
    

  }catch(error){
    return res.json({ success: false, message: error.message+"IN CATCH BLOCK of doctor added"})
  }
}

 const uploadAllDoctorByAdmin = async (req, res) => {
  try {
    if (req.file) {
      const response = await csv().fromFile(req.file.path);
      
      const doctorData = [];
      for (let i = 0; i < response.length; i++) {
        const existingDoctor = await doctorModel.findOne({ email: response[i].email });
        if (existingDoctor) {
          console.log(`Doctor with email ${response[i].email} already exists. Skipping...`);
          continue; // Skip adding this doctor if already exists
        }
        doctorData.push({
          name: response[i].name,
          email: response[i].email,
          password: await hashPassword(response[i].password, 12),
          speciality: response[i].speciality,
          degree: response[i].degree,
          experience: response[i].experience,
          about: response[i].about,
          address: response[i].address,
          date: Date.now(),
        });
      }
    
      // Insert all non-existing doctors into the database
      if (doctorData.length > 0) {
        await doctorModel.insertMany(doctorData);
        return res.status(201).json({
          success: true,
          message: 'CSV file imported successfully, doctors added!',
        });
      }

 //deleting file from server after uploading
    console.log(req.file.path);
    fs.unlinkSync(req.file.path);

      return res.status(200).json({
        success: true,
        message: 'All doctors from CSV already exist in the database!',
      });
    }
   
    return res.status(400).json({
      success: false,
      message: 'No file provided!',
    });
  } catch (error) {
        //deleting file from server if any error occured
        console.log(req.file.path);
        fs.unlinkSync(req.file.path);   
    return res.status(500).json({
      success: false,
      message: `Error occurred while uploading doctors: ${error.message}`,
    });
  }
};


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

const verifyVerificationCode=async(req,res)=>{
const {email,providedCode}=req.body;
console.log(email,"this is emai and code",providedCode,)
  try {
    const {error,value}=acceptCodeSchema.validate({ email, providedCode });
    if(error){
      return res.status(401).json({
        success:false,message:error.details[0].message
      })
    }

    const codeValue=providedCode.toString();
    const existingAdmin=await adminModel.findOne({email}).select('+verificationCode +verificationCodeValidation');

    if(!existingAdmin){
      return res.status(401)
      .json({success:false,message:"admin does not exists"})
    }
 
    if(existingAdmin.verified){
      return res.status(400)
      .json({success:false,message:"you are already verified"})
    }

    if(!existingAdmin.verificationCode||!existingAdmin.verificationCodeValidation){
      return res
        .status(400)
        .json({success:false,message:"something is wrong with the code!"});
    }

    if(Date.now()-existingAdmin.verificationCodeValidation>5*60*1000){
      return res
         .status(400)
         .json({success:false,message:'code has been expired'});
    }

    const hashedCodeValue=hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if(hashedCodeValue==existingAdmin.verificationCode){
      existingAdmin.verified=true;
      existingAdmin.verificationCode=undefined;
      existingAdmin.verificationCodeValidation=undefined;
      await existingAdmin.save();
    return res
          .status(200)
          .json({success:true,message:'your account has been verified'})    
    }
    return res
    .status(400)
    .json({success:false,message:'unexpected occured !!'});

  } catch (error) {
      console.log(error);
   return res.status(400).json({success:false,message:`${error} error in last Code verification failed`});
  }
}
 

const changePassword = async (req, res) => {
	const { adminId, verified} = req.admin;
  console.log(verified);
	const { oldPassword, newPassword } = req.body;
	try {
		const { error, value } = changePasswordSchema.validate({
			oldPassword,
			newPassword,
		});
		if (error) {
			return res
				.status(401)
				.json({ success: false, message: error.details[0].message });
		}
		if (!verified) {
			return res
				.status(401)
				.json({ success: false, message: 'You are not verified admin!' });
		}
		const existingAdmin = await adminModel.findOne({ _id: adminId }).select(
			'+password'
		);
		if (!existingAdmin) {
			return res
				.status(401)
				.json({ success: false, message: 'Admin does not exists!' });
		}
		const result = await comparePassword(oldPassword, existingAdmin.password);
		if (!result) {
			return res
				.status(401)
				.json({ success: false, message: 'Invalid credentials!' });
		}
		const hashedPassword = await hashPassword(newPassword, 12);
		existingAdmin.password = hashedPassword;
		await existingAdmin.save();
		return res
			.status(200)
			.json({ success: true, message: 'Password updated!!' });
	} catch (error) {
		console.log(error);
	}
};

const sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;
  try {
    const { error } = sendForgotPasswordCodeSchema.validate({ email });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const existingAdmin = await adminModel.findOne({ email });
    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin does not exist!",
      });
    }

    const codeValue = Math.floor(Math.random() * 1000000).toString();
    let info = await transport.sendMail({
      from: process.env.NODEMAILER_SENDING_EMAIL_ADDRESS,
      to: existingAdmin.email,
      subject: 'Forgot Password Code',
      html: `<h1>${codeValue}</h1>`,
    });

    if (info.accepted.includes(existingAdmin.email)) {
      const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
      existingAdmin.forgotPasswordCode = hashedCodeValue;
      existingAdmin.forgotPasswordCodeValidation = Date.now();
      await existingAdmin.save();

      return res.status(200).json({
        success: true,
        message: 'Code sent successfully!',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send code!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error sending forgot password code!',
    });
  }
};

const verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    const { error } = acceptFPCodeSchema.validate({ email, providedCode, newPassword });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const existingAdmin = await adminModel.findOne({ email }).select(
      '+forgotPasswordCode +forgotPasswordCodeValidation'
    );

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin does not exist!',
      });
    }

    if (!existingAdmin.forgotPasswordCode || !existingAdmin.forgotPasswordCodeValidation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code!',
      });
    }

    // Check if the code has expired (valid for 5 minutes)
    if (Date.now() - existingAdmin.forgotPasswordCodeValidation > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Code has expired!',
      });
    }

    const hashedCodeValue = hmacProcess(providedCode, process.env.HMAC_VERIFICATION_CODE_SECRET);
    if (hashedCodeValue === existingAdmin.forgotPasswordCode) {
      const hashedPassword = await hashPassword(newPassword, 12);
      existingAdmin.password = hashedPassword;
      existingAdmin.forgotPasswordCode = undefined;
      existingAdmin.forgotPasswordCodeValidation = undefined;
      await existingAdmin.save();

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully!',
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid code provided!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error verifying forgot password code!',
    });
  }
};


export {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    addDoctorByAdmin,
    uploadAllDoctorByAdmin,
    getAllDoctors,
    sendVerificationCode,
    verifyVerificationCode,
    changePassword,
    sendForgotPasswordCode,
    verifyForgotPasswordCode,
}

