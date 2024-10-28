import createGoogleMeetEvent from "../middleware/createGoogleMeetEvent.js";
import sendEmailNotification from "../middleware/sendEmailNotification.js";
import { appointmentSchema, cancelAppointmentSchema, onlineTestSchema, onlineTestTransactionSchema, rescheduleAppointmentSchema, switchDoctorAppointmentSchema } from "../middleware/validator.js";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import getNextAppointmentNumber from "../utils/getNextAppointmentNumber.js";
import onlineTestTransactionModel from "../models/onlineTestTransactionModel.js";
import formatAppointmentDate from "../utils/formatAppointmentDate.js";

// import onlineTestTransactionModel from "../models/onlineTestTransactionModel.js";
const bookAppointment = async (req, res) => {
    try {
      const {
        doctorObjectId,
        // Patient information
        patientEmailId,
        patientName,
        patientMobileNo,
        patientWhatsappNo,
        patientLocation,
        patientAddress,
        patientProblemDesc,
        patientPinCode,
        appointmentDate,
        appointmentTime,
        consentFormReadSignedAgreed,
        isOnlineOrOffline // New field added here
      } = req.body;
  
      console.log(patientName, "name from frontend");
  
      // Validate input data, including the new field
      const { error, value } = appointmentSchema.validate({
        doctorObjectId,
        patientEmailId,
        patientName,
        patientMobileNo,
        patientWhatsappNo,
        patientLocation,
        patientAddress,
        patientProblemDesc,
        patientPinCode,
        appointmentDate,
        appointmentTime,
        consentFormReadSignedAgreed,
        isOnlineOrOffline // Ensure this is validated as well
      });
  
      if (error) {
        return res.status(402).json({ success: false, message: error.details[0].message });
      }
  
      // Check if the doctor exists and is registered by the admin
      const doctorData = await doctorModel.findById(doctorObjectId).select("-password");
  
      if (!doctorData) {
        return res.status(401).json({ success: false, message: 'This doctor is not registered by admin!' });
      }
  
      if (!doctorData.available) {
        return res.status(401).json({ success: false, message: 'Doctor Not Available!' });
      }
  
      // Check if the user has already booked 2 appointments on the same day with any doctor
      const existingAppointments = await appointmentModel.find({
        patientEmailId,
        appointmentDate,
        isAppointmentCancelled: false, // Ignore cancelled appointments
      });
  
      if (existingAppointments.length >= 2) {
        return res.status(400).json({ success: false, message: 'You cannot book more than two appointments on the same day with any doctor.' });
      }
  
      // Check if the slot is available for this doctor
      let slots_booked = doctorData.slots_booked || {};
      if (slots_booked[appointmentDate]) {
        if (slots_booked[appointmentDate].includes(appointmentTime)) {
          return res.status(401).json({ success: false, message: 'Slot Not Available!' });
        } else {
          slots_booked[appointmentDate].push(appointmentTime);
        }
      } else {
        slots_booked[appointmentDate] = [];
        slots_booked[appointmentDate].push(appointmentTime);
      }
  
      // Update the doctor's booked slots
      await doctorModel.findByIdAndUpdate(doctorObjectId, { slots_booked });
  
      // Get the next appointment number
      const appointmentNumber = await getNextAppointmentNumber();
  
      // Save the new appointment
      const appointmentData = {
        appointmentNumber,
        doctorObjectId,
        // Patient information
        patientEmailId,
        patientName,
        patientMobileNo,
        patientWhatsappNo,
        patientLocation,
        patientAddress,
        patientProblemDesc,
        patientPinCode,
        appointmentDate,
        appointmentTime,
        consentFormReadSignedAgreed,
        doctorData,
        date: Date.now(),
        isOnlineOrOffline, // Add the new field here
      };
  
      const newAppointment = new appointmentModel(appointmentData);
      await newAppointment.save();
  
      // Optionally, generate Google Meet link if it's an online appointment
      if (isOnlineOrOffline === "online") {
        // const googleMeetLink = await createGoogleMeetEvent(patientEmailId, doctorData.email, appointmentDate, appointmentTime);
        // console.log(googleMeetLink, 'google meet link in appointment');
      }
  
      // Send email notification

     // or 'offline'

const appointmentMessage = isOnlineOrOffline === 'online' 
  ? 'Your appointment mode is online. Please join the Google Meet .' 
  : 'Your appointment mode is offline. Please visit the counsellor office at the scheduled time.';


      await sendEmailNotification(
        newAppointment.patientEmailId,
        'Psycortex Pvt. Ltd. Appointment Confirmation',
        `"Thank you for visiting Psycortex Pvt. Ltd." Your appointment is confirmed. Your appointment ID is ${newAppointment.appointmentNumber}, and counsellor is ${doctorData.doctorName}. Appointment date is ${formatAppointmentDate(appointmentDate)}, and appointment time is ${appointmentTime}. ${appointmentMessage } `
      );
  
      return res.status(200).json({
        success: true,
        message: 'Appointment Booked Successfully',
        appointment: newAppointment
      });
    } catch (error) {
      res.status(500).json({ success: false, message: `Error in Booking Appointment: ${error.message}` });
    }
  };
  

const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        // Validate input data
        const { error, value } = cancelAppointmentSchema.validate({ appointmentId });

        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        // Find the appointment by ID
        const appointment = await appointmentModel.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Check if the appointment is already cancelled
        if (appointment.isAppointmentCancelled) {
            return res.status(400).json({ success: false, message: 'Appointment is already cancelled' });
        }

        // Find all canceled appointments by the same patient email
        // const previousCancellations = await appointmentModel.find({
        //     patientEmail: appointment.patientEmail,
        //     isAppointmentCancelled: true
        // });



            const now = new Date();
            console.log(now, "this is now");
            
            // Split the `DD_MM_YYYY` format into its parts
            let [day, month, year]= appointment.appointmentDate.split('_').map(Number); // Extract day, month, year
            
            // Create a Date object using the extracted day, month (subtracting 1 since months are 0-indexed), and year
            const formattedAppointmentDate = new Date(year, month - 1, day); 
            
            console.log(formattedAppointmentDate,"this is formatted date",);
            // Log the raw appointment time
            console.log(appointment.appointmentTime, "appointment time");
            
            // Parse the appointment time in "hh:mm AM/PM" format
            let [time, modifier] = appointment.appointmentTime.split(' '); // Split time from AM/PM
            let [hours, minutes] = time.split(':').map(Number); // Split hours and minutes
            
            // Adjust hours for 24-hour format
            if (modifier === 'PM' && hours < 12) {
                hours += 12; // Convert PM hour to 24-hour format
            }
            if (modifier === 'AM' && hours === 12) {
                hours = 0; // Midnight case
            }
            
            // Log the parsed hours and minutes
            console.log(hours, "hours");
            console.log(minutes, "minutes");
            
            // Check for NaN values
            if (isNaN(hours) || isNaN(minutes)) {
                console.error("Parsed hours or minutes are NaN:", { hours, minutes });
                return res.status(400).json({ success: false, message: 'Invalid appointment time values' });
            }
            
            // Set the hours and minutes for the date object
            formattedAppointmentDate.setHours(hours, minutes, 0, 0); 
            
            console.log(formattedAppointmentDate, "appointment date time");
            
            // Calculate the difference in hours
            const hoursDifference = (formattedAppointmentDate - now) / (1000 * 60 * 60); // Difference in hours
            console.log("hoursDifference", hoursDifference);
            
            if (hoursDifference <= 6) {
                return res.status(400).json({ success: false, message: 'Appointment cannot be cancelled within 6 hours of the scheduled time' });
            }
            

    //  console.log(previousCancellations);
    //     // If the user has already canceled an appointment, block further cancellations
    //     if (previousCancellations.length > 0) {
    //         return res.status(403).json({ success: false, message: 'You have already cancelled one appointment. Further cancellations are not allowed.' });
    //     }


        // Mark the appointment as cancelled
        appointment.isAppointmentCancelled = true;
        appointment.appointmentCancelledDateTimeStamp = now;
        await appointment.save();

        // Free up the slot in the doctor's schedule
        const doctorData = await doctorModel.findById(appointment.doctorObjectId);

        if (!doctorData) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const slotsBooked = doctorData.slots_booked || {};
        if (slotsBooked[appointment.appointmentDate]) {
            slotsBooked[appointment.appointmentDate] = slotsBooked[appointment.appointmentDate].filter(time => time !== appointment.appointmentTime);
            await doctorModel.findByIdAndUpdate(
                appointment.doctorObjectId,
                { slots_booked: slotsBooked }
            );
        }

        // Optionally: Send an email notification for cancellation
        // await sendEmailNotification(appointment.patientEmaild, 'Appointment Cancelled', 'Your appointment has been successfully cancelled.');


        await sendEmailNotification(appointment.patientEmailId,
            'Psycortex Pvt. Ltd. Appointment Cancelation', ` "Thank you for visit Psycortex Pvt. Ltd." Your appointment is canceled. your appointment id is ${appointment.appointmentNumber} and counsellor is ${doctorData.doctorName}  appointment date is  ${formatAppointmentDate(appointment.appointmentDate)},and appointment time is  ${appointment.appointmentTime},`);

        return res.status(200).json({ success: true, message: 'Appointment cancelled successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: `Error in cancelling appointment: ${error.message}` });
    }
};

const rescheduleAppointment = async (req, res) => {
    try {
        const { appointmentId, newAppointmentDate, newAppointmentTime } = req.body;

        // Validate the input data
        const { error, value } = rescheduleAppointmentSchema.validate({
            appointmentId, newAppointmentDate, newAppointmentTime
        });

        if (error) {
            return res
                .status(401)
                .json({ success: false, message: error.details[0].message });
        }

        // Find the appointment by its ObjectId
        const appointment = await appointmentModel.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Check if the appointment is already cancelled
        if (appointment.isAppointmentCancelled) {
            return res.status(400).json({ success: false, message: 'Appointment is already cancelled' });
        }

        // Check if the appointment has already been rescheduled
        if (appointment.isAppointmentRescheduled) {
            return res.status(400).json({ success: false, message: 'Appointment has already been rescheduled' });
        }

        // Find the doctor data using doctorObjectId
        const doctorData = await doctorModel.findById(appointment.doctorObjectId);

        if (!doctorData) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        // Check if the new slot is available for the doctor
        let slots_booked = doctorData.slots_booked;

        if (slots_booked[newAppointmentDate] && slots_booked[newAppointmentDate].includes(newAppointmentTime)) {
            return res.status(400).json({ success: false, message: 'The new slot is not available' });
        }

        // Free up the old slot
        if (slots_booked[appointment.appointmentDate]) {
            slots_booked[appointment.appointmentDate] = slots_booked[appointment.appointmentDate].filter(
                time => time !== appointment.appointmentTime
            );
        }

        // Book the new slot
        if (!slots_booked[newAppointmentDate]) {
            slots_booked[newAppointmentDate] = [];
        }
        slots_booked[newAppointmentDate].push(newAppointmentTime);

        // Update the doctor's booked slots
        await doctorModel.findByIdAndUpdate(appointment.doctorObjectId, { slots_booked });

        // Update the appointment details with the new date and time, and mark as rescheduled
        appointment.appointmentDate = newAppointmentDate;
        appointment.appointmentTime = newAppointmentTime;
        appointment.isAppointmentRescheduled = true;
        appointment.appointmentRescheduledDateTimeStamp = new Date(); // Set the reschedule timestamp
        await appointment.save();

        // Optionally, send an email or WhatsApp notification about the reschedule
        // await sendEmailNotification(appointment.patientEmaild, 'Appointment Rescheduled', 'Your appointment has been rescheduled.');

        
        await sendEmailNotification(appointment.patientEmailId,
            'Psycortex Pvt. Ltd. Appointment rescheduled', ` "Thank you for visit Psycortex Pvt. Ltd." Your appointment is rescheduled. your appointment id is ${appointment.appointmentNumber} and counsellor is ${doctorData.doctorName}  appointment new date is  ${formatAppointmentDate(newAppointmentDate)},and new appointment time is  ${newAppointmentTime},`);

        return res.status(200).json({ success: true, message: 'Appointment rescheduled successfully' });
    } catch (error) {
        // console.log(error);
        return res.status(500).json({ success: false, message: `Error in rescheduling appointment: ${error.message}` });
    }
};

const switchDoctorAppointment = async (req, res) => {
    try {
        const { appointmentId, selectedDoctorId, newAppointmentDate, newAppointmentTime, reasonForSwitchDoctor } = req.body;
    console.log(req.body,"all data of switchappointment");
    console.log(appointmentId, selectedDoctorId, newAppointmentDate, newAppointmentTime, reasonForSwitchDoctor ,"all data of switchappointment");
    
        // Validate the input data (assuming Joi schema is predefined for validation)
        const { error } = switchDoctorAppointmentSchema.validate({
            appointmentId,
            selectedDoctorId,
            newAppointmentDate,
            newAppointmentTime,
            reasonForSwitchDoctor
        });

        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        // Find the existing appointment using appointmentId
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found or already cancelled' });
        }

        // Check if the doctor has already been switched for this appointment
        if (appointment.isSwitchedDoctor) {
            return res.status(400).json({ success: false, message: 'Doctor has already been switched for this appointment' });
        }

        // Free up the old doctor's slot
        const oldDoctorData = await doctorModel.findById(appointment.doctorObjectId);
        if (!oldDoctorData) {
            return res.status(404).json({ success: false, message: 'Old doctor not found' });
        }

        let oldDoctorSlotsBooked = oldDoctorData.slots_booked || {};
        if (oldDoctorSlotsBooked[appointment.appointmentDate]) {
            oldDoctorSlotsBooked[appointment.appointmentDate] = oldDoctorSlotsBooked[appointment.appointmentDate].filter(
                time => time !== appointment.appointmentTime
            );
        }

        // Update the old doctor's slots
        await doctorModel.findByIdAndUpdate(appointment.doctorObjectId, { slots_booked: oldDoctorSlotsBooked });

        // Book the new doctor's slot
        const newDoctorData = await doctorModel.findById(selectedDoctorId);
        if (!newDoctorData) {
            return res.status(404).json({ success: false, message: 'New doctor not found' });
        }

        let newDoctorSlotsBooked = newDoctorData.slots_booked || {};
        if (newDoctorSlotsBooked[newAppointmentDate] && newDoctorSlotsBooked[newAppointmentDate].includes(newAppointmentTime)) {
            return res.status(400).json({ success: false, message: 'The new doctor is not available at the requested time' });
        }

        if (!newDoctorSlotsBooked[newAppointmentDate]) {
            newDoctorSlotsBooked[newAppointmentDate] = [];
        }
        newDoctorSlotsBooked[newAppointmentDate].push(newAppointmentTime);

        // Update the new doctor's slots
        await doctorModel.findByIdAndUpdate(newDoctorData._id, { slots_booked: newDoctorSlotsBooked });

        // Update the appointment with the new doctor, new date, and time, and mark it as switched
        appointment.doctorObjectId = newDoctorData._id;
        appointment.doctorData = newDoctorData;
        appointment.appointmentDate = newAppointmentDate;
        appointment.appointmentTime = newAppointmentTime;
        appointment.reasonForSwitchDoctor = reasonForSwitchDoctor;
        appointment.isSwitchedDoctor = true;
        appointment.isSwitchedDoctorDateTimeStamp = new Date(); // Log the time of the switch

        await appointment.save();

        // Optionally, send a notification about the doctor switch
        // await sendEmailNotification(appointment.patientEmailId, 'Doctor switched', 'Doctor switched and appointment updated successfully.');


                
        await sendEmailNotification(appointment.patientEmailId,
            'Psycortex Pvt. Ltd. Appointment switched', ` "Thank you for visit Psycortex Pvt. Ltd." Your appointment counsellor is switched. your appointment id is ${appointment.appointmentNumber} and new counsellor is ${newDoctorData.doctorName}  appointment new date is  ${formatAppointmentDate(newAppointmentDate)},and new appointment time is  ${newAppointmentTime},`);
          
        return res.status(200).json({ success: true, message: 'Counsellor switched and appointment updated successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error in switching doctor: ${error.message}` });
    }
};


const getAllAppointmentsByEmail = async (req, res) => {
    try {
        const { email } = req.params;  // Fetch email from request params
        // Fetch all appointments for the given email
        const appointments = await appointmentModel.find({ 
            patientEmailId: email,  // Match with the patient's email
            isAppointmentCancelled: false  // Exclude cancelled appointments
        }).sort({ appointmentDate: 1 });  // Optional: sort by appointment date in ascending order

        if (appointments.length === 0) {
            return res.status(404).json({ success: false, message: 'No appointments found for this email' });
        }

        return res.status(200).json({
            success: true,
            message: 'Appointments fetched successfully',
            appointments
        });

    } catch (error) {
        // console.log(error);
        res.status(500).json({ success: false, message: `Error in fetching appointments: ${error.message}` });
    }
};

const getAllAppointmentsByEmailOnlyDiagnosis = async (req, res) => {
    try {
        const { email } = req.params;  // Fetch email from request params
        // Fetch all appointments for the given email where isAppointmentDiagnosised is true
        const appointments = await appointmentModel.find({ 
            patientEmailId: email,  // Match with the patient's email
            isAppointmentCancelled: false,  // Exclude cancelled appointments
            isAppointmentDiagnosised: true  // Only include diagnosed appointments
        }).sort({ appointmentDate: 1 })
       .populate('onlineTestIds'); // Optional: sort by appointment date in ascending order

        if (appointments.length === 0) {
            return res.status(404).json({ success: false, message: 'No diagnosed appointments found for this email' });
        }
        return res.status(200).json({
            success: true,
            message: 'Diagnosed appointments fetched successfully',
            appointments
        });
    } catch (error) {
        // console.log(error);
        res.status(500).json({ success: false, message: `Error in fetching diagnosed appointments: ${error.message}` });
    }
};


const addOnlineTestTransaction = async (req, res) => {
    try {
        console.log(req.body);
        // Validate the request body using Joi
        const { error, value } = onlineTestTransactionSchema.validate(req.body);

        // If validation fails, return a 401 response with the error message
        if (error) {
            return res
                .status(401)
                .json({ success: false, message: error.details[0].message });
        }

        const { onlineTestId, appointmentId, totalScore, resultDescription, remarksDetailsAnalysis, consularRemarks } = value;  // Use validated values

        // Create a new online test transaction record
        const newTransaction = new onlineTestTransactionModel({
            onlineTestId,
            appointmentId,
            totalScore,
            resultDescription,
            remarksDetailsAnalysis,
            consularRemarks
        });

        // Save the transaction to the database
        await newTransaction.save();

        // Send success response
        return res.status(201).json({
            success: true,
            message: 'Online test transaction added successfully',
            transaction: newTransaction
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: `Error in adding online test transaction: ${error.message}`
        });
    }
};

import nodemailer from 'nodemailer';


import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';

const sendQuetionpdf = async (req, res) => {
    try {
      // console.log(req.body, "This is request body", req.file.path, "this is file path");
      const pdfPath = req.file.path;
  
      console.log(req.body,"this is req body");

      console.log(req.body.actions,"this is req.body");
      console.log(Array.isArray(req.body.actions),"this is array or not");
      // formData.append('recommendations', recommendations);
      // formData.append('actions', actions);



      // Validate the request body against the onlineTestSchema
      const { error, value } = onlineTestSchema.validate(req.body);
  
      if (error) {
        return res.status(401).json({ success: false, message: error.details[0].message });
      }
  
    // Check if the online test is already completed for this appointment
const existingTransaction = await onlineTestTransactionModel.findOne({
    onlineTestId: req.body.onlineTestId,
    appointmentId: req.body.appointmentId,
 // Ensure this is specific to the appointment
    status: 'completed'
  });
  

  if (existingTransaction) {
    return res.status(400).json({
      success: false,
      message: 'Online test is already completed for this appointment.'
    });
  }
      // Upload the PDF to Cloudinary
      const cloudinaryResponse = await cloudinary.uploader.upload(pdfPath, {
        resource_type: 'raw', // 'raw' is for non-image files like PDFs
        folder: "OnlineTestResults"
      });
  
      if (!cloudinaryResponse || cloudinaryResponse.error) {
        fs.unlinkSync(pdfPath); // Delete local file in case of failure
        return res.json({ success: false, message: "Failed to upload PDF to Cloudinary" });
      }
  
      // Delete the PDF file from local storage after upload
      fs.unlinkSync(pdfPath);
  
      // Cloudinary PDF URL
      const onlineTestQADetailesLink = cloudinaryResponse.secure_url;
  
      // Store the online test transaction data in MongoDB
      const newTransaction = new onlineTestTransactionModel({
        onlineTestId: req.body.onlineTestId,
        appointmentId: req.body.appointmentId,
        totalScore: req.body.totalScore,
        resultDescription: req.body.resultDescription,
        remarksDetailsAnalysis: req.body.remarksDetailsAnalysis,

        //this is interpretation
        interpretation:req.body.interpretation,

        recommendations:req.body.recommendations,
        
        actions:req.body.actions,
        
        consularRemarks: req.body.consularRemarks,
        onlineTestQADetailesLink: onlineTestQADetailesLink, // Store the Cloudinary URL of the PDF
        status: 'completed', // Mark the test as completed
      });
  
      await newTransaction.save();
  
      // Email sending logic (can be uncommented when ready)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        secure: true,
        port: 465,
        auth: {
          user: "bhushan9601@gmail.com",
          pass: "fooe ehew mhzs alnd",
        },
      });
  
      const mailOptions = {
        from: 'bhushan9601@gmail.com',
        to: 'bhushan9601@gmail.com',
        subject: 'Aggression Scale Test Results',
        text: 'Please find attached your aggression scale test results.',
        attachments: [
          {
            filename: 'AggressionScaleTestResults.pdf',
            path: onlineTestQADetailesLink, // Use the Cloudinary URL here
          },
        ],
      };
  
      // Uncomment this block to enable email sending
      // transporter.sendMail(mailOptions, (error, info) => {
      //   if (error) {
      //     return res.status(500).send({ message: 'Error sending email', error });
      //   }
      //   res.send({ message: 'PDF sent successfully', info });
      // });
  
      // Respond with success
      return res.status(201).json({
        success: true,
        message: 'Online test completed successfully',
        transaction: newTransaction,
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error in bhushan: ${error.message}`,
      });
    }
  };
  
  

export {
    bookAppointment,
    cancelAppointment,
    rescheduleAppointment,
    switchDoctorAppointment,
    getAllAppointmentsByEmail,
    getAllAppointmentsByEmailOnlyDiagnosis,
    addOnlineTestTransaction,
    sendQuetionpdf,
}


