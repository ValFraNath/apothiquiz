import axios from "axios";
import React, { Component } from "react";

class Duel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      duelData: null,
    };
  }

  componentDidMount() {
    if (this.state.duelData !== null) return;

    const duelId = this.props.match.params.id;
    axios
      .get(`/api/v1/duels/${duelId}`)
      .then((res) => {
        this.setState({
          duelData: res.data,
        });
      })
      .catch((err) => console.error(err));
  }

  render() {
    return <p>Hello</p>;
  }
}

export default Duel;
