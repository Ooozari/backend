import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    prescribedMedication: {
      type: String,
      required: true,
    },
    treatmentNotes: {
      type: String,
      required: true,
    },
    visitedDate: {
      type: Date, // 5AM 30 sep, 2020
      required: true,
    },
    followUpDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const MedicalRecord = mongoose.model(
  "MedicalRecord",
  medicalRecordSchema
);
