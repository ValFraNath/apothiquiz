import { ReloadIcon, BellIcon } from "@modulz/radix-icons";
import axios from "axios";
import PropTypes from "prop-types";
import React, { lazy, Suspense, Component } from "react";
import { QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { BrowserRouter as Router, Route, Switch, useLocation } from "react-router-dom";

import "./styles/styles.scss";
import ButtonFullWidth from "./components/buttons/ButtonFullWidth";
import FullScreenMessage from "./components/FullScreenMessage";
import NotificationForeground from "./components/NotificationForeground";
import ProtectedRoute from "./components/ProtectedRoute";
import Loading from "./components/status/Loading";
import TopBar from "./components/system/TopBar";

import HomePage from "./pages/HomePage";
import Menu from "./pages/Menu";
import AuthService from "./services/auth.service";
import * as serviceWorker from "./serviceWorker";
import queryClient from "./utils/configuredQueryClient";
import MessagingHandler from "./utils/messaging";

const About = lazy(() => import("./pages/About"));
const Admin = lazy(() => import("./pages/Admin"));
const Duel = lazy(() => import("./pages/Duel"));
const DuelCreate = lazy(() => import("./pages/DuelCreate"));
const DuelOverview = lazy(() => import("./pages/DuelOverview"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const Train = lazy(() => import("./pages/Train"));

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

/**
 * Automatically try to refresh a token on 401 error
 */
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

const UpdateButton = ({ updateRequired, updateSW }) => {
  const location = useLocation();
  if (location.pathname === "/train" || /\/duel\/[0-9]+\/play/.test(location.pathname)) {
    return "";
  }

  return (
    <button id="update-app" className={updateRequired ? "update-animation" : ""} onClick={updateSW}>
      <ReloadIcon />
      {!updateRequired ? "Mettre à jour l'app" : "Mise à jour..."}
    </button>
  );
};

UpdateButton.propTypes = {
  updateRequired: PropTypes.bool.isRequired,
  updateSW: PropTypes.func.isRequired,
};

export default class App extends Component {
  constructor(props) {
    super(props);

    let { pseudo } = AuthService.getCurrentUser() || {};

    this.state = {
      waitingServiceWorker: null,
      isUpdateAvailable: false,
      installPromptEvent: null,
      requireNotificationPermission: false,
      foregroundNotification: null,
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

    // Request permission for notifications and subscribe to push
    const messaging = new MessagingHandler();
    if (
      "Notification" in window &&
      navigator.serviceWorker &&
      Notification.permission !== "denied"
    ) {
      if (this.state.user) {
        if (Notification.permission !== "granted") {
          this.setState({ requireNotificationPermission: true });
        } else {
          messaging.saveToken();
        }
      } else {
        messaging.removeToken();
      }
    }

    // Listen for notifications (in foreground)
    messaging.getMessaging().onMessage((payload) => {
      if (!payload.data.title) {
        console.error("Can't display notification without title");
        return;
      }

      const { title, body } = payload.data;
      this.setState({ foregroundNotification: { title: title, body: body } });
    });
  }

  /**
   * Display the notification authorization request
   */
  displayBrowserNotificationPermission = () => {
    console.log(Notification);
    Notification.requestPermission()
      .then(() => {
        this.setState({ requireNotificationPermission: false });
        new MessagingHandler().saveToken();
      })
      .catch((err) => console.error("Can't request permission", err));
  };

  /**
   * Send a message to the service-worker to request the new version
   */
  updateServiceWorker = () => {
    this.setState({ updateRequired: true });

    this.state.waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };

  render() {
    const {
      user,
      isUpdateAvailable,
      installPromptEvent,
      updateRequired,
      requireNotificationPermission,
      foregroundNotification,
    } = this.state;

    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <TopBar username={user} />
          {isUpdateAvailable && (
            <UpdateButton updateSW={this.updateServiceWorker} updateRequired={updateRequired} />
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

          {foregroundNotification !== null && (
            <NotificationForeground
              title={foregroundNotification.title}
              text={foregroundNotification.body}
              closeNotification={() => this.setState({ foregroundNotification: null })}
            />
          )}

          <Suspense fallback={<Loading />}>
            <Switch>
              <Route path="/" exact>
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
              <ProtectedRoute path="/admin" onlyAdmin exact component={Admin} />
            </Switch>
          </Suspense>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    );
  }
}
