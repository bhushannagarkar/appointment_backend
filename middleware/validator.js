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


const cancelAppointmentSchema=Joi.object({
    
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


});





const rescheduleAppointmentSchema=Joi.object({
    
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

    oldSlotDate:Joi.string()
    .required(),

    oldSlotTime:Joi.string()
    .required(),

    newSlotDate:Joi.string()
    .required(),

    newSlotTime:Joi.string()
    .required(),

});





const switchDoctorAppointmentSchema=Joi.object({
    
    userEmail:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),

    oldDoctorEmail:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),

    newDoctorEmail:Joi.string()
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
const acceptCodeSchema=Joi.object({   
    email:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),
    providedCode:Joi.string()
    .min(6)
    .max(6)
    .required()
});



const changePasswordSchema=Joi.object({
    oldPassword:Joi.string()
    .required()
    .min(8)
    .max(20),
  
    newPassword:Joi.string()
    .required()
    .min(8)
    .max(20),
});


const sendForgotPasswordCodeSchema=Joi.object({    
    email:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),

});

const acceptFPCodeSchema=Joi.object({    
    email:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),
    providedCode:Joi.string()
    .required()
    .min(6)
    .max(6),
    
    newPassword:Joi.string()
    .required()
    .min(8)
    .max(20),



});

export {
    registerSchema,
    loginSchema,
    addDoctorSchema,
    appointmentSchema,
    cancelAppointmentSchema,
    rescheduleAppointmentSchema,
    sendVerificationCodeSchema,
    acceptCodeSchema,
    changePasswordSchema,
    sendForgotPasswordCodeSchema,
    acceptFPCodeSchema,
    switchDoctorAppointmentSchema,
   
}