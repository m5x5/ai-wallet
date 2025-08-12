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
  namespace: "stencil-component-example",
  outputTargets: [
    {
      type: "dist",
      /* esmLoaderPath: '../loader',*/
    },
    {
      type: "docs-readme",
    },
    {
      type: "www",
      serviceWorker: null, // disable service workers
      baseUrl: "https://poimen.github.io/",
      dir: "docs",
    },
  ],
  plugins: [tailwind(), tailwindHMR()],
};
