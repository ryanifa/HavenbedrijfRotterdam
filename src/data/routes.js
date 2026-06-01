// Vereenvoudigde vaarroutes door het havengebied van Rotterdam.
// Geen exacte vaargeulen, maar geografisch herkenbaar genoeg voor een demo.
// Elke route is een lijst van [lon, lat]-waypunten.

export const FAIRWAYS = {
  // Hoofdvaargeul: Noordzee -> Maasmond -> Nieuwe Waterweg -> stad
  maasgeul: [
    [3.78, 52.005],
    [3.92, 51.995],
    [4.0, 51.985],
    [4.06, 51.978],
    [4.13, 51.978], // Hoek van Holland
    [4.2, 51.945],
    [4.28, 51.905], // Botlek
    [4.36, 51.895],
    [4.43, 51.9],
    [4.49, 51.905] // Erasmusbrug / stadshaven
  ],
  // Splitsing naar Europoort / Calandkanaal
  caland: [
    [4.13, 51.978],
    [4.1, 51.955],
    [4.06, 51.95], // Europoort
    [4.02, 51.948], // Maasvlakte
    [3.98, 51.952]
  ],
  // Maasvlakte 2 diepzee-terminals
  maasvlakte2: [
    [4.0, 51.985],
    [3.99, 51.965],
    [3.99, 51.95], // MV2 containerterminals
    [4.0, 51.94]
  ],
  // Hartelkanaal binnenvaart
  hartel: [
    [4.06, 51.95],
    [4.13, 51.91],
    [4.22, 51.87],
    [4.3, 51.86]
  ]
}

// Ankergebied op zee voor de kust (schepen wachten hier).
export const ANCHORAGE = {
  center: [3.85, 51.97],
  radiusDeg: 0.05
}

// Aanlegplaatsen / terminals waar gemeerde schepen liggen.
export const BERTHS = [
  { name: 'APMT Maasvlakte II', pos: [3.99, 51.953] },
  { name: 'RWG Terminal', pos: [4.0, 51.948] },
  { name: 'ECT Delta Terminal', pos: [4.04, 51.947] },
  { name: 'Europoort Tankterminal', pos: [4.08, 51.952] },
  { name: 'Botlek Chemie', pos: [4.28, 51.886] },
  { name: 'Waalhaven', pos: [4.41, 51.895] },
  { name: 'Maashaven', pos: [4.48, 51.898] }
]
