import React, { Component } from "react";
import axios from "axios";

export default class HelloWorld extends Component {
  constructor(props) {
    super(props);

    this.state = {
      receivedMessage: "",
    };
  }

  handleButtonClick = () => {
    axios
      .get(`/api/v1/status`)
      .then((res) => {
        this.setState({
          receivedMessage: res.data.message,
          currentServerVersion: res.data.db_version,
        });
      })
      .catch((err) => console.log(err));
  };

  render() {
    return (
      <div>
        <button onClick={this.handleButtonClick}>Send request</button>
        {this.state.receivedMessage !== "" && (
          <p>
            Received message: "{this.state.receivedMessage}"
            <br />
            Current server version: {this.state.currentServerVersion}
          </p>
        )}
      </div>
    );
  }
}
