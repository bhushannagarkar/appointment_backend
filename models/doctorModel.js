import mongoose from "mongoose";

const doctorSchema=new mongoose.Schema({
    
    doctorName:{type:String,required:true},

    doctorSpecialisation:{type:String,required:true},

    doctorLocation:{type:String,required:true},
   
    doctorAddress:{type:String,required:true},

    doctorEmailId:{type:String,required:true,unique:true},

    doctorMobileNo:{type:String,required:true},

    doctorWhatsappNo:{type:String,required:true},

    doctorQualifications:{type:String,required:true},

    doctorImage: {
        public_id: String,
        url: String,
       },

       doctorProfileLink:{
        url: String,
       },
    password:{type:String,required:true},

     experience: { type: String, required: true },
     about: { type: String, required: true },
     available:{type:Boolean,default:true},
     slots_booked:{type:Object,default:{}},
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

