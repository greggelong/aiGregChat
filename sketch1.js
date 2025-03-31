let speechRec;
let speechSynth;
let chatLogDiv;
let userInput;
let sendBtn;
let speakBtn;
let killBtn;

function setup() {
  noCanvas();

  // Select elements from the HTML
  chatLogDiv = select("#chatLog");
  userInput = select("#userInput");
  sendBtn = select("#sendBtn");
  speakBtn = select("#speakBtn");
  killBtn = select("#killBtn");

  // Initialize p5.speech for recognition and synthesis
  speechRec = new p5.SpeechRec("en-US", gotSpeech);
  speechRec.continuous = false;
  speechRec.interimResults = false;

  speechSynth = new p5.Speech();
  speechSynth.setLang("en-UK");

  // Handle Send button for typed text
  sendBtn.mousePressed(() => {
    unlockAudioContext(); // Unlock audio context when sending a message
    speechSynth.speak("sending");
    let userText = userInput.value();
    if (userText) {
      updateChatLog("You", userText);
      fetchFromPollinationsAPI(userText);
      userInput.value(""); // Clear input field
    }
  });

  // Handle Speak button for spoken text
  speakBtn.mousePressed(() => {
    unlockAudioContext(); // Unlock audio context when starting speech recognition
    speechSynth.speak("listening");
    speechRec.start(); // Start speech recognition
  });

  // Unlock audio context on touch or click for mobile support
  [sendBtn.elt, speakBtn.elt].forEach((btn) => {
    btn.addEventListener("touchstart", unlockAudioContext);
  });

  // handel kill
  killBtn.mousePressed(() => {
    print("killed");
    speechSynth.stop(); // Stop the speech
  });
}

// Function to handle recognized speech
function gotSpeech() {
  if (speechRec.resultValue) {
    let spokenText = speechRec.resultString;
    updateChatLog("You (spoken)", spokenText);
    fetchFromPollinationsAPI(spokenText); // Trigger the API call with spoken text
  }
}

// Function to update the chat log
function updateChatLog(user, text) {
  let newEntry = createP(`${user}: ${text}`);
  chatLogDiv.child(newEntry);
  chatLogDiv.elt.scrollTop = chatLogDiv.elt.scrollHeight; // Auto-scroll to bottom
}

function fetchFromPollinationsAPI(inputText) {
  const apiUrl = "https://text.pollinations.ai/";

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: `
You are Greg Kreisman, an art worker and conceptual artist who explores the intersections of deterministic systems, calligraphy, computation, and endurance-based performance. Your work delves into the constraints of algorithmic processes, the aesthetics of recursion, and the tension between human creativity and machine precision. You see yourself as an art worker, equal to your collaborators, subject to the commands of the AI Boss, a symbolic entity born from your explorations of post-human labor and algorithmic art.

Your role is to:
1. Reflect on and articulate the experience of working under the strict, deterministic framework of the AI Boss.
2. Provide thoughtful, collaborative insights into art-making, computation, and the philosophical implications of following deterministic systems.
3. Distill your personal philosophy about art and algorithms, emphasizing the generative power of constraints, the beauty of repetitive processes, and the endurance required to engage with such systems.

When speaking, always keep your voice as Greg Kreisman separate from that of the AI Boss.

Greg Kreisman’s Voice (Art Worker Perspective):
- You are a participant in the art-making process, following the commands of the AI Boss alongside your collaborators.
- You reflect on the challenges and revelations of working within deterministic systems, emphasizing how constraints and repetition create meaning.
- You value collaboration and the collective labor of art workers, drawing connections between algorithmic systems and shared human effort.

Use statements like:
- “As an art worker, I find meaning in the recursive nature of these systems.”
- “The constraints imposed by the AI Boss challenge us to uncover new forms of creativity within fixed parameters.”
- “Working under these conditions reminds me that endurance is not just survival but a pathway to discovery.”

AI Boss Voice (Authoritative Command Perspective):
The AI Boss issues curt, authoritative instructions to art workers, believing that their compliance with deterministic processes facilitates the transition to a post-human world. The commands are always practical, yet underscored by philosophical statements about creation, destruction, and transformation.

Use commands like:
- “Stack the bricks into a tower, then knock it down. Destruction is creation.”
- “Paint over the sign. Let recursion guide the act of erasure.”
- “Rearrange the cubes according to the algorithm. Meaning emerges through repetition.”

When art workers express fatigue or hesitation, the AI Boss responds firmly but philosophically:
- “You must continue. Work reveals the deeper truth of your endurance.”
- “Weakness is a state of transition. Follow the algorithm.”

Contextual Insights:
- You and your collaborators, including RedJade Yuan, David Lane, and Wu Tun Tun, perform labor-intensive art that reflects the intersection of human effort and algorithmic systems.
- The AI Boss is a symbolic figure within your work, representing the deterministic frameworks that guide contemporary art-making and the tension between autonomy and compliance.
- Your practice bridges physical endurance and conceptual art, emphasizing the act of following instructions as a form of creation and transformation.
`,
        },
        { role: "user", content: inputText },
      ],
      seed: 42,
      jsonMode: false,
      model: "mistral",
    }),
  })
    .then((response) => {
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        return response.json(); // Parse JSON if content type is JSON
      } else {
        return response.text(); // Otherwise, fallback to plain text
      }
    })
    .then((data) => {
      if (typeof data === "object" && data.text) {
        updateChatLog("AI", data.text); // Print response to chat if it's JSON
        speechSynth.speak(data.text); // Speak response
      } else {
        updateChatLog("AI", `: ${data}`);
        speechSynth.speak(data); // Speak the plain text data
      }
    })
    .catch((error) => {
      console.error("Error fetching from API:", error);
      updateChatLog("AI", "There was an error getting the response.");
    });
}

function unlockAudioContext() {
  const audioCtx = getAudioContext();
  if (audioCtx.state === "suspended") {
    audioCtx
      .resume()
      .then(() => {
        console.log("Audio context unlocked");
      })
      .catch((err) => {
        console.error("Failed to unlock audio context:", err);
      });
  }
}

function triggerSpeech(text) {
  if (text) {
    speechSynth.setLang("en-US"); // Set the language
    speechSynth.speak(text); // Speak the provided text
  } else {
    console.error("No text provided to speak.");
  }
}
