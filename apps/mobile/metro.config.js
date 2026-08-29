const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in monorepo
config.watchFolders = [monorepoRoot, projectRoot];

// 2. Let Metro resolve packages in both local and hoisted root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force Metro to resolve (symlinked) packages from the monorepo
config.resolver.disableHierarchicalLookup = false;

// 4. Redirect reactBatchedUpdates to native implementation and mock react-dom for mobile platforms
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('reactBatchedUpdates') && platform !== 'web') {
    return context.resolveRequest(context, './reactBatchedUpdates.native.mjs', platform);
  }
  if (moduleName === 'react-dom' && platform !== 'web') {
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

