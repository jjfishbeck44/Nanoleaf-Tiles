//==============================================================================
/**
@file		action.js
@brief		Nanoleaf Plugin
@copyright	(c) 2021, fSoft, Ltd.
			This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Protype which represents an action
function Action(inContext, inSettings) {
	// Init Action
	var instance = this;
	// Private variable containing the context of the action
	var context = inContext;
	// Private variable containing the settings of the action
	var settings = inSettings;

	// Set the default values
	setDefaults();
	// Public function returning the context
	this.getContext = function () {
		return context;
	};
	// Public function returning the settings
	this.getSettings = function () {
		return settings;
	};
	// Public function for settings the settings
	this.setSettings = function (inSettings) {
		settings = inSettings;
	};

	// Private function to set the defaults
	function setDefaults(inCallback) {
		// If at least one controller is authorized
		if (Object.keys(globalSettings).length == 0) {
			// If a callback function was given
			if (inCallback !== undefined) {
				// Execute the callback function
				inCallback();
			}
			return;
		}
		// Find out type of action
		var action;
		if (instance instanceof PowerAction) {
			action = 'com.fsoft.nanoleaf.power';
		} else if (instance instanceof BrightnessAction) {
			action = 'com.fsoft.nanoleaf.brightness';
		} else if (instance instanceof ColorAction) {
			action = 'com.fsoft.nanoleaf.color';
		} else if (instance instanceof EffectsAction) {
			action = 'com.fsoft.nanoleaf.effects';
		}
		// If the controller is set for this action
		if (!('nanoController' in settings)) {
			// Sort the controllers alphabetically
			var controllerIDsSorted = Object.keys(globalSettings.nanoControllers).sort(function (a, b) {
				return globalSettings.nanoControllers[a].nanoName.localeCompare(globalSettings.nanoControllers[b].nanoName);
			});
			// Save the settings
			saveSettings(action, inContext, settings);
		}
		// If a callback function was given
		if (inCallback !== undefined) {
			// Execute the callback function
			inCallback();
		}
	}
}