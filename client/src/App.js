import React, { Component } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import * as serviceWorker from "./serviceWorker";

import "./styles/styles.scss";

import HelloWorld from "./components/HelloWorld";
import InstallApp from "./components/InstallApp";
import Train from "./components/Train";
import OfflineBanner from "./components/OfflineBanner";

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      waitingServiceWorker: null,
      isUpdateAvailable: false,
      installPromptEvent: null
    };
  }

  componentDidMount() {
    // Install serviceWorker
    serviceWorker.register({
      onUpdate: (registration) => {
        this.setState({
          waitingServiceWorker: registration.waiting,
          isUpdateAvailable: true
        });
      },
      onWaiting: (waiting) => {
        this.setState({
          waitingServiceWorker: waiting,
          isUpdateAvailable: true
        });
      }
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
    this.state.waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }

  render() {
    const {isUpdateAvailable, installPromptEvent} = this.state;

    return (
      <Router>
        <OfflineBanner />
        {isUpdateAvailable &&
          <button onClick={this.updateServiceWorker}>Mettre à jour l'app</button>
        }
        <Switch>
          <Route path="/" exact>
            <Link to="/hello_world">Go to Hello World!</Link>
            <Link to="/train">Train</Link>
            {installPromptEvent !== null && (
              <InstallApp installPromptEvent={installPromptEvent} />
            )}
          </Route>
          <Route path="/hello_world" exact component={HelloWorld} />
          <Route path="/train" exact component={Train} />
          <Route status={404}>Not Found</Route>
        </Switch>
      </Router>
    );
  }
}
