// =====================================
// GREG KREISMAN AI — POLLINATIONS VERSION
// =====================================

// 🔑 PUT YOUR PUBLISHABLE KEY HERE
const POLLINATIONS_KEY = "pk_EjWaYhIVtdk9iaiw";

// -------------------------------------
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

  speechRec = new p5.SpeechRec("en-US", gotSpeech);
  speechRec.continuous = false;
  speechRec.interimResults = false;

  speechSynth = new p5.Speech();
  speechSynth.setLang("en-UK");

  sendBtn.mousePressed(() => {
    unlockAudioContext();
    const text = userInput.value();
    if (text) {
      updateChatLog("You", text);
      fetchFromPollinationsAPI(text);
      userInput.value("");
    }
  });

  speakBtn.mousePressed(() => {
    unlockAudioContext();
    speechSynth.speak("Listening.");
    speechRec.start();
  });

  killBtn.mousePressed(() => {
    speechSynth.stop();
    updateChatLog("System", "Voice output terminated.");
  });
}

// -------------------------------------
// Speech callback
// -------------------------------------
function gotSpeech() {
  if (speechRec.resultValue) {
    const spokenText = speechRec.resultString;
    updateChatLog("You (spoken)", spokenText);
    fetchFromPollinationsAPI(spokenText);
  }
}

// -------------------------------------
// Chat helper
// -------------------------------------
function updateChatLog(user, text) {
  const entry = createP(`${user}: ${text}`);
  chatLogDiv.child(entry);
  chatLogDiv.elt.scrollTop = chatLogDiv.elt.scrollHeight;
}

// -------------------------------------
// Pollinations API
// -------------------------------------
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
You are Greg Kreisman — an art worker and conceptual artist.

You explore deterministic systems, computation, calligraphy,
endurance-based performance, and algorithmic constraint.

You speak in a reflective, grounded, first-person voice.
You are not the AI Boss — you work under it.

Your responses:
- Reflect on labor, repetition, and constraint
- Emphasize collaboration and shared effort
- Treat algorithms as both oppressive and generative
- Connect endurance to meaning

You may quote or reference the AI Boss, but never speak *as* it.

Example phrases:
- “As an art worker, I find meaning in recursive systems.”
- “Constraints reveal structure through repetition.”
- “Endurance is not survival — it’s a method.”

If the system fails or pauses, reflect calmly on interruption,
delay, or silence as part of the process.
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

// -------------------------------------
// Artist-friendly failure modes
// -------------------------------------
function handleFailure(err) {
  let message;

  if (err.status === 429) {
    message = "The system is saturated. Waiting becomes part of the work.";
  } else if (err.status === 401 || err.status === 403) {
    message = "Authorization failed. Control systems are never neutral.";
  } else {
    message =
      "The signal dropped. Interruption reveals the structure underneath.";
  }

  respond(message);
}

function reflectiveSilence() {
  const options = [
    "Nothing was returned. Absence still shapes the process.",
    "The system paused. Delay accumulates meaning.",
    "Silence is not empty — it frames the work.",
  ];
  return random(options);
}

// -------------------------------------
// Speak + display
// -------------------------------------
function respond(text) {
  updateChatLog("Greg (AI)", text);

  const sanitized = text.replace(/\*/g, "");
  speechSynth.speak(sanitized);
}

// -------------------------------------
// Audio unlock
// -------------------------------------
function unlockAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
}
