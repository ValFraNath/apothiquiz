import React from "react";

const InstallApp = ({ installPromptEvent }) => (
  <button id="installButton" onClick={() => installPromptEvent.prompt()}>
    Install Guacamole
  </button>
);

export default InstallApp;
