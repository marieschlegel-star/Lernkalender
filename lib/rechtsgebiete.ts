import type { Fach } from "./types";

export interface ThemenGruppe {
  fach: Fach;
  label: string;
  emoji: string;
  themen: string[];
}

export const RECHTSGEBIETE: ThemenGruppe[] = [
  {
    fach: "ZivR",
    label: "Zivilrecht",
    emoji: "⚖️",
    themen: [
      "BGB AT",
      "Schuldrecht AT",
      "Schuldrecht BT",
      "Sachenrecht",
      "Familienrecht",
      "Erbrecht",
      "Haupt-/Hilfsvorbringen",
      "Wiederholung ZivR",
    ],
  },
  {
    fach: "ZPO",
    label: "ZPO",
    emoji: "📋",
    themen: [
      "Zulässigkeit",
      "Zuständigkeit",
      "Mahnverfahren",
      "Arrest & einstweilige Verfügung",
      "Klagearten",
      "Prozesskostenhilfe",
      "Beweisrecht",
      "Wiederholung ZPO",
    ],
  },
  {
    fach: "ZPO III",
    label: "ZPO III",
    emoji: "📑",
    themen: [
      "Berufung",
      "Revision",
      "Zwangsvollstreckung",
      "Einstweiliger Rechtsschutz",
      "Insolvenzrecht",
      "Wiederholung ZPO III",
    ],
  },
  {
    fach: "StrafR",
    label: "Strafrecht",
    emoji: "🔨",
    themen: [
      "StGB AT I – Vorsatz",
      "StGB AT II – Täterschaft",
      "Körperverletzungsdelikte",
      "Tötungsdelikte",
      "Eigentumsdelikte",
      "Vermögensdelikte",
      "Betrug & Untreue",
      "Wiederholung StrafR",
    ],
  },
  {
    fach: "StPO",
    label: "Strafprozessrecht",
    emoji: "🏛️",
    themen: [
      "Ermittlungsverfahren",
      "Zwischenverfahren",
      "Hauptverfahren",
      "Beweisverwertungsverbote",
      "Rechtsmittel StPO",
      "Wiederholung StPO",
    ],
  },
  {
    fach: "VwR",
    label: "Verwaltungsrecht",
    emoji: "🏢",
    themen: [
      "VwR AT – VA & Aufhebung",
      "VwR AT – Ermessen",
      "Polizeirecht",
      "Baurecht",
      "Beamtenrecht",
      "Anfechtungsklage",
      "Verpflichtungsklage",
      "Wiederholung VwR",
    ],
  },
  {
    fach: "VwGO",
    label: "VwGO & Öffentliches Recht",
    emoji: "📜",
    themen: [
      "VwGO – Überblick",
      "Vorläufiger Rechtsschutz",
      "Normenkontrolle",
      "Grundrechte",
      "Staatsrecht",
      "Europarecht",
      "Methodenlehre",
      "Wiederholung ÖR",
    ],
  },
];
