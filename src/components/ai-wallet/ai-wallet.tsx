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
import '@vaadin/combo-box/vaadin-combo-box.js';

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
  @Prop()
  variant: 'shadow' | 'border' = 'shadow';
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
  private comboBoxListeners: { [key: string]: any } = {};

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

  // Setup wizard state
  @State()
  setupComplete: boolean = false;

  @State()
  setupStep: 'apiKey' | 'endpoint' | 'complete' = 'apiKey';

  // Dynamic models state
  @State()
  models: InternalModel[] = [];
  @State()
  modelsLoading: boolean = false;
  @State()
  modelsError: string | null = null;

  // Track if we've already loaded models to prevent duplicate loads
  private modelsLoadedOnce: boolean = false;
  // Track if combo boxes have been initialized
  private comboBoxesInitialized: boolean = false;

  // Event emitter for configuration changes
  @Event()
  configChanged: EventEmitter<AIWalletConfig>;

  @State()
  rs: any;

  private endpointDebounceTimer: NodeJS.Timeout;
  private apiKeyDebounceTimer: NodeJS.Timeout;

  componentWillLoad() {
    console.log('[AI-Wallet] componentWillLoad - starting');
    // If RemoteStorage is provided, set up the listener
    if (this.rs) {
      console.log('[AI-Wallet] RemoteStorage detected, setting up listener');
      this.setupRemoteStorageListener();
    } else {
      console.log('[AI-Wallet] No RemoteStorage, loading from localStorage');
      // No RemoteStorage, try loading from localStorage
      this.loadFromLocalStorage();
      this.configurationLoaded = true;
      this.checkSetupComplete();
      // Load models if setup is complete
      if (this.setupComplete) {
        console.log('[AI-Wallet] Setup complete, loading models');
        this.loadModels();
      } else {
        console.log('[AI-Wallet] Setup not complete, skipping model load');
      }
    }
  }

  componentDidLoad() {
    // Emit initial configuration after component is fully loaded
    // This ensures React context and other listeners receive the initial state
    console.log('[AI-Wallet] componentDidLoad - emitting initial config');
    // Use setTimeout to ensure this happens after the component is fully initialized
    // and the React ref is set up
    setTimeout(() => {
      console.log('[AI-Wallet] Emitting initial config to listeners');
      this.configChanged.emit({
        endpoint: this.endpoint,
        apiKey: this.apiKey,
        vlm: this.selectedModels.vlm,
        llm: this.selectedModels.llm,
        sst: this.selectedModels.sst,
        tts: this.selectedModels.tts,
        enabledCapabilities: [...this.enabledCapabilities],
      });
    }, 0);
  }

  private loadFromLocalStorage() {
    try {
      const savedConfig = localStorage.getItem('ai-wallet-config');
      console.log('[AI-Wallet] loadFromLocalStorage - raw config:', savedConfig);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        console.log("[AI-Wallet] Loading saved AI wallet configuration from localStorage:", config);
        this.loadConfigurationFromStorage(config);
      } else {
        console.log('[AI-Wallet] No config found in localStorage');
      }
    } catch (err) {
      console.log("[AI-Wallet] Error loading configuration from localStorage:", err);
    }
  }

  private saveToLocalStorage() {
    try {
      const config = {
        endpoint: this.endpoint,
        apiKey: this.apiKey,
        vlm: this.selectedModels.vlm,
        llm: this.selectedModels.llm,
        sst: this.selectedModels.sst,
        tts: this.selectedModels.tts,
        enabledCapabilities: [...this.enabledCapabilities],
      };
      console.log("[AI-Wallet] Saving to localStorage:", config);
      console.log("[AI-Wallet] Current selectedModels state:", this.selectedModels);
      localStorage.setItem('ai-wallet-config', JSON.stringify(config));
      console.log("[AI-Wallet] Configuration saved to localStorage successfully");
    } catch (err) {
      console.log("[AI-Wallet] Error saving configuration to localStorage:", err);
    }
  }

  private setupRemoteStorageListener() {
    if (!this.rs) return;

    this.rs.on("connected", async () => {
      try {
        // @ts-ignore - aiWallet module may not be typed
        const savedConfig = await this.rs.aiWallet.getConfig();

        if (savedConfig) {
          console.log("Loading saved AI wallet configuration:", savedConfig);
          this.loadConfigurationFromStorage(savedConfig);
        } else {
          console.log("No saved configuration found, using defaults");
        }
        this.configurationLoaded = true;

        // Load models after configuration is ready
        if (this.setupComplete) {
          this.loadModels();
        }
      } catch (err) {
        console.log("Error loading configuration:", err);
        this.configurationLoaded = true;
        this.checkSetupComplete();
      }
    });
  }

  componentDidRender() {
    // Only update combo boxes if models are loaded and we haven't initialized yet
    // or if models just finished loading
    if (this.models.length > 0 && (!this.comboBoxesInitialized || this.modelsLoading === false)) {
      this.updateComboBoxes();
    }
  }

  private updateComboBoxes() {
    // Only run once per model load cycle
    if (this.comboBoxesInitialized && this.models.length > 0) {
      return;
    }

    // Use requestAnimationFrame instead of setTimeout for better performance
    requestAnimationFrame(() => {
      console.log('[AI-Wallet] updateComboBoxes - selectedModels:', this.selectedModels);
      console.log('[AI-Wallet] updateComboBoxes - available models:', this.models.length);

      const refKeys = Object.keys(this.comboBoxRefs);
      if (refKeys.length === 0) {
        console.log('[AI-Wallet] No combo box refs yet, skipping update');
        return;
      }

      refKeys.forEach(capabilityId => {
        const comboBox = this.comboBoxRefs[capabilityId];
        if (!comboBox) {
          console.log(`[AI-Wallet] No comboBox ref for ${capabilityId}`);
          return;
        }

        // Set items
        const availableModels = this.models.filter(m =>
          m.capabilities.includes(capabilityId)
        );
        const items = availableModels.map(model => ({
          id: model.id,
          name: model.name
        }));

        console.log(`[AI-Wallet] ComboBox ${capabilityId} - available items:`, items.length);

        // Always set items on first initialization
        comboBox.items = items;
        console.log(`[AI-Wallet] ComboBox ${capabilityId} - items updated`);

        // Set value
        const currentValue = this.selectedModels[capabilityId];
        console.log(`[AI-Wallet] ComboBox ${capabilityId} - currentValue:`, currentValue, 'comboBox.value:', comboBox.value);
        if (currentValue && comboBox.value !== currentValue) {
          comboBox.value = currentValue;
          console.log(`[AI-Wallet] ComboBox ${capabilityId} - value set to:`, currentValue);
        }
      });

      this.comboBoxesInitialized = true;
      console.log('[AI-Wallet] Combo boxes initialized');
    });
  }



  // Add model fetching methods
  private async loadModels() {
    // Prevent duplicate loads
    if (this.modelsLoading) {
      console.log('[AI-Wallet] Models already loading, skipping duplicate request');
      return;
    }

    if (!this.endpoint) {
      console.log('[AI-Wallet] No endpoint, using fallback models');
      this.models = this.getFallbackModels();
      this.modelsLoadedOnce = true;
      return;
    }

    console.log('[AI-Wallet] Loading models from:', this.endpoint);
    this.modelsLoading = true;
    this.modelsError = null;
    this.comboBoxesInitialized = false; // Reset to allow update after new models load

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
      this.modelsLoadedOnce = true;
      console.log('[AI-Wallet] Models loaded successfully:', this.models.length);

      // Validate and fix model selections after loading new models
      this.validateModelSelections();
    } catch (error) {
      console.error("[AI-Wallet] Error loading models:", error);
      this.modelsError = error.message || "Failed to load models";
      this.models = this.getFallbackModels();
      this.modelsLoadedOnce = true;
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

    console.log('[AI-Wallet] loadConfigurationFromStorage - config:', config);

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

    console.log('[AI-Wallet] Configuration loaded - selectedModels:', this.selectedModels);

    // Check if setup is complete
    this.checkSetupComplete();

    // Only reload models if endpoint or API key changed AND we've already loaded once
    // or if we haven't loaded models yet
    const needsReload = !this.modelsLoadedOnce || (oldEndpoint !== this.endpoint || oldApiKey !== this.apiKey);

    if (needsReload) {
      console.log('[AI-Wallet] Endpoint or API key changed, reloading models');
      this.loadModels();
    } else {
      console.log('[AI-Wallet] Configuration loaded, models already up to date');
    }
  }

  private checkSetupComplete() {
    this.setupComplete = !!(this.apiKey && this.endpoint);
    if (!this.setupComplete) {
      this.setupStep = !this.apiKey ? 'apiKey' : 'endpoint';
    } else {
      this.setupStep = 'complete';
    }
  }

  private detectEndpointFromApiKey(apiKey: string): string | null {
    // Try to detect provider from API key format
    if (apiKey.startsWith('sk-proj-') || apiKey.startsWith('sk-')) {
      return 'https://api.openai.com/v1';
    }
    if (apiKey.startsWith('sk-ant-')) {
      return 'https://api.anthropic.com/v1';
    }
    if (apiKey.length === 39 && apiKey.includes('-')) {
      // Anthropic format
      return 'https://api.anthropic.com/v1';
    }
    return null;
  }

  private async handleApiKeySubmit() {
    if (!this.apiKey) return;

    // Try to detect endpoint
    const detectedEndpoint = this.detectEndpointFromApiKey(this.apiKey);
    if (detectedEndpoint) {
      this.endpoint = detectedEndpoint;
      this.setupStep = 'complete';
      await this.loadModels();
      this.checkSetupComplete();
      this.emitConfigChange();
    } else {
      // Need to ask for endpoint
      this.setupStep = 'endpoint';
    }
  }

  private async handleEndpointSubmit() {
    if (!this.endpoint) return;

    this.setupStep = 'complete';
    await this.loadModels();
    this.checkSetupComplete();
    this.emitConfigChange();
  }

  private async saveConfigurationToStorage() {
    const config = {
      endpoint: this.endpoint,
      apiKey: this.apiKey,
      vlm: this.selectedModels.vlm,
      llm: this.selectedModels.llm,
      sst: this.selectedModels.sst,
      tts: this.selectedModels.tts,
      enabledCapabilities: [...this.enabledCapabilities],
    };

    // Save to RemoteStorage if available
    if (this.rs && this.rs.connected) {
      try {
        await this.rs.aiWallet.setConfig(config);
        console.log("AI wallet configuration saved to RemoteStorage:", config);
      } catch (err) {
        console.log("Error saving configuration to RemoteStorage:", err);
      }
    }

    // Always save to localStorage as fallback
    this.saveToLocalStorage();
  }

  @Method()
  async setRemoteStorage(rs: any) {
    this.rs = rs;
    // Set up listener when RemoteStorage is provided
    this.setupRemoteStorageListener();
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
    const config = {
      endpoint: this.endpoint,
      apiKey: this.apiKey,
      vlm: this.selectedModels.vlm,
      llm: this.selectedModels.llm,
      sst: this.selectedModels.sst,
      tts: this.selectedModels.tts,
      enabledCapabilities: [...this.enabledCapabilities],
    };
    console.log('[AI-Wallet] emitConfigChange - config:', config);
    console.log('[AI-Wallet] configurationLoaded:', this.configurationLoaded);

    this.configChanged.emit(config);

    // Only save to RemoteStorage after initial configuration has been loaded
    // to prevent overwriting the remote config during initialization
    if (this.configurationLoaded) {
      console.log('[AI-Wallet] Saving configuration to storage');
      this.saveConfigurationToStorage();
    } else {
      console.log('[AI-Wallet] Skipping save - configuration not yet loaded');
    }
  }

  private async onEndpointOrKeyChange() {
    // Emit configuration change
    this.emitConfigChange();
    // Reload models when endpoint or API key changes
    await this.loadModels();
  }

  private debouncedEndpointChange() {
    if (this.endpointDebounceTimer) {
      clearTimeout(this.endpointDebounceTimer);
    }
    this.endpointDebounceTimer = setTimeout(() => {
      console.log('[AI-Wallet] Debounced endpoint change triggered');
      this.onEndpointOrKeyChange();
    }, 800); // Increased to 800ms to reduce API calls while typing
  }

  private debouncedApiKeyChange() {
    if (this.apiKeyDebounceTimer) {
      clearTimeout(this.apiKeyDebounceTimer);
    }
    this.apiKeyDebounceTimer = setTimeout(() => {
      console.log('[AI-Wallet] Debounced API key change triggered');
      this.onEndpointOrKeyChange();
    }, 800); // Increased to 800ms to reduce API calls while typing
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

    const handleEnableCapability = (capabilityId: string) => {
      this.enabledCapabilities = this.enabledCapabilities.includes(capabilityId)
        ? this.enabledCapabilities.filter((id) => id !== capabilityId)
        : [...this.enabledCapabilities, capabilityId];
      this.emitConfigChange();
    };

    const handleSelectModel = (capabilityId: string, modelId: string) => {
      console.log(`[AI-Wallet] handleSelectModel called - capability: ${capabilityId}, model: ${modelId}`);
      console.log('[AI-Wallet] Before update - selectedModels:', this.selectedModels);
      this.selectedModels = { ...this.selectedModels, [capabilityId]: modelId };
      console.log('[AI-Wallet] After update - selectedModels:', this.selectedModels);
      this.emitConfigChange();
    };

    const allCapabilities = Object.entries(t.capabilities).map(
      ([id, capability]) => ({
        id,
        ...capability,
        icon: "🚀",
      }),
    );

    // Setup wizard view
    const containerClass = `flex flex-col items-center w-full max-w-sm mx-auto p-6 bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-lg ${
      this.variant === 'border' ? 'border-2 border-gray-300 dark:border-zinc-700' : 'shadow-lg'
    }`;

    if (!this.setupComplete) {
      return (
        <Host>
          <div class={containerClass}>
            <h2 class="text-xl font-semibold mb-4">AI Wallet Setup</h2>

            {this.setupStep === 'apiKey' && (
              <div class="w-full space-y-4">
                <p class="text-sm text-gray-600 dark:text-zinc-400">
                  Enter your API key to get started. We'll try to detect your provider automatically.
                </p>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={this.apiKey}
                    onInput={(e) => (this.apiKey = (e.target as HTMLInputElement).value)}
                    onKeyDown={(e) => e.key === 'Enter' && this.handleApiKeySubmit()}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                    placeholder="sk-..."
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => this.handleApiKeySubmit()}
                  disabled={!this.apiKey}
                  class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
                {this.rs && (
                  <div class="pt-4 border-t border-gray-200 dark:border-zinc-700">
                    <connect-remotestorage rs={this.rs}></connect-remotestorage>
                  </div>
                )}
              </div>
            )}

            {this.setupStep === 'endpoint' && (
              <div class="w-full space-y-4">
                <p class="text-sm text-gray-600 dark:text-zinc-400">
                  We couldn't detect your provider. Please enter your API endpoint.
                </p>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                    API Endpoint
                  </label>
                  <input
                    type="url"
                    value={this.endpoint}
                    onInput={(e) => (this.endpoint = (e.target as HTMLInputElement).value)}
                    onKeyDown={(e) => e.key === 'Enter' && this.handleEndpointSubmit()}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                    placeholder="https://api.example.com/v1"
                    autoFocus
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-zinc-500">
                    Common: OpenAI, Anthropic, or custom endpoint
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onClick={() => this.setupStep = 'apiKey'}
                    class="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => this.handleEndpointSubmit()}
                    disabled={!this.endpoint}
                    class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </Host>
      );
    }

    // Main compact view (when setup is complete)
    const mainContainerClass = `flex flex-col items-center w-full max-w-md mx-auto p-4 bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-lg ${
      this.variant === 'border' ? 'border-2 border-gray-300 dark:border-zinc-700' : 'shadow-lg'
    }`;

    return (
      <Host>
        <div class={mainContainerClass}>
          {/* Main compact view */}
          <div class="w-full space-y-3">
            {/* Model Selection Grid - Only enabled ones */}
            <div class="grid grid-cols-2 gap-2">
              {allCapabilities
                .filter((cap) => this.enabledCapabilities.includes(cap.id))
                .map((capability) => {
                  const selectedModel = this.selectedModels[capability.id];
                  return (
                    <div key={capability.id} class="flex flex-col">
                      <label class="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">
                        {capability.title}
                      </label>
                      <vaadin-combo-box
                        ref={(el: any) => {
                          // Remove old listener if exists
                          if (this.comboBoxRefs[capability.id] && this.comboBoxListeners[capability.id]) {
                            this.comboBoxRefs[capability.id].removeEventListener('value-changed', this.comboBoxListeners[capability.id]);
                          }

                          this.comboBoxRefs[capability.id] = el;

                          if (el) {
                            // Create and store event listener
                            const listener = (e: any) => {
                              console.log(`[AI-Wallet] value-changed event fired for ${capability.id}`, e.detail);
                              const newValue = e.detail.value;
                              if (newValue && newValue !== this.selectedModels[capability.id]) {
                                handleSelectModel(capability.id, newValue);
                              }
                            };
                            this.comboBoxListeners[capability.id] = listener;
                            el.addEventListener('value-changed', listener);
                          }
                        }}
                        value={selectedModel}
                        item-label-path="name"
                        item-value-path="id"
                        style={{
                          "--vaadin-input-field-border-color": "#d1d5db",
                          "--vaadin-input-field-border-width": "1px",
                          "--vaadin-input-field-background": "white",
                          "--vaadin-overlay-z-index": "10000",
                          width: "100%",
                          position: "relative",
                          zIndex: "10",
                        }}
                      ></vaadin-combo-box>
                    </div>
                  );
                })}
            </div>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => (this.showAdvancedConfig = !this.showAdvancedConfig)}
              class="w-full text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 py-2 text-center focus:outline-none"
            >
              {this.showAdvancedConfig ? "Hide" : "Show"} Advanced Settings
            </button>

            {/* Advanced Settings Section */}
            {this.showAdvancedConfig && (
              <div class="w-full space-y-3 pt-2 border-t border-gray-200 dark:border-zinc-700">
                {/* API Configuration */}
                <div class="space-y-2">
                  <div>
                    <label class="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 flex items-center justify-between">
                      API Endpoint
                      <button
                        type="button"
                        onClick={() => {
                          this.endpoint = "https://server.budecredits.de/";
                          this.onEndpointOrKeyChange();
                        }}
                        class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 focus:outline-none"
                      >
                        Reset
                      </button>
                    </label>
                    <input
                      type="url"
                      value={this.endpoint}
                      onInput={(e) => {
                        this.endpoint = (e.target as HTMLInputElement).value;
                        this.debouncedEndpointChange();
                      }}
                      class="w-full px-2 py-1.5 border border-gray-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                      placeholder="https://server.budecredits.de/"
                    />
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-zinc-500">
                      {this.models.length} models loaded
                    </p>
                  </div>

                  <div>
                    <label class="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={this.apiKey}
                      onInput={(e) => {
                        this.apiKey = (e.target as HTMLInputElement).value;
                        this.debouncedApiKeyChange();
                      }}
                      class="w-full px-2 py-1.5 border border-gray-300 dark:border-zinc-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                      placeholder="Enter your API key"
                    />
                  </div>
                </div>

                {/* Capability Toggles */}
                <div>
                  <label class="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-2 block">
                    Enabled Capabilities
                  </label>
                  <div class="flex flex-wrap gap-2">
                    {allCapabilities.map((capability) => {
                      const isEnabled = this.enabledCapabilities.includes(capability.id);
                      return (
                        <button
                          key={capability.id}
                          type="button"
                          onClick={() => handleEnableCapability(capability.id)}
                          class={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            isEnabled
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-600"
                          }`}
                        >
                          {capability.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {this.modelsError && (
                  <div class="flex items-center space-x-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950 px-2 py-1.5 rounded">
                    <span>Error loading models</span>
                    <button
                      onClick={() => this.loadModels()}
                      class="text-red-800 hover:text-red-900 dark:text-red-300 underline"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* RemoteStorage */}
                {this.rs && (<connect-remotestorage rs={this.rs}></connect-remotestorage>)}
              </div>
            )}
          </div>
        </div>
      </Host>
    );
  }
}
