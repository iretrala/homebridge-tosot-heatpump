const commands = require('./app/commandEnums');
const deviceFactory = require('./app/deviceFactory');
let Service, Characteristic;

module.exports = function (homebridge) {
    console.log(homebridge.platformAccessory);
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-tosot-heatpump', 'TosotHeatpump', TosotHeatpump);
}

function TosotHeatpump(log, config) {
    this.log = log;
    this.name = config.name;
    this.host = config.host;
    this.updateInterval = config.updateInterval || 10000;
    this.acTempSensorShift = config.acTempSensorShift || 40;
    this.useTargetTempAsCurrent = config.useTargetTempAsCurrent || false;
    this.model = config.acModel || "Tosot Heatpump";

    this.services = [];

    this.GreeACService = new Service.Heatpump(this.name);

    this.GreeACService
        .getCharacteristic(Characteristic.Active)
        .on('get', this.getActive.bind(this))
        .on('set', this.setActive.bind(this));

    this.GreeACService
        .getCharacteristic(Characteristic.CurrentHeatpumpState)
        .on('get', this.getCurrentHeatpumpState.bind(this));

    this.GreeACService
        .getCharacteristic(Characteristic.TargetHeatpumpState)
        .on('set', this.setTargetHeatpumpState.bind(this))
        .on('get', this.getTargetHeatpumpState.bind(this));

    this.GreeACService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({
            minValue: -100,
            maxValue: 100,
            minStep: 0.01
        })
        .on('get', this.getCurrentTemperature.bind(this));

    this.GreeACService
        .getCharacteristic(Characteristic.TemperatureDisplayUnits)
        .on('get', this.getTemperatureDisplayUnits.bind(this))
        .on('set', this.setTemperatureDisplayUnits.bind(this));

    this.GreeACService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
        .setProps({
            minValue: 16,
            maxValue: 30,
            minStep: .5
        })
        .on('set', this.setTargetTemperature.bind(this))
        .on('get', this.getTargetTemperature.bind(this));

    this.GreeACService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
        .setProps({
            minValue: 16,
            maxValue: 30,
            minStep: .5
        })
        .on('set', this.setTargetTemperature.bind(this))
        .on('get', this.getTargetTemperature.bind(this));

    this.GreeACService
        .getCharacteristic(Characteristic.SwingMode)
        .on('get', this.getSwingMode.bind(this))
        .on('set', this.setSwingMode.bind(this));

    this.GreeACService
        .getCharacteristic(Characteristic.RotationSpeed)
        .setProps({
            unit: null,
            format: Characteristic.Formats.UINT8,
            maxValue: 6,
            minValue: 1,
            validValues: [1, 2, 3, 4, 5, 6] // 6 - auto
        })
        .on('get', this.getRotationSpeed.bind(this))
        .on('set', this.setRotationSpeed.bind(this));


    this.services.push(this.GreeACService);

    this.serviceInfo = new Service.AccessoryInformation();

    this.serviceInfo
        .setCharacteristic(Characteristic.Name, this.name)
        .setCharacteristic(Characteristic.Manufacturer, Tosot)
        .setCharacteristic(Characteristic.Model, this.model)
        .setCharacteristic(Characteristic.SerialNumber, this.host.replace(/\./g, ""));

    this.services.push(this.serviceInfo);

    this.discover();
}

TosotHeatpump.prototype = {

    getServices: function () {
        return this.services;
    },

    discover: function () {

        let me = this,
            log = this.log;

        const deviceOptions = {
            host: me.host,
            updateInterval: me.updateInterval,
            onStatus: (deviceModel) => {
                me.getActive((x, val) => {
                    me.GreeACService
                        .getCharacteristic(Characteristic.Active)
                        .updateValue(val);
                });

                me.getTargetHeatpumpState((x, val) => {
                    me.GreeACService
                        .getCharacteristic(Characteristic.TargetHeatpumpState)
                        .updateValue(val);
                });

                me.getCurrentHeatpumpState((x, val) => {
                    me.GreeACService
                        .getCharacteristic(Characteristic.CurrentHeatpumpState)
                        .updateValue(val);
                });

                me.getCurrentTemperature((x, val) => {
                    me.GreeACService
                        .getCharacteristic(Characteristic.CurrentTemperature)
                        .updateValue(val);
                });


                me.getTargetTemperature((x, val) => {
                    me.GreeACService
                        .getCharacteristic(Characteristic.CoolingThresholdTemperature)
                        .updateValue(val);
                    me.GreeACService
                        .getCharacteristic(Characteristic.HeatingThresholdTemperature)
                        .updateValue(val);
                });


                me.getSwingMode((x, val) => {
                    me.GreeACService
                        .getCharacteristic(Characteristic.SwingMode)
                        .updateValue(val);
                });

                me.getRotationSpeed((x, val) => {
                    me.GreeACService
                        .getCharacteristic(Characteristic.RotationSpeed)
                        .updateValue(val);
                });

            },
            onUpdate: (deviceModel) => {
                // log.info('Status updated on %s', deviceModel.name)
            },
            onConnected: (deviceModel) => {
                if (deviceModel.bound == true) {
                    log.info('Connected to %s with IP address', deviceModel.name, deviceModel.address);
                } else {
                    log.info('Error connecting to %s with IP address %s', deviceModel.name, deviceModel.address);
                }

            },
            onError: (deviceModel) => {
                log.info('Error communicating with device %s with IP address %s', deviceModel.name, deviceModel.address);

            },
            onDisconnected: (deviceModel) => {
                log.info('Disconnected from device %s with IP address %s', deviceModel.name, deviceModel.address);

            }
        };
        log.info("Start discover device %s", deviceOptions.host);
        me.device = deviceFactory.connect(deviceOptions);
    },

    setActive: function (Active, callback, context) {
        if (this._isContextValid(context)) {
            this.device.setPower(Active === Characteristic.Active.ACTIVE ? commands.power.value.on : commands.power.value.off);
        }
        callback();
    },

    getActive: function (callback) {
        callback(null,
            this.device.getPower() === commands.power.value.off
                ? Characteristic.Active.INACTIVE
                : Characteristic.Active.ACTIVE);
    },
    getCurrentHeatpumpState: function (callback) {
        let mode = this.device.getMode(),
            state;

        switch (mode) {
            case commands.mode.value.cool:
                state = Characteristic.CurrentHeatpumpState.COOLING;
                break;
            case commands.mode.value.heat:
                state = Characteristic.CurrentHeatpumpState.HEATING;
                break;
            case commands.mode.value.auto:
                state = Characteristic.CurrentHeatpumpState.IDLE;
                break;
            default:
                state = Characteristic.CurrentHeatpumpState.INACTIVE;
        }

        callback(null, state);

    },
    getCurrentTemperature: function (callback) {
        let temp = this.useTargetTempAsCurrent ? this.device.getTemp() : this.device.getRoomTemp() - this.acTempSensorShift;
        callback(null, temp);
    },
    setTemperatureDisplayUnits: function (value, callback) {
        // F is unsupported
        callback(null);
    },

    getTemperatureDisplayUnits: function (callback) {
        // F is unsupported
        callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS);
    },

    getTargetHeatpumpState: function (callback) {
        let mode = this.device.getMode(),
            state;

        switch (mode) {
            case commands.mode.value.cool:
                state = Characteristic.TargetHeatpumpState.COOL;
                break;
            case commands.mode.value.heat:
                state = Characteristic.TargetHeatpumpState.HEAT;
                break;
            default:
                state = Characteristic.TargetHeatpumpState.AUTO;
        }
        callback(null, state);
    },

    setTargetHeatpumpState: function (TargetHeatpumpState, callback, context) {
        if (this._isContextValid(context)) {
            let mode;

            switch (TargetHeatpumpState) {
                case Characteristic.TargetHeatpumpState.HEAT:
                    mode = commands.mode.value.heat;
                    break;
                case Characteristic.TargetHeatpumpState.COOL:
                    mode = commands.mode.value.cool;
                    break;
                default:
                    mode = commands.mode.value.auto;
            }
            this.device.setMode(mode);
        }

        callback();
    },

    getTargetTemperature: function (callback) {
        callback(null, this.device.getTemp());
    },

    setTargetTemperature: function (TargetTemperature, callback, context) {
        if (this._isContextValid(context)) {
            this.device.setTemp(parseInt(TargetTemperature));
        }
        callback();
    },
    getSwingMode: function (callback) {
        callback(null,
            commands.swingVert.fixedValues.includes(this.device.getSwingVert())
                ? Characteristic.SwingMode.SWING_DISABLED
                : Characteristic.SwingMode.SWING_ENABLED);
    },
    setSwingMode: function (SwingMode, callback, context) {
        if (this._isContextValid(context)) {
            this.device.setSwingVert(SwingMode === Characteristic.SwingMode.SWING_DISABLED
                ? commands.swingVert.value.default
                : commands.swingVert.value.full);
        }
        callback();
    },

    getRotationSpeed: function (callback) {
        let speed = this.device.getFanSpeed();
        speed = speed === commands.fanSpeed.value.auto ? 6 : speed;

        callback(null, speed);

    },
    setRotationSpeed: function (RotationSpeed, callback, context) {
        if (this._isContextValid(context)) {
            let speed = RotationSpeed === 6 ? commands.fanSpeed.value.auto : RotationSpeed;
            this.device.setFanSpeed(speed);
        }
        callback();
    },

    identify: function (callback) {

        this.device.setTemp(22);
        this.log.info("identify: set temperature to 22");

        callback();
    },

    getServices: function () {
        return this.services;
    },
    _isContextValid: function (context) {
        return context !== 'fromSetValue';
    }
};
