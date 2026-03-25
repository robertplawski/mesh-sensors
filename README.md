# Lora sensors server

## What is it?
This project uses lora connectivity to send arduino sensor data from client to server. Server uses web technologies to host api endpoints, and next.js for responsive PWA for data visualization and server interaction. We've also used tinkercad to create mounts for the powerbank. Sensor reads the data from bosch sensor -> temperature, pressure, humidity, gas resistance, voc, co2

## DEMO
You can see the live working demo at `https://sensors.eksabajt.pl`

## SHOWCASE
Below we'll attach some images to show the sensors in action.

## Beware
This is our first 3d printing + rpi + arduino project made in 2 weeks, please do not expect any quality nor reliability. (we tried, ok?). The code wasn't tested with more than one client and may require modification in order to do so.

## Hardware
In this demo we've used [MKR IOT Carrier v2 board from Arduino Opla kit](https://store-usa.arduino.cc/products/arduino-opla-iot-kit) and [Raspberry PI 4B](https://www.raspberrypi.com/products/raspberry-pi-4-model-b/) with [SX1262 868M LoRa HAT](https://www.waveshare.com/wiki/SX1262_868M_LoRa_HAT) and a [baesus powerbank](https://store-usa.arduino.cc/products/arduino-opla-iot-kit) for client power. You'd need two opla kits, 2 rpis and 2 lora hats with 1 powerbank to get this setup working. 

It would be advised to have pliers ready for 3d print supports and whatnot. Also a pc with ssh access to raspberry pi would be nice.

## Case...
We're using a case from [I-box-it](https://makerworld.com/en/models/1111693-raspberry-pi-4-case-wall-mount-options#profileId-1108376), you should download it from there and print the accurate version (with gpio clearance) for the server raspberry pi. For the client raspberry pi we've included stls with a mount for a powerbank. Also included a mkr iot board mount for the powerbank. 

## Getting started
Connect the LoRa HAT to raspberry pi as per [manual](https://www.waveshare.com/wiki/SX1262_868M_LoRa_HAT), do not forget to enable it on raspberry pi.
Assemble your Arduino Opla Kit sensor as in instruction and flash the sketch in `arduino/` modify code as necessary. Then connect it to your raspberry pi using an usb cable. Connect to your raspberry pis using ssh and clone the repo. Modify the config to include names, address 0 for server lon, lat and password. Build the frontend by using command `cd frontend/ && npm run build`, then create a systemd service to run the backend (look inside services dir) and another to run frontend. On the client raspberry pi you'd need to also edit the config (different name and address 1 for client) and create a client service. If everything was done correctly your PIs should talk to each other exchanging sensor data -> you can access the dashboard at `localhost:3000` on the pi, or `<pis-ip-addr>:3000` on the network

## Troubleshooting
Common problems with this setup include
- the arduino not connecting - try restarting the PI, reseating USB cable, changing the device in the script to accurate one 
- the hat not working correctly - try working with the wiki one more time, beware of jumper position and software setup
- the dashboard not working - ensure your server pi has internet connection and the port isn't occupied by other service. 

GLHF 
