const { withXcodeProject } = require('@expo/config-plugins');

function withDisableMacSupport(config) {
  return withXcodeProject(config, (config) => {
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
}

module.exports = withDisableMacSupport;
