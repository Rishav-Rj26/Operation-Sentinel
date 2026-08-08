const RANKS = [
  'DGP',
  'ADGP',
  'IG',
  'DIG',
  'SP',
  'DSP',
  'ASP',
  'Inspector',
  'SI',
  'ASI',
  'HeadConstable',
  'Constable'
];

const COMMAND_RANKS = ['DGP', 'ADGP', 'IG']; // Never field-deployed
const STRATEGIC_RANKS = ['DIG', 'SP']; // Cluster oversight only
const ZONE_MANAGER_RANKS = ['DSP', 'ASP', 'Inspector']; // 1-3 adjacent zones
const FIELD_RANKS = ['SI', 'ASI', 'HeadConstable', 'Constable'];

const REST_HOURS = {
  Inspector: 12,
  default: 8
};

module.exports = {
  RANKS,
  COMMAND_RANKS,
  STRATEGIC_RANKS,
  ZONE_MANAGER_RANKS,
  FIELD_RANKS,
  REST_HOURS
};
