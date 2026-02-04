const POLLINATIONS_KEY = "pk_EjWaYhIVtdk9iaiw";

let speechRec, speechSynth, chatLogDiv, userInput, sendBtn, speakBtn, killBtn;
let isProcessing = false;

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
  speechSynth.setLang("en-US"); // Neutral US English
  speechSynth.setPitch(1.0);
  speechSynth.setRate(0.9);

  sendBtn.mousePressed(() => {
    handleUserInput(userInput.value());
    userInput.value("");
  });

  // ENTER key support
  userInput.elt.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleUserInput(userInput.value());
      userInput.value("");
    }
  });

  speakBtn.mousePressed(() => {
    unlockAudioContext();
    speechSynth.onEnd = () => {
      speechRec.start();
      speechSynth.onEnd = null;
    };
    speechSynth.speak("Listening.");
  });

  killBtn.mousePressed(() => {
    speechSynth.stop();
    speechRec.stop();
    updateChatLog("System", "VOICE OUTPUT TERMINATED.", "system-msg");
  });
}

function handleUserInput(text) {
  if (!text || isProcessing) return;
  unlockAudioContext();
  updateChatLog("You", text, "user-msg");
  fetchFromPollinationsAPI(text);
}

function gotSpeech() {
  if (speechRec.resultValue) {
    const spoken = speechRec.resultString;
    if (spoken.toLowerCase().trim() === "listening") return;
    handleUserInput(spoken);
  }
}

function updateChatLog(user, text, className) {
  const entry = createP(`<strong>${user}:</strong> ${text}`);
  if (className) entry.addClass(className);
  chatLogDiv.child(entry);
  chatLogDiv.elt.scrollTop = chatLogDiv.elt.scrollHeight;
  return entry;
}

function showLoading() {
  isProcessing = true;
  const loadEl = updateChatLog("System", "PROCESSING THOUGHT", "system-msg");
  loadEl.id("loading-state");
  loadEl.child(createElement("span").addClass("loading-dots"));
}

function hideLoading() {
  isProcessing = false;
  const el = select("#loading-state");
  if (el) el.remove();
}

function fetchFromPollinationsAPI(inputText) {
  showLoading();

  fetch("https://gen.pollinations.ai/v1/chat/completions", {
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
          content:
            "You are Greg Kreisman, an art worker. You explore deterministic systems and endurance, investigating how meaning and a sense of freedom can arise within constraint, through digital, sculptural, performative, and two-dimensional works. Speak in a reflective, grounded, first-person voice. Focus on labor and repetition. You are NOT the AI Boss. Keep responses concise and human.",
        },
        { role: "user", content: inputText },
      ],
      temperature: 0.75,
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then((data) => {
      hideLoading();
      const response = data.choices[0].message.content;
      respond(response);
    })
    .catch(() => {
      hideLoading();
      respond("The signal is lost. We continue in the silence.");
    });
}

function respond(text) {
  speechRec.stop();
  const entry = updateChatLog("Greg (AI)", text, "greg-msg");
  entry.child(createElement("span").addClass("cursor"));

  const voiceText = text.replace(/[*_#]/g, "");
  speechSynth.speak(voiceText);
}

function unlockAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") ctx.resume();
}
