import axios from "axios";
import PropTypes from "prop-types";
import React, { Component, useRef } from "react";

import AuthService from "../services/auth.service";

const ACCEPTED_TYPES = ["text/csv", "application/vnd.ms-excel"];

class FileImporter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      errors: [],
      warnings: [],
      selectedFile: null,
    };
  }

  sendImportedFile(e) {
    e.preventDefault();
    const file = this.state.selectedFile;
    const requestData = new FormData();

    requestData.append("file", file);

    axios
      .post("/api/v1/import/molecules", requestData)
      .then((res) => {
        const warnings = res.data.warnings.map((w) => w.message);
        this.setState({ warnings, errors: [] });
      })
      .catch((error) => {
        if (error.response.status === 400) {
          const errors = error.response.data.errors.map((w) => w.message);
          this.setState({ errors, warnings: [] });
          return;
        }
        this.setState({ errors: ["Une erreur est survenue de notre coté."] });
      });
  }

  handleInput(e) {
    const file = e.target.files[0] || null;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      e.target.parentNode.reset();
      return;
    }
    this.setState({ selectedFile: file });
  }

  render() {
    return (
      <div className="file-importer">
        <form>
          <input id="molecules-file" onChange={this.handleInput.bind(this)} type="file" />
          <button
            type="submit"
            disabled={this.state.selectedFile === null}
            onClick={this.sendImportedFile.bind(this)}
          >
            Envoyer
          </button>
        </form>
        <ul>
          {this.state.errors.map((error) => (
            <li key={error} className="error">
              {error}
            </li>
          ))}
          {this.state.warnings.map((warning) => (
            <li key={warning} className="warning">
              {warning}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

/**
 * Component which, on click, fetch a file and opens it.
 */
const FileDownloader = ({ filename, endpoint, text }) => {
  const linkRef = useRef(null);

  /**
   * Fetch the file and open it
   * @param {MouseEvent} e
   */
  function fetchAndOpenFile(e) {
    const link = linkRef.current;
    if (!link.href.endsWith("none")) {
      return;
    }
    e.preventDefault();

    getLastImportedFile(endpoint)
      .then((url) => {
        link.href = url;
        link.click();
        link.href = "none";
      })
      .catch((error) => console.error("Can't download the file", error));
  }

  return (
    <a ref={linkRef} href={"none"} download={filename} onClick={fetchAndOpenFile}>
      {text}
    </a>
  );
};

FileDownloader.propTypes = {
  filename: PropTypes.string.isRequired,
  endpoint: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

export default class Admin extends Component {
  render() {
    return (
      <main id="administration">
        <h1>Espace Administration</h1>
        <details open>
          <summary>Importer des molécules</summary>
          <FileDownloader
            text="Télécharcher le dernier fichier importé"
            filename="molecules.csv"
            endpoint="/api/v1/import/molecules"
          />
          <FileImporter />
        </details>
      </main>
    );
  }
}

/**
 * Fetch the last imported file, and return the url of the object
 * @param {string} endpoint The endpoint to request
 * @returns {string} The data url
 */
function getLastImportedFile(endpoint) {
  return new Promise((resolve, reject) => {
    axios
      .get(endpoint)
      .then((res) => {
        const { token } = AuthService.getCurrentUser();
        fetch(res.data.shortpath, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            if (res.status !== 200) {
              res.json().then((error) => reject(error));
              return;
            }
            res
              .blob()
              .then((data) => resolve(window.URL.createObjectURL(data)))
              .catch(reject);
          })
          .catch(reject);
      })
      .catch(reject);
  });
}
