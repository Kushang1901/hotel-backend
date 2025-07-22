const express = require('express');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const twilio = require('twilio');

dotenv.config();

oracledb.initOracleClient({ libDir: "C:\\oracle\\instantclient_23_8" });

const app = express();
const PORT = process.env.PORT || 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Twilio setup
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

app.post('/api/book', async (req, res) => {
  const { guest_name, email, check_in, check_out, room_type, message } = req.body;

  try {
    const conn = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING
    });

    // Insert into Oracle
    await conn.execute(
      `INSERT INTO hotel_booking (guest_name, email, check_in, check_out, room_type, message)
       VALUES (:1, :2, TO_DATE(:3, 'YYYY-MM-DD'), TO_DATE(:4, 'YYYY-MM-DD'), :5, :6)`,
      [guest_name, email, check_in, check_out, room_type, message],
      { autoCommit: true }
    );

    await conn.close();

    // Send WhatsApp message to hotel
    await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio sandbox number
      to: 'whatsapp:+919824402132',  // Your hotel WhatsApp number
      body: `🛎️ New Booking!\n\nGuest: ${guest_name}\nPhone: ${email}\nRoom: ${room_type}\nCheck-in: ${check_in}\nCheck-out: ${check_out}\nMessage: ${message}`
    });

    res.status(200).send('✅ Booking received and WhatsApp sent!');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Booking failed: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
