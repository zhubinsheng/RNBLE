module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      "import",
      {
        "libraryName": "antd-mobile-rn"
      }
    ]
  ],
  // "presets": ["babel-preset-expo"],
  // "plugins": [["import", { "libraryName": "antd-mobile-rn" }]],
};
