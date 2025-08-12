import { Component, Host, h, Prop, Element } from '@stencil/core';
import { type RemoteStorage } from "remotestoragejs";
import Widget from "remotestorage-widget";

@Component({
  tag: 'connect-remotestorage',
  styleUrl: 'connect-remotestorage.css',
  shadow: true,
})
export class ConnectRemotestorage {
  private widget: Widget;
  @Prop() rs: RemoteStorage;
  @Element() el: HTMLElement;

  componentDidLoad() {
    this.widget = new Widget(this.rs, { logging: true, leaveOpen: true });
    const rsWidget = this.el.shadowRoot.querySelector("#rs-widget");

    if (rsWidget) {
      this.widget.attach(rsWidget);
    } else {
      console.error("No rs-widget found");
    }
  }

  render() {
    return (
      <Host>
        <div id="rs-widget"></div>
      </Host>
    );
  }
}
