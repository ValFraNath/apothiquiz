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
          serverStatus: res.data.status,
          currentServerVersion: res.data.db_version,
        });
      })
      .catch((err) => console.log(err));
  };

  render() {
    return (
      <div>
        <button onClick={this.handleButtonClick}>Send request</button>
        {this.state.serverStatus !== "" && (
          <p>
            Connection to the server: {this.state.serverStatus}
            <br />
            Current server version: {this.state.currentServerVersion}
          </p>
        )}
      </div>
    );
  }
}
