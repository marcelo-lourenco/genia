/**
 * GEDCOM X Standard Data Types
 * Reference: https://gedcomx.org / FamilySearch Platform API
 */

export interface GedcomxNamePart {
  type?: string;
  value: string;
}

export interface GedcomxNameForm {
  fullText?: string;
  lang?: string;
  parts?: GedcomxNamePart[];
}

export interface GedcomxName {
  id?: string;
  type?: string;
  nameForms: GedcomxNameForm[];
  preferred?: boolean;
}

export interface GedcomxDate {
  original?: string;
  formal?: string;
}

export interface GedcomxPlace {
  original?: string;
}

export interface GedcomxFact {
  id?: string;
  type: string;
  date?: GedcomxDate;
  place?: GedcomxPlace;
  value?: string;
}

export interface GedcomxDisplayProperties {
  name?: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  marriageDate?: string;
  marriagePlace?: string;
  ascendancyNumber?: string;
  descendancyNumber?: string;
}

export interface GedcomxPerson {
  id: string;
  principal?: boolean;
  gender?: {
    type?: string;
  };
  names?: GedcomxName[];
  facts?: GedcomxFact[];
  sources?: Array<{
    description?: string;
  }>;
  display?: GedcomxDisplayProperties;
}

export interface GedcomxRelationship {
  id?: string;
  type: string;
  person1: { resource: string };
  person2: { resource: string };
  facts?: GedcomxFact[];
}

export interface GedcomxDocument {
  id?: string;
  persons?: GedcomxPerson[];
  relationships?: GedcomxRelationship[];
  sourceDescriptions?: Array<{
    id?: string;
    about?: string;
    titles?: Array<{ value: string }>;
  }>;
}
