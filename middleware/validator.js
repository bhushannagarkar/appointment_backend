import Joi from 'joi';

const registerSchema=Joi.object({
    email:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),
    password:Joi.string()
    .required(),
    
});


const loginSchema=Joi.object({
    email:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),
    password:Joi.string()
    .required(),
    
});

const addDoctorSchema=Joi.object({
    name:Joi.string()
    .required(),

    email:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),

    password:Joi.string()
    .required()
    .min(8)
    .max(20),

    degree:Joi.string()
    .required(),

    experience:Joi.string()
    .required(),

    address:Joi.string()
    .required(),
    
    speciality:Joi.string()
    .required(),

    about :Joi.string()
    .required(), 
   
});





const appointmentSchema=Joi.object({
    
    userEmail:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),

    doctorEmail:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),

    slotDate:Joi.string()
    .required(),

    slotTime:Joi.string()
    .required(),

    whatsAppNumber:Joi.string()
    .required(),
     
    userName:Joi.string()
    .required(),

});

const sendVerificationCodeSchema=Joi.object({
    
    email:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),

});


export {
    registerSchema,
    loginSchema,
    addDoctorSchema,
    appointmentSchema,
    sendVerificationCodeSchema,

}