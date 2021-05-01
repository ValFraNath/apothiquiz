import React from "react";
// import GitInfo from "react-git-info/macro";

import variables from "../styles/base/_variables.module.scss";

const About = () => {
  // const gitInfo = GitInfo();
  // const date = new Date();
  // date.setTime(Date.parse(gitInfo.commit.date));

  return (
    <main
      id="informations"
      style={{ height: window.innerHeight - Number.parseInt(variables.topBarHeight) }}
    >
      <p>
        Apothiquiz est une application d'apprentissage réflexe à destination des étudiants en
        pharmacie de l'Université de Franche-Comté.
      </p>
      <p>
        Réalisée dans le cadre d'un projet tutoré de Licence 3 Informatique 2020-2021 et d'un stage
        de la même Licence.
      </p>
      <p>
        Application open-source, code disponible sur{" "}
        <a href="https://github.com/valFraNath/apothiquiz">GitHub.com/ValFraNath/Apothiquiz</a>
      </p>
      <p>
        En cas de remarque ou de conseil sur cette application, vous pouvez{" "}
        <a href="mailto:nathanael.houn@edu.univ-fcomte.fr,francois.poguet@edu.univ-fcomte.fr,valentin.perignon@edu.univ-fcomte.fr">
          nous écrire par mail
        </a>{" "}
        ou <a href="https://github.com/ValFraNath/apothiquiz/issues/new/">ouvrir un ticket</a>.
      </p>

      <details id="credits">
        <summary>Crédits</summary>
        <ol>
          <li>
            Réalisé par Éros Albérola, <a href="https://www.nathanaelhoun.fr">Nathanaël Houn</a>,{" "}
            <a href="https://francois.poguet.com">François Poguet</a> et{" "}
            <a href="https://valentin-perignon.fr">Valentin Perignon</a>.
          </li>
          <li>Supervisé par Anne-Laure Clairet, Frédéric Dadeau, et Marc Pudlo.</li>
          <li>Graphismes par Roxane Herbstmeyer.</li>
          <li>
            Icônes par{" "}
            <a href="https://icons.modulz.app/" target="_blank" rel="noreferrer">
              Modulz
            </a>
            .
          </li>
        </ol>
      </details>

      <table id="app-version">
        {/* <tbody>
          <tr>
            <td>Date de version : </td>
            <td>
              {process.env.NODE_ENV === "production"
                ? date.toLocaleString().split("GMT")[0]
                : process.env.NODE_ENV}
            </td>
          </tr>
          <tr>
            <td>Hash de version : </td>
            <td>{gitInfo.commit.shortHash}</td>
          </tr>
        </tbody> */}
      </table>
    </main>
  );
};

export default About;
