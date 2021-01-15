import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import * as serviceWorker from "./serviceWorker";
import { ReloadIcon } from "@modulz/radix-icons";

import "./styles/styles.scss";
import TopBar from "./components/system/TopBar";
import Menu from "./components/pages/Menu";
import Informations from "./components/pages/Informations";
import Train from "./components/layouts/Train";
import Login from "./components/pages/Login";
import AuthService from "./services/auth.service";
import axios from "axios";
import Profile from "./components/pages/Profile";

/**
 * Set up the authorization header in all request if the user is logged in
 */
axios.interceptors.request.use(function (config) {
  const user = AuthService.getCurrentUser();
  if (user && user.token && user.pseudo) {
    config.headers.Authorization = `Barear ${user.token}`;
  }
  return config;
});

export default class App extends Component {
  constructor(props) {
    super(props);

    let user = AuthService.getCurrentUser();
    if (user) {
      user = user.pseudo;
    }

    this.state = {
      waitingServiceWorker: null,
      isUpdateAvailable: false,
      installPromptEvent: null,
      user: user,
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
    const { isUpdateAvailable, installPromptEvent, updateRequired } = this.state;

    return (
      <Router>
        <TopBar user={this.state.user} />
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
              <Menu user={this.state.user} installPromptEvent={installPromptEvent} />
            </Route>
            <Route path="/informations" exact component={Informations} />
            <Route path="/train" exact component={Train} />
            <Route path="/login" exact component={Login} />
            <Route path="/profile" exact component={Profile} />
          </Switch>
        </main>
      </Router>
    );
  }
}
