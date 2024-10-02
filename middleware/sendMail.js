import nodemailer from 'nodemailer';

// const transport=nodemailer.createTransport({
//     service:process.env.NODEMAILER_SERVICE,
//     auth:{
//         user: process.env.NODEMAILER_SENDING_EMAIL_ADDRESS,
//         pass: process.env.NODEMAILER_SENDING_EMAIL_PASSWORD,
//     }
// })

const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // Use 465 for SSL/TLS
    secure: false, // true for 465, false for 587
    auth: {
        user:process.env.NODEMAILER_SENDING_EMAIL_ADDRESS,
        pass:process.env.NODEMAILER_SENDING_EMAIL_PASSWORD,
    },
    socketTimeout: 60000, // 60 seconds
    connectionTimeout: 60000 // 60 seconds
});
export default transport;