#include <DHT.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>

// ============================================================
// HOMELY SMART HOME - ESP32 FIRMWARE WITH CAPTIVE PORTAL SETUP
// ============================================================

const char* MDNS_HOSTNAME = "homely-smarthome"; // http://homely-smarthome.local
const char* AP_SSID = "Homely-SmartHome-Setup";

WebServer server(80);
DNSServer dnsServer;
Preferences preferences;

const byte DNS_PORT = 53;
bool inConfigMode = false;
bool isWifiConnected = false;

// ---- Sensor pins ----
#define DHTPIN   17
#define DHTTYPE  DHT11
#define PIR_PIN  4

// ---- Relay pins (active-LOW: LOW = on, HIGH = off) ----
#define RELAY_PORCH         26   // manual only
#define RELAY_LIVING        32   // PIR-driven
#define RELAY_BEDROOM_LIGHT 33   // manual only
#define RELAY_BEDROOM_FAN   25   // temperature-driven in Auto mode

// ---- 7-LED Hardware Status Dashboard (Common Anode, Active-LOW) ----
// Connect Common Positive (+) leg to ESP32 3.3V pin via a single 220Ω resistor.
// Connect individual Ground (-) legs to these ESP32 GPIO pins:
#define LED_WIFI      18   // LED 1: Wi-Fi Status (Solid = Online, Running Wave = Connecting, Scanner = Setup)
#define LED_MODE      19   // LED 2: System Mode (Auto = ON, Manual = OFF)
#define LED_PORCH     21   // LED 3: Porch Light Relay State
#define LED_LIVING    22   // LED 4: Living Room Light Relay State
#define LED_BED_L     23   // LED 5: Bedroom Light Relay State
#define LED_BED_F     27   // LED 6: Bedroom Fan Relay State
#define LED_MOTION    13   // LED 7: PIR Motion Detected Indicator

const int STATUS_LEDS[7] = { LED_WIFI, LED_MODE, LED_PORCH, LED_LIVING, LED_BED_L, LED_BED_F, LED_MOTION };
const int NUM_STATUS_LEDS = 7;

// GPIO 2 is the onboard LED - not used for user feedback (7-LED external board is used instead)

DHT dht(DHTPIN, DHTTYPE);

// ---- System state ----
String systemMode = "manual"; // Starts in manual mode by default

bool porchOn        = true;
bool livingOn       = true;
bool bedroomLightOn = true;
bool bedroomFanOn   = true;

float lastTemp      = 26.0;
float lastHumidity  = 55.0;

// ---- PIR / living room automation ----
const unsigned long MOTION_HOLD_MS = 5000;
unsigned long lastMotionTime = 0;
const int PIR_CONFIRM_COUNT = 2;
int pirHighStreak = 0;
bool motionActive = false;

// ---- Fan automation / temperature state ----
// Fan is 100% manual direct control from the app.
// Temperature & humidity sensors report live telemetry.

// ============================================================
// 7-LED Status Dashboard & Animation System (Active-LOW: LOW=ON, HIGH=OFF)
// ============================================================

// Low-level helper: writes LOW to turn LED ON, HIGH to turn OFF
inline void setLed(int pin, bool on) {
  digitalWrite(pin, on ? LOW : HIGH);
}

// Low-level helper: set all 7 dashboard LEDs simultaneously
inline void setAllLeds(bool on) {
  for (int i = 0; i < NUM_STATUS_LEDS; i++) {
    digitalWrite(STATUS_LEDS[i], on ? LOW : HIGH);
  }
}

// 1. BOOTUP SELF-TEST (POST): Rapid forward & reverse sweep on initial power-on
void playBootPostAnimation() {
  for (int i = 0; i < NUM_STATUS_LEDS; i++) {
    setAllLeds(false);
    setLed(STATUS_LEDS[i], true);
    delay(40);
  }
  for (int i = NUM_STATUS_LEDS - 1; i >= 0; i--) {
    setAllLeds(false);
    setLed(STATUS_LEDS[i], true);
    delay(40);
  }
  // Double unison flash to confirm all 7 channels operational
  setAllLeds(true);  delay(80);
  setAllLeds(false); delay(80);
  setAllLeds(true);  delay(80);
  setAllLeds(false); delay(120);
}

// 2. WI-FI CONNECTED CELEBRATION: Cascade fill 1->7 + double pulse, then locks LED 1 solid
void playConnectedAnimation() {
  // Sequential cascade fill
  for (int i = 0; i < NUM_STATUS_LEDS; i++) {
    setLed(STATUS_LEDS[i], true);
    delay(60);
  }
  delay(100);

  // Double celebration strobe
  for (int b = 0; b < 2; b++) {
    setAllLeds(false);
    delay(80);
    setAllLeds(true);
    delay(100);
  }
  delay(120);

  // Settle to live telemetry state (LED 1 Wi-Fi stays locked ON)
  setAllLeds(false);
  setLed(LED_WIFI, true);
  delay(100);
}

// 3. RUNTIME NON-BLOCKING DASHBOARD & ANIMATION ENGINE
void updateStatusLeds() {
  unsigned long now = millis();

  if (inConfigMode) {
    // SETUP / AP MODE (Homely-SmartHome-Setup active):
    // Smooth ping-pong / scanner bounce across all 7 LEDs (indicates waiting for pairing)
    static unsigned long lastScannerStep = 0;
    static int scannerIdx = 0;
    static int scannerDir = 1;

    if (now - lastScannerStep >= 75) {
      lastScannerStep = now;
      setAllLeds(false);
      setLed(STATUS_LEDS[scannerIdx], true);
      scannerIdx += scannerDir;
      if (scannerIdx >= NUM_STATUS_LEDS - 1) {
        scannerIdx = NUM_STATUS_LEDS - 1;
        scannerDir = -1;
      } else if (scannerIdx <= 0) {
        scannerIdx = 0;
        scannerDir = 1;
      }
    }
  } else if (!isWifiConnected) {
    // CONNECTING TO WI-FI: Smooth unidirectional chasing wave across 7 LEDs
    static unsigned long lastWaveStep = 0;
    static int waveIdx = 0;

    if (now - lastWaveStep >= 65) {
      lastWaveStep = now;
      setAllLeds(false);
      setLed(STATUS_LEDS[waveIdx], true);
      waveIdx = (waveIdx + 1) % NUM_STATUS_LEDS;
    }
  } else {
    // ONLINE & RUNNING (Real-Time Live House Dashboard):
    setLed(LED_WIFI,   true);                          // LED 1: Solid ON (Wi-Fi online)
    setLed(LED_MODE,   systemMode == "auto");          // LED 2: ON in Auto, OFF in Manual
    setLed(LED_PORCH,  porchOn);                       // LED 3: Porch Light Relay State
    setLed(LED_LIVING, livingOn);                      // LED 4: Living Room Light Relay State
    setLed(LED_BED_L,  bedroomLightOn);                // LED 5: Bedroom Light Relay State
    setLed(LED_BED_F,  bedroomFanOn);                  // LED 6: Bedroom Fan Relay State
    setLed(LED_MOTION, motionActive);                  // LED 7: Flashes ON when PIR motion detected
  }
}

// ============================================================
// Relay helpers
// ============================================================
void setRelay(int pin, bool on) {
  int pinLevel;
  if (pin == RELAY_BEDROOM_FAN) {
    // Fan relay is inverted (LOW = ON / spinning, HIGH = OFF / stopped)
    pinLevel = on ? LOW : HIGH;
  } else {
    // Light relays (HIGH = ON / lit, LOW = OFF / dark)
    pinLevel = on ? HIGH : LOW;
  }
  digitalWrite(pin, pinLevel);
  Serial.print("[RELAY] Pin ");
  Serial.print(pin);
  Serial.print(" -> Logical State: ");
  Serial.print(on ? "ON" : "OFF");
  Serial.print(" | Written GPIO Output: ");
  Serial.println(pinLevel == HIGH ? "HIGH (3.3V)" : "LOW (0V)");
}

// ============================================================
// CORS & Common Headers
// ============================================================
void sendJson(int code, const String& json) {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(code, "application/json", json);
}

void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204);
}

// ============================================================
// Consolidated HTTP API Handlers (Single-Roundtrip)
// ============================================================
void handlePing() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "ok");
}

// Single payload containing BOTH system state and sensor metrics
void handleStatus() {
  String json = "{";
  json += "\"mode\":\"" + systemMode + "\",";
  json += "\"porch\":{\"on\":" + String(porchOn ? "true" : "false") + "},";
  json += "\"living\":{\"on\":" + String(livingOn ? "true" : "false") +
          ",\"motion\":" + String(motionActive ? "true" : "false") + "},";
  json += "\"bedroom_light\":{\"on\":" + String(bedroomLightOn ? "true" : "false") + "},";
  json += "\"bedroom_fan\":{\"on\":" + String(bedroomFanOn ? "true" : "false") + "},";
  json += "\"temperature\":" + String(isnan(lastTemp) ? 26.0 : lastTemp, 1) + ",";
  json += "\"humidity\":" + String(isnan(lastHumidity) ? 50.0 : lastHumidity, 1);
  json += "}";
  sendJson(200, json);
}

void handleSensors() {
  String json = "{";
  json += "\"temperature\":" + String(isnan(lastTemp) ? 26.0 : lastTemp, 1) + ",";
  json += "\"humidity\":" + String(isnan(lastHumidity) ? 50.0 : lastHumidity, 1);
  json += "}";
  sendJson(200, json);
}

bool bodyWantsOn() {
  String body = server.arg("plain");
  return body.indexOf("\"on\"") != -1 && (body.indexOf("true") != -1 || body.indexOf("1") != -1);
}

void handleRelayPorch() {
  String body = server.arg("plain");
  Serial.print("[HTTP] POST /relay/porch: ");
  Serial.println(body);
  porchOn = bodyWantsOn();
  setRelay(RELAY_PORCH, porchOn);
  sendJson(200, "{\"ok\":true,\"porch\":" + String(porchOn ? "true" : "false") + "}");
}

void handleRelayBedroomLight() {
  String body = server.arg("plain");
  Serial.print("[HTTP] POST /relay/bedroom_light: ");
  Serial.println(body);
  bedroomLightOn = bodyWantsOn();
  setRelay(RELAY_BEDROOM_LIGHT, bedroomLightOn);
  sendJson(200, "{\"ok\":true,\"bedroom_light\":" + String(bedroomLightOn ? "true" : "false") + "}");
}

void handleRelayLiving() {
  String body = server.arg("plain");
  Serial.print("[HTTP] POST /relay/living: ");
  Serial.println(body);
  livingOn = bodyWantsOn();
  setRelay(RELAY_LIVING, livingOn);
  if (livingOn) lastMotionTime = millis();
  sendJson(200, "{\"ok\":true,\"living\":" + String(livingOn ? "true" : "false") + "}");
}

void handleRelayBedroomFan() {
  String body = server.arg("plain");
  Serial.print("[HTTP] POST /relay/bedroom_fan: ");
  Serial.println(body);
  bedroomFanOn = bodyWantsOn();
  setRelay(RELAY_BEDROOM_FAN, bedroomFanOn);
  sendJson(200, "{\"ok\":true,\"bedroom_fan\":" + String(bedroomFanOn ? "true" : "false") + "}");
}

void handleMode() {
  String body = server.arg("plain");
  if (body.indexOf("auto") != -1) {
    systemMode = "auto";
  } else if (body.indexOf("manual") != -1) {
    systemMode = "manual";
  }
  Serial.print("System Mode updated via App to: ");
  Serial.println(systemMode);
  sendJson(200, "{\"ok\":true,\"mode\":\"" + systemMode + "\"}");
}

void handleResetWifi() {
  sendJson(200, "{\"ok\":true,\"message\":\"Clearing WiFi credentials and restarting AP mode...\"}");
  // Reverse wipe: turn LEDs off from 7 down to 1
  for (int i = NUM_STATUS_LEDS - 1; i >= 0; i--) {
    setLed(STATUS_LEDS[i], false);
    delay(80);
  }
  delay(500);
  preferences.begin("wifi-config", false);
  preferences.clear();
  preferences.end();
  ESP.restart();
}

// ============================================================
// Captive Portal HTML & Setup Server Handlers
// ============================================================
const char SETUP_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Homely Smart Home Setup</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0E0E12; color: #FFFFFF; padding: 24px; }
    .container { max-width: 400px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 24px; }
    .badge { display: inline-block; background: #F59E0B; color: #000; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 999px; margin-bottom: 8px; text-transform: uppercase; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
    p { color: #A1A1AA; font-size: 14px; line-height: 1.4; }
    .card { background: #18181B; border: 1px solid #27272A; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
    label { display: block; font-size: 12px; font-weight: 600; color: #D4D4D8; margin-bottom: 6px; }
    select, input { width: 100%; background: #27272A; border: 1px solid #3F3F46; border-radius: 10px; padding: 12px 14px; font-size: 15px; color: #FFFFFF; margin-bottom: 16px; outline: none; }
    select:focus, input:focus { border-color: #F59E0B; }
    button { width: 100%; background: #F59E0B; color: #000000; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: 700; cursor: pointer; }
    button:active { opacity: 0.9; }
    .hint { font-size: 12px; color: #71717A; text-align: center; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Device Setup</div>
      <h1>Homely Smart Home</h1>
      <p>Connect your ESP32 controller to your home Wi-Fi network.</p>
    </div>
    <div class="card">
      <form action="/save" method="POST">
        <label for="ssid">SELECT WI-FI NETWORK</label>
        <input type="text" id="ssid" name="ssid" placeholder="Enter or select Wi-Fi SSID" required list="networks">
        <datalist id="networks">
          {{NETWORKS}}
        </datalist>

        <label for="pass">WI-FI PASSWORD</label>
        <input type="password" id="pass" name="pass" placeholder="Enter password (leave empty if open)">

        <button type="submit">Connect to Wi-Fi</button>
      </form>
    </div>
    <div class="hint">After connecting, your device will be reachable at <b>http://homely-smarthome.local</b></div>
  </div>
</body>
</html>
)rawliteral";

void handlePortalRoot() {
  String html = String(SETUP_HTML);
  
  // Scan WiFi networks
  int n = WiFi.scanNetworks();
  String options = "";
  for (int i = 0; i < n; ++i) {
    options += "<option value=\"" + WiFi.SSID(i) + "\">";
  }
  html.replace("{{NETWORKS}}", options);
  
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.send(200, "text/html", html);
}

void handlePortalSave() {
  String ssid = server.arg("ssid");
  String pass = server.arg("pass");
  
  if (ssid.length() > 0) {
    preferences.begin("wifi-config", false);
    preferences.putString("ssid", ssid);
    preferences.putString("pass", pass);
    preferences.end();

    String res = "<!DOCTYPE html><html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><style>body{background:#0E0E12;color:#FFF;font-family:sans-serif;text-align:center;padding:40px;}h2{color:#10B981;}</style></head><body><h2>Credentials Saved!</h2><p>Connecting to " + ssid + "...</p><p>You can now switch back to your home Wi-Fi and open the Homely app.</p></body></html>";
    server.send(200, "text/html", res);

    // Rapid 3-pulse save confirmation strobe
    for (int i = 0; i < 3; i++) {
      setAllLeds(true);
      delay(100);
      setAllLeds(false);
      delay(100);
    }
    delay(600);
    ESP.restart();
  } else {
    server.send(400, "text/plain", "SSID cannot be empty");
  }
}

void startCaptivePortal() {
  inConfigMode = true;
  isWifiConnected = false;
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID);

  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  Serial.println("==================================================");
  Serial.print("Started Setup AP: ");
  Serial.println(AP_SSID);
  Serial.print("Portal IP: ");
  Serial.println(WiFi.softAPIP());
  Serial.println("==================================================");

  server.on("/", HTTP_GET, handlePortalRoot);
  server.on("/save", HTTP_POST, handlePortalSave);
  server.onNotFound(handlePortalRoot); // Captive portal redirect
  server.begin();
}

// ============================================================
// Setup
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(PIR_PIN, INPUT);
  pinMode(RELAY_PORCH, OUTPUT);
  pinMode(RELAY_LIVING, OUTPUT);
  pinMode(RELAY_BEDROOM_LIGHT, OUTPUT);
  pinMode(RELAY_BEDROOM_FAN, OUTPUT);

  // 7-LED Dashboard Pins (Common Anode, Active-LOW)
  for (int i = 0; i < NUM_STATUS_LEDS; i++) {
    pinMode(STATUS_LEDS[i], OUTPUT);
  }

  // Power-on default: all lights and fan turn ON on power-up
  setRelay(RELAY_PORCH, true);
  setRelay(RELAY_LIVING, true);
  setRelay(RELAY_BEDROOM_LIGHT, true);
  setRelay(RELAY_BEDROOM_FAN, true);

  // Initialize all LEDs to OFF (HIGH for Common Anode)
  setAllLeds(false);

  // Run hardware power-on self-test animation (LED 1 -> 7 -> 1 sweep)
  playBootPostAnimation();

  dht.begin();

  // Load saved Wi-Fi
  preferences.begin("wifi-config", true);
  String savedSSID = preferences.getString("ssid", "");
  String savedPass = preferences.getString("pass", "");
  preferences.end();

  if (savedSSID.length() == 0) {
    Serial.println("No saved Wi-Fi found. Starting Setup AP mode...");
    startCaptivePortal();
    return;
  }

  Serial.print("Connecting to saved Wi-Fi: ");
  Serial.println(savedSSID);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false); // Disables modem sleep for instant HTTP responses
  WiFi.begin(savedSSID.c_str(), savedPass.c_str());

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(20);
    updateStatusLeds(); // Animates the 7-LED chasing wave smoothly
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    isWifiConnected = true;
    playConnectedAnimation(); // Cascades 1->7, double strobe, locks LED 1 solid
    updateStatusLeds();       // Real-time live dashboard active
    Serial.print("Wi-Fi Connected! IP: ");
    Serial.println(WiFi.localIP());

    if (MDNS.begin(MDNS_HOSTNAME)) {
      Serial.print("mDNS active at http://");
      Serial.print(MDNS_HOSTNAME);
      Serial.println(".local");
      MDNS.addService("http", "tcp", 80);
    }

    // Register API routes
    server.on("/ping", HTTP_GET, handlePing);
    server.on("/status", HTTP_GET, handleStatus);
    server.on("/sensors", HTTP_GET, handleSensors);
    server.on("/relay/porch", HTTP_POST, handleRelayPorch);
    server.on("/relay/living", HTTP_POST, handleRelayLiving);
    server.on("/relay/bedroom_light", HTTP_POST, handleRelayBedroomLight);
    server.on("/relay/bedroom_fan", HTTP_POST, handleRelayBedroomFan);
    server.on("/mode", HTTP_POST, handleMode);
    server.on("/reset-wifi", HTTP_POST, handleResetWifi);

    // OPTIONS preflight
    server.on("/ping", HTTP_OPTIONS, handleOptions);
    server.on("/status", HTTP_OPTIONS, handleOptions);
    server.on("/sensors", HTTP_OPTIONS, handleOptions);
    server.on("/relay/porch", HTTP_OPTIONS, handleOptions);
    server.on("/relay/living", HTTP_OPTIONS, handleOptions);
    server.on("/relay/bedroom_light", HTTP_OPTIONS, handleOptions);
    server.on("/relay/bedroom_fan", HTTP_OPTIONS, handleOptions);
    server.on("/mode", HTTP_OPTIONS, handleOptions);

    server.begin();
    Serial.println("Homely Smart Home API Server ready.");
  } else {
    Serial.println("Failed to connect to saved Wi-Fi. Launching Setup Portal...");
    startCaptivePortal();
  }
}

// ============================================================
// Automation logic
// ============================================================
void handleMotionAutomation() {
  // Debounce: sample PIR every 50ms to avoid noisy reads
  static unsigned long lastPirCheck = 0;
  unsigned long now = millis();
  if (now - lastPirCheck < 50) return;
  lastPirCheck = now;

  int motion = digitalRead(PIR_PIN);

  if (motion == HIGH) {
    if (pirHighStreak < PIR_CONFIRM_COUNT + 1) pirHighStreak++;
  } else {
    pirHighStreak = 0;
  }

  // When motion is confirmed, record the timestamp
  if (pirHighStreak >= PIR_CONFIRM_COUNT) {
    lastMotionTime = now;
  }

  // Motion is held active for 4 seconds after detection
  // This allows the App and Status Dashboard LED to show Motion Detected in real time (even in Manual mode)
  motionActive = (lastMotionTime > 0 && (now - lastMotionTime < 4000));

  // Physical light automation ONLY triggers in AUTO mode.
  // In MANUAL mode, the living room light remains 100% under manual app control.
  if (systemMode == "auto") {
    if (motionActive) {
      if (!livingOn) {
        livingOn = true;
        setRelay(RELAY_LIVING, true);
      }
    } else if (livingOn && (now - lastMotionTime > MOTION_HOLD_MS)) {
      livingOn = false;
      setRelay(RELAY_LIVING, false);
    }
  }
}

void handleSensorsUpdate() {
  static unsigned long lastDhtRead = 0;
  if (millis() - lastDhtRead < 2000) return;
  lastDhtRead = millis();

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (!isnan(h) && !isnan(t) && h >= 0 && h <= 100 && t > -20 && t < 70) {
    lastTemp = t;
    lastHumidity = h;
  }
}

// ============================================================
// Wi-Fi Connection Watchdog (Background Reconnection)
// ============================================================
void handleWifiWatchdog() {
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck < 10000) return;
  lastCheck = millis();

  if (WiFi.status() == WL_CONNECTED) {
    isWifiConnected = true;
  } else {
    isWifiConnected = false;
    Serial.println("Wi-Fi disconnected — attempting background reconnect...");
    WiFi.reconnect();
  }
}

// ============================================================
// Main loop
// ============================================================
void loop() {
  updateStatusLeds(); // Drives 7-LED real-time hardware status dashboard

  if (inConfigMode) {
    dnsServer.processNextRequest();
    server.handleClient();
    yield();
    return;
  }

  handleWifiWatchdog();
  handleMotionAutomation();
  handleSensorsUpdate();

  server.handleClient();
  yield();
}
