import { render } from "@testing-library/react";
import { expect } from "chai";
import React from "react";
import ReactDOM from "react-dom";

import { act } from "react-dom/test-utils";

import App from "../App";

/* eslint-disable */
describe("Good display", () => {
  // Jest test
  it("renders without crashing", async () => {
    const div = document.createElement("div");
    await act(async () => {
      ReactDOM.render(<App />, div);
    });
  });

  // Chai test
  it("contains the good link", async () => {
    let getByText;
    await act(async () => {
      getByText = render(<App />).getByText;
    });
    expect(getByText(/À propos/i)).to.be.not.null;
  });
});
