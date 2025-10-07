import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
     name: {
      type: String,
      required: true,
    },
     age: {
      type: Number,
      required: true,
      min: 0,
    },
     diagnosis: {
      type: String,
      required: true,
    },
     bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
     gender: {
      type: String,
      enum: ["M", "F", "O"],
      required: true,
    },
     admittedIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
}, { timestamps: true });

export const Patient = mongoose.model('Patient', patientSchema);
