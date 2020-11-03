import React, { Component } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import * as serviceWorker from "./serviceWorker";
import { ReloadIcon } from "@modulz/radix-icons";

import "./styles/styles.scss";
import HelloWorld from "./components/system/HelloWorld";
import InstallApp from "./components/system/InstallApp";
import Train from "./components/layouts/Train";
import OfflineBanner from "./components/system/OfflineBanner";
import Login from "./components/Login";
import AuthService from "./services/auth.service";
import UserBadge from "./components/UserBadge";
import axios from "axios";
import WhoAmI from "./components/PrivateTemp";

/**
 * Set up the authorization header in all request is the user is logged in
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
    const {
      isUpdateAvailable,
      installPromptEvent,
      updateRequired,
    } = this.state;

    return (
      <Router>
        <OfflineBanner />
        {this.state.user && UserBadge(this.state.user)}
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
        <Switch>
          <Route path="/" exact>
            <Link to="/hello_world">Go to Hello World</Link>
            <Link to="/train">Train</Link>
            {installPromptEvent !== null && (
              <InstallApp installPromptEvent={installPromptEvent} />
            )}
            {this.state.user === null && <Link to="/login">Login</Link>}
            <Link to="/private">Who an I ? (private)</Link>
          </Route>
          <Route path="/hello_world" exact component={HelloWorld} />
          <Route path="/train" exact component={Train} />
          <Route path="/login" exact component={Login} />
          <Route path="/private" exact component={WhoAmI} />
        </Switch>
      </Router>
    );
  }
}
