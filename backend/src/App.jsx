import React, { Component }from "react";
import { QueryClientProvider } from "react-query";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import TopBar from "./components/system/TopBar";
import "./styles/styles.scss";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import User from "./pages/User";
import Auth from "./utils/authentication";
import queryClient from "./utils/configuredQueryClient";

export default class App extends Component {
  constructor(props) {
    super(props);

    let { pseudo } = Auth.getCurrentUser() || {};

    this.state = {
      user: pseudo || null,
    };
  }

render() {
	const { user } = this.state;
	return (
    <QueryClientProvider client={queryClient}>
  		<BrowserRouter>
  		<TopBar />
  			<Switch>
    			<Route exact path="/" component={Login}/>
    			<ProtectedRoute
            path="/menu"
            exact
            component={() => (
            <Menu user={user} />
            )}
            />
          <ProtectedRoute path="/user" component={User}/>
  		  </Switch>
  		</BrowserRouter>
    </QueryClientProvider>
	);
}
}
