module.exports = {
  require: './test/setup.js',
  timeout: 5000,
  exit: true,
  recursive: true,
  'watch-files': ['__tests__/**/*.js', 'models/**/*.js', 'controllers/**/*.js', 'routes/**/*.js'],
  'watch-ignore': ['node_modules'],
  reporter: 'spec'
};
