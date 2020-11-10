# homebridge-tosot-heatpump

# Control Tosot and partners heat pumps with Apple HomeKit

This plugin is based on https://github.com/ddenisyuk/homebridge-gree-heatercooler awesome hard work with a few quality of life additions.

Diff:
- uses HeaterCooler instead Thermostat;
- no need external temperature sensor and mqtt.

Should work with all Tosot and partners (Tosot+ app) heatpumps.

## Requirements
- NodeJS (>=8.9.3) with NPM

For each AC device you need to add an accessory and specify the IP address of the device.


## Usage Example:
```
{
    "bridge": {
        "name": "Homebridge",
        "username": "CC:22:3D:E3:CE:30",
        "port": 51826,
        "pin": "123-45-568"
    },
    "accessories": [
        {
            "accessory": "TosotHeatpump",
            "host": "192.168.1.X",
            "name": "Living room AC",
            "acModel": "Gree V2",
            "useTargetTempAsCurrent": true, // for AC W/O builded in temp sensor
            "updateInterval": 10000
        },
        {
            "accessory": "TosotHeatpump",
            "host": "192.168.1.Y",
            "name": "Bedroom AC",
            "acModel": "C&H",
            "acTempSensorShift": 40,
            "updateInterval": 10000
        }
    ]
}
```
