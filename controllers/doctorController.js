import jwt from 'jsonwebtoken';
import doctorModel from '../models/doctorModel.js';
import { comparePassword, hashPassword, hmacProcess } from '../utils/hashing.js'; // assuming you have these utility functions
import { loginSchema, changePasswordSchema, sendVerificationCodeSchema, acceptCodeSchema, sendForgotPasswordCodeSchema, acceptFPCodeSchema, diagnosisSchema } from '../middleware/validator.js'; // 
import appointmentModel from '../models/appointmentModel.js';
import transport from '../middleware/sendMail.js';
import { updateDoctorSchema } from '../middleware/validator.js';
import fs from 'fs';
import { v2 as cloudinary } from "cloudinary";
import onlineTestModel from '../models/onlineTestModel.js'; // Import your online test model
import diagnosisModel from '../models/diagnosisModel.js';
import onlineTestTransactionModel from '../models/onlineTestTransactionModel.js';

// Doctor Login
const loginDoctor = async (req, res) => {
  const { doctorEmailId, password } = req.body;
  try {
    const { error } = loginSchema.validate({ doctorEmailId, password });
    if (error) {
      return res.status(401).json({ success: false, message: error.details[0].message });
    }

    const existingDoctor = await doctorModel.findOne({ doctorEmailId }).select("+password");

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
        doctorEmailId: existingDoctor.doctorEmailId,
        verified: existingDoctor.verified,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRE }
    );

    res
      .cookie('Authorization', 'Bearer ' + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        // httpOnly: process.env.NODE_ENV === 'production',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      })
      .json({
        success: true,
        token,
        message: 'Logged in successfully',
        existingDoctor,
      });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong in doctor login" });
  }
};

const getDoctor = async (req, res) => {
  try {
    // Extract the userId from the token or session
    const doctorId = req.doctor.doctorId; // Assuming the userId is attached to the request via authentication middleware

    // Fetch the user using the userId from the database
    const existingDoctor = await doctorModel.findById(doctorId); // Replace `userModel` with the correct model (e.g., doctorModel if it's for doctors)

    if (!existingDoctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    // If you need to include image data like in the doctor profile, handle it here
    // You can add any necessary logic to return image data or any other fields

    // Return the user data as a response
    return res.status(200).json({
      success: true,
      existingDoctor, // This will include all user data fetched from the database
    });

  } catch (error) {
    // Handle any errors during fetching user data
    console.error("Error fetching user data: ", error.message);
    return res.status(500).json({
      success: false,
      message: error.message + " in catch block of getUser function",
    });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    // Extract the appointment ID from the request parameters
    const appointmentId = req.params.id; // Assuming appointment ID is passed in the URL as a parameter

    // Fetch the appointment using the appointment ID from the database
    const existingAppointment = await appointmentModel.findById(appointmentId);

    if (!existingAppointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // If appointment is found, return the appointment data as a response
    return res.status(200).json({
      success: true,
      appointment: existingAppointment,
    });

  } catch (error) {
    // Handle any errors during the fetching process
    console.error("Error fetching appointment data: ", error.message);
    return res.status(500).json({
      success: false,
      message: `Error occurred: ${error.message}`,
    });
  }
};

// Doctor Logout
const logoutDoctor = async (req, res) => {
  res.clearCookie('Authorization')
    .status(200)
    .json({ success: true, message: "Logged out successfully " });
};
const updateDoctorProfile = async (req, res) => {
  const { doctorName, doctorEmailId, doctorSpecialisation, doctorQualifications, experience, about, doctorLocation, doctorAddress, doctorMobileNo, doctorWhatsappNo } = req.body;
  console.log(req.doctor.doctorId, "this is doctor data from cookies");

  const doctorId = req.doctor.doctorId; // Get doctorId from the token
  try {
    // Fetch the doctor using doctorId
    const existingDoctor = await doctorModel.findById(doctorId);
    if (!existingDoctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    // Validate incoming data
    const { error, value } = updateDoctorSchema.validate({
      doctorName,
      doctorEmailId,
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

    // Update doctor data
    const doctorData = {
      doctorName,
      doctorEmailId,
      doctorSpecialisation,
      doctorQualifications,
      experience,
      about,
      doctorLocation,
      doctorAddress,
      doctorMobileNo,
      doctorWhatsappNo,
      date: Date.now() // Update date on profile change
    };

    // Handle image upload if there’s a new file
    if (req.file) {
      const { path: imageTempPath } = req.file;
      console.log(req.file, "this is image");
      if (imageTempPath) {
        try {
          console.log("Image temp path: ", imageTempPath);


          // Upload new image to Cloudinary
          const cloudinaryResponse = await cloudinary.uploader.upload(imageTempPath, {
            folder: "DOCTORS_IMAGES"
          });
          console.log(cloudinaryResponse, "this is cloudinary response");
          if (!cloudinaryResponse || cloudinaryResponse.error) {
            console.log("Cloudinary upload failed: ", cloudinaryResponse.error);
            fs.unlinkSync(imageTempPath); // Remove temp file if upload failed
            return res.json({ success: false, message: "Failed to upload image to Cloudinary" });
          }

          // Remove the old image from Cloudinary if it exists
          if (existingDoctor.doctorImage && existingDoctor.doctorImage.public_id) {
            console.log("Removing old image from Cloudinary:", existingDoctor.doctorImage.public_id);
            await cloudinary.uploader.destroy(existingDoctor.doctorImage.public_id);
          }

          // Update doctorImage with new Cloudinary data
          doctorData.doctorImage = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
          };

          console.log("Image uploaded successfully: ", cloudinaryResponse.secure_url);

          // Remove temporary file from the server
          fs.unlinkSync(imageTempPath);
        } catch (error) {
          console.error("Error uploading image: ", error.message);
          fs.unlinkSync(imageTempPath); // Remove temp file if an error occurs
          return res.json({ success: false, message: "Error occurred while uploading the image" });
        }
      }
    }

    // Update the doctor profile in the database
    const updatedDoctor = await doctorModel.findByIdAndUpdate(doctorId, doctorData, { new: true });

    return res.json({ success: true, message: "Doctor profile updated successfully", doctor: updatedDoctor });
  } catch (error) {
    console.error("Error in profile update: ", error.message);
    return res.status(500).json({ success: false, message: error.message + " in catch block of doctor profile update" });
  }
};

const sendDoctorVerificationCode = async (req, res) => {
  const { doctorEmailId } = req.body;

  try {
    const { error } = sendVerificationCodeSchema.validate({ doctorEmailId });
    if (error) {
      return res.status(401).json({ success: false, message: error.details[0].message });
    }

    const existingDoctor = await doctorModel.findOne({ doctorEmailId });
    if (!existingDoctor) {
      return res.status(404).json({ success: false, message: "Doctor does not exist!  bhushan" });
    }
    if (existingDoctor.verified) {
      return res.status(400).json({ success: false, message: "Doctor is already verified!" });
    }

    const codeValue = Math.floor(Math.random() * 1000000).toString();
    let info = await transport.sendMail({
      from: process.env.NODdoctorEmailIdER_SENDING_doctorEmailId_ADDRESS,
      to: existingDoctor.doctorEmailId,
      subject: 'Verification Code',
      html: `<h1>${codeValue}</h1>`,
    });

    if (info.accepted[0] === existingDoctor.doctorEmailId) {
      const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
      existingDoctor.verificationCode = hashedCodeValue;
      existingDoctor.verificationCodeValidation = Date.now();
      await existingDoctor.save();

      return res.status(200).json({ success: true, message: "Code sent successfully!" });
    }

    res.status(500).json({ success: false, message: "Failed to send code!" });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong in sending verification code!" });
  }
};

const verifyDoctorVerificationCode = async (req, res) => {
  const { doctorEmailId, providedCode } = req.body;
  try {
    const { error } = acceptCodeSchema.validate({ doctorEmailId, providedCode });
    if (error) {
      return res.status(401).json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingDoctor = await doctorModel.findOne({ doctorEmailId }).select('+verificationCode +verificationCodeValidation');
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
    // console.log(error);
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
    // console.log(error);
    res.status(500).json({ success: false, message: "Error changing the password!" });
  }
};

const sendDoctorForgotPasswordCode = async (req, res) => {
  const { doctorEmailId } = req.body;
  try {
    // Validate input
    const { error } = sendForgotPasswordCodeSchema.validate({ doctorEmailId });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Check if the doctor exists
    const existingDoctor = await doctorModel.findOne({ doctorEmailId });
    if (!existingDoctor) {
      return res.status(404).json({ success: false, message: "Doctor does not exist!" });
    }

    // Generate random 6-digit code
    const codeValue = Math.floor(Math.random() * 1000000).toString();

    // Send the code via email
    let info = await transport.sendMail({
      from: process.env.NODEMAILER_SENDING_EMAIL_ADDRESS,  // Corrected the env variable
      to: existingDoctor.doctorEmailId,
      subject: 'Forgot Password Code',
      html: `<h1>${codeValue}</h1>`,
    });

    // If the email is accepted, hash the code and store it
    if (info.accepted.includes(existingDoctor.doctorEmailId)) {
      const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
      existingDoctor.forgetPasswordCode = hashedCodeValue;  // Use the correct field name
      existingDoctor.forgetPasswordCodeValidation = Date.now();  // Use the correct field name

      // Save the updated doctor record
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
  const { doctorEmailId, providedCode, newPassword } = req.body;
  console.log(req.body, "this is in doctor verify code ");
  try {
    // Validate input data
    const { error } = acceptFPCodeSchema.validate({ doctorEmailId, providedCode, newPassword });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Find doctor and include forgot password fields
    const existingDoctor = await doctorModel
      .findOne({ doctorEmailId })
      .select("+forgetPasswordCode +forgetPasswordCodeValidation");

    if (!existingDoctor) {
      return res.status(404).json({ success: false, message: "Doctor does not exist!" });
    }

    // Check if code is expired (5-minute limit)
    if (Date.now() - existingDoctor.forgetPasswordCodeValidation > 5 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "Forgot password code expired!" });
    }

    // Hash the provided code and check if it matches
    const hashedCodeValue = hmacProcess(providedCode, process.env.HMAC_VERIFICATION_CODE_SECRET);
    if (hashedCodeValue !== existingDoctor.forgetPasswordCode) {
      return res.status(400).json({ success: false, message: "Invalid forgot password code!" });
    }

    // Hash the new password and update the doctor record
    const hashedPassword = await hashPassword(newPassword, 12);
    existingDoctor.password = hashedPassword;
    existingDoctor.forgetPasswordCode = undefined;
    existingDoctor.forgetPasswordCodeValidation = undefined;

    await existingDoctor.save();

    // Send success response
    res.status(200).json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error resetting the password!" });
  }
};

// Import the appointment model

// Controller to find all appointments for a specific doctor
const getDoctorAppointments = async (req, res) => {
  const { doctorObjectId } = req.params; // Extract doctorObjectId from request parameters
  console.log(doctorObjectId, "this is doctor object id in backend");
  try {
    // Find all appointments where doctorObjectId matches the provided doctorObjectId
    const appointments = await appointmentModel.find({ doctorObjectId });

    // Check if appointments exist
    if (!appointments || appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments found for this doctor",
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


const createDiagnosis = async (req, res) => {
  const {
    appointmentId,
    patientProblemDesc,
    age,
    sex,
    education,
    occupation,
    maritalStatus,
    residence,
    family,
    membersInFamily,
    // identificationMarks,
    reliability,
    previousConsultation,
    consultationDetails,
    birthDevelopment,
    childhoodDisorders,
    homeAtmosphere,
    scholasticActivities,
    vocationHistory,
    menstrualHistory,
    sexualMaritalHistory,
    forensicHistory,
    generalPatternLiving,
    premorbidPersonality,
    relations,
    workLeisure,
    mood,
    character,
    attitudesStandards,
    habits,
    generalAppearance,
    attitude,
    motorBehavior,
    speech,
    cognitiveFunctions,
    moodAffect,
    thought,
    perceptualDisorders,
    judgment,
    insight,
    diagnosticFormulation,
    selectedTests // This is an array of selected online test IDs
  } = req.body;

  const doctorId = req.doctor?.doctorId;  // Get the doctorId from the request

  try {
    // Check if the appointment and doctor exist
    const appointment = await appointmentModel.findById(appointmentId);
    const doctor = await doctorModel.findById(doctorId);

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointment.isAppointmentDiagnosised) {
      return res.status(400).json({ success: false, message: "Appointment already diagnosed" });
    }

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    // Create a new diagnosis entry
    const newDiagnosis = new diagnosisModel({
      appointmentId,
      doctorId,
      patientProblemDesc,
      age,
      sex,
      education,
      occupation,
      maritalStatus,
      residence,
      family,
      membersInFamily,
      // identificationMarks,
      reliability,
      previousConsultation,
      consultationDetails,
      birthDevelopment,
      childhoodDisorders,
      homeAtmosphere,
      scholasticActivities,
      vocationHistory,
      menstrualHistory,
      sexualMaritalHistory,
      forensicHistory,
      generalPatternLiving,
      premorbidPersonality,
      relations,
      workLeisure,
      mood,
      character,
      attitudesStandards,
      habits,
      generalAppearance,
      attitude,
      motorBehavior,
      speech,
      cognitiveFunctions,
      moodAffect,
      thought,
      perceptualDisorders,
      judgment,
      insight,
      diagnosticFormulation,
      onlineTests: selectedTests // Store selected tests
    });

    const savedDiagnosis = await newDiagnosis.save();

    // Push the selected tests (IDs) into the onlineTestIds array of the appointment
    if (selectedTests && selectedTests.length > 0) {
      appointment.onlineTestIds.push(...selectedTests); // Spread selectedTests array into onlineTestIds
    }

    // Mark the appointment as diagnosed
    appointment.isAppointmentDiagnosised = true;

    // Save the updated appointment
    await appointment.save();

    return res.status(201).json({ success: true, message: "Diagnosis completed successfully", diagnosis: savedDiagnosis });

  } catch (error) {
    console.error("Error creating diagnosis:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};



// Function to get all online tests
const getAllOnlineTests = async (req, res) => {
  try {
    // Fetch all online tests from the database
    const onlineTests = await onlineTestModel.find();

    // Check if there are any online tests
    if (onlineTests.length === 0) {
      return res.status(404).json({ success: false, message: "No online tests found" });
    }

    // Return the list of online tests
    return res.status(200).json({ success: true, message: "all online test", onlineTests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message + " in fetching online tests" });
  }
};


const getAllOnlineTestsByAppointmentId = async (req, res) => {
  try {
    const { appointmentId } = req.query;

    const transactions = await onlineTestTransactionModel
      .find({ appointmentId })
      .populate('onlineTestId')
      .populate('appointmentId')  // This requires Appointment model to be registered
      .exec();

    if (transactions.length === 0) {
      return res.status(404).json({ success: false, message: "No online tests found for this appointment" });
    }

    res.status(200).json({
      success: true,
      onlineTests: transactions.map(transaction => ({
        onlineTestId: transaction.onlineTestId._id,
        onlineTestName: transaction.onlineTestId.onlineTestName,
        onlineTestDescription: transaction.onlineTestId.onlineTestDescription,
        totalScore: transaction.totalScore,
        resultDescription: transaction.resultDescription,
        remarksDetailsAnalysis: transaction.remarksDetailsAnalysis,
        consularRemarks: transaction.consularRemarks,
        onlineTestQADetailesLink: transaction.onlineTestQADetailesLink,
        status: transaction.status,

        //appoinment details
        appointmentDetails: {
          appointmentNumber: transaction.appointmentId.appointmentNumber,
          patientName: transaction.appointmentId.patientName,
             //appoinment date and time
          appointmentDate:transaction.appointmentId.appointmentDate,
          appointmentTime:transaction.appointmentId.appointmentTime,
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


import mongoose from "mongoose"


const updateConsularRemarks = async (req, res) => {
  try {
    const { transactionId } = req.params; // Extract transactionId from params
    const { counsellorRemarks } = req.body; // Extract remarks from body

    console.log("Received Transaction ID:", transactionId);
    console.log("Received Counsellor Remarks:", counsellorRemarks);

    // Check if transactionId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ success: false, message: "Invalid transaction ID format" });
    }

    // if (!counsellorRemarks) {
    //   return res.status(400).json({ success: false, message: "Consular remarks are required" });
    // }

    // Find the document by onlineTestId
    const existingTransaction = await onlineTestTransactionModel.findOne({ onlineTestId: transactionId });

    // Check if remarks have already been added
    if (existingTransaction && existingTransaction.counsellorRemarks) {
   return  await res.status(400).json({ success: false, message: "Remarks already added. " });
    }

  if (!counsellorRemarks) {
      return res.status(400).json({ success: false, message: "Consular remarks are required" });
    }


    // Update counsellorRemarks if it hasn't been added yet
    const updatedTransaction = await onlineTestTransactionModel.findOneAndUpdate(
      { onlineTestId: transactionId }, // Match using onlineTestId
      { counsellorRemarks },
      { new: true } // Return the updated document
    );


    if (!updatedTransaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({
      success: true,
      message: "Counsellor remarks added successfully",
      updatedTransaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message  });
  }
};




// import mongoose from "mongoose";
import PDFDocument from "pdfkit";
// import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
// import onlineTestTransactionModel from "./models/onlineTestTransaction"; // Adjust model import path as needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Function to generate doctor report PDF
const generateDoctorReportPDF = async (req, res) => {
  try {
    const { appointmentId } = req.query; 
    console.log("Received Appointment ID:", appointmentId);
   
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Please provide an appointment ID",
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID format",
      });
    }
   
    const transactions = await onlineTestTransactionModel.find({ appointmentId })
      .populate("appointmentId")
      .populate("onlineTestId")
      .exec();


  
    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found for the provided appointment ID",
      });
    }




    // for (const transaction of transactions) {
    //   if (!transaction.counsellorRemarks) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Counselor remarks are required",
    //     });
    //   }
    // }


    console.log("i am in the start");
    console.log("i am in the middle");


    // Generate PDF in memory
    const pdfDoc = new PDFDocument();
    const pdfChunks = [];

    pdfDoc.on("data", (chunk) => pdfChunks.push(chunk));
    pdfDoc.on("end", async () => {
      const pdfBuffer = Buffer.concat(pdfChunks);

      // Save the PDF buffer as a temporary file or use it for direct upload
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "DoctorReports",
              public_id: `DoctorReport_${appointmentId}.pdf`, // Add .pdf extension
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          uploadStream.end(pdfBuffer);
        });

        // Save the PDF URL in the completeAnaylysisReportLink field
        await onlineTestTransactionModel.updateMany(
          { appointmentId },
          { completeAnaylysisReportLink: result.secure_url }
        );

        // Respond with the Cloudinary URL
        res.status(201).json({
          success: true,
          message: "Report generated and uploaded successfully",
          reportPDFLink: result.secure_url,
        });
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to upload PDF to Cloudinary",
        });
      }
    });

    // Begin writing content to the PDF
    pdfDoc.fontSize(16).text("Counsellor Report", { align: "center" });
    pdfDoc.moveDown()

    transactions.forEach((transaction) => {
      pdfDoc.fontSize(14).text(`Appointment No.: ${transaction.appointmentId.appointmentNumber}`, { align: "center" });
      pdfDoc.moveDown();
      pdfDoc.text(`Online Test Name: ${transaction.onlineTestId.onlineTestName}`);
      pdfDoc.text(`Client Name: ${transaction.appointmentId.patientName}`);
      pdfDoc.text(`Counsellor Name: ${transaction.appointmentId.doctorData.doctorName}`);
      pdfDoc.text(`Total Score: ${transaction.totalScore}`);
      pdfDoc.text(`Result Description: ${transaction.resultDescription}`);
      pdfDoc.text(`Interpretation: ${transaction.interpretation}`);
      pdfDoc.moveDown();
      pdfDoc.text(`Recommendations: ${transaction.recommendations}`);
      pdfDoc.moveDown();
      pdfDoc.text(`Actions: ${transaction.actions}`);
      pdfDoc.moveDown();
      // pdfDoc.text(`Counsellor Remarks: ${transaction.counsellorRemarks}`);
      pdfDoc.text(`Status: ${transaction.status}`);
      pdfDoc.moveDown().moveDown();
    });

    pdfDoc.end();
  } catch (error) {
    console.error("Error generating or uploading PDF:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while generating or uploading the report",
    });
  }
};




export { loginDoctor, getDoctor, createDiagnosis, getAppointmentById, logoutDoctor, updateDoctorProfile, sendDoctorVerificationCode, verifyDoctorVerificationCode, changeDoctorPassword, sendDoctorForgotPasswordCode, verifyDoctorForgotPasswordCode, getDoctorAppointments, getAllOnlineTests, getAllOnlineTestsByAppointmentId ,updateConsularRemarks,generateDoctorReportPDF};

