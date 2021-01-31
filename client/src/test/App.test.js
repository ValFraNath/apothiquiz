import { render } from "@testing-library/react";
import { expect } from "chai";
import React from "react";
import ReactDOM from "react-dom";

import App from "../App";

/* eslint-disable */
describe("Good display", () => {
  // Jest test
  it("renders without crashing", () => {
    const div = document.createElement("div");
    ReactDOM.render(<App />, div);
  });

  // Chai test
  it("contains the good link", () => {
    const { getByText } = render(<App />);
    expect(getByText(/À propos/i)).to.be.not.null;
  });
});
