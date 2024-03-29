//==============================================================================
/**
@file		nanoleaf.js
@brief		Nanoleaf Plugin
@copyright	(c) 2021, fSoft, Ltd.
			This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a Nanoleaf controller
function Nanoleaf(ip = null, token = null, sn = null, name = null, info = null) {
	// Init Nanoleaf
	var instance = this;
	// Private variable
	var ip = ip;
	var token = token;
	var sn = sn;
	var name = name;
	var info = info;

	// Public function to retrieve the IP address
	this.getIP = function () {
		return ip;
	};

	// Public function to retrieve the name
	this.getName = function () {
		return name;
	};

	// Public function to retrieve the ID
	this.getSN = function () {
		return sn;
	};

	// Public function to retrieve the authorization token
	this.getToken = function () {
		return token;
	};

	// Public function to retrieve the controller infomation
	this.getInfo = function () {
		return info;
	};

	// Public function to set the controller infomation
	this.setInfo = function (result, callback) {
		info = result;
		callback(true);
	};

	// Public function to set the brightness status of the controller
	this.setBrightness = function (state, value, callback) {
		// Define value object and Send new payload
		var temp = '{"brightness": {"value": ' + value + '}}';
		instance.setController('state', temp, function (success, message, value) {
			instance.getController('A', function (success, result) {
				instance.setInfo(result, function (success) {
					callback(success, message);
				});
			});
		});
	};

	// Public function to set the color of the controller
	this.setColor = function (state, value, callback) {
		// Define color object
		var hsv = convertcolor(value);
		var temp = '{"ct": {"value": ' + parseInt(hsv.v) + '}, "hue": {"value": ' + parseInt(hsv.h) + '}, "sat": {"value": ' + parseInt(hsv.s) + '}}';
		instance.setController('state', temp, function (success, message, value) {
			instance.getController('A', function (success, result) {
				instance.setInfo(result, function (success) {
					callback(success, message);
				});
			});
		});
	};

	// Public function to set the effects of the controller
	this.setEffect = function (state, value, callback) {
		// Define state object and Send new state
		var temp = '{"select": "' + value + '"}';
		instance.setController('effects', temp, function (success, message, value) {
			instance.getController('A', function (success, result) {
				instance.setInfo(result, function (success) {
					callback(success, message);
				});
			});
		});
	};

	// Public function to set the power status of the controller
	this.setPower = function (state, value, callback) {
		// Set the power to true/false
		var temp = (state ? true : false);
		// Define state object and Send new state
		var temp = '{"on": {"value": ' + temp + '}}';
		instance.setController('state', temp, function (success, message, value) {
			instance.getController('A', function (success, result) {
				instance.setInfo(result, function (success) {
					callback(success, message);
				});
			});
		});
	}

	// Static function to get the data from a controller
	this.getController = async function (result, callback) {
		var URL = "http://" + ip + ":16021/api/v1/" + token + "/";
		var XHR = new XMLHttpRequest();
		XHR.responseType = 'json';
		XHR.timeout = 5000;
		XHR.open('GET', URL, true);
		XHR.setRequestHeader("Content-Type", "application/json");

		XHR.onload = function () {
			if (XHR.readyState === 4 && XHR.status === 200) {
				if (XHR.response !== undefined && XHR.response !== null) {
					var result = XHR.response;
					if ('name' in result && 'serialNo' in result) {
						callback(true, result);
					} else {
						callback(false, 'Did not get controller serial number.');
					}
				} else {
					callback(false, 'Controller response is undefined or null.');
				}
			} else {
				callback(false, 'Could not connect to the controller.');
			}
		};

		XHR.onerror = function () {
			callback(false, 'Unable to connect to the controller.');
		};

		XHR.ontimeout = function () {
			callback(false, 'Connection to the controller timed out.');
		};

		var obj = {};
		obj.devicetype = 'stream_deck';
		var data = JSON.stringify(obj);
		XHR.send(data);
	};

	// Public function to set a value on the controller
	this.setController = function (command, value, callback) {
		var URL = "http://" + ip + ":16021/api/v1/" + token + "/" + command;
		var XHR = new XMLHttpRequest();
		XHR.responseType = 'text';
		XHR.timeout = 2000;
		XHR.open('PUT', URL, true);
		XHR.setRequestHeader("Content-Type", "application/json");

		XHR.onload = function () {
			if (XHR.readyState === 4 && XHR.status === 204) {
				if (XHR.response !== undefined && XHR.response !== null) {
					if (XHR.statusText == 'No Content') {
						callback(true, 'OK', value);
					} else {
						callback(false, 'Did not get controller serial number.');
					}
				} else {
					callback(false, 'Controller response is undefined or null.');
				}
			} else {
				callback(false, 'Could not connect to the controller.');
			}
		};

		XHR.onerror = function () {
			callback(false, 'Unable to connect to the controller.');
		};

		XHR.ontimeout = function () {
			callback(false, 'Connection to the controller timed out.');
		};

		value.devicetype = 'stream_deck';
		XHR.send(value);
	};
}

// Private function to build a cache
Nanoleaf.buildcache = async function (callback) {
	if (window.nanoControllerCache['status'] !== "") {
		return;
	}
	window.nanoControllerCache['status'] = 'building';
	var keys = Object.keys(window.nanoControllers);
	var index = 0;
	// Iterate through all controllers that were discovered
	while (index < keys.length) {
		let SN = keys[index];
		index++;
		let nanoData = window.nanoControllers[SN];
		// add the IP to the global array
		window.nanoControllerIPs.push(nanoData.nanoIP);
		try {
			// Get the controller info here
			let result = await Nanoleaf.getController(nanoData.nanoIP, nanoData.nanoToken);
			if (result[0]) {
				var NF = await getnanoleaf(result, nanoData.nanoIP, nanoData.nanoToken, nanoData.nanoSN, nanoData.nanoName);
				let nanoKey = '"' + nanoData.nanoSN + '"';
				window.nanoControllerCache[nanoKey] = NF;
			}
		} catch(e) {
			log(e);
		}
		if (index >= keys.length) {
			window.nanoControllerCache['status'] = 'done';
			callback(true);
		}
	}

	async function getnanoleaf(result, nanoIP, nanoToken, nanoSN, nanoName) {
		return new Promise(function (resolve, reject) {
			if (result[0]) {
				let nanoInfo = result[1];
				let NF = new Nanoleaf(nanoIP, nanoToken, nanoSN, nanoName, nanoInfo);
				resolve(NF);
			} else {
				reject(result);
			}
		});
	}
}

// Find the controller in the nanoControllerCache
Nanoleaf.findhost = function (callback) {
	var hosts = window.nanoControllerCache.length;
	var host = 0;
	var thehost = 0;
	while (host < hosts) {
		host++;
		(function (host) {
			if (settings.nanoController in window.nanoControllerCache) {
			}
		})(host);
		if (host >= hosts) {
			callback(true, thehost);
		}
	}
}

// Static function to search the network for controllers
Nanoleaf.findControllers = function (callback) {
	// scanning a single Class-C. Need to search the subnet mask to determin if the network consists of more than one Class-C.
	var _networkIP = localIP.match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)./);
	var networkIP = _networkIP[0];
	var haveIPs = [];
	var needIPs = [];
	var XHR = [];
	var host = 0;
	while (host < 254) {
		host++;
		var URL = "http://" + networkIP + host + ":16021/api/v1/";
		(function (host) {
			var ip = "";
			XHR[host] = new XMLHttpRequest();
			XHR[host].timeout = 1000;
			XHR[host].open('GET', URL, true);
			XHR[host].setRequestHeader("Content-Type", "application/json");

			XHR[host].onreadystatechange = function () {
				if (XHR[host].readyState === 4 && XHR[host].status === 401) {
					ip = (networkIP + host).toString();
					if (window.nanoControllerIPs.indexOf(ip) < 0) {
						needIPs.push(ip);
					} else {
						haveIPs.push(ip);
					}
				}
			}
			XHR[host].send();
		})(host);
		if (host >= 254) {
			callback(true, needIPs, haveIPs);
		}
	}
}

// Static function to get a new authorization token from the controller
Nanoleaf.getNewToken = function (nanoIP, callback) {
	if (nanoIP) {
		var URL = "http://" + nanoIP + ":16021/api/v1/new";
		var XHR = new XMLHttpRequest();
		XHR.open('POST', URL, true);
		XHR.setRequestHeader("Content-Type", "application/json");
		XHR.responseType = 'json';
		XHR.timeout = 2500;

		XHR.onload = function () {
			if (XHR.readyState === 4 && XHR.status === 200) {
				if (XHR.response !== undefined && XHR.response != null) {
					var result = XHR.response;
					if (XHR['responseType'] == "json") {
						var nanoToken = result['auth_token'];
						callback(true, nanoToken);
					} else {
						callback(false, 'Did not get auth_token');
					}
				} else {
					callback(false, 'Controller response is undefined or null.');
				}
			} else {
				callback(false, 'Could not connect to the controller.');
			}
		};

		XHR.onerror = function () {
			callback(false, 'Unable to connect to the controller.');
		};

		XHR.ontimeout = function () {
			callback(false, 'Connection to the controller timed out.');
		};

		var obj = {};
		obj.devicetype = 'stream_deck';
		var data = JSON.stringify(obj);
		XHR.send(data);
	} else {
		callback(false, 'No IP address given.');
	}
};

// Static function to get the data from a controller
Nanoleaf.getController = async function (nanoIP, nanoToken) {
	var XHR = new XMLHttpRequest();
	return new Promise(function (resolve, reject) {
		let URL = "http://" + nanoIP + ":16021/api/v1/" + nanoToken + "/";
		XHR.open('GET', URL, true);
		XHR.setRequestHeader("Content-Type", "application/json");
		XHR.responseType = 'json';
		XHR.timeout = 5000;

		XHR.onload = function () {
			if (XHR.readyState === 4 && XHR.status === 200) {
				if (XHR.response !== undefined && XHR.response != null) {
					let result = XHR.response;
					if ('name' in result && 'serialNo' in result) {
						resolve([true, result]);
					} else {
						reject([false, 'Did not get controller serial number: ' + nanoIP]);
					}
				} else {
					reject([false, 'Controller response is undefined or null: ' + nanoIP]);
				}
			} else {
				reject([false, 'Could not connect to the controller: ' + nanoIP]);
			}
		};

		XHR.onerror = function () {
			reject([false, 'Unable to connect to the controller: ' + nanoIP]);
		};

		XHR.ontimeout = function () {
			reject([false, 'Connection to the controller timed out: ' + nanoIP]);
		};

		let obj = {};
		obj.devicetype = 'stream_deck';
		let data = JSON.stringify(obj);
		XHR.send(data);
	});
};

function convertcolor(color) {
	var hsv = hex2hsv(color);
/*
	var hue = {"value": parseInt(hsv.h)};
	var sat = {"value": parseInt(hsv.s)};
	var ct = {"value": parseInt(hsv.v)};
	var targetState = '"ct": ct, "hue": hue, "sat": sat';
*/
	return hsv;
}

// Static function to convert hex to rgb
function hex2rgb(inHex) {
	// Remove hash if it exists
	if (inHex.charAt(0) === '#') {
		inHex = inHex.substr(1);
	}
	// Split hex into RGB components
	var rgbArray = inHex.match(/.{1,2}/g);
	// Convert RGB component into decimals
	var red = parseInt(rgbArray[0], 16);
	var green = parseInt(rgbArray[1], 16);
	var blue = parseInt(rgbArray[2], 16);
	return { 'r': red, 'g': green, 'b': blue };
}

// Static function to convert hex to hsv
function hex2hsv(inHex) {
	// Convert hex to rgb
	var rgb = hex2rgb(inHex);
	// Convert rgb to hsv
	return rgb2hsv(rgb);
}

// Static function to convert rgb to hsv
function rgb2hsv(inRGB) {
	// Calculate the brightness and saturation value
	var max = Math.max(inRGB.r, inRGB.g, inRGB.b);
	var min = Math.min(inRGB.r, inRGB.g, inRGB.b);
	var d = max - min;
	var s = (max === 0 ? 0 : d / max);
	var v = (min * 100) / 255;
	// Calculate the hue value
	var h;
	switch (max) {
		case min:
			h = 0;
			break;
		case inRGB.r:
			h = (inRGB.g - inRGB.b) + d * (inRGB.g < inRGB.b ? 6 : 0);
			h /= 6 * d;
			break;
		case inRGB.g:
			h = (inRGB.b - inRGB.r) + d * 2;
			h /= 6 * d;
			break;
		case inRGB.b:
			h = (inRGB.r - inRGB.g) + d * 4;
			h /= 6 * d;
			break;
	}
	h = (h * 360);
	s = (s * 100);
	var calc = ((6500 - 1200) / 100);
	calc = (calc * v);
	v = calc + 1200;
	if (v > 6500) {
		v = 6500;
	} else if (v < 1200) {
		v = 1200;
	}
	return { 'h': h, 's': s, 'v': v };
}

/*
// functions not used
// Static function to convert hex to xy
function hex2xy(inHex) {
	// Convert hex to rgb
	var rgb = Nanoleaf.hex2rgb(inHex);
	// Concert RGB components to floats
	red = rgb.r / 255;
	green = rgb.g / 255;
	blue = rgb.b / 255;
	// Convert RGB to XY
	var r = red > 0.04045 ? Math.pow(((red + 0.055) / 1.055), 2.4000000953674316) : red / 12.92;
	var g = green > 0.04045 ? Math.pow(((green + 0.055) / 1.055), 2.4000000953674316) : green / 12.92;
	var b = blue > 0.04045 ? Math.pow(((blue + 0.055) / 1.055), 2.4000000953674316) : blue / 12.92;
	var x = r * 0.664511 + g * 0.154324 + b * 0.162028;
	var y = r * 0.283881 + g * 0.668433 + b * 0.047685;
	var z = r * 8.8E-5 + g * 0.07231 + b * 0.986039;
	// Convert XYZ zo XY
	var xy = [x / (x + y + z), y / (x + y + z)];
	if (isNaN(xy[0])) {
		xy[0] = 0.0;
	}
	if (isNaN(xy[1])) {
		xy[1] = 0.0;
	}
	return xy;
};

// Static function to convert hsv to hex
function hsv2hex(inHSV) {
	// Convert hsv to rgb
	var rgb = Nanoleaf.hsv2rgb(inHSV);
	// Convert rgb to hex
	return Nanoleaf.rgb2hex(rgb);
}

// Static function to convert hsv to rgb
function hsv2rgb(inHSV) {
	var r = null;
	var g = null;
	var b = null;
	var i = Math.floor(inHSV.h * 6);
	var f = inHSV.h * 6 - i;
	var p = inHSV.v * (1 - inHSV.s);
	var q = inHSV.v * (1 - f * inHSV.s);
	var t = inHSV.v * (1 - (1 - f) * inHSV.s);
	// Calculate red, green and blue
	switch (i % 6) {
		case 0:
			r = inHSV.v;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = inHSV.v;
			b = p;
			break;
		case 2:
			r = p;
			g = inHSV.v;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = inHSV.v;
			break;
		case 4:
			r = t;
			g = p;
			b = inHSV.v;
			break;
		case 5:
			r = inHSV.v;
			g = p;
			b = q;
			break;
	}
	// Convert rgb values to int
	var red = Math.round(r * 255);
	var green = Math.round(g * 255);
	var blue = Math.round(b * 255);
	return { 'r': red, 'g': green, 'b': blue };
}

// Static function to convert rgb to hex
function rgb2hex(inRGB) {
	return '#' + ((1 << 24) + (inRGB.r << 16) + (inRGB.g << 8) + inRGB.b).toString(16).slice(1);
}
*/
