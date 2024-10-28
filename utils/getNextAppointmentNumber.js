import Counter from '../models/counterModel.js'

const getNextAppointmentNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        {}, // Match all documents
        { $inc: { appointmentNumber: 1 } }, // Increment the appointment number
        { new: true, upsert: true } // Create a new document if it doesn't exist
    );

    return counter.appointmentNumber;
};
export default getNextAppointmentNumber;