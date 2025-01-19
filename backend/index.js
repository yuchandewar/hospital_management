const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = 4000;
const MONGO_URI = 'mongodb+srv://yuchandewar:GBXDMnfHnRhTfuuP@cluster0.ut37e.mongodb.net/try';

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database Connection
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// MongoDB Schema and Model
const hospitalSchema = new mongoose.Schema({
  hospitalId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  hospitalName: { type: String, required: true },
  appointments: [
    {
      patientName: String,
      patientAge: Number,
      doctor: String,
      condition: String,
      status: String,
      date: Date,
    },
  ],
  doctors: [{ name: String, specialization: String, status: String, age: Number }],
  Livestatus: {
              activate: {
                type: Boolean,
                default:false
              },
              ambulance: {
                type: Number, // This defines an array of strings
                default:0
              },
              doctor: {
                type: Number, // This defines an array of strings
                default:0
              },
              beds: {
                type: Number, // This defines an array of strings
                default:0
              },
              type: {
                type: String, // This defines an array of strings
                default:"GENERAL"
              },
              time: {
                type: String, // This defines an array of strings
                default: new Date().toLocaleTimeString()
              },
  }
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

// Routes

// Register a new hospital
app.post('/api/hospitals/register', async (req, res) => {
  const { hospitalId, password, hospitalName } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newHospital = new Hospital({
      hospitalId: hospitalId,
      password: hashedPassword,
      hospitalName: hospitalName,
    });

    await newHospital.save();
    res.status(201).json({ message: 'Hospital registered successfully!' });
    console.log("done")
  } catch (error) {
    console.log("crash")
    res.status(500).json({ error: 'Failed to register hospital', details: error });
  }
});

// Login a hospital
app.post('/api/hospitals/login', async (req, res) => {
  const { hospitalId, password } = req.body;

  try {
    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, hospital.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', hospitalId: hospital.hospitalId });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error });
  }
});

// Get hospital data
app.get('/api/hospitals/:hospitalId', async (req, res) => {
  const { hospitalId } = req.params;

  if (!hospitalId) {
    return res.status(400).json({ error: 'Hospital ID is required' });
  }

  try {
    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    console.log(hospital);
    return res.json(hospital);
  } catch (error) {
    console.log("Crash")
    res.status(500).json({ error: 'Failed to fetch hospital data', details: error });
  }
});

// Update hospital data
app.put('/api/hospitals/:hospitalId', async (req, res) => {
  const { hospitalId } = req.params;
  const { beds, ambulances, doctors, appointments } = req.body;

  try {
    const updatedHospital = await Hospital.findOneAndUpdate(
      { hospitalId },
      { beds, ambulances, doctors, appointments },
      { new: true }
    );

    if (!updatedHospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json(updatedHospital);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hospital data', details: error });
  }
});


// Update live status of a hospital
app.put('/hospitals/:id/livestatus', async (req, res) => {
  console.log('here')
  try {
    const updates = req.body;
    console.log(updates)
    const hospital = await Hospital.findOneAndUpdate(
      { hospitalId: req.params.id },
      { $set: { Livestatus: updates } },
      { new: true }
    );
    if (!hospital) return res.status(404).send({ message: 'Hospital not found' });
    res.status(200).send(hospital);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});
// Update live status of a hospital
app.put('/hospitals/:id/livestatus/toggleactivate', async (req, res) => {
  try {
    const { activate } = req.body;
    const hospital = await Hospital.findOneAndUpdate(
      { hospitalId: req.params.id },
      { $set: { 'Livestatus.activate': activate } },
      { new: true }
    );
    if (!hospital) return res.status(404).send({ message: 'Hospital not found' });
    res.status(200).send(hospital);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});



// Add a new doctor
app.post('/hospitals/:id/doctors', async (req, res) => {
  try {
    const { name, specialization, status, age } = req.body;
    
    const hospital = await Hospital.findOne({ hospitalId: req.params.id });
    if (!hospital) return res.status(404).send({ message: 'Hospital not found' });
    
    hospital.doctors.push({ name, specialization, status, age });
    await hospital.save();
    res.status(201).send({ message: 'Doctor added successfully', hospital });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});
 
// Delete a doctor
app.delete('/hospitals/:id/doctors/:doctorName', async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ hospitalId: req.params.id });
    if (!hospital) return res.status(404).send({ message: 'Hospital not found' });

    hospital.doctors = hospital.doctors.filter(doc => doc.name !== req.params.doctorName);
    await hospital.save();
    res.status(200).send({ message: 'Doctor deleted successfully', hospital });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


// Add a new patient appointment
app.post('/hospitals/:id/appointments', async (req, res) => {
  try {
    const { patientName, patientAge, doctor, status, condition, date } = req.body;
    const hospital = await Hospital.findOne({ hospitalId: req.params.id });
    if (!hospital) return res.status(404).send({ message: 'Hospital not found' });

    hospital.appointments.push({ patientName, patientAge, doctor,status, condition, date });
    await hospital.save();
    console.log("done")
    res.status(201).send({ message: 'Appointment added successfully', hospital });
  } catch (error) {
    console.log("crash")
    res.status(500).send({ error: error.message });
  }
});



// Define the API endpoint to fetch all hospitals
app.get("/api/hospitals", async (req, res) => {
  try {
    const hospitals = await Hospital.find(); // Fetch all documents in the collection
    res.status(200).json(hospitals);
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
