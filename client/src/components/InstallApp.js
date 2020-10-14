import React, { Component } from "react";

export default class InstallApp extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  handleClick = () => {
    this.props.installPrompt.prompt();
  };

  render() {
    return (
      <div>
        <button id="installButton" onClick={this.handleClick}>
          Install this app and become a medical expert!
        </button>
      </div>
    );
  }
}
