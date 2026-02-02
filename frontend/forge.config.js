const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    name: "Aniways",
    executableName: "aniways",
    icon: "./public/Icon",
    asar: true,
    ignore: [
      /^\/node_modules\/(?!(.next|next))/,
      /^\/\.next\/cache/,
      /^\/\.git/,
      /^\/src/,
      /^\/\.env/,
      /\.map$/,
    ],
    extraResource: ["./.next/standalone", "./public"],
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "Aniways",
        setupIcon: "./public/Icon.ico",
        iconUrl: "https://raw.githubusercontent.com/your-repo/aniways/main/frontend/public/Icon.ico",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "linux", "win32"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          name: "aniways",
          productName: "Aniways",
          icon: "./public/Icon.ico",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          name: "aniways",
          productName: "Aniways",
          icon: "./public/Icon.ico",
        },
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
