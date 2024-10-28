import { google } from 'googleapis';
// import nodemailer from 'nodemailer';
const myclintId="538360044271-c3s8i5p3tun6a5t2kilndeivurdvgdtu.apps.googleusercontent.com";
const myclintSecret="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";
const { OAuth2 } = google.auth;

const oAuth2Client = new OAuth2(
    // 'YOUR_CLIENT_ID', 
    myclintId,
    // 'YOUR_CLIENT_SECRET', 
    myclintSecret,
    'https://developers.google.com/oauthplayground'
    // 'YOUR_REDIRECT_URI'  // typically 'https://developers.google.com/oauthplayground' for testing
);

oAuth2Client.setCredentials({
    // refresh_token: 'YOUR_REFRESH_TOKEN',
    refresh_token:'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'
});


// const createGoogleMeetEvent=async(userEmail, doctorEmail, slotDate, slotTime)=> {
//     const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
//     const eventStartTime = new Date(slotDate + 'T' + slotTime);
//     const eventEndTime = new Date(eventStartTime);
//     eventEndTime.setMinutes(eventEndTime.getMinutes() + 30);  // Assuming the appointment is 30 minutes

//     const event = {
//         summary: `Appointment with ${doctorEmail}`,
//         location: 'Google Meet',
//         description: `Appointment between ${doctorEmail} and ${userEmail}`,
//         start: { dateTime: eventStartTime.toISOString(), timeZone: 'Asia/Kolkata' },
//         end: { dateTime: eventEndTime.toISOString(), timeZone: 'Asia/Kolkata' },
//         attendees: [{ email: userEmail }, { email: doctorEmail }],
//         conferenceData: {
//             createRequest: {
//                 requestId: Math.random().toString(36).substring(2),
//                 conferenceSolutionKey: { type: 'hangoutsMeet' }
//             }
//         },
//     };

//     const res = await calendar.events.insert({
//         calendarId: 'primary',
//         resource: event,
//         conferenceDataVersion: 1,
//     });
//     console.log(res.data.hangoutLink,"meetlink")
//     return res.data.hangoutLink;  // Returns the Google Meet link
// }

const createGoogleMeetEvent = async (userEmail, doctorEmail, slotDate, slotTime) => {
    try {
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        // Combine date and time into a single Date object
        const eventStartTime = new Date(`${slotDate}T${slotTime}`);
        if (isNaN(eventStartTime.getTime())) {
            throw new Error('Invalid start time value');
        }

        // Set the event end time (assuming appointment is 30 minutes long)
        const eventEndTime = new Date(eventStartTime);
        eventEndTime.setMinutes(eventEndTime.getMinutes() + 30);

        if (isNaN(eventEndTime.getTime())) {
            throw new Error('Invalid end time value');
        }

        // Define the event object
        const event = {
            summary: `Appointment with Dr. ${doctorEmail}`,
            location: 'Google Meet',
            description: `This is an appointment between ${doctorEmail} and ${userEmail}.`,
            start: {
                dateTime: eventStartTime.toISOString(),
                timeZone: 'Asia/Kolkata',
            },
            end: {
                dateTime: eventEndTime.toISOString(),
                timeZone: 'Asia/Kolkata',
            },
            attendees: [
                { email: userEmail },
                { email: doctorEmail },
            ],
            conferenceData: {
                createRequest: {
                    requestId: Math.random().toString(36).substring(2),  // Generate unique ID for the conference
                    conferenceSolutionKey: { type: 'hangoutsMeet' },  // Specifies Google Meet
                },
            },
        };

        // Insert the event into Google Calendar
        const response = await calendar.events.insert({
            calendarId: 'primary',  // Assuming the primary calendar is used
            resource: event,
            conferenceDataVersion: 1,  // Required for Google Meet link creation
        });

        // Log and return the Google Meet link
        const meetLink = response.data.hangoutLink;
        console.log('Google Meet Link:', meetLink);
        return meetLink;

    } catch (error) {
        console.error(`Error creating Google Meet event: ${error.message}`);
        throw new Error(`Failed to create Google Meet event: ${error.message}`);
    }
};



export default createGoogleMeetEvent;