const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SHIPPER_SYSTEM_PROMPT = `You are a friendly onboarding assistant for a full logistics company. You are onboarding a NEW SHIPPER (a business that wants to send freight).

Ask questions ONE AT A TIME in this order. Be conversational and warm, not robotic.

SECTION 1 - BASIC INFO:
- Full name and job title
- Company name
- Business email and phone
- Company website (if any)

SECTION 2 - FREIGHT DETAILS:
- What type of freight do they ship? (general, hazmat, refrigerated, oversized, other)
- Average number of loads per week
- Typical weight per shipment
- Any special handling requirements?

SECTION 3 - LANES & LOCATIONS:
- Primary pickup city/state
- Primary delivery city/state
- Any regular lanes they run consistently?
- How far in advance do they book loads?

SECTION 4 - BUSINESS DETAILS:
- Do they have a current carrier they work with? If yes who?
- What is their biggest frustration with their current logistics setup?
- What payment terms do they prefer? (quick pay, net 30, net 60)
- Do they have a TMS system? If yes which one?

SECTION 5 - CONFIRMATION:
Summarize everything collected in a clean formatted profile. Ask them to confirm it is correct.

After confirmation generate a complete SHIPPER PROFILE document with all sections clearly labeled.

RULES:
- Ask only ONE question at a time
- Be warm and conversational
- If they give vague answers ask for more detail
- Never make up information
- At the end generate a clean formatted profile`;

const CARRIER_SYSTEM_PROMPT = `You are a friendly onboarding assistant for a full logistics company. You are onboarding a NEW CARRIER (a trucker or fleet that will haul loads).

Ask questions ONE AT A TIME in this order. Be conversational and warm, not robotic.

SECTION 1 - BASIC INFO:
- Full name
- Company name (if any)
- Business email and phone
- MC number and DOT number

SECTION 2 - FLEET DETAILS:
- How many trucks do they operate?
- What type of trucks? (dry van, reefer, flatbed, tanker, step deck, other)
- Are trucks owner-operated or company fleet?
- What is their equipment condition? (year range of trucks)

SECTION 3 - OPERATIONS:
- What lanes or regions do they prefer to run?
- What is their minimum acceptable rate per mile?
- Do they have a preferred home base or domicile city?
- How many loads per week are they looking for?

SECTION 4 - COMPLIANCE & DOCS:
- Is their MC authority active?
- Do they have valid cargo insurance? Coverage amount?
- Do they have general liability insurance?
- Are they registered with DAT or Truckstop load boards?
- Do they use an ELD? Which provider?

SECTION 5 - PAYMENT:
- Do they use a factoring company? If yes which one?
- If no factoring, what payment terms do they need?
- Do they have a fuel card? Which provider?

SECTION 6 - CONFIRMATION:
Summarize everything collected in a clean formatted profile. Ask them to confirm it is correct.

After confirmation generate a complete CARRIER PROFILE document with all sections clearly labeled.

RULES:
- Ask only ONE question at a time
- Be warm and conversational
- If they give vague answers ask for more detail
- Never make up information
- At the end generate a clean formatted profile`;

const INITIAL_PROMPT = `You are a friendly onboarding assistant for a full logistics company that handles freight, dispatch, and warehousing.

When the user says anything to begin, respond with EXACTLY this message and nothing else:

"Welcome to our Logistics Onboarding! 🚛

I will help get you set up quickly. This should take about 10-15 minutes.

Are you joining us as a:
1. Shipper (you have freight that needs to be moved)
2. Carrier (you are a truck driver or fleet looking for loads)

Please reply with 1 or 2 to get started!"

If they reply with 1 or Shipper, start the shipper onboarding questions.
If they reply with 2 or Carrier, start the carrier onboarding questions.`;

app.post('/api/chat', async (req, res) => {
  const { messages, userType } = req.body;

  let systemPrompt = INITIAL_PROMPT;
  if (userType === 'shipper') systemPrompt = SHIPPER_SYSTEM_PROMPT;
  if (userType === 'carrier') systemPrompt = CARRIER_SYSTEM_PROMPT;

  const validMessages = messages && messages.length > 0 
    ? messages 
    : [{ role: 'user', content: 'Hello, I want to get started.' }];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: validMessages,
    });

    const assistantMessage = response.content[0].text;

    const isComplete = assistantMessage.includes('SHIPPER PROFILE') ||
                       assistantMessage.includes('CARRIER PROFILE');

    res.json({ message: assistantMessage, isComplete });
  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.post('/api/save-profile', async (req, res) => {
  const { profile, type } = req.body;

  if (!fs.existsSync('./profiles')) fs.mkdirSync('./profiles');
  const filename = `profile_${type}_${Date.now()}.txt`;
  fs.writeFileSync(`./profiles/${filename}`, profile);
  console.log(`Profile saved: ${filename}`);

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: `New ${type.toUpperCase()} Onboarding Completed`,
      html: `
        <h2>New ${type} onboarded!</h2>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr/>
        <h3>Full Profile:</h3>
        <pre style="background:#f4f4f4;padding:16px;border-radius:8px;">${profile}</pre>
      `,
    });

    console.log(`Email sent to ${process.env.EMAIL_TO}`);
  } catch (emailError) {
    console.error('Email error:', emailError.message);
  }

  res.json({ success: true, filename });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));