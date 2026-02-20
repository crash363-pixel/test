const STORAGE_KEY = "smartClosetItems";
const OUTFIT_SLOTS = [
  { key: "parte_superior", label: "Parte superior" },
  { key: "parte_inferior", label: "Parte inferior" },
  { key: "calzado", label: "Calzado" },
  { key: "abrigo", label: "Abrigo" },
  { key: "accesorio", label: "Accesorio" },
];

const itemForm = document.getElementById("itemForm");
const imageInput = document.getElementById("imageInput");
const nameInput = document.getElementById("nameInput");
const categoryInput = document.getElementById("categoryInput");
const seasonInput = document.getElementById("seasonInput");
const closetGrid = document.getElementById("closetGrid");
const saveStatus = document.getElementById("saveStatus");
const outfitSelectors = document.getElementById("outfitSelectors");
const outfitMessage = document.getElementById("outfitMessage");
const outfitPreview = document.getElementById("outfitPreview");
const suggestBtn = document.getElementById("suggestBtn");
const clearSelectionBtn = document.getElementById("clearSelectionBtn");

let closetItems = loadItems();

initialize();

function initialize() {
  renderCloset();
  renderSelectors();
  suggestBtn.addEventListener("click", suggestOutfit);
  clearSelectionBtn.addEventListener("click", () => {
    document.querySelectorAll(".slot-select").forEach((select) => (select.value = ""));
    renderOutfitPreview();
    outfitMessage.textContent = "Selección borrada. Puedes volver a combinar.";
  });

  itemForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveStatus.textContent = "Procesando imagen y detectando color...";

    const file = imageInput.files && imageInput.files[0];
    if (!file) {
      saveStatus.textContent = "Selecciona una imagen.";
      return;
    }

    try {
      const imageDataUrl = await fileToDataUrl(file);
      const color = await detectDominantColor(imageDataUrl);

      const item = {
        id: generateId(),
        name: nameInput.value.trim(),
        category: categoryInput.value,
        season: seasonInput.value,
        color,
        imageDataUrl,
      };

      closetItems.push(item);
      persistItems(closetItems);
      itemForm.reset();
      renderCloset();
      renderSelectors();
      saveStatus.textContent = `Prenda guardada ✅. Color detectado: ${color.label} (${color.hex})`;
    } catch (error) {
      console.error(error);
      saveStatus.textContent = "No se pudo guardar la prenda. Inténtalo con otra foto.";
    }
  });
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("No se pudo leer el armario guardado:", error);
    return [];
  }
}

function persistItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("No se pudo guardar el armario:", error);
    saveStatus.textContent = "No se pudo guardar en el navegador (almacenamiento lleno o bloqueado).";
  }
}

function renderCloset() {
  closetGrid.innerHTML = "";

  if (closetItems.length === 0) {
    closetGrid.innerHTML = "<p class='status'>Aún no hay prendas guardadas.</p>";
    return;
  }

  const template = document.getElementById("itemCardTemplate");

  closetItems.forEach((item) => {
    const fragment = template.content.cloneNode(true);
    const img = fragment.querySelector("img");
    const title = fragment.querySelector("h3");
    const meta = fragment.querySelector(".meta");
    const color = fragment.querySelector(".color");

    img.src = item.imageDataUrl;
    img.alt = item.name;
    title.textContent = item.name;
    meta.textContent = `${beautify(item.category)} · ${beautify(item.season)}`;
    color.textContent = `Color: ${item.color.label} (${item.color.hex})`;

    closetGrid.appendChild(fragment);
  });
}

function renderSelectors() {
  outfitSelectors.innerHTML = "";

  OUTFIT_SLOTS.forEach((slot) => {
    const label = document.createElement("label");
    label.textContent = slot.label;

    const select = document.createElement("select");
    select.className = "slot-select";
    select.dataset.slot = slot.key;

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "No seleccionado";
    select.appendChild(emptyOption);

    closetItems
      .filter((item) => item.category === slot.key)
      .forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.name} (${item.color.label})`;
        select.appendChild(option);
      });

    select.addEventListener("change", renderOutfitPreview);
    label.appendChild(select);
    outfitSelectors.appendChild(label);
  });

  renderOutfitPreview();
}

function renderOutfitPreview() {
  outfitPreview.innerHTML = "";

  const selectedItems = getSelectedItems();
  if (selectedItems.length === 0) {
    outfitPreview.innerHTML = "<p class='status'>Selecciona prendas para ver el conjunto.</p>";
    return;
  }

  selectedItems.forEach((item) => {
    const article = document.createElement("article");
    article.className = "item-card";
    article.innerHTML = `
      <img src="${item.imageDataUrl}" alt="${item.name}" />
      <div>
        <h3>${item.name}</h3>
        <p class="meta">${beautify(item.category)}</p>
        <p class="color">${item.color.label} (${item.color.hex})</p>
      </div>
    `;
    outfitPreview.appendChild(article);
  });

  const harmonyScore = calculateHarmony(selectedItems);
  outfitMessage.textContent =
    harmonyScore >= 70
      ? `✅ Buena combinación (${harmonyScore}/100). Parece un conjunto equilibrado.`
      : `ℹ️ Combinación mejorable (${harmonyScore}/100). Prueba otros colores.`;
}

function suggestOutfit() {
  const byCategory = closetItems.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  for (const slot of OUTFIT_SLOTS) {
    const candidates = byCategory[slot.key] || [];
    const select = document.querySelector(`select[data-slot='${slot.key}']`);

    if (!select) continue;
    if (candidates.length === 0) {
      select.value = "";
      continue;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    select.value = chosen.id;
  }

  renderOutfitPreview();
}

function getSelectedItems() {
  return [...document.querySelectorAll(".slot-select")]
    .map((select) => closetItems.find((item) => item.id === select.value))
    .filter(Boolean);
}

function calculateHarmony(items) {
  if (items.length < 2) return 100;

  let nearMatches = 0;
  let comparisons = 0;

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const distance = colorDistance(items[i].color.rgb, items[j].color.rgb);
      if (distance < 130) nearMatches += 1;
      comparisons += 1;
    }
  }

  return Math.round((nearMatches / comparisons) * 100);
}

function colorDistance(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function detectDominantColor(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 60;
      canvas.height = 60;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("No se pudo crear canvas context."));
        return;
      }

      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

      let r = 0;
      let g = 0;
      let b = 0;
      const pixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }

      r = Math.round(r / pixels);
      g = Math.round(g / pixels);
      b = Math.round(b / pixels);

      resolve({
        rgb: { r, g, b },
        hex: rgbToHex(r, g, b),
        label: colorNameFromRgb(r, g, b),
      });
    };

    img.onerror = () => reject(new Error("Error cargando imagen."));
    img.src = dataUrl;
  });
}

function colorNameFromRgb(r, g, b) {
  if (r < 45 && g < 45 && b < 45) return "Negro";
  if (r > 220 && g > 220 && b > 220) return "Blanco";
  if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15) return "Gris";
  if (r > g + 30 && r > b + 30) return "Rojo";
  if (g > r + 25 && g > b + 25) return "Verde";
  if (b > r + 25 && b > g + 25) return "Azul";
  if (r > 170 && g > 120 && b < 110) return "Amarillo/Mostaza";
  if (r > 160 && b > 140 && g < 150) return "Morado/Rosa";
  if (r > 140 && g > 90 && b < 90) return "Marrón";
  return "Mixto";
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function beautify(value) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}
