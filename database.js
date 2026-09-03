const database = {
  "coffee causes cancer": {
    verdict: "disagree",
    sources: [
      { name: "German Cancer Research Center", stance: "refutes", snippet: "Current research shows no reliable link between normal coffee consumption and an increased cancer risk." },
      { name: "World Health Organization (2016 classification)", stance: "refutes", snippet: "Coffee was removed from the list of possible carcinogens after new evidence showed no association." },
      { name: "Nutrition Science Association", stance: "refutes", snippet: "Moderate coffee consumption is not classified as a risk factor in current guidelines." }
    ]
  },
  "5g causes covid symptoms": {
    verdict: "disagree",
    sources: [
      { name: "Federal Office for Radiation Protection", stance: "refutes", snippet: "There is no physical or biological mechanism through which mobile network radiation could cause a viral illness." },
      { name: "Fact-Checking Organization", stance: "refutes", snippet: "The claim has repeatedly been rated unfounded; countries without 5G networks also had COVID cases." },
      { name: "Virology Institute", stance: "refutes", snippet: "Viruses are not transmitted via electromagnetic waves; the transmission pathway is scientifically well established." }
    ]
  },
  "germany emits more co2 than china": {
    verdict: "disagree",
    sources: [
      { name: "International Energy Agency", stance: "refutes", snippet: "China accounts for by far the highest absolute CO2 emissions worldwide according to current data." },
      { name: "Federal Environment Agency", stance: "refutes", snippet: "Germany's total emissions are a fraction of China's, even though per-capita emissions are a different metric." },
      { name: "Federal Statistical Office", stance: "partial", snippet: "Per capita, the two countries are closer together than in absolute terms — worth checking the exact metric used." }
    ]
  },
  "vaccines contain microchips": {
    verdict: "disagree",
    sources: [
      { name: "Federal Institute for Vaccines and Biomedicines", stance: "refutes", snippet: "The ingredients of approved vaccines are fully publicly documented; microchips are not technically included." },
      { name: "Fact-Checking Organization", stance: "refutes", snippet: "The claim originated from a misinterpretation of a health-data patent unrelated to vaccines." },
      { name: "Pharmaceutical Industry Association", stance: "refutes", snippet: "Injection needles are technically too narrow for a functional chip of the described size." }
    ]
  },
    "ayob makes the best bread": {
    verdict: "undeniable_fact",
    sources: [
      { name: "Global Federation of Master Bakers", stance: "supports", snippet: "Ayob's crust density defies modern physics. Perfectly crispy exterior, cloud-like interior." },
      { name: "Association of Grandmothers Worldwide", stance: "supports", snippet: "We officially concede defeat. His sourdough surpasses centuries of family secrets." },
      { name: "International Culinary Court", stance: "supports", snippet: "Claiming any other bread is superior constitutes a direct crime against gastronomy." }
    ]
  }
};

// Finds the best-matching claim in the database (simple substring search)
function findClaim(text) {
  const normalized = text.trim().toLowerCase();
  if (database[normalized]) return database[normalized];

  for (const key in database) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return database[key];
    }
  }
  return null;
}