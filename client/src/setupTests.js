// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
//import "@testing-library/jest-dom/extend-expect";
import chai from "chai";
import createChaiEnzyme from "chai-enzyme";
import createChaiJestDiff from "chai-jest-diff";
import dirtyChai from "dirty-chai";
import { configure as configureEnzyme } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import sinonChai from "sinon-chai";

chai.use(dirtyChai).use(createChaiJestDiff()).use(createChaiEnzyme()).use(sinonChai);
configureEnzyme({ adapter: new Adapter() });

global.window.matchMedia = function () {
  return {
    matches: true,
    addEventListener: function (ev, callback) {},
  };
};
