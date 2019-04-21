module.exports = function(api) {
  if (api) {
    api.cache(true)
  }

  return {
    presets: [['@babel/preset-env', { modules: false }]],
    env: {
      test: {
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
      },
    },
  }
}
