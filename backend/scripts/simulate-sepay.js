const fs = require("fs")
const path = require("path")
const http = require("http")

// 1. Get CLI arguments
const rawBookingCode = process.argv[2]
const amountStr = process.argv[3]

if (!rawBookingCode) {
  console.error("Usage: node simulate-sepay.js <BOOKING_CODE> [AMOUNT]")
  console.error("Example: node simulate-sepay.js DN-A3F9K2 120000")
  process.exit(1)
}

const bookingCode = rawBookingCode.replace("-", "").toUpperCase()
const amount = amountStr ? parseInt(amountStr, 10) : 100000 // default to 100k if not specified

// 2. Parse token from backend/.env
let token = "sepay_test_token_123"
try {
  const envPath = path.join(__dirname, "../.env")
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8")
    const match = envContent.match(/SEPAY_WEBHOOK_API_KEY\s*=\s*([^\r\n]+)/)
    if (match) {
      token = match[1].trim()
    }
  }
} catch (e) {
  console.warn("Could not read backend/.env file, using default token:", e.message)
}

// 3. Construct payload
const payload = JSON.stringify({
  id: Math.floor(Math.random() * 1000000),
  gateway: "BIDV",
  transactionDate: new Date().toISOString().replace("T", " ").substring(0, 19),
  accountNumber: "7351111442",
  subAccount: "",
  code: bookingCode,
  content: `CK thanh toan don hang ${bookingCode} dinomad`,
  transferType: "in",
  description: "LE DANG KHOA chuyen khoan",
  transferAmount: amount,
  amount_in: amount,
  accumulated: 50000000,
  referenceCode: "FT" + Math.floor(10000000 + Math.random() * 90000000),
})

// 4. Send request
const options = {
  hostname: "localhost",
  port: 4000,
  path: "/api/payments/sepay-webhook",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    "Authorization": `Apikey ${token}`,
  },
}

console.info(`\n🚀 Simulating SePay Webhook transfer...`)
console.info(`   Target URL: http://localhost:4000/api/payments/sepay-webhook`)
console.info(`   Token:      ${token}`)
console.info(`   Booking:    ${bookingCode}`)
console.info(`   Amount:     ${amount} VND`)
console.info(`\nSending payload: ${payload}\n`)

const req = http.request(options, (res) => {
  let responseData = ""
  res.on("data", (chunk) => {
    responseData += chunk
  })
  res.on("end", () => {
    console.info(`--------------------------------------------------`)
    console.info(`Response Status: ${res.statusCode} ${res.statusMessage}`)
    console.info(`Response Body:   ${responseData}`)
    console.info(`--------------------------------------------------\n`)
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.info("✅ Simulation Success! Webhook processed successfully.")
    } else {
      console.error("❌ Simulation Failed. Check NestJS logs for details.")
    }
  })
})

req.on("error", (e) => {
  console.error(`❌ Connection Error: ${e.message}`)
})

req.write(payload)
req.end()
