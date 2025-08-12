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

  // Internal configuration state
  @State()
  endpoint: string = "https://server.budecredits.de/";
  @State()
  apiKey: string = "";

  // Advanced config toggle state
  @State()
  showAdvancedConfig: boolean = false;

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

  private rs: RemoteStorage;

  componentWillLoad() {
    this.rs = new RemoteStorage();
    this.rs.access.claim("ai-wallet", "rw");

    // Load models initially
    this.loadModels();

    this.rs.on("connected", async () => {
      const client = this.rs.scope("/ai-wallet/");
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

      // Try to load existing configuration
      try {
        const savedConfig = await client.getObject("config");
        if (savedConfig) {
          console.log("Loading saved AI wallet configuration:", savedConfig);
          this.loadConfigurationFromStorage(savedConfig);
        } else {
          console.log("No saved configuration found, using defaults");
          this.saveConfigurationToStorage();
        }
      } catch (err) {
        console.log("Error loading configuration:", err);
        this.saveConfigurationToStorage();
      }
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
    } catch (error) {
      console.error("Error loading models:", error);
      this.modelsError = error.message || "Failed to load models";
      this.models = this.getFallbackModels();
      this.validateModelSelections();
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
        ["llm", "vlm", "sst", "tts"].includes(cap.toLowerCase())
      );
    }

    // Infer capabilities from model name, type, or features
    const modelInfo = `${model.id} ${model.type || ""} ${
      (model.features || []).join(" ")
    }`.toLowerCase();

    if (
      modelInfo.includes("language") || modelInfo.includes("llm") ||
      modelInfo.includes("chat") || modelInfo.includes("text")
    ) {
      capabilities.push("llm");
    }

    if (
      modelInfo.includes("vision") || modelInfo.includes("vlm") ||
      modelInfo.includes("image") || modelInfo.includes("visual")
    ) {
      capabilities.push("vlm");
    }

    if (
      modelInfo.includes("speech") || modelInfo.includes("sst") ||
      modelInfo.includes("transcrib")
    ) {
      capabilities.push("sst");
    }

    if (
      modelInfo.includes("tts") || modelInfo.includes("text-to-speech") ||
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

    // Save to RemoteStorage whenever configuration changes
    this.saveConfigurationToStorage();
  }

  private async onEndpointOrKeyChange() {
    // Emit configuration change
    this.emitConfigChange();
    // Reload models when endpoint or API key changes
    await this.loadModels();
  }

  render() {
    const t = {
      selectModel: "Select Model",
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

    // Use dynamic models from state
    const models = this.models;
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
          class={`flex flex-col items-center justify-between px-4 py-8 mb-4 bg-white rounded-md shadow-lg w-full max-w-5xl @container`}
        >
          <div class="flex flex-col items-center space-y-8">
            <div class="w-full">
              <div class="mt-4 space-y-4 animate-fadeIn">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                    API Endpoint
                    <button
                      type="button"
                      onClick={() => {
                        this.endpoint = "https://server.budecredits.de/";
                        this.onEndpointOrKeyChange();
                      }}
                      class="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
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
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://server.budecredits.de/"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    {this.models.length}{" "}
                    AI models loaded from {this.endpoint}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={this.apiKey}
                    onInput={(e) => {
                      this.apiKey = (e.target as HTMLInputElement).value;
                      this.onEndpointOrKeyChange();
                    }}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your API key"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Your API key for authentication
                  </p>
                </div>
              </div>
            </div>

            {this.modelsError && (
              <div class="flex items-center space-x-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>Models error: {this.modelsError}</span>
                <button
                  onClick={() => this.loadModels()}
                  class="ml-2 text-red-800 hover:text-red-900 underline text-xs"
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
                const availableModels = models.filter((m) =>
                  m.capabilities.includes(capability.id)
                );

                return (
                  <div
                    key={capability.id}
                    class={`flex flex-col p-4 rounded-lg border border-gray-200`}
                  >
                    <div class="flex items-center justify-between mb-2">
                      <h3 class={`font-medium`}>{capability.title}</h3>
                      {!isEnabled && (
                        <button
                          type="button"
                          onClick={() => onEnableCapability(capability.id)}
                          class="flex items-center justify-center w-6 h-6 rounded-full text-white bg-primary-600 hover:bg-gray-300 focus-visible:ring focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-primary-600 hover:text-gray-700 transition-colors"
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
                    <p class="text-sm text-gray-500 mt-1">
                      {capability.description}
                    </p>

                    {isEnabled && (
                      <div class="relative mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            this.showModelSelector =
                              this.showModelSelector === capability.id
                                ? null
                                : capability.id;
                          }}
                          class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 w-full border border-gray-200"
                        >
                          <span class="text-sm">
                            {selectedModel
                              ? models.find((m) => m.id === selectedModel)?.name
                              : t.selectModel}
                          </span>
                        </button>

                        {this.showModelSelector === capability.id && (
                          <div class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 border border-gray-200">
                            {availableModels.map((model) => (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => {
                                  onSelectModel(capability.id, model.id);
                                  this.showModelSelector = null;
                                }}
                                class={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                  selectedModel === model.id
                                    ? "text-primary-600 bg-primary-50"
                                    : "text-gray-700"
                                }`}
                              >
                                {model.id}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
            <connect-remotestorage rs={this.rs}></connect-remotestorage>
        </div>
      </Host>
    );
  }
}
