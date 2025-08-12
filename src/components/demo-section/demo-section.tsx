import { Component, Host, h } from "@stencil/core";

@Component({
  tag: "demo-section",
  styleUrl: "demo-section.css",
  shadow: true,
})
export class DemoSection {
  render() {
    return (
      <Host>
        <div class="grid place-items-center text-slate-800">
          <div class="w-full max-w-6xl gap-4 mb-8 lg:rounded-md bg-opacity-60 glass">
            <div class="flex flex-col px-2 pt-2">
              <div class="grid grid-cols-1 mx-4 md:grid-cols-2 place-items-center">
                <ai-wallet
                  card-title="Functional Components"
                  subtitle="These badges are functional components"
                  sync={true}
                />
              </div>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
