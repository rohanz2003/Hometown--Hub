/**
 * utils/locations.js — country and state options for location forms.
 */
import { Country, State } from 'country-state-city';

export const COUNTRY_OPTIONS = Country.getAllCountries()
  .map((country) => ({
    value: country.isoCode,
    label: country.name,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const getStateOptions = (countryCode) =>
  State.getStatesOfCountry(countryCode)
    .map((state) => ({
      value: state.name,
      label: state.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

export const getCountryCode = (countryName) =>
  COUNTRY_OPTIONS.find((country) => country.label === countryName)?.value || '';

export const getCountryName = (countryCode) =>
  COUNTRY_OPTIONS.find((country) => country.value === countryCode)?.label || '';