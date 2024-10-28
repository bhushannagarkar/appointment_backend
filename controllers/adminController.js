import jwt from 'jsonwebtoken';
import { registerSchema ,loginSchema,addDoctorSchema, sendVerificationCodeSchema, acceptCodeSchema, sendForgotPasswordCodeSchema, acceptFPCodeSchema, changePasswordSchema, registerSchemaForAdmin, loginSchemaForAdmin, sendForgotPasswordCodeForAdminSchema, acceptFPCodeForAdminSchema} from '../middleware/validator.js';
import adminModel from '../models/adminModel.js';
import { comparePassword, hashPassword, hmacProcess } from '../utils/hashing.js';
import { v2 as cloudinary } from "cloudinary";
import doctorModel from '../models/doctorModel.js';
import transport from '../middleware/sendMail.js';
import csv from 'csvtojson';
import fs from 'fs';
import appointmentModel from '../models/appointmentModel.js';
import onlineTestModel from '../models/onlineTestModel.js'; // Import your online test model


const registerAdmin = async (req, res) => {
    // console.log(req.body);
    const {
        adminEmailId,
        adminPassword,
        adminName,
        adminLocation,
        adminMobileNo,
        adminWhatsappNo,
    } = req.body;

    try {
        // Validate input data
        const { error, value } = registerSchemaForAdmin.validate({
            adminEmailId,
            adminPassword,
            adminName,
            adminLocation,
            adminMobileNo,
            adminWhatsappNo,
        });

        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        // Check if admin already exists
        const existingAdmin = await adminModel.findOne({ adminEmailId });
        // console.log(existingAdmin, 'this is existing');

        if (existingAdmin) {
            return res.status(401).json({ success: false, message: 'Admin already exists!' });
        }

        // Hash the password
        const hashedPassword = await hashPassword(adminPassword, 12);

        // Prepare the admin object
        const adminData = {
            adminEmailId,
            adminPassword: hashedPassword,
            adminName,
            adminLocation,
            adminMobileNo,
            adminWhatsappNo,
            verified: false, // Default value
            adminImagelink: {
                public_id: '',
                url: ''
            },
        };

        // Handle image upload if a file is provided
        if (req.file) {
            const { path: imageTempPath } = req.file; // Use req.file to access the uploaded image file

            // console.log(req.file, "tempfile path", imageTempPath); // Log the file to check its properties

            if (imageTempPath) {
                try {
                    const cloudinaryResponse = await cloudinary.uploader.upload(
                        imageTempPath, // Use the file path or buffer
                        { folder: "ADMIN_IMAGES" } // Change the folder name as needed
                    );

                    if (!cloudinaryResponse || cloudinaryResponse.error) {
                        fs.unlinkSync(imageTempPath);
                        return res.json({ success: false, message: "Failed to upload image to Cloudinary" });
                    }

                    // Set image data in the adminData object
                    adminData.adminImagelink.public_id = cloudinaryResponse.public_id;
                    adminData.adminImagelink.url = cloudinaryResponse.secure_url;

                    // Delete the temporary file from the server after uploading
                    fs.unlinkSync(imageTempPath);
                } catch (error) {
                    // Delete the temporary file from the server in case of error
                    fs.unlinkSync(imageTempPath);
                    return res.json({ success: false, message: "An error occurred while uploading the image" });
                }
            }
        }

        // Create and save the new admin
        const admin = new adminModel(adminData);
        const result = await admin.save();

        result.adminPassword = undefined; // Ensure password is not returned in the response

        res.status(201).json({
            success: true,
            message: "Your account has been created successfully",
            result,
        });
    } catch (error) {
        // console.log(error);
        res.status(500).json({ success: false, message: "Error in Register to admin" });
    }
};

const loginAdmin = async (req, res) => {
  // console.log(req.body);
  const { adminEmailId, adminPassword } = req.body; // Change email to adminEmailId
  try {
      // Validate input data
      const { error } = loginSchemaForAdmin.validate({  adminEmailId,  adminPassword });

      if (error) {
          return res.status(401).json({ success: false, message: error.details[0].message });
      }

      // Check if admin exists
      const existingAdmin = await adminModel.findOne({ adminEmailId }).select("+adminPassword");
      // console.log(existingAdmin, 'this is existing');

      if (!existingAdmin) {
          return res.status(401).json({ success: false, message: 'You are not an admin!' });
      }

      // Compare passwords
      const result = await comparePassword(adminPassword, existingAdmin.adminPassword);

      if (!result) {
          return res.status(401).json({ success: false, message: 'Invalid credentials!' });
      }

      // Generate token
      const token = jwt.sign(
          {
              adminId: existingAdmin._id,
              adminEmailId: existingAdmin.adminEmailId,
              verified: existingAdmin.verified,
          },
          process.env.TOKEN_SECRET,
          {
              expiresIn: process.env.TOKEN_EXPIRE,
          }
      );

      res.cookie('Authorization', 'Bearer ' + token, {
          expires: new Date(Date.now() + 8 * 3600000),
          httpOnly: process.env.NODE_ENV === 'production',
          secure: process.env.NODE_ENV === 'production',
      }).json({
          success: true,
          token,
          message: 'Logged in successfully',
      });
  } catch (error) {
      // console.log(error);
      res.json({ success: false, message: "Something went wrong in login admin" });
  }
};

 const logoutAdmin=async(req,res)=>{
    res.clearCookie('admin')
    .status(200)
    .json({success:true,message:"logged out successfully"
    });

 }

 // Function to add a doctor by admin
 const addDoctorByAdmin = async (req, res) => {
   const { doctorName, doctorEmailId, password, doctorSpecialisation, doctorQualifications, experience, about, doctorLocation, doctorAddress, doctorMobileNo, doctorWhatsappNo } = req.body;
 
   // Check if doctor already exists
   const existingDoctor = await doctorModel.findOne({ doctorEmailId });
   console.log(existingDoctor, "this is null");
 
   if (existingDoctor) {
     return res.json({ success: false, message: "Email already exists" });
   }
 
   try {
     // Validate incoming data using Joi schema
     const { error, value } = addDoctorSchema.validate({
       doctorName,
       doctorEmailId,
       password,
       doctorSpecialisation,
       doctorQualifications,
       experience,
       about,
       doctorLocation,
       doctorAddress,
       doctorMobileNo,
       doctorWhatsappNo
     });
 
     if (error) {
       return res.status(401).json({ success: false, message: error.details[0].message });
     }
 
     // Hash the password before saving
     const hashedPassword = await hashPassword(password, 12);
 
     // Doctor data to be saved
     const doctorData = {
       doctorName,
       doctorEmailId,
       password: hashedPassword,
       doctorSpecialisation,
       doctorQualifications,
       experience,
       about,
       doctorLocation,
       doctorAddress,
       doctorMobileNo,
       doctorWhatsappNo,
       date: Date.now()
     };
 
     // Upload image to Cloudinary if file is present
     if (req.file) {
       const { path: imageTempPath } = req.file;
 
       console.log(req.file, "tempfile path", imageTempPath);
 
       if (imageTempPath) {
         try {
           const cloudinaryResponse = await cloudinary.uploader.upload(imageTempPath, {
             folder:"DOCTORS_IMAGES"
           });
 
           if (!cloudinaryResponse || cloudinaryResponse.error) {
             fs.unlinkSync(imageTempPath);
             return res.json({ success: false, message: "Failed to upload image to Cloudinary" });
           }
 
           doctorData.doctorImage = {
             public_id: cloudinaryResponse.public_id,
             url: cloudinaryResponse.secure_url
           };
 
           // Remove temporary file from the server
           fs.unlinkSync(imageTempPath);
         } catch (error) {
           fs.unlinkSync(imageTempPath);
           return res.json({ success: false, message: "Error occurred while uploading the image" });
         }
       }
     }
 
     // Save new doctor to the database
     const newDoctor = new doctorModel(doctorData);
     await newDoctor.save();
 
     return res.json({ success: true, message: "Doctor Added" });
   } catch (error) {
     return res.json({ success: false, message: error.message + " in catch block of doctor added" });
   }
 };
 
 const uploadAllDoctorByAdmin = async (req, res) => {
  try {
    if (req.file) {
      const response = await csv().fromFile(req.file.path);
      
      const doctorData = [];
for (let i = 0; i < response.length; i++) {
  const existingDoctor = await doctorModel.findOne({ doctorEmailId: response[i].doctorEmailId });
  
  if (existingDoctor) {
    console.log(`Doctor with email ${response[i].email} already exists. Skipping...`);
    continue; // Skip adding this doctor if already exists
  }

  doctorData.push({
    doctorName: response[i].doctorName,
    doctorEmailId: response[i].doctorEmailId,
    password: await hashPassword(response[i].password, 12),
    doctorSpecialisation: response[i].doctorSpecialisation,
    doctorQualifications: response[i].doctorQualifications,
    experience: response[i].experience,
    about: response[i].about,
    doctorAddress: response[i].doctorAddress,
    date: Date.now(),
    available: true,  // Assuming the doctor is available by default
    doctorLocation: response[i].doctorLocation, // Assuming location field is available in response
    doctorMobileNo: response[i].doctorMobileNo, // Assuming mobileNo field is in response
    doctorWhatsappNo: response[i].doctorWhatsappNo, // Assuming whatsappNo field is in response
    // doctorImage: {
    //   public_id: response[i].imagePublicId, // Assuming public_id and URL are present in response
    //   url: response[i].imageUrl,
    // },
    // doctorProfileLink: {
    //   url: response[i].profileUrl, // Assuming profile link URL is in response
    // },
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

const getSingleDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    const doctors = await doctorModel.findById(id).select("-password");
    console.log(doctors);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

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
  const { adminEmailId } = req.body;
  try {
    const { error } = sendForgotPasswordCodeForAdminSchema.validate({ adminEmailId });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const existingAdmin = await adminModel.findOne({ adminEmailId });
    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin does not exist!",
      });
    }

    const codeValue = Math.floor(Math.random() * 1000000).toString();
    let info = await transport.sendMail({
      from: process.env.NODEMAILER_SENDING_EMAIL_ADDRESS,
      to: existingAdmin.adminEmailId,
      subject: 'Forgot Password Code',
      html: `<h1>${codeValue}</h1>`,
    });

    if (info.accepted.includes(existingAdmin.adminEmailId)) {
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
  const { adminEmailId, providedCode, newPassword } = req.body;

  try {
    // Validate the input using schema
    const { error } = acceptFPCodeForAdminSchema.validate({
      adminEmailId,
      providedCode,
      newPassword,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Find admin by email
    const existingAdmin = await adminModel.findOne({ adminEmailId }).select(
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

    // Hash the provided code and compare it with the stored hashed code
    const hashedCodeValue = hmacProcess(providedCode, process.env.HMAC_VERIFICATION_CODE_SECRET);
    if (hashedCodeValue === existingAdmin.forgotPasswordCode) {
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword, 12);

      // Update the password and clear forgot password fields
      existingAdmin.adminPassword = hashedPassword;
      existingAdmin.forgotPasswordCode = undefined;
      existingAdmin.forgotPasswordCodeValidation = undefined;

      // Save the updated admin
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
    return res.status(500).json({
      success: false,
      message: 'Error verifying forgot password code!',
    });
  }
};


const getAllAppointments = async (req, res) => {
 // Extract doctorObjectId from request parameters

  try {
    // Find all appointments where doctorObjectId matches the provided doctorObjectId
    const appointments = await appointmentModel.find();

    // Check if appointments exist
    if (!appointments || appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments found ",
      });
    }

    // Respond with the found appointments
    res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      appointments,
    });
  } catch (error) {
    // Handle any errors
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching appointments",
    });
  }
};

// add Online test

// Function to add an online test by admin
const addOnlineTestByAdmin = async (req, res) => {
  const { onlineTestName, onlineTestDescription } = req.body;

  // Check if an online test with the same name already exists
  const existingOnlineTest = await onlineTestModel.findOne({ onlineTestName });

  if (existingOnlineTest) {
    return res.json({ success: false, message: "Test name already exists" });
  }

  try {
    // Validate incoming data (you can add validation like Joi schema if needed)
    if (!onlineTestName || !onlineTestDescription) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Create new online test data to be saved
    const onlineTestData = {
      onlineTestName,
      onlineTestDescription,
      date: Date.now(),
    };

    // Save new online test to the database
    const newOnlineTest = new onlineTestModel(onlineTestData);
    await newOnlineTest.save();

    return res.json({ success: true, message: "Online Test Added Successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message + " in catch block of online test addition" });
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
    getSingleDoctor,
    getAllAppointments,
    addOnlineTestByAdmin,
}
