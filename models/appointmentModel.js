
import mongoose  from "mongoose";
const appointmentSchema = new mongoose.Schema({
  //appointment number
    appointmentNumber:{type:Number,required: true},
    doctorObjectId: { type: String, required: true },
   //patient information
    patientEmailId: { type: String, required: true },
    patientName:{ type: String, required: true },
    patientMobileNo: { type: String, required: true },
    patientWhatsappNo: { type: String, required: true },
    patientLocation:{ type: String, required: true },
    patientAddress:{ type: String, required: true },
    patientProblemDesc:{ type: String, required: true },
    patientPinCode:{ type: String, required: true },
   //appoinment date and time
    appointmentDate: { type: String, required: true },
    appointmentTime: { type: String, required: true },
    //appointment related time and dates
    appointmentBookedDateTimeStamp:{type:Date},
    appointmentCancelledDateTimeStamp:{type:Date},
    appointmentRescheduledDateTimeStamp:{type:Date},
    appointmentClosedDateTimeStamp:{type:Date},
  //consent form read or not 
    consentFormReadSignedAgreed:{ type: Boolean,required: true },
    //sms utilities send or not 
    sMSSent:{ type: Boolean, default: false },
    whatsApp_Sent:{ type: Boolean, default: false },
    emailSent:{ type: Boolean, default: false },

    doctorData: { type: Object, required: true },

    date: { type: Number, required: true },
    isAppointmentCancelled: { type: Boolean, default: false },
    isappointmentClosed:{ type: Boolean, default: false },
    isAppointmentRescheduled: { type: Boolean, default: false }, 

    isAppointmentDiagnosised: { type: Boolean, default: false }, 

    reasonForSwitchDoctor:{type:String},
    // rescheduledAt: { type: Date }, 
    isSwitchedDoctorDateTimeStamp: { type: Date }, 
    isSwitchedDoctor: { type: Boolean, default: false }, 


      // New field for tracking online or offline mode
  isOnlineOrOffline: { 
    type: String, 
    enum: ["online", "offline"], 
    required: true 
  },

    //for online tests 
   onlineTestIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "onlineTest" }] 
    //isonline or offline
    // New field to track doctor switch
}, { timestamps: true });

// const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);
// export default appointmentModel;


const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
export default Appointment;