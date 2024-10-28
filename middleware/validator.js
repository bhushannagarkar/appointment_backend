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

const registerSchemaForAdmin=Joi.object({
    // adminEmailId,
    // adminPassword,
    // adminName,
    // adminLocation,
    // adminMobileNo,
    // adminWhatsappNo

    adminEmailId:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),
    adminPassword:Joi.string()
    .required(),

    adminName:Joi.string()
    .required(),
    
    adminLocation:Joi.string()
    .required(),

    adminMobileNo:Joi.string()
    .required(),

    adminWhatsappNo:Joi.string()
    .required(),

});


const loginSchema=Joi.object({
    doctorEmailId:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),
    password:Joi.string()
    .required(),
   
});

const loginSchemaForAdmin=Joi.object({
    adminEmailId:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),
    adminPassword:Joi.string()
    .required(),
   
});



const addDoctorSchema=Joi.object({
    // doctorName,
    // doctorEmailId,
    // password,
    // doctorSpecialisation,
    // doctorQualifications,
    // experience,
    // about,
    // doctorLocation,
    // doctorAddress,
    // doctorMobileNo,
    // doctorWhatsappNo



    doctorName:Joi.string()
    .required(),

    doctorEmailId:Joi.string()
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

    doctorSpecialisation:Joi.string()
    .required(),

    doctorQualifications:Joi.string()
    .required(),

    experience:Joi.string()
    .required(),
    
    about:Joi.string()
    .required(),

    doctorLocation :Joi.string()
    .required(), 

    
    doctorAddress :Joi.string()
    .required(), 
   
    doctorMobileNo:Joi.string()
    .required(), 

     
    doctorWhatsappNo:Joi.string()
    .required(), 
});


const updateDoctorSchema=Joi.object({
    doctorName:Joi.string()
    .required(),

    doctorEmailId:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),

    doctorSpecialisation:Joi.string()
    .required(),

    doctorQualifications:Joi.string()
    .required(),

    experience:Joi.string()
    .required(),
    
    about:Joi.string()
    .required(),

    doctorLocation :Joi.string()
    .required(), 

    
    doctorAddress :Joi.string()
    .required(), 
   
    doctorMobileNo:Joi.string()
    .required(), 

     
    doctorWhatsappNo:Joi.string()
    .required(), 
});


const appointmentSchema = Joi.object({
  doctorObjectId: Joi.string()
      .required(),

  patientEmailId: Joi.string()
      .min(6)
      .max(60)
      .required()
      .email({
          tlds: { allow: ['com', 'net'] },
      }),
      patientName: Joi.string()
      .max(30)
      .required(),


  patientMobileNo: Joi.string()
      .pattern(/^[6-9]\d{9}$/)  // This regex ensures the number starts with 6, 7, 8, or 9 and has 10 digits
      .required()
      .messages({
          'string.pattern.base': 'Mobile number must be a valid 10-digit number starting with 6-9.',
          'string.empty': 'Mobile number is required.',
      }),

  patientWhatsappNo: Joi.string()
      .pattern(/^[6-9]\d{9}$/)  // This regex ensures the number starts with 6, 7, 8, or 9 and has 10 digits
      .required()
      .messages({
          'string.pattern.base': 'Whatsapp number must be a valid 10-digit number starting with 6-9.',
          'string.empty': 'Whatsapp number is required.',
      }),

  patientLocation: Joi.string()
      .required(),



      patientAddress: Joi.string()
      .required()
      .pattern(/^[a-zA-Z0-9\s,.#-]+$/) // Adjust the regex based on allowed characters
      .min(5) // Minimum length for address (adjust as needed)
      .max(100),



  patientProblemDesc: Joi.string()
      .required()
      .min(10) // Minimum length for address (adjust as needed)
      .max(100),


  patientPinCode: Joi.string()
      .pattern(/^[1-9][0-9]{5}$/)  // This regex ensures the pin code is a 6-digit number, not starting with 0
      .required()
      .messages({
          'string.pattern.base': 'Pin code must be a valid 6-digit number.',
          'string.empty': 'Pin code is required.',
      }),

  appointmentDate: Joi.string()
      .required(),

  appointmentTime: Joi.string()
      .required(),

  consentFormReadSignedAgreed: Joi.boolean()
      .valid(true)  // This ensures the value is true (checkbox is checked)
      .required()
      .messages({
          'any.only': 'You must agree to the consent form by checking the box.',
          'boolean.base': 'Invalid value for consent.',
      }),

  isOnlineOrOffline: Joi.string()
      .valid("online", "offline")  // This ensures only "online" or "offline" values are accepted
      .required()
      .messages({
          'any.only': 'Appointment mode must be either "online" or "offline".',
          'string.empty': 'Appointment mode is required.',
      })

});


const diagnosisSchema = Joi.object({
  appointmentId: Joi.string()
    .required()
    .regex(/^[a-fA-F0-9]{24}$/) // Assuming MongoDB ObjectId format
    .messages({
      'string.pattern.base': 'Appointment ID must be a valid ObjectId.',
    }),

  age: Joi.number()
    .required()
    .messages({
      'number.base': 'Age must be a number.',
      'number.empty': 'Age is required.',
    }),

  sex: Joi.string()
    .required()
    .messages({
      'string.empty': 'Gender is required.',
      // Uncomment the line below if you want to restrict to certain values
      // 'any.only': 'Sex must be either male, female, or other.'
    }),

  education: Joi.string()
    .allow(null, ''),

  occupation: Joi.string()
    .allow(null, ''),

  maritalStatus: Joi.string()
    .allow(null, ''),

  residence: Joi.string()
    .allow(null, ''),

  family: Joi.string()
    .allow(null, ''),

  membersInFamily: Joi.number()
    .allow(null, ''),

  identificationMarks: Joi.string()
    .allow(null, ''),

  reliability: Joi.string()
    .allow(null, ''),

  previousConsultation: Joi.string()
    .allow(null, ''),

  consultationDetails: Joi.string()
    .allow(null, ''),

  birthDevelopment: Joi.string()
    .allow(null, ''),

  childhoodDisorders: Joi.string()
    .allow(null, ''),

  homeAtmosphere: Joi.string()
    .allow(null, ''),

  scholasticActivities: Joi.string()
    .allow(null, ''),

  vocationHistory: Joi.string()
    .allow(null, ''),

  menstrualHistory: Joi.string()
    .allow(null, ''),

  sexualMaritalHistory: Joi.string()
    .allow(null, ''),

  forensicHistory: Joi.string()
    .allow(null, ''),

  generalPatternLiving: Joi.string()
    .allow(null, ''),

  premorbidPersonality: Joi.string()
    .allow(null, ''),

  relations: Joi.string()
    .allow(null, ''),

  workLeisure: Joi.string()
    .allow(null, ''),

  mood: Joi.string()
    .allow(null, ''),

  character: Joi.string()
    .allow(null, ''),

  attitudesStandards: Joi.string()
    .allow(null, ''),

  habits: Joi.string()
    .allow(null, ''),

  generalAppearance: Joi.string()
    .allow(null, ''),

  attitude: Joi.string()
    .allow(null, ''),

  motorBehavior: Joi.string()
    .allow(null, ''),

  speech: Joi.string()
    .allow(null, ''),

  cognitiveFunctions: Joi.string()
    .allow(null, ''),

  moodAffect: Joi.string()
    .allow(null, ''),

  thought: Joi.string()
    .allow(null, ''),

  perceptualDisorders: Joi.string()
    .allow(null, ''),

  judgment: Joi.string()
    .allow(null, ''),

  insight: Joi.string()
    .allow(null, ''),

  diagnosticFormulation: Joi.string()
    .allow(null, ''),

  selectedTests: Joi.array() // Assuming selectedTests is an array
    .allow(null, '')
    .messages({
      'array.base': 'Selected tests must be an array.'
    }),

  patientProblemDesc: Joi.string() // Add patientProblemDesc for validation
    .allow(null, ''),
});

const cancelAppointmentSchema=Joi.object({   
    appointmentId:Joi.string()
            .required()     
});


const rescheduleAppointmentSchema=Joi.object({
    appointmentId:Joi.string()
    .required() ,
    newAppointmentDate:Joi.string()
    .required(),
    newAppointmentTime:Joi.string()
    .required(),

});


const switchDoctorAppointmentSchema=Joi.object({
  

    appointmentId:Joi.string()
    .required()
    ,
    selectedDoctorId:Joi.string()
    .required()
    ,
    newAppointmentDate:Joi.string()
    .required()
    ,
    newAppointmentTime:Joi.string()
    .required()
    ,
    reasonForSwitchDoctor:Joi.string()
    .required()
    ,
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
    doctorEmailId:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),

});


const sendForgotPasswordCodeForAdminSchema=Joi.object({    
  adminEmailId:Joi.string()
  .min(6)
  .max(60)
  .required()
  .email({
      tlds:{allow:['com','net']},
  }),

});

const acceptFPCodeSchema=Joi.object({    
    doctorEmailId:Joi.string()
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

const acceptFPCodeForAdminSchema=Joi.object({    
  adminEmailId:Joi.string()
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


const onlineTestTransactionSchema = Joi.object({
  onlineTestId: Joi.string().required(), // Must be a required string (ObjectId as a string)
  appointmentId: Joi.string().required(), // Must be a required string (ObjectId as a string)
  totalScore: Joi.number().min(0).required(), // Total score is a required number with a minimum value of 0
  resultDescription: Joi.string().max(100).required(), // Result description is a required string with max length of 100
  remarksDetailsAnalysis: Joi.string().max(500).optional(), // Remarks are optional but limited to 500 characters
  consularRemarks: Joi.string().optional() // Consular remarks are optional
});


const onlineTestSchema = Joi.object({
  onlineTestId: Joi.string().required(), // Must be a required string (ObjectId as a string)
  appointmentId: Joi.string().required(), // Must be a required string (ObjectId as a string)
  totalScore: Joi.number().min(0).required(), // Total score is a required number with a minimum value of 0
  testName: Joi.string().max(100),
  message:Joi.string().max(100),
  

  // formData.append('recommendations', recommendations);
  // formData.append('actions', actions);

  interpretation:Joi.string().required(),
  recommendations:Joi.string().required(),

  // actions: Joi.array().items(Joi.string()).required(),
  actions:Joi.string().required(),


   // Result description is a required string with max length of 100
  resultDescription: Joi.string().max(500).optional(), // Remarks are optional but limited to 500 characters
  consularRemarks: Joi.string().optional() // Consular remarks are optional
});



export {
    registerSchemaForAdmin,
    loginSchemaForAdmin,
    registerSchema,
    loginSchema,
    addDoctorSchema,
    updateDoctorSchema,
    appointmentSchema,
    cancelAppointmentSchema,
    rescheduleAppointmentSchema,
    sendVerificationCodeSchema,
    acceptCodeSchema,
    changePasswordSchema,
    sendForgotPasswordCodeSchema,
    acceptFPCodeSchema,
    switchDoctorAppointmentSchema,
    diagnosisSchema,
    sendForgotPasswordCodeForAdminSchema,
    acceptFPCodeForAdminSchema,
    onlineTestTransactionSchema,
    onlineTestSchema,
}