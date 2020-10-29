import React, { Component } from "react";

class OfflineBanner extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOnline: true,
    };
  }

  updateOnlineStatus = () => {
    this.setState({
      isOnline: navigator.onLine,
    });
  };

  componentDidMount() {
    window.addEventListener("online", this.updateOnlineStatus);
    window.addEventListener("offline", this.updateOnlineStatus);
  }

  componentWillUnmount() {
    window.removeEventListener("online", this.updateOnlineStatus);
    window.removeEventListener("offline", this.updateOnlineStatus);
  }

  render() {
    return (
      <aside
        id={"offlineBanner"}
        className={this.state.isOnline ? "online" : "offline"}
      >
        {this.state.isOnline ? "ONLINE" : "OFFLINE"}
      </aside>
    );
  }
}

export default OfflineBanner;
