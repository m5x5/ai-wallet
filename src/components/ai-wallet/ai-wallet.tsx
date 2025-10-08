import {
  Component,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
} from "@stencil/core";
import RemoteStorage from "remotestoragejs";
import '@vaadin/vaadin-combo-box/vaadin-combo-box.js';

export interface AIWalletConfig {
  endpoint?: string;
  apiKey?: string;
  vlm?: string;
  llm?: string;
  sst?: string;
  tts?: string;
  enabledCapabilities?: string[];
}

// Add interface for API model response
export interface APIModel {
  id: string;
  name: string;
  capabilities?: string[];
  features?: string[];
  type?: string;
}

// Add interface for internal model structure
export interface InternalModel {
  id: string;
  name: string;
  capabilities: string[];
}

console.log(RemoteStorage);
// Handle both CommonJS and ESM exports
const rs = new (RemoteStorage as any)();
rs.access.claim("ai-wallet", "rw");
rs.on("connected", async () => {
  const client = rs.scope("/ai-wallet/");
  client.declareType("ai-wallet-config", {
    type: "object",
    properties: {
      endpoint: {
        type: "string",
        format: "uri",
        default: "https://server.budecredits.de/",
      },
      apiKey: {
        type: "string",
        default: "",
      },
      vlm: {
        type: "string",
        default: "vlm-1",
      },
      llm: {
        type: "string",
        default: "llm-1",
      },
      sst: {
        type: "string",
        default: "sst-1",
      },
      tts: {
        type: "string",
        default: "tts-1",
      },
      enabledCapabilities: {
        type: "array",
        items: { type: "string" },
        default: ["llm", "vlm", "sst", "tts"],
      },
    },
    required: [],
  });
  try {
    const savedConfig = await client.getObject("config");
    globalThis.savedConfig = savedConfig;
    globalThis.configLoadComplete = true;
  } catch (err) {
    console.log("Error loading config from remote storage:", err);
    globalThis.savedConfig = null;
    globalThis.configLoadComplete = true;
  }
});

@Component({
  tag: "ai-wallet",
  styleUrl: "ai-wallet.css",
  shadow: true,
})
export class AIWallet {
  @Prop()
  cardTitle: string;
  @Prop()
  subtitle: string;
  @Prop()
  capabilities: any = ["vlm", "llm", "sst", "tts"];
  @Prop()
  sync: boolean = true;
  @State()
  open: boolean = true;
  @State()
  enabledCapabilities: string[] = ["llm", "vlm", "sst", "tts"];
  @State()
  selectedModels: { [key: string]: string } = {
    llm: "llm-1",
    vlm: "vlm-1",
    sst: "sst-1",
    tts: "tts-1",
  };
  @State()
  activeCapability: string = "llm";
  @State()
  showModelSelector: string | null = null;

  private comboBoxRefs: { [key: string]: any } = {};

  // Internal configuration state
  @State()
  endpoint: string = "https://server.budecredits.de/";
  @State()
  apiKey: string = "";

  // Advanced config toggle state
  @State()
  showAdvancedConfig: boolean = false;

  // Configuration loading state
  @State()
  configurationLoaded: boolean = false;

  // Dynamic models state
  @State()
  models: InternalModel[] = [];
  @State()
  modelsLoading: boolean = false;
  @State()
  modelsError: string | null = null;

  // Event emitter for configuration changes
  @Event()
  configChanged: EventEmitter<AIWalletConfig>;

  private rs: any;

  componentWillLoad() {
    this.rs = rs;

    this.loadModels();

    this.rs.on("connected", async () => {
      // Wait for the global config load to complete
      await this.waitForConfigLoad();

      try {
        if (globalThis.savedConfig) {
          console.log(
            "Loading saved AI wallet configuration:",
            globalThis.savedConfig,
          );
          this.loadConfigurationFromStorage(globalThis.savedConfig);
        } else {
          console.log("No saved configuration found, using defaults");
          this.saveConfigurationToStorage();
        }
        this.configurationLoaded = true;
      } catch (err) {
        console.log("Error loading configuration:", err);
        this.saveConfigurationToStorage();
        this.configurationLoaded = true;
      }
    });
  }

  componentDidRender() {
    // Update combo box items after render
    this.updateComboBoxItems();
  }

  private updateComboBoxItems() {
    Object.keys(this.comboBoxRefs).forEach(capabilityId => {
      const comboBox = this.comboBoxRefs[capabilityId];
      if (comboBox) {
        const availableModels = this.models.filter(m =>
          m.capabilities.includes(capabilityId)
        );
        comboBox.items = availableModels.map(model => ({
          id: model.id,
          name: model.name
        }));
      }
    });
  }

  private async waitForConfigLoad(): Promise<void> {
    return new Promise((resolve) => {
      if (globalThis.configLoadComplete) {
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (globalThis.configLoadComplete) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      // Timeout after 5 seconds to avoid infinite waiting
      setTimeout(() => {
        clearInterval(checkInterval);
        globalThis.configLoadComplete = true;
        resolve();
      }, 5000);
    });
  }

  // Add model fetching methods
  private async loadModels() {
    if (!this.endpoint) {
      this.models = this.getFallbackModels();
      return;
    }

    this.modelsLoading = true;
    this.modelsError = null;

    try {
      const apiUrl = this.getModelsApiUrl(this.endpoint);
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch models: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      this.models = this.mapApiModelsToInternal(data);
      this.modelsError = null;

      // Validate and fix model selections after loading new models
      this.validateModelSelections();
      // Update combo box items with new models
      setTimeout(() => this.updateComboBoxItems(), 100);
    } catch (error) {
      console.error("Error loading models:", error);
      this.modelsError = error.message || "Failed to load models";
      this.models = this.getFallbackModels();
      this.validateModelSelections();
      // Update combo box items even with fallback models
      setTimeout(() => this.updateComboBoxItems(), 100);
    } finally {
      this.modelsLoading = false;
    }
  }

  private getModelsApiUrl(endpoint: string): string {
    // Remove trailing slash and build API URL
    const baseUrl = endpoint.replace(/\/$/, "");
    return `${baseUrl}/models`;
  }

  private mapApiModelsToInternal(apiResponse: any): InternalModel[] {
    // Handle different possible response formats
    let models: APIModel[] = [];

    if (Array.isArray(apiResponse)) {
      models = apiResponse;
    } else if (apiResponse.models && Array.isArray(apiResponse.models)) {
      models = apiResponse.models;
    } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
      models = apiResponse.data;
    } else {
      console.warn("Unexpected API response format:", apiResponse);
      return this.getFallbackModels();
    }

    return models.map((model) => ({
      id: model.id,
      name: model.id,
      capabilities: this.inferCapabilities(model),
    }));
  }

  private inferCapabilities(model: APIModel): string[] {
    const capabilities: string[] = [];

    // If the model explicitly has capabilities, use them
    if (model.capabilities && Array.isArray(model.capabilities)) {
      return model.capabilities.filter((cap) =>
        ["llm", "vlm", "sst", "tts"].includes(cap.toLowerCase()),
      );
    }

    // Infer capabilities from model name, type, or features
    const modelInfo = `${model.id} ${model.type || ""} ${(
      model.features || []
    ).join(" ")}`.toLowerCase();

    if (
      modelInfo.includes("language") ||
      modelInfo.includes("llm") ||
      modelInfo.includes("chat") ||
      modelInfo.includes("text")
    ) {
      capabilities.push("llm");
    }

    if (
      modelInfo.includes("vision") ||
      modelInfo.includes("vlm") ||
      modelInfo.includes("image") ||
      modelInfo.includes("visual")
    ) {
      capabilities.push("vlm");
    }

    if (
      modelInfo.includes("speech") ||
      modelInfo.includes("sst") ||
      modelInfo.includes("transcrib")
    ) {
      capabilities.push("sst");
    }

    if (
      modelInfo.includes("tts") ||
      modelInfo.includes("text-to-speech") ||
      modelInfo.includes("synthesis")
    ) {
      capabilities.push("tts");
    }

    // Default to llm if no capabilities could be inferred
    if (capabilities.length === 0) {
      capabilities.push("llm");
    }

    return capabilities;
  }

  private getFallbackModels(): InternalModel[] {
    return [];
  }

  private validateModelSelections() {
    const newSelectedModels = { ...this.selectedModels };
    let changed = false;

    if (changed) {
      this.selectedModels = newSelectedModels;
      console.log("Model selections updated:", newSelectedModels);
      // Emit configuration change to sync with storage and parent components
      this.emitConfigChange();
    }
  }

  private loadConfigurationFromStorage(config: any) {
    const oldEndpoint = this.endpoint;
    const oldApiKey = this.apiKey;

    if (config.endpoint !== undefined) this.endpoint = config.endpoint;
    if (config.apiKey !== undefined) this.apiKey = config.apiKey;
    if (config.enabledCapabilities) {
      this.enabledCapabilities = [...config.enabledCapabilities];
    }

    const newSelectedModels = { ...this.selectedModels };
    if (config.vlm) newSelectedModels.vlm = config.vlm;
    if (config.llm) newSelectedModels.llm = config.llm;
    if (config.sst) newSelectedModels.sst = config.sst;
    if (config.tts) newSelectedModels.tts = config.tts;
    this.selectedModels = newSelectedModels;

    // Reload models if endpoint or API key changed
    if (oldEndpoint !== this.endpoint || oldApiKey !== this.apiKey) {
      this.loadModels();
    }
  }

  private async saveConfigurationToStorage() {
    if (!this.rs || !this.rs.connected) return;

    try {
      const client = this.rs.scope("/ai-wallet/");
      const config = {
        endpoint: this.endpoint,
        apiKey: this.apiKey,
        vlm: this.selectedModels.vlm,
        llm: this.selectedModels.llm,
        sst: this.selectedModels.sst,
        tts: this.selectedModels.tts,
        enabledCapabilities: [...this.enabledCapabilities],
      };

      await client.storeObject("ai-wallet-config", "config", config);
      console.log("AI wallet configuration saved:", config);
    } catch (err) {
      console.log("Error saving configuration:", err);
    }
  }

  @Method()
  async getRemoteStorage(): Promise<any> {
    return this.rs;
  }

  // Method to get current configuration (readonly)
  @Method()
  async getConfiguration(): Promise<AIWalletConfig> {
    return {
      endpoint: this.endpoint,
      apiKey: this.apiKey,
      vlm: this.selectedModels.vlm,
      llm: this.selectedModels.llm,
      sst: this.selectedModels.sst,
      tts: this.selectedModels.tts,
      enabledCapabilities: [...this.enabledCapabilities],
    };
  }

  // Method to force save configuration to RemoteStorage
  @Method()
  async saveConfiguration(): Promise<boolean> {
    try {
      await this.saveConfigurationToStorage();
      return true;
    } catch (err) {
      console.error("Failed to save configuration:", err);
      return false;
    }
  }

  private emitConfigChange() {
    this.configChanged.emit({
      endpoint: this.endpoint,
      apiKey: this.apiKey,
      vlm: this.selectedModels.vlm,
      llm: this.selectedModels.llm,
      sst: this.selectedModels.sst,
      tts: this.selectedModels.tts,
      enabledCapabilities: [...this.enabledCapabilities],
    });

    // Only save to RemoteStorage after initial configuration has been loaded
    // to prevent overwriting the remote config during initialization
    if (this.configurationLoaded) {
      this.saveConfigurationToStorage();
    }
  }

  private async onEndpointOrKeyChange() {
    // Emit configuration change
    this.emitConfigChange();
    // Reload models when endpoint or API key changes
    await this.loadModels();
  }

  render() {
    const t = {
      capabilities: {
        llm: {
          title: "Language",
          description: "Large Language Model",
        },
        vlm: {
          title: "Vision",
          description: "Vision Language Model",
        },
        sst: {
          title: "Speech-to-Text",
          description: "Speech Synthesis",
        },
        tts: {
          title: "Text-to-Speech",
          description: "Text to Speech",
        },
      },
    };

    for (const capability of Object.keys(t.capabilities)) {
      if (!this.capabilities.includes(capability)) {
        delete t.capabilities[capability];
      }
    }

    const onEnableCapability = (capabilityId: string) => {
      this.enabledCapabilities = this.enabledCapabilities.includes(capabilityId)
        ? this.enabledCapabilities.filter((id) => id !== capabilityId)
        : [...this.enabledCapabilities, capabilityId];
      // Emit configuration change when capabilities change
      this.emitConfigChange();
    };
    const onSelectModel = (capabilityId: string, modelId: string) => {
      this.selectedModels = { ...this.selectedModels, [capabilityId]: modelId };
      // Emit configuration change when model is selected
      this.emitConfigChange();
    };
    const lang = "en";

    const allCapabilities = Object.entries(t.capabilities).map(
      ([id, capability]) => ({
        id,
        ...capability,
        icon: "🚀",
      }),
    );

    return (
      <Host>
        <div
          class={`flex flex-col items-center justify-between px-4 mb-4 bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-md shadow-lg w-full max-w-5xl @container`}
        >
          <div class="flex flex-col items-center space-y-8">
            <div class="w-full">
              <div class="mt-4 space-y-4 animate-fadeIn">
                <div>
                  <label class="text-sm font-medium text-gray-700 dark:text-zinc-200 mb-2 flex items-center justify-between">
                    API Endpoint
                    <button
                      type="button"
                      onClick={() => {
                        this.endpoint = "https://server.budecredits.de/";
                        this.onEndpointOrKeyChange();
                      }}
                      class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:underline"
                    >
                      Reset to default endpoint
                    </button>
                  </label>
                  <input
                    type="url"
                    value={this.endpoint}
                    onInput={(e) => {
                      this.endpoint = (e.target as HTMLInputElement).value;
                      this.onEndpointOrKeyChange();
                    }}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
                    placeholder="https://server.budecredits.de/"
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                    {this.models.length} AI models loaded from {this.endpoint}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-zinc-200 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={this.apiKey}
                    onInput={(e) => {
                      this.apiKey = (e.target as HTMLInputElement).value;
                      this.onEndpointOrKeyChange();
                    }}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
                    placeholder="Enter your API key"
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                    Your API key for authentication
                  </p>
                </div>
              </div>
            </div>

            {this.modelsError && (
              <div class="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 px-3 py-2 rounded-md dark:border dark:border-red-900/30">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>Models error: {this.modelsError}</span>
                <button
                  onClick={() => this.loadModels()}
                  class="ml-2 text-red-800 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200 underline text-xs"
                >
                  Retry
                </button>
              </div>
            )}

            <div class="grid grid-cols-2 grid-rows-[auto_1fr_auto] gap-4 w-full relative mb-0">
              {allCapabilities.map((capability) => {
                const isEnabled = this.enabledCapabilities.includes(
                  capability.id,
                );
                const selectedModel = this.selectedModels[capability.id];

                return (
                  <div
                    key={capability.id}
                    class={`flex flex-col p-4 rounded-lg border border-gray-200 dark:border-zinc-700`}
                  >
                    <div class="flex items-center justify-between mb-2">
                      <h3 class={`font-medium dark:text-zinc-100`}>
                        {capability.title}
                      </h3>
                      {!isEnabled && (
                        <button
                          type="button"
                          onClick={() => onEnableCapability(capability.id)}
                          class="flex items-center justify-center w-6 h-6 rounded-full text-white bg-primary-600 hover:bg-gray-300 dark:hover:bg-zinc-700 focus-visible:ring focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-primary-600 hover:text-gray-700 dark:hover:text-zinc-100 transition-colors"
                          aria-label={lang === "en" ? "Aktivieren" : "Enable"}
                        >
                          <svg
                            class="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p class="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                      {capability.description}
                    </p>

                    {isEnabled && this.models.length > 0 && (
                      <div class="relative mt-4">
                        <vaadin-combo-box
                          ref={(el: any) => this.comboBoxRefs[capability.id] = el}
                          value={selectedModel}
                          item-label-path="name"
                          item-value-path="id"
                          onValueChanged={(e: any) => {
                            console.log(e);
                            const newValue = e.detail.value;
                            if (newValue) {
                              onSelectModel(capability.id, newValue);
                            }
                          }}
                          style={{
                            '--vaadin-input-field-border-color': '#d1d5db',
                            '--vaadin-input-field-background': 'white',
                            'width': '100%'
                          }}
                        ></vaadin-combo-box>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <connect-remotestorage rs={this.rs}></connect-remotestorage>
          </div>
        </div>
      </Host>
    );
  }
}
