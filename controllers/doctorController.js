import jwt from 'jsonwebtoken';
import doctorModel from '../models/doctorModel.js';
import { comparePassword, hashPassword } from '../utils/hashing.js'; // assuming you have these utility functions
import { loginSchema, changePasswordSchema, sendVerificationCodeSchema, acceptCodeSchema, sendForgotPasswordCodeSchema, acceptFPCodeSchema } from '../middleware/validator.js'; // 

// Doctor Login
const loginDoctor = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error } = loginSchema.validate({ email, password });
    if (error) {
      return res.status(401).json({ success: false, message: error.details[0].message });
    }

    const existingDoctor = await doctorModel.findOne({ email }).select("+password");
    if (!existingDoctor) {
      return res.status(401).json({ success: false, message: "You are not registered as a doctor!" });
    }

    const result = await comparePassword(password, existingDoctor.password);
    if (!result) {
      return res.status(401).json({ success: false, message: "Invalid credentials!" });
    }

    const token = jwt.sign(
      {
        doctorId: existingDoctor._id,
        email: existingDoctor.email,
        verified: existingDoctor.verified,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRE }
    );

    res
    .cookie('Authorization', 'Bearer ' + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
      })
      .json({
        success: true,
        token,
        message: 'Logged in successfully',
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong in doctor login" });
  }
};

// Doctor Logout
const logoutDoctor = async (req, res) => {
  res.clearCookie('Authorization')
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

const updateDoctorProfile = async (req, res) => {
    const { doctorId } = req.doctor; // doctor ID from the middleware
    const { name, email, password, speciality, degree, experience, about, address } = req.body;
  
    try {
      // Check if doctor exists
      const doctor = await doctorModel.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ success: false, message: "Doctor not found" });
      }
  
      // Validate the inputs (similar to what you did in addDoctor)
      const { error } = addDoctorSchema.validate({ name, email, password, speciality, degree, experience, about, address });
      if (error) {
        return res.status(401).json({ success: false, message: error.details[0].message });
      }
  
      // Update password if it is provided
      let hashedPassword;
      if (password) {
        hashedPassword = await hashPassword(password, 12); // Re-hash the password if it is provided
      }
  
      // Handling the image update (image is required)
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Image is required for profile update" });
      }
  
      const { path: imageTempPath } = req.file;
      if (imageTempPath) {
        try {
          // Upload the new image to Cloudinary
          const cloudinaryResponse = await cloudinary.uploader.upload(imageTempPath, { folder: "DOCTORS_IMAGES" });
  
          if (!cloudinaryResponse || cloudinaryResponse.error) {
            fs.unlinkSync(imageTempPath); // Delete the temporary image file from server
            return res.status(500).json({ success: false, message: "Failed to upload image to Cloudinary" });
          }
  
          // If the doctor already has an image, delete the old one from Cloudinary
          if (doctor.image && doctor.image.public_id) {
            await cloudinary.uploader.destroy(doctor.image.public_id);
          }
  
          // Set the new image data
          doctor.image = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
          };
  
          // Delete the temporary image file from the server after successful upload
          fs.unlinkSync(imageTempPath);
        } catch (error) {
          fs.unlinkSync(imageTempPath); // Ensure temporary file is deleted even in case of an error
          return res.status(500).json({ success: false, message: "An error occurred while uploading the image" });
        }
      }
  
      // Update the doctor's profile data
      doctor.name = name || doctor.name;
      doctor.email = email || doctor.email;
      doctor.speciality = speciality || doctor.speciality;
      doctor.degree = degree || doctor.degree;
      doctor.experience = experience || doctor.experience;
      doctor.about = about || doctor.about;
      doctor.address = JSON.parse(address) || doctor.address;
  
      if (hashedPassword) {
        doctor.password = hashedPassword; // Update password if provided
      }
  
      // Save the updated doctor profile
      await doctor.save();
  
      return res.json({ success: true, message: "Doctor profile updated successfully" });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message + " in catch block of doctor profile update" });
    }
  };
  
  


const sendDoctorVerificationCode = async (req, res) => {
    const { email } = req.body;
    try {
      const { error } = sendVerificationCodeSchema.validate({ email });
      if (error) {
        return res.status(401).json({ success: false, message: error.details[0].message });
      }
  
      const existingDoctor = await doctorModel.findOne({ email });
      if (!existingDoctor) {
        return res.status(404).json({ success: false, message: "Doctor does not exist!" });
      }
      if (existingDoctor.verified) {
        return res.status(400).json({ success: false, message: "Doctor is already verified!" });
      }
  
      const codeValue = Math.floor(Math.random() * 1000000).toString();
      let info = await transport.sendMail({
        from: process.env.NODEMAILER_SENDING_EMAIL_ADDRESS,
        to: existingDoctor.email,
        subject: 'Verification Code',
        html: `<h1>${codeValue}</h1>`,
      });
  
      if (info.accepted[0] === existingDoctor.email) {
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        existingDoctor.verificationCode = hashedCodeValue;
        existingDoctor.verificationCodeValidation = Date.now();
        await existingDoctor.save();
  
        return res.status(200).json({ success: true, message: "Code sent successfully!" });
      }
  
      res.status(500).json({ success: false, message: "Failed to send code!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Something went wrong in sending verification code!" });
    }
  };
  
  const verifyDoctorVerificationCode = async (req, res) => {
    const { email, providedCode } = req.body;
    try {
      const { error } = acceptCodeSchema.validate({ email, providedCode });
      if (error) {
        return res.status(401).json({ success: false, message: error.details[0].message });
      }
  
      const codeValue = providedCode.toString();
      const existingDoctor = await doctorModel.findOne({ email }).select('+verificationCode +verificationCodeValidation');
      if (!existingDoctor) {
        return res.status(401).json({ success: false, message: "Doctor does not exist!" });
      }
      if (existingDoctor.verified) {
        return res.status(400).json({ success: false, message: "Doctor is already verified!" });
      }
  
      if (Date.now() - existingDoctor.verificationCodeValidation > 5 * 60 * 1000) {
        return res.status(400).json({ success: false, message: "Code has expired!" });
      }
  
      const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
      if (hashedCodeValue === existingDoctor.verificationCode) {
        existingDoctor.verified = true;
        existingDoctor.verificationCode = undefined;
        existingDoctor.verificationCodeValidation = undefined;
        await existingDoctor.save();
  
        return res.status(200).json({ success: true, message: "Account verified successfully!" });
      }
  
      res.status(400).json({ success: false, message: "Invalid code provided!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error verifying the code!" });
    }
  };

  const changeDoctorPassword = async (req, res) => {
    const { doctorId, verified } = req.doctor;
    const { oldPassword, newPassword } = req.body;
    try {
      const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
      if (error) {
        return res.status(401).json({ success: false, message: error.details[0].message });
      }
      if (!verified) {
        return res.status(401).json({ success: false, message: "You are not a verified doctor!" });
      }
  
      const existingDoctor = await doctorModel.findOne({ _id: doctorId }).select('+password');
      if (!existingDoctor) {
        return res.status(404).json({ success: false, message: "Doctor does not exist!" });
      }
  
      const result = await comparePassword(oldPassword, existingDoctor.password);
      if (!result) {
        return res.status(401).json({ success: false, message: "Old password is incorrect!" });
      }
  
      const hashedPassword = await hashPassword(newPassword, 12);
      existingDoctor.password = hashedPassword;
      await existingDoctor.save();
  
      res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error changing the password!" });
    }
  };
  
  const sendDoctorForgotPasswordCode = async (req, res) => {
    const { email } = req.body;
    try {
      const { error } = sendForgotPasswordCodeSchema.validate({ email });
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }
  
      const existingDoctor = await doctorModel.findOne({ email });
      if (!existingDoctor) {
        return res.status(404).json({ success: false, message: "Doctor does not exist!" });
      }
  
      const codeValue = Math.floor(Math.random() * 1000000).toString();
      let info = await transport.sendMail({
        from: process.env.NODEMAILER_SENDING_EMAIL_ADDRESS,
        to: existingDoctor.email,
        subject: 'Forgot Password Code',
        html: `<h1>${codeValue}</h1>`,
      });
  
      if (info.accepted.includes(existingDoctor.email)) {
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        existingDoctor.forgotPasswordCode = hashedCodeValue;
        existingDoctor.forgotPasswordCodeValidation = Date.now();
        await existingDoctor.save();
  
        return res.status(200).json({ success: true, message: "Forgot password code sent!" });
      }
  
      res.status(500).json({ success: false, message: "Failed to send forgot password code!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error sending forgot password code!" });
    }
  };
  
  const verifyDoctorForgotPasswordCode = async (req, res) => {
    const { email, providedCode, newPassword } = req.body;
    try {
      const { error } = acceptFPCodeSchema.validate({ email, providedCode, newPassword });
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }
  
      const existingDoctor = await doctorModel.findOne({ email }).select('+forgotPasswordCode +forgotPasswordCodeValidation');
      if (!existingDoctor) {
        return res.status(404).json({ success: false, message: "Doctor does not exist!" });
      }
  
      if (Date.now() - existingDoctor.forgotPasswordCodeValidation > 5 * 60 * 1000) {
        return res.status(400).json({ success: false, message: "Forgot password code expired!" });
      }
  
      const hashedCodeValue = hmacProcess(providedCode, process.env.HMAC_VERIFICATION_CODE_SECRET);
      if (hashedCodeValue !== existingDoctor.forgotPasswordCode) {
        return res.status(400).json({ success: false, message: "Invalid forgot password code!" });
      }
  
      const hashedPassword = await hashPassword(newPassword, 12);
      existingDoctor.password = hashedPassword;
      existingDoctor.forgotPasswordCode = undefined;
      existingDoctor.forgotPasswordCodeValidation = undefined;
      await existingDoctor.save();
  
      res.status(200).json({ success: true, message: "Password reset successfully!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error resetting the password!" });
    }
  };
  
export { loginDoctor, logoutDoctor,updateDoctorProfile,sendDoctorVerificationCode,verifyDoctorVerificationCode,changeDoctorPassword,sendDoctorForgotPasswordCode ,verifyDoctorForgotPasswordCode};
