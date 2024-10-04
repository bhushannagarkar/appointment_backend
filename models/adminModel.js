import mongoose from "mongoose";

const adminSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      unique: [true, 'Email must be unique'],
      minLength: [6, 'Email must have 6 characters!'],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password must be provided'],
      trim: true,
      select: false,
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
