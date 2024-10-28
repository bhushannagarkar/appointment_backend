import mongoose from "mongoose";
// import appointmentModel from "./appointment"; 
// Define the schema for online test transactions
const onlineTestTransactionSchema = new mongoose.Schema({
  onlineTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'onlineTest', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },

  totalScore: { type: Number, required: true, min: 0 },

  resultDescription: { type: String,  maxlength: 100 },

  remarksDetailsAnalysis: { type: String, maxlength: 500 },

  interpretation: { type: String },

  recommendations:{ type: String },

  actions:{ type: String },

  counsellorRemarks: { type: String }, 

  onlineTestQADetailesLink: { type: String, },
  completeAnaylysisReportLink: { type: String,  },

  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  // New field to store Cloudinary PDF URL
}, { timestamps: true });


// Ensure uniqueness of each test-appointment combination
onlineTestTransactionSchema.index({ onlineTestId: 1, appointmentId: 1 }, { unique: true });

const onlineTestTransactionModel = mongoose.models.onlineTestTransaction || mongoose.model("onlineTestTransaction", onlineTestTransactionSchema);

export default onlineTestTransactionModel;



