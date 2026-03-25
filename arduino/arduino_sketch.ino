#include <Arduino_MKRIoTCarrier.h>
#define HAS_MOTOR true
#define MOTION_DETECTOR_SECONDS 60
MKRIoTCarrier carrier;

int INA = 2;
int INB = 3;

byte sensorPin = 7;


void setup() {
  pinMode(INA, OUTPUT);
  pinMode(INB, OUTPUT);
  pinMode(sensorPin,INPUT);

  digitalWrite(INA, LOW);
  digitalWrite(INB, LOW);

  Serial.begin(9600);
  Serial.println("Temp_C,Humidity,Pressure_kPa,Gas_Ohms,VOC,CO2,IAQ,Motor_running,buzzer,motion_detected,armed");

  carrier.noCase();
  carrier.begin();
  //carrier.display.clear();
  carrier.display.fillScreen(0x0000);
  carrier.display.setRotation(0);
}
bool isArmed = false;
bool motionDetected = false;
bool buzzerRunning = false;
bool motorRunning = false;
unsigned long motorStartTime = 0;
int motionDetectedTime = 0;
void loop() {
  // ---- Handle Serial Input ----
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    // Split input by commas
    const int maxArgs = 5;  // change if you expect more
    String args[maxArgs];
    int argCount = 0;
    int start = 0;
    for (int i = 0; i <= input.length(); i++) {
      if (input[i] == ',' || i == input.length()) {
        args[argCount++] = input.substring(start, i);
        args[argCount - 1].trim();
        args[argCount - 1].toLowerCase(); // make lowercase for easier comparison
        start = i + 1;
        if (argCount >= maxArgs) break;
      }
    }
   
    // ---- Command Handling ----
    if (argCount > 0) {
      String cmd = args[0];

      if(cmd == "alarm" && argCount > 1){
        if(args[1] == "arm"){
          isArmed = true;
             printSensors();
        }
        if(args[1] == "disarm"){
          isArmed = false;
             printSensors();
        }
      }
     

      // --- Sensor Command ---
      if (cmd == "sensors" && argCount > 1 && args[1] == "read") {
        printSensors();
      }

      if (cmd == "buzzer" && argCount > 1 ){
        int freq = args[1].toInt();
        if(freq == 0){
          carrier.Buzzer.noSound();
          buzzerRunning = false;
             printSensors();
        }else{
     if(argCount > 2){
          int duration =  args[2].toInt();
          carrier.Buzzer.beep(freq,duration); 
        buzzerRunning = false;
           printSensors();

        }else{
        carrier.Buzzer.sound(freq); 
        buzzerRunning = true;
           printSensors();
        }
        }
   
      }
      // --- Motor Commands ---
      if (HAS_MOTOR && cmd == "motor") {
        if (argCount > 1) {
          String action = args[1];
          if (action == "on" && !motorRunning) {
            motorStartTime = millis();
            motorRunning = true;
               printSensors();
          } else if (action == "off" && motorRunning) {
            motorRunning = false;
               printSensors();
          }
          // Optional: handle motor speed if provided
          if (argCount > 2) {
            int speed = args[2].toInt(); // 0-255
            if (motorRunning) {
              analogWrite(INA, speed);
              digitalWrite(INB, LOW);
            }
          }
        }
      }
    }
  }

  // ---- Motor Control ----
  if (HAS_MOTOR && motorRunning ) {
    digitalWrite(INA, HIGH);
    digitalWrite(INB, LOW);
  } 
   if (HAS_MOTOR && !motorRunning) {
    digitalWrite(INA, LOW);
    digitalWrite(INB, LOW);
  }
  byte motion = digitalRead(sensorPin);
  
  if(motion == HIGH){
    motionDetected = true;
    motionDetectedTime = millis();
  }
    if(motionDetected && millis() - motionDetectedTime > MOTION_DETECTOR_SECONDS * 1000){
      motionDetected = false;
      motionDetectedTime = 0;
    }
  delay(10);
}

// ---- Sensor Printing Function ----
void printSensors() {
  int r = 0, g = 0, b = 0;

  float temperatureC = carrier.Env.readTemperature();
  float humidity = carrier.Env.readHumidity();
  float pressure = carrier.Pressure.readPressure();
  float gasResistor = carrier.AirQuality.readGasResistor();
  float voc = carrier.AirQuality.readVOC();
  float iaq = carrier.AirQuality.readStaticIAQ();
  float co2 = carrier.AirQuality.readCO2();

  /*float accX = 0, accY = 0, accZ = 0;
  float gyroX = 0, gyroY = 0, gyroZ = 0;

  if (IMU.accelerationAvailable()) IMU.readAcceleration(accX, accY, accZ);
  if (IMU.gyroscopeAvailable()) IMU.readGyroscope(gyroX, gyroY, gyroZ);

  int gestureVal = -1;
  if (carrier.Light.gestureAvailable()) {
    uint8_t gesture = carrier.Light.readGesture();
    if (gesture == UP) gestureVal = 0;
    else if (gesture == DOWN) gestureVal = 1;
    else if (gesture == LEFT) gestureVal = 2;
    else if (gesture == RIGHT) gestureVal = 3;
  }

  if (carrier.Light.colorAvailable()) carrier.Light.readColor(r, g, b);*/

  Serial.print(temperatureC); Serial.print(",");
  Serial.print(humidity); Serial.print(",");
  Serial.print(pressure); Serial.print(",");
  Serial.print(gasResistor); Serial.print(",");
  Serial.print(voc); Serial.print(",");
  Serial.print(co2); Serial.print(",");
  Serial.print(iaq); Serial.print(",");
  Serial.print(motorRunning); Serial.print(',');
  Serial.print(buzzerRunning); Serial.print(',');
  Serial.print(motionDetected); Serial.print(',');
  Serial.print(isArmed); 
}