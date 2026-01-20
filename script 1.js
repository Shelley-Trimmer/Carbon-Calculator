// Emission factors (rough UK-centric estimates)
const FACTORS = {
  carPerMile: 0.192,
  busPerMile: 0.105,
  trainPerMile: 0.041,
  evPerMile: 0.053,
  cyclePerMile: 0,
  shortFlight: 250,
  longFlight: 1100,
  electricityPerKWh: 0.233,
  gasPerKWh: 0.184,
  diet: {
    plant: 1000,
    mixed: 2000,
    meat: 3000,
  },
};

const UK_AVERAGE = 10000;

// DOM references
const carMilesInput = document.getElementById("carMiles");
const busMilesInput = document.getElementById("busMiles");
const trainMilesInput = document.getElementById("trainMiles");
const evMilesInput = document.getElementById("evMiles");
const cycleMilesInput = document.getElementById("cycleMiles");
const shortFlightsInput = document.getElementById("shortFlights");
const longFlightsInput = document.getElementById("longFlights");
const electricityInput = document.getElementById("electricity");
const gasInput = document.getElementById("gas");
const carError = document.getElementById("carError");

const totalResult = document.getElementById("totalResult");
const transportResult = document.getElementById("transportResult");
const busResult = document.getElementById("busResult");
const trainResult = document.getElementById("trainResult");
const evResult = document.getElementById("evResult");
const cycleResult = document.getElementById("cycleResult");
const homeResult = document.getElementById("homeResult");
const dietResult = document.getElementById("dietResult");
const ratingBadgeContainer = document.getElementById("ratingBadge");
const tipsList = document.getElementById("tipsList");

// Helper functions
function getDietSelection() {
  const selected = document.querySelector("input[name='diet']:checked");
  return selected ? selected.value : 'plant';
}

function parseNumber(value) {
  const num = Number(value);
  return (isNaN(num) || num < 0) ? 0 : num;
}

function formatNumber(num) {
  return num >= 1000 ? num.toFixed(0) : num.toFixed(1);
}

function updateCarError() {
  const raw = Number(carMilesInput.value);
  const show = Number.isFinite(raw) && raw < 0;
  carError.style.display = show ? 'block' : 'none';
}

// 🌿 NEW: Pure emissions calculation function
function computeEmissions(inputs) {
  const {
    carMiles, busMiles, trainMiles, evMiles, cycleMiles,
    shortFlights, longFlights, electricity, gas, dietChoice
  } = inputs;

  const bus = busMiles * FACTORS.busPerMile;
  const car = carMiles * FACTORS.carPerMile;
  const train = trainMiles * FACTORS.trainPerMile;
  const ev = evMiles * FACTORS.evPerMile;
  const cycle = cycleMiles * FACTORS.cyclePerMile;
  const flights = shortFlights * FACTORS.shortFlight + longFlights * FACTORS.longFlight;
  const home = electricity * FACTORS.electricityPerKWh + gas * FACTORS.gasPerKWh;
  const diet = FACTORS.diet[dietChoice];

  return {
    car, bus, train, ev, cycle, flights, home, diet,
    transport: car + bus + train + ev + cycle + flights,
    total: car + bus + train + ev + cycle + flights + home + diet
  };
}

// Chart state
let carbonChart = null;

function updateChart(data) {
  const canvas = document.getElementById("carbonChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (carbonChart) carbonChart.destroy();
  carbonChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Carbon Footprint"],
      datasets: [
        { label: "Car", data: [data.car], backgroundColor: "#4caf50" },
        { label: "Bus", data: [data.bus], backgroundColor: "#81c784" },
        { label: "Train", data: [data.train], backgroundColor: "#aed581" },
        { label: "EV", data: [data.ev], backgroundColor: "#dce775" },
        { label: "Flights", data: [data.flights], backgroundColor: "#fff176" },
        { label: "Home Energy", data: [data.home], backgroundColor: "#ffd54f" },
        { label: "Diet", data: [data.diet], backgroundColor: "#ffb74d" },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      scales: { x: { stacked: true }, y: { stacked: true } },
    },
  });
}

function updateTips(total) {
  tipsList.innerHTML = "";
  if (!total) {
    tipsList.innerHTML = "<li>Fill in the form to see personalised suggestions.</li>";
    return;
  }

  const ratio = total / UK_AVERAGE;
  let tips = [];

  if (ratio <= 0.6) {
    tips = [
      "You're already doing well — consider sharing what works with others.",
      "Explore green energy tariffs or community sustainability projects.",
      "Reduce indirect emissions by buying fewer new products.",
    ];
  } else if (ratio <= 1.2) {
    tips = [
      "Try combining short car trips or using public transport.",
      "Improve home efficiency with draught-proofing or insulation.",
      "Add one or two regular plant-based meals to your week.",
    ];
  } else {
    tips = [
      "Consider reducing long-haul flights or offsetting unavoidable ones.",
      "Look at big wins: insulation, thermostat changes, or green tariffs.",
      "Experiment with reducing red meat and processed foods.",
    ];
  }

  tips.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    tipsList.appendChild(li);
  });
}

// 🌿 CLEAN NEW VERSION
function calculateFootprint() {
  updateCarError();

  const inputs = {
    carMiles: parseNumber(carMilesInput.value),
    busMiles: parseNumber(busMilesInput.value),
    trainMiles: parseNumber(trainMilesInput.value),
    evMiles: parseNumber(evMilesInput.value),
    cycleMiles: parseNumber(cycleMilesInput.value),
    shortFlights: parseNumber(shortFlightsInput.value),
    longFlights: parseNumber(longFlightsInput.value),
    electricity: parseNumber(electricityInput.value),
    gas: parseNumber(gasInput.value),
    dietChoice: getDietSelection()
  };

  const results = computeEmissions(inputs);

  const ratio = results.total / UK_AVERAGE;
  let rating = "";
  if (ratio <= 0.6) rating = "Low";
  else if (ratio <= 1.2) rating = "Average";
  else rating = "High";

  // Clear old classes
ratingBadgeContainer.classList.remove("rating-low", "rating-average", "rating-high");

if (rating === "Low") {
  ratingBadgeContainer.classList.add("rating-low");
} else if (rating === "Average") {
  ratingBadgeContainer.classList.add("rating-average");
} else if (rating === "High") {
  ratingBadgeContainer.classList.add("rating-high");
}

ratingBadgeContainer.textContent = `Rating: ${rating}`;

  totalResult.textContent = `${formatNumber(results.total)} kg CO₂e`;
  busResult.textContent = `${formatNumber(results.bus)} kg CO₂e`;
  trainResult.textContent = `${formatNumber(results.train)} kg CO₂e`;
  evResult.textContent = `${formatNumber(results.ev)} kg CO₂e`;
  cycleResult.textContent = `${formatNumber(results.cycle)} kg CO₂e`;
  transportResult.textContent = `${formatNumber(results.transport)} kg CO₂e`;
  homeResult.textContent = `${formatNumber(results.home)} kg CO₂e`;
  dietResult.textContent = `${formatNumber(results.diet)} kg CO₂e`;

  updateChart({
    car: results.car,
    bus: results.bus,
    train: results.train,
    ev: results.ev,
    flights: results.flights,
    home: results.home,
    diet: results.diet
  });

  updateTips(results.total);
}

function resetForm() {
  carMilesInput.value = "";
  busMilesInput.value = "";
  trainMilesInput.value = "";
  evMilesInput.value = "";
  cycleMilesInput.value = "";
  shortFlightsInput.value = "";
  longFlightsInput.value = "";
  electricityInput.value = "";
  gasInput.value = "";

  document.querySelector("input[name='diet'][value='plant']").checked = true;

  totalResult.textContent = "— kg CO₂e";
  busResult.textContent = "— kg CO₂e";
  trainResult.textContent = "— kg CO₂e";
  evResult.textContent = "— kg CO₂e";
  cycleResult.textContent = "0 kg CO₂e";
  transportResult.textContent = "— kg CO₂e";
  homeResult.textContent = "— kg CO₂e";
  dietResult.textContent = "— kg CO₂e";

  updateTips(null);
  if (carbonChart) { carbonChart.destroy(); carbonChart = null; }
}

// Wire up events
document.getElementById("calculateBtn").addEventListener("click", calculateFootprint);
document.getElementById("resetBtn").addEventListener("click", resetForm);