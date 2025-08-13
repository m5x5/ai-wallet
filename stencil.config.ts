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
    { type: "dist" }
  ],
  plugins: [tailwind(), tailwindHMR()],
};
