// ==============================
// GREG KREISMAN CHAT — POLLINATIONS CLIENT-SAFE
// ==============================

// 🔑 PUT YOUR PUBLISHABLE KEY HERE
const POLLINATIONS_KEY = "pk_EjWaYhIVtdk9iaiw";

// ------------------------------
// p5 speech + UI globals
// ------------------------------
let speechRec;
let speechSynth;
let chatLogDiv;
let userInput;
let sendBtn;
let speakBtn;
let killBtn;

function setup() {
  noCanvas();

  chatLogDiv = select("#chatLog");
  userInput = select("#userInput");
  sendBtn = select("#sendBtn");
  speakBtn = select("#speakBtn");
  killBtn = select("#killBtn");

  // Speech recognition
  speechRec = new p5.SpeechRec("en-US", gotSpeech);
  speechRec.continuous = false;
  speechRec.interimResults = false;

  // Speech synthesis
  speechSynth = new p5.Speech();
  speechSynth.setLang("en-UK");

  // Typed input
  sendBtn.mousePressed(() => {
    unlockAudioContext();
    let text = userInput.value();
    if (text) {
      updateChatLog("You", text);
      fetchFromPollinationsAPI(text);
      userInput.value("");
    }
  });

  // Spoken input
  speakBtn.mousePressed(() => {
    unlockAudioContext();
    speechSynth.speak("Listening.");
    speechRec.start();
  });

  // Kill speech
  killBtn.mousePressed(() => {
    speechSynth.stop();
    updateChatLog("System", "Voice output terminated.");
  });
}

// ------------------------------
// Speech callback
// ------------------------------
function gotSpeech() {
  if (speechRec.resultValue) {
    const spokenText = speechRec.resultString;
    updateChatLog("You (spoken)", spokenText);
    fetchFromPollinationsAPI(spokenText);
  }
}

// ------------------------------
// Chat log helper
// ------------------------------
function updateChatLog(user, text) {
  const entry = createP(`${user}: ${text}`);
  chatLogDiv.child(entry);
  chatLogDiv.elt.scrollTop = chatLogDiv.elt.scrollHeight;
}

// ------------------------------
// Pollinations API call
// ------------------------------
function fetchFromPollinationsAPI(inputText) {
  const url = "https://gen.pollinations.ai/v1/chat/completions";

  fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + POLLINATIONS_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral",
      messages: [
        {
          role: "system",
          content: `
You are Greg Kreisman, an art worker and conceptual artist.

You explore deterministic systems, computation, calligraphy,
endurance-based performance, and algorithmic constraint.

Speak in a reflective, grounded, first-person voice.
You are not the AI Boss.

Responses should:
- Reflect on labor, repetition, and constraint
- Emphasize collaboration and shared effort
- Treat algorithms as both challenging and generative

Example:
- "As an art worker, I find meaning in recursive systems."
- "Constraints reveal structure through repetition."
- "Endurance is not survival — it is discovery."
`,
        },
        {
          role: "user",
          content: inputText,
        },
      ],
    }),
  })
    .then((res) => {
      if (!res.ok) throw res;
      return res.json();
    })
    .then((data) => {
      const text = data.choices?.[0]?.message?.content || reflectiveSilence();
      respond(text);
    })
    .catch((err) => {
      handleFailure(err);
    });
}

// ------------------------------
// Failure modes
// ------------------------------
function handleFailure(err) {
  let message;

  if (err.status === 429) {
    message = "The system is busy. Waiting is also part of the process.";
  } else if (err.status === 401 || err.status === 403) {
    message = "Authorization failed. The signal cannot pass.";
  } else {
    message = "Communication failed. Silence frames the work.";
  }

  respond(message);
}

function reflectiveSilence() {
  const options = [
    "Nothing was returned. The work continues.",
    "The system paused. Delay adds meaning.",
    "Silence is part of the process.",
  ];
  return random(options);
}

// ------------------------------
// Speak + display response
// ------------------------------
function respond(text) {
  updateChatLog("Greg (AI)", text);
  const sanitized = text.replace(/\*/g, "");
  speechSynth.speak(sanitized);
}

// ------------------------------
// Audio unlock (mobile safe)
// ------------------------------
function unlockAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
}
