import mongoose from "mongoose";

const doctorSchema=new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    image: {
      public_id: String,
      url: String,
     },
     speciality: { type: String, required: true }, 
     degree: { type: String, required: true },
     experience: { type: String, required: true },
     about: { type: String, required: true },
     available:{type:Boolean,default:true},
     slots_booked:{type:Object,default:{}},
     address:{type:Object,required:true},
     date:{type:Number,required:true},
     verified:{
        type:Boolean,
        select:false,
    },
    verificationCode:{
        type:String,
        select:false,
    },
    verificationCodeValidation:{
        type:Number,
        select:false,
    },
    forgetPasswordCode:{
        type:String,
        select:false,
    },
    forgetPasswordCodeValidation:{
        type:Number,
        select:false,
    },
},{
    timestamps: true,
});
const doctorModel=mongoose.model.doctor || mongoose.model("doctor",doctorSchema);
export default doctorModel;