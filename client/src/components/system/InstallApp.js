import React from "react";
import PropTypes from "prop-types";
import { DownloadIcon } from "@modulz/radix-icons";

const InstallApp = ({ installPromptEvent }) => (
  <button id="installButton" onClick={() => installPromptEvent.prompt()}>
    <span>
      <DownloadIcon />
    </span>
    <span>Installer l'application</span>
  </button>
);

InstallApp.propTypes = {
  installPromptEvent: PropTypes.shape({
    prompt: PropTypes.func.isRequired,
  }),
};

export default InstallApp;
