import { Component, Host, h, Prop, Element } from '@stencil/core';
import {RemoteStorageWidget} from "remotestorage-widget";
import "remotestorage-widget";

@Component({
  tag: 'connect-remotestorage',
  styleUrl: 'connect-remotestorage.css',
  shadow: true,
})
export class ConnectRemotestorage {
  @Prop() rs: any;
  @Element() el: HTMLElement;

  componentDidLoad() {
    const rsWidget = this.el.shadowRoot.querySelector("remotestorage-widget") as RemoteStorageWidget;
    console.log(rsWidget);

    rsWidget.setRemoteStorage(this.rs);
    rsWidget.setOptions({
      logging: true,
      leaveOpen: true,
    });
  }

  render() {
    return (
      <Host>
        <div class="pt-2 border-t border-gray-200 dark:border-zinc-700">
          <remotestorage-widget open rs={this.rs}></remotestorage-widget>
        </div>
      </Host>
    );
  }
}
