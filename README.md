# Control Tosot and partners heat pumps with Apple HomeKit

This plugins is based on the amazing hardwork of https://github.com/ddenisyuk/homebridge-gree-heatercooler.

Diff:
- Utilizes more options for configuration
- Config menu for Homebridge (coming soon)

Should work with all Tosot and partners (Tosot+ app) heatpumps.

## Requirements
- NodeJS (>=8.9.3) with NPM

For each AC device you need to add an accessory and specify the IP address of the device.


## Configuration options

| Key | Required | Default | Description |
| --- | --- | --- | --- |
| `accessory` | yes | — | Must be exactly `TosotHeaterCooler`. |
| `name` | yes | — | Display name of the accessory in HomeKit. |
| `host` | yes | — | IP address of the AC unit. |
| `serialnumber` | no | — | Serial number shown in the Home app's accessory info. |
| `acModel` | no | `Tosot HeaterCooler` | Model name shown in the Home app's accessory info. |
| `useTargetTempAsCurrent` | no | `false` | Set to `true` for units without a built-in room temperature sensor, so the current temperature reported to HomeKit falls back to the target temperature. |
| `acTempSensorShift` | no | `40` | Offset subtracted from the raw sensor reading to get the room temperature (only used when `useTargetTempAsCurrent` is `false`). |
| `updateInterval` | no | `10000` | Polling interval in milliseconds for status updates from the device. |

## Usage Example:
```json
{
    "bridge": {
        "name": "Homebridge",
        "username": "CC:22:3D:E3:CE:30",
        "port": 51826,
        "pin": "123-45-568"
    },
    "accessories": [
        {
            "accessory": "TosotHeaterCooler",
            "host": "192.168.1.X",
            "name": "Living room AC",
            "acModel": "Tosot X5302",
            "serialnumber": "25b2t646df642t6564",
            "useTargetTempAsCurrent": true,
            "updateInterval": 10000
        },
        {
            "accessory": "TosotHeaterCooler",
            "host": "192.168.1.Y",
            "name": "Bedroom AC",
            "acModel": "C&H",
            "acTempSensorShift": 40,
            "updateInterval": 10000
        }
    ]
}
```
