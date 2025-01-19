// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
// Create the Express app
const app = express();
app.use(express.json());
app.use(cors())
// Connect to MongoDB
const mongoURI = 'mongodb+srv://yuchandewar:GBXDMnfHnRhTfuuP@cluster0.ut37e.mongodb.net/status';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(err => console.error('Connection error:', err));


const userSchema = new mongoose.Schema({
    hospitalName: {
        type: String,
        required: true
      },
      activate: {
        type: Boolean,
        required: true
      },
      ambulance: {
        type: Number, // This defines an array of strings
        required: true
      },
      doctor: {
        type: Number, // This defines an array of strings
        required: true
      },
      beds: {
        type: Number, // This defines an array of strings
        required: true
      },
      type: {
        type: String, // This defines an array of strings
        required: true
      },
      time: {
        type: String, // This defines an array of strings
        required: true
      },

    });
    
    const status = mongoose.model('status', userSchema);


// Endpoint to receive the ID from Server A
app.post('/receive-id', (req, res) => {
    const { id } = req.body;
  
    console.log('Received ID from Server A:', id);
  
    // Respond back to Server A
    res.status(200).json({
      message: 'ID received successfully!',
      receivedId: id,
    });
  });



app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.post('/status', async (req, res) => {
     
    // const{site, username, password} = req.body;
    const { hospitalName, activate, ambulance, doctor, beds, type, time } = req.body;

const newData = new status({
    hospitalName:hospitalName,
    activate:activate,
    ambulance:ambulance,
    doctor:doctor,
    beds:beds,
    type:type,
    time:time,
    
});

newData.save().then((status) => {
console.log('User saved:', status);
res.send("Message is saved")
}).catch((error) => {
console.error('Error saving user:', error);
});

});



// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));