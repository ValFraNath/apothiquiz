import axios from "axios";
import PropTypes from "prop-types";
import React, { Component, useRef } from "react";

import AuthService from "../services/auth.service";
const FileImporter = () => {
  const inputRef = useRef(null);

  function sendImportedFile(e) {
    e.preventDefault();
    const input = inputRef.current;
    console.log(input.files);
  }

  return (
    <div>
      <form>
        <label>
          Importer un fichier
          <input ref={inputRef} type="file" />
        </label>
        <button type="submit" onClick={sendImportedFile}>
          Envoyer
        </button>
      </form>
    </div>
  );
};

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
        <FileImporter />
        <FileDownloader
          text="Télécharcher le dernier fichier importé"
          filename="molecules.csv"
          endpoint="/api/v1/import/molecules"
        />
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
