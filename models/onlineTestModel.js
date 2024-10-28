import mongoose from "mongoose";

// Define the schema for online tests
const onlineTestSchema = new mongoose.Schema({
  onlineTestName: { type: String, required: true }, // Test name
  onlineTestDescription: { type: String, required: true }  // Test description
}, { timestamps: true });

// Create the model based on the schema
const onlineTestModel = mongoose.models.onlineTest || mongoose.model("onlineTest", onlineTestSchema);

export default onlineTestModel;
