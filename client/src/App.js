import { ReloadIcon } from "@modulz/radix-icons";
import axios from "axios";
import React, { Component } from "react";
import { QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import "./styles/styles.scss";
import ProtectedRoute from "./components/ProtectedRoute";
import TopBar from "./components/system/TopBar";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Duel from "./pages/Duel";
import DuelCreate from "./pages/DuelCreate";
import DuelOverview from "./pages/DuelOverview";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import Profile from "./pages/Profile";
import Train from "./pages/Train";
import AuthService from "./services/auth.service";
import * as serviceWorker from "./serviceWorker";
import queryClient from "./utils/configuredQueryClient";

/**
 * Set up the authorization header in all request if the user is logged in
 */
axios.interceptors.request.use((config) => {
  const { accessToken, pseudo } = AuthService.getCurrentUser() || {};
  if (accessToken && pseudo) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    let { refreshToken } = AuthService.getCurrentUser() || {};

    if (refreshToken && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const res = await axios.post(`/api/v1/users/token`, { refreshToken });

      if (res.status === 200) {
        AuthService.updateAccesToken(res.data.accessToken);
        console.log("Access token refreshed!");
        return axios(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default class App extends Component {
  constructor(props) {
    super(props);

    let { pseudo } = AuthService.getCurrentUser() || {};

    this.state = {
      waitingServiceWorker: null,
      isUpdateAvailable: false,
      installPromptEvent: null,
      user: pseudo || null,
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
  }

  updateServiceWorker = () => {
    this.setState({ updateRequired: true });

    this.state.waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };

  render() {
    const { user, isUpdateAvailable, installPromptEvent, updateRequired } = this.state;

    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <TopBar username={user} />
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
            <Route path="/" exact Menu>
              <Menu user={this.state.user} installPromptEvent={installPromptEvent} />
            </Route>
            <Route path="/about" exact component={About} />
            <Route path="/train" exact component={Train} />
            <Route path="/login" exact component={Login} />
            <ProtectedRoute path="/profile" exact component={Profile} />
            <ProtectedRoute path="/homepage" exact component={HomePage} />
            <ProtectedRoute path="/duel/create" exact component={DuelCreate} />
            <ProtectedRoute path="/duel/:id" exact component={DuelOverview} />
            <ProtectedRoute path="/duel/:id/play" exact component={Duel} />
            <ProtectedRoute path="/admin" exact component={Admin} />
          </Switch>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    );
  }
}
