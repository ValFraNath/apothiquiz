import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import * as serviceWorker from "./serviceWorker";
import { ReloadIcon } from "@modulz/radix-icons";

import "./styles/styles.scss";
import TopBar from "./components/system/TopBar";
import Menu from "./components/layouts/Menu";
import Informations from "./components/layouts/Informations";
import Train from "./components/layouts/Train";

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      waitingServiceWorker: null,
      isUpdateAvailable: false,
      installPromptEvent: null,
      updateRequired: false,
    };
  }

  componentDidMount() {
    // Install serviceWorker
    serviceWorker.register({
      onUpdate: (registration) => {
        this.setState({
          waitingServiceWorker: registration.waiting,
          isUpdateAvailable: true,
        });
      },
      onWaiting: (waiting) => {
        this.setState({
          waitingServiceWorker: waiting,
          isUpdateAvailable: true,
        });
      },
    });

    // Display installation button
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();

      this.setState({
        installPromptEvent: event,
      });
    });
  }

  updateServiceWorker = () => {
    this.setState({ updateRequired: true });

    this.state.waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };

  render() {
    const {
      isUpdateAvailable,
      installPromptEvent,
      updateRequired,
    } = this.state;

    return (
      <Router>
        <TopBar />

        {isUpdateAvailable && (
          <button
            id="update-app"
            className={updateRequired ? "update-animation" : ""}
            onClick={this.updateServiceWorker}
          >
            <ReloadIcon />
            {!updateRequired ? "Mettre à jour l'app" : "Mise à jour..."}
          </button>
        )}

        <main>
          <Switch>
            <Route path="/" exact Menu>
              <Menu installPromptEvent={installPromptEvent} />
            </Route>
            <Route path="/informations" exact component={Informations} />
            <Route path="/train" exact component={Train} />
            <Route status={404}>Not Found</Route>
          </Switch>
        </main>
      </Router>
    );
  }
}
