module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  env: {
    development: {
      plugins: [["module:react-native-dotenv",{
        moduleName: "@env",
        path: '.env.development'
      }]]
    }
  },
  plugins: [
    [
      "@babel/plugin-proposal-decorators",
      {
        legacy: true,
      },
    ],
    ["@babel/plugin-proposal-optional-catch-binding"],
    ["module:react-native-dotenv", {
      "moduleName": "@env",
      "path": ".env",
      "blacklist": null,
      "whitelist": null,
      "safe": false,
      "allowUndefined": true
    }]
  ],
}
