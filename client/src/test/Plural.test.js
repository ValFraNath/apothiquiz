import React from "react";
import { shallow } from "enzyme";
import { expect } from "chai";

import Plural from "../components/Plural";

describe("Plural component", () => {
  const singular = "arbre";
  const plural = "arbres";

  const singularIrr = "hibou";
  const pluralIrr = "hiboux";

  it("should display the singular itself", () => {
    const wrapper = shallow(<Plural word={singular} count={1} />);
    expect(wrapper.text()).to.be.equal(singular);
  });

  it("should display the plural itself", () => {
    const wrapper = shallow(<Plural word={singular} count={42} />);
    expect(wrapper.text()).to.be.equal(plural);
  });

  it("should display the singular with props", () => {
    const wrapper = shallow(<Plural word={singularIrr} count={1} plural={pluralIrr} />);
    expect(wrapper.text()).to.be.equal(singularIrr);
  });

  it("should display the plural with props", () => {
    const wrapper = shallow(<Plural word={singularIrr} count={42} plural={pluralIrr} />);
    expect(wrapper.text()).to.be.equal(pluralIrr);
  });
});
