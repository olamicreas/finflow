const { withXcodeProject, withEntitlementsPlist } = require('@expo/config-plugins');

function withCustomMod(config) {
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (configurations[key] && configurations[key].buildSettings) {
        const buildSettings = configurations[key].buildSettings;
        buildSettings.SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD = 'NO';
        buildSettings.SUPPORTS_MACCATALYST = 'NO';
        buildSettings.TARGETED_DEVICE_FAMILY = '"1"';
      }
    }
    return config;
  });

  config = withEntitlementsPlist(config, (config) => {
    // Safely delete aps-environment to align with Apple AppStore profile
    delete config.modResults['aps-environment'];
    return config;
  });

  return config;
}

module.exports = withCustomMod;
