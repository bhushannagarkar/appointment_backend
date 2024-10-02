import mongoose from "mongoose";

const adminSchema=mongoose.Schema(
    {
    email:{
        type:String,
        required:[true,'Email is required'],
        trim:true,
        unique:[true,'Email must be unique'],
        minLength:[6,'Email must have 6 character!'],
        lowercase:true,
    },
    password:{
        type:String,
        required:[true,'Password must be provided'],
        trim:true,
        select:false,
    },
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
},
{
    timestamps: true,
}
);

const adminModel = mongoose.models.user || mongoose.model("admin", adminSchema);
export default adminModel;