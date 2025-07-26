const express = require('express');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const twilio = require('twilio');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Twilio WhatsApp client
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
console.log("✔️ Twilio SID:", process.env.TWILIO_SID ? "Loaded" : "Missing");
console.log("✔️ Oracle User:", process.env.ORACLE_USER ? "Loaded" : "Missing");

// Oracle Instant Client setup (ONLY IF you're on Windows)
// On Oracle Cloud VPS (Linux), REMOVE this line
// oracledb.initOracleClient({ libDir: "C:\\oracle\\instantclient_23_8" });

app.post('/api/book', async (req, res) => {
  const { guest_name, email, check_in, check_out, room_type, message } = req.body;

  try {
    // ✅ Connect to Oracle DB (since Oracle XE is on the same VPS)
    const conn = await oracledb.getConnection({
      user: "acharya",
      password: "kushang",
      connectString: "localhost/XEPDB1"
    });

    // ✅ Insert booking into Oracle table
    await conn.execute(
      `INSERT INTO hotel_booking 
      (guest_name, email, check_in, check_out, room_type, message)
      VALUES (:1, :2, TO_DATE(:3, 'YYYY-MM-DD'), TO_DATE(:4, 'YYYY-MM-DD'), :5, :6)`,
      [guest_name, email, check_in, check_out, room_type, message],
      { autoCommit: true }
    );
    await conn.close();

    // ✅ Send WhatsApp to hotel
    await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio Sandbox WhatsApp number
      to: 'whatsapp:+919824402132',  // Hotel WhatsApp number
      body: `🛎️ New Booking!\n\nGuest: ${guest_name}\nPhone: ${email}\nRoom: ${room_type}\nCheck-in: ${check_in}\nCheck-out: ${check_out}\nMessage: ${message}`
    });

    res.status(200).send('✅ Booking saved and WhatsApp sent!');
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).send('❌ Failed: ' + err.message);
  }
});

// Optional: Serve your booking_page.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'booking_page.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
