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

// ---- External 3-Pin Status Indicator LEDs (Box / Enclosure Faceplate) ----
// Connect 3 LEDs (or an RGB LED with current-limiting resistors) to these pins:
#define LED_SETUP_PIN       18   // Amber/Yellow LED: Setup Mode (AP Active)
#define LED_CONNECTING_PIN  19   // Blue LED: Connecting / Searching for Wi-Fi
#define LED_ONLINE_PIN      21   // Green LED: Connected & Online

#define ONBOARD_LED_PIN     2    // Onboard DevKit LED (mirrors status)

DHT dht(DHTPIN, DHTTYPE);

// ---- System state ----
String systemMode = "manual"; // Starts in manual mode by default

bool porchOn        = false;
bool livingOn       = false;
bool bedroomLightOn = false;
bool bedroomFanOn   = false;

float lastTemp      = 26.0;
float lastHumidity  = 55.0;

// ---- PIR / living room automation ----
const unsigned long MOTION_HOLD_MS = 5000;
unsigned long lastMotionTime = 0;
const int PIR_CONFIRM_COUNT = 2;
int pirHighStreak = 0;
bool motionActive = false;

// ---- Fan / temperature automation ----
const float FAN_ON_TEMP  = 33.0;
const float FAN_OFF_TEMP = 27.0;

// ============================================================
// 3-Pin Status LED Indicator Manager (Non-blocking)
// ============================================================
void updateStatusLeds() {
  static unsigned long lastBlink = 0;
  static bool blinkState = false;
  unsigned long now = millis();

  if (inConfigMode) {
    // 1. SETUP / AP MODE:
    // LED_SETUP (Pin 18) = Solid ON (or slow pulse)
    // LED_CONNECTING = OFF, LED_ONLINE = OFF
    digitalWrite(LED_SETUP_PIN, HIGH);
    digitalWrite(LED_CONNECTING_PIN, LOW);
    digitalWrite(LED_ONLINE_PIN, LOW);

    // Onboard LED blinks slowly (500ms)
    if (now - lastBlink >= 500) {
      lastBlink = now;
      blinkState = !blinkState;
      digitalWrite(ONBOARD_LED_PIN, blinkState);
    }
  } else if (!isWifiConnected) {
    // 2. CONNECTING / RECONNECTING TO WI-FI:
    // LED_CONNECTING (Pin 19) = Fast Blinking (150ms)
    // LED_SETUP = OFF, LED_ONLINE = OFF
    if (now - lastBlink >= 150) {
      lastBlink = now;
      blinkState = !blinkState;
      digitalWrite(LED_CONNECTING_PIN, blinkState);
      digitalWrite(ONBOARD_LED_PIN, blinkState);
    }
    digitalWrite(LED_SETUP_PIN, LOW);
    digitalWrite(LED_ONLINE_PIN, LOW);
  } else {
    // 3. ONLINE & CONNECTED:
    // LED_ONLINE (Pin 21) = Solid ON
    // LED_SETUP = OFF, LED_CONNECTING = OFF
    digitalWrite(LED_ONLINE_PIN, HIGH);
    digitalWrite(LED_SETUP_PIN, LOW);
    digitalWrite(LED_CONNECTING_PIN, LOW);
    digitalWrite(ONBOARD_LED_PIN, HIGH);
  }
}

// ============================================================
// Relay helpers
// ============================================================
void setRelay(int pin, bool on) {
  digitalWrite(pin, on ? LOW : HIGH); // active-LOW
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
  porchOn = bodyWantsOn();
  setRelay(RELAY_PORCH, porchOn);
  sendJson(200, "{\"ok\":true,\"porch\":" + String(porchOn ? "true" : "false") + "}");
}

void handleRelayBedroomLight() {
  bedroomLightOn = bodyWantsOn();
  setRelay(RELAY_BEDROOM_LIGHT, bedroomLightOn);
  sendJson(200, "{\"ok\":true,\"bedroom_light\":" + String(bedroomLightOn ? "true" : "false") + "}");
}

void handleRelayLiving() {
  sendJson(409, "{\"ok\":false,\"error\":\"Living room is automatic PIR-controlled\"}");
}

void handleRelayBedroomFan() {
  if (systemMode != "manual") {
    sendJson(409, "{\"ok\":false,\"error\":\"Switch to manual mode first\"}");
    return;
  }
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
  delay(1000);
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
    delay(2000);
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

  // Status LED Pins
  pinMode(LED_SETUP_PIN, OUTPUT);
  pinMode(LED_CONNECTING_PIN, OUTPUT);
  pinMode(LED_ONLINE_PIN, OUTPUT);
  pinMode(ONBOARD_LED_PIN, OUTPUT);

  setRelay(RELAY_PORCH, false);
  setRelay(RELAY_LIVING, false);
  setRelay(RELAY_BEDROOM_LIGHT, false);
  setRelay(RELAY_BEDROOM_FAN, false);

  digitalWrite(LED_SETUP_PIN, LOW);
  digitalWrite(LED_CONNECTING_PIN, LOW);
  digitalWrite(LED_ONLINE_PIN, LOW);
  digitalWrite(ONBOARD_LED_PIN, LOW);

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
  while (WiFi.status() != WL_CONNECTED && millis() - start < 12000) {
    delay(150);
    Serial.print(".");
    updateStatusLeds(); // Drive connecting LED blink
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    isWifiConnected = true;
    updateStatusLeds(); // Solid Green when connected
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
  int motion = digitalRead(PIR_PIN);

  if (motion == HIGH) {
    pirHighStreak++;
  } else {
    pirHighStreak = 0;
  }

  motionActive = (pirHighStreak >= PIR_CONFIRM_COUNT);

  if (motionActive) {
    lastMotionTime = millis();
    if (!livingOn) {
      livingOn = true;
      setRelay(RELAY_LIVING, true);
    }
  } else if (livingOn && (millis() - lastMotionTime > MOTION_HOLD_MS)) {
    livingOn = false;
    setRelay(RELAY_LIVING, false);
  }
}

void handleFanAutomation() {
  static unsigned long lastDhtRead = 0;
  if (millis() - lastDhtRead < 2000) return;
  lastDhtRead = millis();

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (!isnan(h) && !isnan(t) && h >= 0 && h <= 100 && t > -20 && t < 70) {
    lastTemp = t;
    lastHumidity = h;

    if (systemMode == "auto") {
      if (!bedroomFanOn && t >= FAN_ON_TEMP) {
        bedroomFanOn = true;
        setRelay(RELAY_BEDROOM_FAN, true);
      } else if (bedroomFanOn && t <= FAN_OFF_TEMP) {
        bedroomFanOn = false;
        setRelay(RELAY_BEDROOM_FAN, false);
      }
    }
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
  updateStatusLeds(); // Drives 3-pin status indicator LEDs in real time

  if (inConfigMode) {
    dnsServer.processNextRequest();
    server.handleClient();
    yield();
    return;
  }

  handleWifiWatchdog();
  handleMotionAutomation();
  handleFanAutomation();

  server.handleClient();
  yield();
}
