const oracledb = require('oracledb');

// Skip dotenv for now
oracledb.initOracleClient({ libDir: "C:\\oracle\\instantclient_23_8" });

async function testConnection() {
  try {
    const conn = await oracledb.getConnection({
      user: "acharya",
      password: "kushang",
      connectString: "localhost:1521/XEPDB1"
    });

    console.log("✅ Connected to Oracle DB!");
    await conn.close();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
}

testConnection();
