var superagent = require("superagent");
var Service, Characteristic;

module.exports = function(homebridge) {
  //console.log("homebridge API version: " + homebridge.version);

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-sonoff-mini-api-rest", "Sonoff", SonoffAccessory);
}


function SonoffAccessory(log, config) {
  console.log("Sonoff Accessory Init");

  this.log = log;
  this.name = config["name"];
  this.id = config["id"];
  this.url = config["url"];
  this.debug = config.debug || false;
  this.type = config["type"];
  this.valve_type = config["valve_type"];
  this.is_valve = false;

  // old version config
  if(this.url === undefined) {
    this.url = config["uri"];
  }

  switch (this.type) {
    case "fan":
      this.service = new Service.Fan(this.name);
      break;
    default:
    case "lightbulb":
      this.service = new Service.Lightbulb(this.name);
      break;
    case "switch":
      this.service = new Service.Switch(this.name);
      break;
    case "outlet":
      this.service = new Service.Outlet(this.name);
      break;
    case "valve":
      this.service = new Service.Valve(this.name);
      this.is_valve = true;
      break;
  }
  
  if (this.debug) {
    this.log('Type: ' + this.type);
    this.log('Is valve: ' + this.is_valve);
  }

  if (this.is_valve) {

    if (this.debug) {
      this.log('Valve type: ' + this.valve_type);
    }
  
    switch (this.valve_type) {
      default:
      case "generic":
        this.valve_type = Characteristic.ValveType.GENERIC_VALVE;
        break;
      case "irrigation":
        this.valve_type = Characteristic.ValveType.IRRIGATION;
        break;
      case "shower_head":
        this.valve_type = Characteristic.ValveType.SHOWER_HEAD;
        break;
      case "water_faucet":
        this.valve_type = Characteristic.ValveType.WATER_FAUCET;
        break;
    }

    if (this.debug) {
      this.log('Valve type id: ' + this.valve_type);
    }
    
    this.service
      .getCharacteristic(Characteristic.Active)
      .on('get', this.getStateInt8.bind(this))
      .on('set', this.setStateInt8.bind(this));
    this.service
      .getCharacteristic(Characteristic.InUse)
      .on('get', this.getStateInt8.bind(this));
    this.service
      .getCharacteristic(Characteristic.ValveType)
      .on('get', this.getValveType.bind(this));
  } else {
    this.service
      .getCharacteristic(Characteristic.On)
      .on('get', this.getStateBool.bind(this))
      .on('set', this.setStateBool.bind(this));
  }
}


SonoffAccessory.prototype.getStateBool = function(callback) {
  this.log("Getting current state...");

  superagent
  .post(this.url+'/zeroconf/info')
  .send({ "deviceid": this.id, "data": { } }) // sends a JSON post body
  .set('X-API-Key', 'foobar')
  .set('accept', 'json')
  .end((error, response) => {
    if (!error && response.statusCode == 200) {
      var json = JSON.parse(response.text).data;
      var state = json.switch;

      if (this.debug)           
          this.log('getState() request returned successfully ('+response.statusCode+'). Body: '+JSON.stringify(json));

      this.log("Sonoff state is %s", state);

      var on = (state == "on") ? true : false;
      callback(null, on); 
    }
    else {
      this.log("Function getStateBool(). Error getting state (status code %s): %s", response, error.message);
      callback(error);
    }
  });
}


SonoffAccessory.prototype.setStateBool = function(state, callback) {  
  
  var SonoffState = (state == true) ? "on" : "off";
  this.log("Set state to %s", SonoffState);

  superagent
    .post(this.url+'/zeroconf/switch')
    .send({ "deviceid": this.id, "data": { "switch": SonoffState } }) // sends a JSON post body
    .set('X-API-Key', 'foobar')
    .set('accept', 'json')
    .end((error, response) => {
      if (!error && response.statusCode == 200) {
        if (this.debug)           
            this.log('setState() request returned successfully ('+response.statusCode+'). Body: '+JSON.stringify(response));
        callback(null, state);
      }
      else {
        this.log("Function setStateBool(). Error getting state (status code %s): %s", response, error.message);
        callback(error);
      }      
    });
}


SonoffAccessory.prototype.getStateInt8 = function(callback) {
  this.log("Getting current state...");

  superagent
  .post(this.url+'/zeroconf/info')
  .send({ "deviceid": this.id, "data": { } }) // sends a JSON post body
  .set('X-API-Key', 'foobar')
  .set('accept', 'json')
  .end((error, response) => {
    if (!error && response.statusCode == 200) {
      var json = JSON.parse(response.text).data;
      var state = JSON.parse(json).switch;

      if (this.debug)           
          this.log('getState() request returned successfully ('+response.statusCode+'). Body: '+JSON.stringify(json));

      this.log("Sonoff state is %s", state);

      var on = (state == "on") ? 1 : 0;
      callback(null, on); 
    }
    else {
      this.log("Function getStateInt8(). Error getting state (status code %s): %s", response, error.message);
      callback(error);
    }
  });
}


SonoffAccessory.prototype.setStateInt8 = function(state, callback) {  
  
  var SonoffState = (state == 1) ? "on" : "off";
  this.log("Set state to %s", SonoffState);

  superagent
    .post(this.url+'/zeroconf/switch')
    .send({ "deviceid": this.id, "data": { "switch": SonoffState } }) // sends a JSON post body
    .set('X-API-Key', 'foobar')
    .set('accept', 'json')
    .end((error, response) => {
      if (!error && response.statusCode == 200) {
        if (this.debug)           
            this.log('setState() request returned successfully ('+response.statusCode+'). Body: '+JSON.stringify(response));
        callback(null, state);
      }
      else {
        this.log("Function setStateInt8(). Error getting state (status code %s): %s", response, error.message);
        callback(error);
      }      
    });
}

SonoffAccessory.prototype.getValveType = function(callback) {
  callback(null, this.valve_type);
}


SonoffAccessory.prototype.getServices = function() {
  return [this.service];
}
