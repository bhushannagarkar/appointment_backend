import mongoose from "mongoose";

// Create the diagnosis schema
const diagnosisSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "appointment", required: true }, // Reference to the appointment
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", required: true }, // Reference to the doctor
  
  // patientName: { type: String, required: true },
  // patientEmailId: { type: String, required: true },
  // date: { type: Date, required: true },
  // time: { type: String, required: true },
  
  // Patient details
  age: { type: Number,  },
  sex: { type: String, },
  // address: { type: String, required: true },
  // contactNo: { type: String, required: true },
  education: { type: String },
  occupation: { type: String },
  maritalStatus: { type: String },
  residence: { type: String },
  family: { type: String },
  membersInFamily: { type: Number },
  identificationMarks: { type: String },
  reliability: { type: String },
  
  // Medical history
  previousConsultation: { type: String },
  consultationDetails: { type: String },
  birthDevelopment: { type: String },
  childhoodDisorders: { type: String },
  homeAtmosphere: { type: String },
  scholasticActivities: { type: String },
  vocationHistory: { type: String },
  menstrualHistory: { type: String }, // Added field
  sexualMaritalHistory: { type: String }, // Added field
  forensicHistory: { type: String }, // Added field
  generalPatternLiving: { type: String }, // Added field
  premorbidPersonality: { type: String }, // Added field
  relations: { type: String }, // Added field
  workLeisure: { type: String }, // Added field
  
  // Current status
  mood: { type: String }, // Added field
  character: { type: String }, // Added field
  attitudesStandards: { type: String }, // Added field
  habits: { type: String }, // Added field
  generalAppearance: { type: String }, // Added field
  attitude: { type: String }, // Added field
  motorBehavior: { type: String }, // Added field
  speech: { type: String }, // Added field
  cognitiveFunctions: { type: String }, // Added field
  moodAffect: { type: String }, // Added field
  thought: { type: String }, // Added field
  perceptualDisorders: { type: String }, // Added field
  judgment: { type: String }, // Added field
  insight: { type: String }, // Added field
  diagnosticFormulation: { type: String }, // Added field


  //consuler analysis add this field

    // Add onlineTests field (Array of ObjectIds referencing the OnlineTest model)
    onlineTests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnlineTest'  // Reference to the OnlineTest model
    }],

}, {
  timestamps: true,
});

const diagnosisModel = mongoose.models.diagnosis || mongoose.model("diagnosis", diagnosisSchema);
export default diagnosisModel;
