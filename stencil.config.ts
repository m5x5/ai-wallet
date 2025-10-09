import { Config } from "@stencil/core";
import tailwind, {
  tailwindHMR,
  setPluginConfigurationDefaults,
} from "stencil-tailwind-plugin";

setPluginConfigurationDefaults({
  enableDebug: false,
  tailwindCssPath: "./src/styles/tailwind.css",
});

export const config: Config = {
  namespace: "ai-wallet",
  outputTargets: [
    {
      type: "dist",
      esmLoaderPath: "../loader",
    },
    { type: "dist-custom-elements",
      customElementsExportBehavior: 'auto-define-custom-elements',
      includeGlobalScripts: true,
     },
    {
      type: "www",
      serviceWorker: null,
      dir: "dev",
    }
  ],
  plugins: [tailwind(), tailwindHMR()],
};
