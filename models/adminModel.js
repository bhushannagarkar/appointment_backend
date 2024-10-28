import mongoose from "mongoose";

const adminSchema = mongoose.Schema(
  {
    adminEmailId: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      unique: [true, 'Email must be unique'],
      minLength: [6, 'Email must have 6 characters!'],
      lowercase: true,
    },

    adminPassword: {
      type: String,
      required: [true, 'Password must be provided'],
      trim: true,
      select: false,
    },

    adminName: {
      type: String,
    
    },

    adminLocation:{
      type: String,
     
    },

    adminMobileNo:{
      type: String,
     
    },

    adminWhatsappNo:{
      type: String,
      required: [true, 'Locatin must be provided'], 
    },

    adminImagelink: {
      public_id: String,
      url: String,  
     },

    verified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeValidation: {
      type: Number,
      select: false,
    },
    forgotPasswordCode: {
      type: String,
      select: false,
    },
    forgotPasswordCodeValidation: {
      type: Number,
      select: false,
    },
  },
  { timestamps: true }
);

const adminModel = mongoose.models.admin || mongoose.model("admin", adminSchema);
export default adminModel;
