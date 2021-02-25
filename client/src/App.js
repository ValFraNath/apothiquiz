import { ReloadIcon, BellIcon } from "@modulz/radix-icons";
import axios from "axios";
import firebase from "firebase/app";
import "firebase/messaging";
import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import "./styles/styles.scss";
import ButtonFullWidth from "./components/buttons/ButtonFullWidth";
import FullScreenMessage from "./components/FullScreenMessage";
import ProtectedRoute from "./components/ProtectedRoute";
import TopBar from "./components/system/TopBar";
import About from "./pages/About";
import Admin from "./pages/Admin";
import CreateDuel from "./pages/CreateDuel";
import Duel from "./pages/Duel";
import DuelOverview from "./pages/DuelOverview";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import Profile from "./pages/Profile";
import Train from "./pages/Train";
import AuthService from "./services/auth.service";
import * as serviceWorker from "./serviceWorker";

/**
 * Set up the authorization header in all request if the user is logged in
 */
axios.interceptors.request.use((config) => {
  const user = AuthService.getCurrentUser();
  if (user && user.token && user.pseudo) {
    config.headers.Authorization = `Bearer ${user.token}`;
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
      requireNotificationPermission: false,
      user: user,
    };
  }

  componentDidMount() {
    // Install service-worker
    const newUpdateAvailable = (newSW) => {
      this.setState({
        waitingServiceWorker: newSW,
        isUpdateAvailable: true,
      });
    };
    serviceWorker.register({
      onUpdate: (reg) => {
        newUpdateAvailable(reg);
      },
      onWaiting: (reg) => {
        newUpdateAvailable(reg);
      },
    });

    // Display installation button
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.setState({
        installPromptEvent: event,
      });
    });

    // Request permission for notifications and subscribe to push
    if (this.state.user && "Notification" in window && navigator.serviceWorker) {
      this.installFirebase();
    }
  }

  installFirebase() {
    firebase.initializeApp({
      apiKey: "AIzaSyCtGrFY1_UOzWAFn1xt1CRPNGZ40JZcaJw",
      authDomain: "guacamole-31ba0.firebaseapp.com",
      projectId: "guacamole-31ba0",
      storageBucket: "guacamole-31ba0.appspot.com",
      messagingSenderId: "46062321146",
      appId: "1:46062321146:web:bcd9f8b8caf30c2aacf843",
    });

    const messaging = firebase.messaging();
    navigator.serviceWorker.getRegistration().then((reg) => {
      messaging
        .getToken({
          vapidKey:
            "BFW2K4Eu0CFRDsJFJTVrdXbwalM7iIiL4t_BVzbgqPik9WJvHUgzedh5baLT0ukRsm1WG_BGT7A_5KygJ_WLfYs",
          serviceWorkerRegistration: reg,
        })
        .then((currentToken) => {
          if (currentToken) {
            console.info(`User token: ${currentToken}`);
          } else {
            this.displayBrowserNotificationPermission();
          }
        })
        .catch((err) => console.error("Can't retrieve token.", err));
    });
  }

  displayBrowserNotificationPermission() {
    Notification.requestPermission().then(() => {
      this.setState({ requireNotificationPermission: false });
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
      requireNotificationPermission,
    } = this.state;

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

        {requireNotificationPermission && (
          <FullScreenMessage id="authorization-notification">
            <BellIcon />

            <h1>Notifications</h1>

            <p>
              Nous aimerions vous envoyer des notifications pour vous prévenir lorsque de nouveaux
              duels sont disponibles.
            </p>

            <ButtonFullWidth onClick={this.displayBrowserNotificationPermission}>
              Autoriser les notifications
            </ButtonFullWidth>
            <button onClick={this.displayBrowserNotificationPermission}>Ne pas autoriser</button>
          </FullScreenMessage>
        )}

        <Switch>
          <Route path="/" exact Menu>
            <Menu user={this.state.user} installPromptEvent={installPromptEvent} />
          </Route>
          <Route path="/about" exact component={About} />
          <Route path="/train" exact component={Train} />
          <Route path="/login" exact component={Login} />
          <ProtectedRoute path="/profile" exact component={Profile} />
          <ProtectedRoute path="/homepage" exact component={HomePage} />
          <ProtectedRoute path="/createduel" exact component={CreateDuel} />
          <ProtectedRoute path="/duel/:id" exact component={DuelOverview} />
          <ProtectedRoute path="/duel/:id/play" exact component={Duel} />
          <ProtectedRoute path="/admin" exact component={Admin} />
        </Switch>
      </Router>
    );
  }
}
