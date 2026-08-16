/*
 * Smart Home — Blynk Edition
 *
 * Hardware: ESP32, DHT11 (GPIO17), PIR (GPIO4),
 *           Relay channels on GPIO25, GPIO26, GPIO27
 *
 * Blynk Template ID, Name, and Auth Token go below.
 * Get these from blynk.cloud → Templates → your template.
 */

#define BLYNK_TEMPLATE_ID   "YOUR_TEMPLATE_ID"
#define BLYNK_TEMPLATE_NAME "Smart Home"
#define BLYNK_AUTH_TOKEN    "YOUR_AUTH_TOKEN"

#include <WiFi.h>
#include <WiFiClient.h>
#include <BlynkSimpleEsp32.h>
#include <DHT.h>

// ── Wi-Fi ──
char ssid[] = "YOUR_WIFI_SSID";
char pass[] = "YOUR_WIFI_PASSWORD";

// ── Pins ──
#define PIR_PIN        4
#define DHTPIN         17
#define DHTTYPE        DHT11
#define RELAY_PORCH    25   // V3
#define RELAY_LIVING   26   // V4
#define RELAY_BEDROOM  27   // V5

// ── DHT ──
DHT dht(DHTPIN, DHTTYPE);

// ── State ──
bool autoMode = true;
bool lastMotion = false;
unsigned long lastMotionTime = 0;
const unsigned long MOTION_HOLD_MS = 5000;

// PIR debounce
int pirHighStreak = 0;
const int PIR_CONFIRM_COUNT = 3;

// ── Blynk virtual pin handlers ──

// V6: Auto/Manual mode switch (1 = auto, 0 = manual)
BLYNK_WRITE(V6) {
  autoMode = (param.asInt() == 1);
  Blynk.logEvent("mode_change", autoMode ? "Auto mode" : "Manual mode");
}

// V3: Porch light manual control
BLYNK_WRITE(V3) {
  if (!autoMode) {
    digitalWrite(RELAY_PORCH, param.asInt() ? LOW : HIGH);
  }
}

// V4: Living room LED manual control
BLYNK_WRITE(V4) {
  if (!autoMode) {
    digitalWrite(RELAY_LIVING, param.asInt() ? LOW : HIGH);
  }
}

// V5: Bedroom fan manual control
BLYNK_WRITE(V5) {
  if (!autoMode) {
    digitalWrite(RELAY_BEDROOM, param.asInt() ? LOW : HIGH);
  }
}

// ── Setup ──
void setup() {
  Serial.begin(115200);
  delay(500);

  // Pins
  pinMode(PIR_PIN, INPUT);
  pinMode(RELAY_PORCH, OUTPUT);
  pinMode(RELAY_LIVING, OUTPUT);
  pinMode(RELAY_BEDROOM, OUTPUT);

  // All relays OFF (active-LOW: HIGH = off)
  digitalWrite(RELAY_PORCH, HIGH);
  digitalWrite(RELAY_LIVING, HIGH);
  digitalWrite(RELAY_BEDROOM, HIGH);

  // DHT
  dht.begin();
  delay(1500);

  // Blynk
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);
  Serial.println("Smart Home started (Blynk)");
}

// ── Main loop ──
void loop() {
  Blynk.run();

  // ── PIR motion (auto mode only) ──
  if (autoMode) {
    int motion = digitalRead(PIR_PIN);

    if (motion == HIGH) {
      pirHighStreak++;
    } else {
      pirHighStreak = 0;
    }

    if (pirHighStreak >= PIR_CONFIRM_COUNT) {
      lastMotionTime = millis();
      if (!lastMotion) {
        lastMotion = true;
        // Motion detected: turn on porch + living room
        digitalWrite(RELAY_PORCH, LOW);
        digitalWrite(RELAY_LIVING, LOW);
        Blynk.virtualWrite(V2, 1);  // motion indicator
        Blynk.virtualWrite(V3, 1);  // sync porch state
        Blynk.virtualWrite(V4, 1);  // sync living state
        Blynk.logEvent("motion", "Motion detected");
        Serial.println("Motion -> porch + living ON");
      }
    } else if (lastMotion && millis() - lastMotionTime > MOTION_HOLD_MS) {
      lastMotion = false;
      // No motion for 5s: turn off
      digitalWrite(RELAY_PORCH, HIGH);
      digitalWrite(RELAY_LIVING, HIGH);
      Blynk.virtualWrite(V2, 0);
      Blynk.virtualWrite(V3, 0);
      Blynk.virtualWrite(V4, 0);
      Serial.println("No motion for 5s -> porch + living OFF");
    }
  }

  // ── DHT sensor (every 2 seconds) ──
  static unsigned long lastDhtRead = 0;
  if (millis() - lastDhtRead > 2000) {
    lastDhtRead = millis();

    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (!isnan(h) && !isnan(t)) {
      Blynk.virtualWrite(V0, t);  // temperature
      Blynk.virtualWrite(V1, h);  // humidity
      Serial.printf("Temp: %.1f°C  Humidity: %.0f%%\n", t, h);
    }
  }

  delay(100);
}
