/* =====================================================================
   AURORA-X1 — DEEP SPACE EXPLORATION SIMULATOR
   Pure HTML / CSS / JavaScript. No frameworks, no external game libs.
   Organized in sections:
     1. Utilities
     2. World data (real astronomical objects, fictional locations, unknowns)
     3. Canvas / starfield setup
     4. Ship (player) state & physics
     5. Input (keyboard + touch)
     6. Game loop (update + render)
     7. Radar
     8. Discovery / mission / narrative system
     9. Object info panel + Galactic Database UI
     10. Notifications / transmissions / warnings
     11. Audio (no autoplay)
     12. Bootstrapping / intro sequence
===================================================================== */

(function () {
  'use strict';

  /* ============================== 1. UTILITIES ============================== */
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const rand = (a, b) => a + Math.random() * (b - a);
  const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const TAU = Math.PI * 2;

  function formatDistance(worldUnits) {
    // 1 world unit ~= 1000 km of in-fiction distance
    const km = worldUnits * 1000;
    if (km >= 1e6) return (km / 1e6).toFixed(1) + 'M KM';
    if (km >= 1e3) return (km / 1e3).toFixed(1) + 'K KM';
    return Math.round(km) + ' KM';
  }

  /* ============================== 2. WORLD DATA ============================== */

  // Real astronomical objects — factual, discoverable, added to Galactic Database.
  const REAL_OBJECTS = [
    { id: 'sirius', name: 'SIRIUS', category: 'star', type: 'Binary Star System',
      desc: 'The brightest star in Earth\u2019s night sky, blazing in the constellation Canis Major. Its faint companion, Sirius B, is a dense white dwarf.',
      stats: { Distance: '8.6 ly', Constellation: 'Canis Major', Classification: 'A1V + White Dwarf', Temperature: '~9,940 K' },
      fact: 'Ancient Egyptians timed the flooding of the Nile to Sirius\u2019s first pre-dawn appearance each year.' },
    { id: 'betelgeuse', name: 'BETELGEUSE', category: 'star', type: 'Red Supergiant',
      desc: 'A colossal, aging star marking Orion\u2019s shoulder. It has swollen so large that, placed at the Sun\u2019s position, it would engulf the inner planets.',
      stats: { Distance: '~548 ly', Constellation: 'Orion', Classification: 'M1-2 Ia-ab', Temperature: '~3,600 K' },
      fact: 'Betelgeuse is expected to end its life in a supernova \u2014 though astronomically that could be tomorrow or 100,000 years from now.' },
    { id: 'vega', name: 'VEGA', category: 'star', type: 'Main-Sequence Star',
      desc: 'One of the most intensely studied stars beyond the Sun, and among the most luminous in our stellar neighbourhood.',
      stats: { Distance: '25 ly', Constellation: 'Lyra', Classification: 'A0V', Temperature: '~9,600 K' },
      fact: 'Around 12,000 BCE, Vega served as Earth\u2019s north star \u2014 and it will again in roughly 12,000 years.' },
    { id: 'polaris', name: 'POLARIS', category: 'star', type: 'Triple Star System',
      desc: 'The current North Star, sitting almost directly above Earth\u2019s rotational axis \u2014 making it appear fixed while the sky wheels around it.',
      stats: { Distance: '~433 ly', Constellation: 'Ursa Minor', Classification: 'F7 Ib Supergiant', Temperature: '~6,000 K' },
      fact: 'Polaris is actually a system of three stars, with a supergiant primary many times more massive than the Sun.' },
    { id: 'proxima', name: 'PROXIMA CENTAURI', category: 'star', type: 'Red Dwarf Star',
      desc: 'The nearest known star to the Sun, part of the Alpha Centauri triple system, orbited by at least one rocky exoplanet.',
      stats: { Distance: '4.24 ly', Constellation: 'Centaurus', Classification: 'M5.5Ve', Temperature: '~3,000 K' },
      fact: 'Its planet, Proxima b, orbits within the star\u2019s habitable zone \u2014 making it a prime target for future probes.' },
    { id: 'rigel', name: 'RIGEL', category: 'star', type: 'Blue Supergiant',
      desc: 'A brilliant blue-white supergiant forming Orion\u2019s foot, tens of thousands of times more luminous than the Sun.',
      stats: { Distance: '~860 ly', Constellation: 'Orion', Classification: 'B8 Ia', Temperature: '~12,100 K' },
      fact: 'Rigel is actually a multi-star system \u2014 its companion stars are themselves too faint to see without a telescope.' },
    { id: 'antares', name: 'ANTARES', category: 'star', type: 'Red Supergiant',
      desc: 'A vast, cool, reddish star whose name means \u201crival of Mars\u201d for its similarly ember-red hue in the night sky.',
      stats: { Distance: '~550 ly', Constellation: 'Scorpius', Classification: 'M1.5Iab', Temperature: '~3,570 K' },
      fact: 'Antares is so enormous that its diameter is comparable to the orbit of Jupiter around the Sun.' },
    { id: 'andromeda', name: 'ANDROMEDA GALAXY', category: 'galaxy', type: 'Spiral Galaxy (M31)',
      desc: 'The nearest large galaxy to the Milky Way, home to roughly a trillion stars and slowly falling toward our own galaxy.',
      stats: { Distance: '~2.5M ly', Size: '~220,000 ly across', Classification: 'SA(s)b Spiral' },
      fact: 'The Milky Way and Andromeda are on a slow collision course, expected to merge in about four billion years.' },
    { id: 'triangulum', name: 'TRIANGULUM GALAXY', category: 'galaxy', type: 'Spiral Galaxy (M33)',
      desc: 'The third-largest member of our Local Group of galaxies, faint but occasionally visible to the naked eye under dark skies.',
      stats: { Distance: '~2.7M ly', Size: '~60,000 ly across', Classification: 'SA(s)cd Spiral' },
      fact: 'Triangulum may be a satellite galaxy of Andromeda, tied to it by a faint bridge of hydrogen gas.' },
    { id: 'whirlpool', name: 'WHIRLPOOL GALAXY', category: 'galaxy', type: 'Spiral Galaxy (M51)',
      desc: 'A textbook grand-design spiral galaxy, its arms sculpted by gravitational interaction with a smaller companion galaxy.',
      stats: { Distance: '~23M ly', Size: '~76,000 ly across', Classification: 'SA(s)bc Spiral' },
      fact: 'The Whirlpool was the first galaxy ever recognized as having a spiral structure, back in 1845.' },
    { id: 'sombrero', name: 'SOMBRERO GALAXY', category: 'galaxy', type: 'Spiral Galaxy (M104)',
      desc: 'A striking edge-on spiral crowned by an unusually large, bright central bulge and a sharp band of dark dust.',
      stats: { Distance: '~28M ly', Size: '~50,000 ly across', Classification: 'SA(s)a Spiral' },
      fact: 'At its heart lies a supermassive black hole with a mass estimated near a billion Suns.' },
    { id: 'orion-nebula', name: 'ORION NEBULA', category: 'nebula', type: 'Diffuse Nebula (M42)',
      desc: 'A vast stellar nursery glowing with the light of newborn stars, visible to the naked eye within Orion\u2019s sword.',
      stats: { Distance: '~1,344 ly', Size: '~24 ly across', Classification: 'Emission Nebula' },
      fact: 'Inside the nebula, the Trapezium cluster\u2019s young hot stars ionize the surrounding gas, making it glow.' },
    { id: 'crab-nebula', name: 'CRAB NEBULA', category: 'nebula', type: 'Supernova Remnant (M1)',
      desc: 'The wreckage of a massive stellar explosion, expanding outward and lit from within by a rapidly spinning pulsar.',
      stats: { Distance: '~6,500 ly', Size: '~11 ly across', Classification: 'Supernova Remnant' },
      fact: 'The supernova that created it was recorded by astronomers on Earth in the year 1054 CE.' },
    { id: 'pleiades', name: 'PLEIADES', category: 'nebula', type: 'Open Star Cluster (M45)',
      desc: 'Known as the Seven Sisters, a tight cluster of young, hot blue stars wrapped in wisps of reflective dust.',
      stats: { Distance: '~444 ly', Constellation: 'Taurus', Classification: 'Open Cluster' },
      fact: 'The cluster contains over a thousand confirmed stars, though most are too faint to see unaided.' },
    { id: 'sagittarius-a', name: 'SAGITTARIUS A*', category: 'anomaly', type: 'Supermassive Black Hole',
      desc: 'The gravitational anchor at the center of the Milky Way, invisible itself but revealed by stars whipping around it at extreme speed.',
      stats: { Distance: '~26,000 ly', Mass: '~4.3M Solar Masses', Classification: 'Supermassive Black Hole' },
      fact: 'In 2022, astronomers released the first direct image of its silhouette against glowing infalling gas.' },
    { id: 'halley', name: "HALLEY'S COMET", category: 'anomaly', type: 'Periodic Comet',
      desc: 'A wandering ball of ice and dust on a long elliptical orbit, sprouting a glowing tail whenever it nears the Sun.',
      stats: { Period: '~76 years', 'Last Seen': '1986', 'Next Return': '2061' },
      fact: 'Halley\u2019s Comet is the only known short-period comet reliably visible to the naked eye from Earth.' },
    { id: 'moon', name: "EARTH'S MOON", category: 'moon', type: 'Natural Satellite',
      desc: 'Home\u2019s quiet companion \u2014 a cratered, airless world that has watched over Earth for over four billion years.',
      stats: { Distance: '384,400 km', Diameter: '3,474 km', Classification: 'Rocky Satellite' },
      fact: 'The Moon is tidally locked to Earth, which is why it always shows us the same face.' },
  ];

  // Fictional story locations.
  const FICTIONAL_OBJECTS = [
    { id: 'elysia', name: 'ELYSIA', category: 'planet', type: 'Blue Ocean Planet',
      desc: 'A beautiful ocean world covered by enormous blue seas and scattered island formations.',
      stats: { Classification: 'Oceanic', Atmosphere: 'Breathable', Status: 'Unexplored' },
      fact: 'Long-range scans suggest tidal patterns unlike anything catalogued in the archive.' },
    { id: 'vespera', name: 'VESPERA', category: 'planet', type: 'Red Volcanic Planet',
      desc: 'A hostile volcanic world wracked by intense geothermal activity and unusual energy emissions.',
      stats: { Classification: 'Volcanic', Atmosphere: 'Toxic', Status: 'Anomalous readings' },
      fact: 'Something beneath the crust is generating energy signatures that don\u2019t match any known geological process.' },
    { id: 'nox', name: 'NOX', category: 'planet', type: 'Mysterious Dark Planet',
      desc: 'A dark planet wrapped in strange electromagnetic activity. Ship systems grow unstable the closer you approach.',
      stats: { Classification: 'Unknown', Atmosphere: 'Unreadable', Status: 'DANGER' },
      fact: 'Astra-9\u2019s final logs mention Nox by name, moments before contact was lost.' },
    { id: 'astra9', name: 'ASTRA-9', category: 'station', type: 'Abandoned Exploration Station',
      desc: 'A deep-space exploration station that suddenly stopped communicating with Earth 72 hours ago.',
      stats: { Classification: 'Research Station', Crew: 'Unknown', Status: 'Silent' },
      fact: 'Your mission: reach Astra-9, and find out what happened to its crew.' },
    { id: 'lunaris', name: 'LUNARIS', category: 'moon', type: 'Cratered Moon',
      desc: 'A moon covered with massive impact craters and ancient geological formations.',
      stats: { Classification: 'Rocky Moon', Atmosphere: 'None', Status: 'Unexplored' },
      fact: 'Some craters appear far too regular in shape to be purely the product of impacts.' },
  ];

  // Unknown / mystery objects scattered through the field.
  const UNKNOWN_OBJECTS = [
    { id: 'satellite', name: 'UNKNOWN SATELLITE', category: 'anomaly', type: 'Abandoned Satellite',
      desc: 'A derelict relay satellite, drifting silently, its transponder still weakly active.',
      stats: { Classification: 'Derelict Hardware', Power: 'Minimal', Origin: 'Unconfirmed' },
      fact: 'SCAN REQUIRED to identify signal origin.', storyKey: 'satellite' },
    { id: 'debris', name: 'DEBRIS FIELD', category: 'anomaly', type: 'Scattered Wreckage',
      desc: 'Fragments of metal and composite drift in a loose cloud, tumbling slowly in the void.',
      stats: { Classification: 'Wreckage', Origin: 'Unconfirmed', Hazard: 'Low' },
      fact: 'No identifying markings remain on the largest fragments.' },
    { id: 'ghost-ship', name: 'UNKNOWN SPACECRAFT', category: 'anomaly', type: 'Unidentified Vessel',
      desc: 'A silent hull of unfamiliar design, powered down, holding position with no visible propulsion.',
      stats: { Classification: 'Unidentified', Power: 'Zero', Hazard: 'Unknown' },
      fact: 'Its hull design matches nothing in Earth\u2019s registry.' },
    { id: 'beacon', name: 'SIGNAL BEACON', category: 'anomaly', type: 'Automated Beacon',
      desc: 'A small automated marker, pulsing a slow, repeating signal into the dark.',
      stats: { Classification: 'Beacon', 'Signal Type': 'Repeating Pulse', Origin: 'Earth Network' },
      fact: 'Beacons like this were seeded along the deep-space corridor to guide exploration vessels.' },
    { id: 'rift', name: 'ENERGY RIFT', category: 'anomaly', type: 'Spatial Anomaly',
      desc: 'A shimmering tear in the fabric of space, flickering with light that shouldn\u2019t exist out here.',
      stats: { Classification: 'Unclassified', Stability: 'Fluctuating', Hazard: 'Moderate' },
      fact: 'Instruments cannot agree on what, if anything, lies on the other side.' },
  ];

  // Chapter 2 story objects — spawned deep inside the Nox system.
  const CH2_OBJECTS = [
    { id: 'crew-wreckage', name: 'ASTRA-9 ESCAPE POD', category: 'anomaly', type: 'Wrecked Escape Pod',
      desc: 'A battered escape pod from Astra-9, its hull scarred by an energy discharge unlike anything in the archive.',
      stats: { Classification: 'Escape Pod', Origin: 'Astra-9', Status: 'Derelict' },
      fact: 'The pod\u2019s log shows it launched moments after the station lost contact \u2014 but never reached open space.' },
    { id: 'strange-structure', name: 'UNKNOWN STRUCTURE', category: 'anomaly', type: 'Non-Natural Formation',
      desc: 'A geometric structure hangs motionless in the dark, its surface absorbing every scan pulse sent toward it.',
      stats: { Classification: 'Unclassified', Material: 'Unknown', Age: 'Indeterminate' },
      fact: 'Its proportions echo no known engineering \u2014 human or otherwise.' },
    { id: 'crew-log', name: 'CREW LOG FRAGMENT', category: 'anomaly', type: 'Recovered Data Buoy',
      desc: 'A drifting data buoy, its casing scorched, still broadcasting a corrupted fragment of a crew log.',
      stats: { Classification: 'Data Buoy', Integrity: '12%', Origin: 'Astra-9' },
      fact: 'The recovered fragment ends mid-sentence: \u201cIt isn\u2019t empty out here. It\u2019s watching, and it\u2019s \u2014\u201d' },
  ];
  const CH2_POSITIONS = {
    'crew-wreckage': { a: 2.75, r: 8300 },
    'strange-structure': { a: 2.95, r: 8700 },
    'crew-log': { a: 2.85, r: 8100 },
  };

  // Chapter 3 story objects — the heart of Nox.
  const CH3_OBJECTS = [
    { id: 'the-unknown', name: 'THE UNKNOWN', category: 'anomaly', type: 'Unidentified Presence',
      desc: 'Not a ship. Not a planet. Not anything the Galactic Database has a category for. It waits at the heart of Nox, and it feels aware of you.',
      stats: { Classification: '???', Composition: '???', Intent: '???' },
      fact: 'Every instrument aboard AURORA-X1 agrees on one reading only: it knows you are here.' },
  ];
  const CH3_POSITIONS = {
    'the-unknown': { a: 2.9, r: 9800 },
  };

  // Assign world coordinates + visual radius + colors. Ship starts at (0,0).
  const WORLD_RADIUS = 11000;
  function placeObjects() {
    const all = [];
    const angStep = TAU / (REAL_OBJECTS.length);
    REAL_OBJECTS.forEach((o, i) => {
      const a = i * angStep + rand(-0.15, 0.15);
      let r;
      if (o.category === 'galaxy') r = rand(5200, 8600);
      else if (o.category === 'nebula') r = rand(3600, 6200);
      else r = rand(1800, 5200);
      all.push(Object.assign({}, o, {
        worldX: Math.cos(a) * r, worldY: Math.sin(a) * r,
        radius: sizeForCategory(o.category, true),
        discovered: false,
      }));
    });

    // Fictional locations placed along a loose story path, Astra-9 further out, Nox beyond that.
    const fictionalPositions = {
      elysia: { a: 0.4, r: 1600 },
      vespera: { a: 1.3, r: 2600 },
      lunaris: { a: 2.1, r: 2100 },
      astra9: { a: 2.75, r: 5200 },
      nox: { a: 2.9, r: 7800 },
    };
    FICTIONAL_OBJECTS.forEach((o) => {
      const p = fictionalPositions[o.id];
      all.push(Object.assign({}, o, {
        worldX: Math.cos(p.a) * p.r, worldY: Math.sin(p.a) * p.r,
        radius: sizeForCategory(o.category, false),
        discovered: false,
      }));
    });

    // Unknown objects scattered nearer to the player for early discovery.
    const unknownPositions = [
      { a: 2.55, r: 3600 }, // satellite -- along the path toward Astra-9
      { a: 0.9, r: 1200 },
      { a: 4.2, r: 2400 },
      { a: 5.1, r: 1700 },
      { a: 3.3, r: 4600 },
    ];
    UNKNOWN_OBJECTS.forEach((o, i) => {
      const p = unknownPositions[i];
      all.push(Object.assign({}, o, {
        worldX: Math.cos(p.a) * p.r, worldY: Math.sin(p.a) * p.r,
        radius: sizeForCategory(o.category, false),
        discovered: false,
      }));
    });

    return all;
  }

  function sizeForCategory(cat, isReal) {
    switch (cat) {
      case 'galaxy': return rand(220, 340);
      case 'nebula': return rand(170, 260);
      case 'star': return rand(70, 110);
      case 'planet': return rand(90, 150);
      case 'moon': return rand(46, 66);
      case 'station': return 54;
      case 'anomaly': return rand(28, 40);
      default: return 60;
    }
  }

  const OBJECT_COLORS = {
    star: '#fde68a', planet: '#22d3ee', moon: '#cbd5e1',
    station: '#a78bfa', anomaly: '#f87171', galaxy: '#c4b5fd', nebula: '#67e8f9',
  };

  const WORLD_OBJECTS = placeObjects();
  // Per-object custom hues for fictional planets, for a bit more variety.
  const CUSTOM_HUES = { elysia: '#38bdf8', vespera: '#f97362', nox: '#7c3aed', lunaris: '#94a3b8', astra9: '#a78bfa' };

  // Spawns a set of story objects (chapter 2 / chapter 3) into the live world.
  function spawnObjects(list, positions) {
    list.forEach((o) => {
      const p = positions[o.id];
      WORLD_OBJECTS.push(Object.assign({}, o, {
        worldX: Math.cos(p.a) * p.r, worldY: Math.sin(p.a) * p.r,
        radius: sizeForCategory(o.category, false),
        discovered: false,
      }));
    });
    refreshDatabase();
  }

  /* ============================== 3. CANVAS / STARFIELD ============================== */
  const canvas = document.getElementById('space-canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Multi-layer parallax starfield, tiled infinitely.
  const STAR_LAYERS = [
    { count: 140, tile: 1400, parallax: 0.08, size: [0.6, 1.3], color: '150,180,220' },
    { count: 110, tile: 1800, parallax: 0.18, size: [0.8, 1.8], color: '190,220,255' },
    { count: 80, tile: 2200, parallax: 0.34, size: [1.1, 2.4], color: '220,240,255' },
  ];
  STAR_LAYERS.forEach((layer) => {
    layer.stars = [];
    for (let i = 0; i < layer.count; i++) {
      layer.stars.push({
        x: rand(0, layer.tile), y: rand(0, layer.tile),
        r: rand(layer.size[0], layer.size[1]),
        phase: rand(0, TAU), speed: rand(0.6, 1.6),
      });
    }
  });

  // A handful of nebula cloud blobs for background depth (very slow parallax).
  const NEBULA_CLOUDS = [];
  for (let i = 0; i < 7; i++) {
    NEBULA_CLOUDS.push({
      x: rand(-9000, 9000), y: rand(-9000, 9000), r: rand(900, 1800),
      color: choice(['99,102,241', '168,85,247', '34,211,238', '236,72,153']),
      parallax: 0.05,
    });
  }

  function drawStarfield(t) {
    ctx.fillStyle = '#04060d';
    ctx.fillRect(0, 0, W, H);

    // Faraway nebula clouds
    NEBULA_CLOUDS.forEach((c) => {
      const sx = W / 2 + (c.x - ship.x * c.parallax);
      const sy = H / 2 + (c.y - ship.y * c.parallax);
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, c.r);
      g.addColorStop(0, `rgba(${c.color},0.10)`);
      g.addColorStop(1, `rgba(${c.color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(sx, sy, c.r, 0, TAU); ctx.fill();
    });

    STAR_LAYERS.forEach((layer) => {
      const offX = (ship.x * layer.parallax) % layer.tile;
      const offY = (ship.y * layer.parallax) % layer.tile;
      const originX = -offX - layer.tile;
      const originY = -offY - layer.tile;
      for (let tx = 0; tx < 3; tx++) {
        for (let ty = 0; ty < 3; ty++) {
          const baseX = originX + tx * layer.tile + W / 2;
          const baseY = originY + ty * layer.tile + H / 2;
          layer.stars.forEach((s) => {
            const twinkle = 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
            ctx.globalAlpha = twinkle;
            ctx.fillStyle = `rgb(${layer.color})`;
            ctx.beginPath();
            ctx.arc(baseX + s.x, baseY + s.y, s.r, 0, TAU);
            ctx.fill();
          });
        }
      }
      ctx.globalAlpha = 1;
    });
  }

  /* ============================== 4. SHIP STATE ============================== */
  const ship = {
    x: 0, y: 0, vx: 0, vy: 0, heading: -Math.PI / 2,
    speed: 0, maxSpeed: 340, boostMaxSpeed: 620,
    accel: 240, turnRate: 2.6, drag: 0.985,
    boosting: false,
    hull: 100, shield: 100, fuel: 87, energy: 94,
    engineStatus: 'IDLE',
    thrustParticles: [],
  };

  let destination = null; // reference to a world object

  /* ============================== 5. INPUT ============================== */
  const keys = { up: false, down: false, left: false, right: false, boost: false };

  window.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
      case 'w': case 'arrowup': keys.up = true; break;
      case 's': case 'arrowdown': keys.down = true; break;
      case 'a': case 'arrowleft': keys.left = true; break;
      case 'd': case 'arrowright': keys.right = true; break;
      case ' ': keys.boost = true; e.preventDefault(); break;
      case 'e': triggerScanNearest(); break;
      case 'm': toggleRadarExpand(); break;
    }
  });
  window.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
      case 'w': case 'arrowup': keys.up = false; break;
      case 's': case 'arrowdown': keys.down = false; break;
      case 'a': case 'arrowleft': keys.left = false; break;
      case 'd': case 'arrowright': keys.right = false; break;
      case ' ': keys.boost = false; break;
    }
  });

  // Touch controls
  document.querySelectorAll('.touch-btn[data-key]').forEach((btn) => {
    const key = btn.dataset.key;
    const press = (v) => (e) => {
      e.preventDefault();
      if (key === 'scan') { if (v) triggerScanNearest(); return; }
      if (key === 'map') { if (v) toggleRadarExpand(); return; }
      if (key === 'boost') keys.boost = v;
      if (key === 'up') keys.up = v;
      if (key === 'down') keys.down = v;
      if (key === 'left') keys.left = v;
      if (key === 'right') keys.right = v;
    };
    btn.addEventListener('touchstart', press(true), { passive: false });
    btn.addEventListener('touchend', press(false), { passive: false });
    btn.addEventListener('mousedown', press(true));
    btn.addEventListener('mouseup', press(false));
    btn.addEventListener('mouseleave', press(false));
  });

  function toggleRadarExpand() {
    const wrap = document.getElementById('radar-wrap');
    wrap.classList.toggle('expanded');
    wrap.style.width = wrap.classList.contains('expanded') ? '320px' : '';
    wrap.style.height = wrap.classList.contains('expanded') ? '320px' : '';
  }

  /* Canvas click -> hit test world objects */
  canvas.addEventListener('click', (e) => {
    const mx = e.clientX, my = e.clientY;
    let closestObj = null, closestD = 26; // px hit radius padding
    WORLD_OBJECTS.forEach((o) => {
      const sx = W / 2 + (o.worldX - ship.x);
      const sy = H / 2 + (o.worldY - ship.y);
      const screenR = objectScreenRadius(o);
      const d = dist(mx, my, sx, sy) - screenR;
      if (d < closestD) { closestD = d; closestObj = o; }
    });
    if (closestObj) openObjectPanel(closestObj);
  });

  function objectScreenRadius(o) {
    const d = dist(ship.x, ship.y, o.worldX, o.worldY);
    const proximityBoost = clamp(1 - d / 2600, 0, 1);
    return o.radius * (0.55 + proximityBoost * 1.1);
  }

  /* ============================== 6. GAME LOOP ============================== */
  let lastTime = performance.now();
  let gameRunning = false;
  let scanCount = 0;

  function update(dt, t) {
    // Turning
    if (keys.left) ship.heading -= ship.turnRate * dt;
    if (keys.right) ship.heading += ship.turnRate * dt;

    // Thrust
    const boosting = keys.boost && ship.energy > 2;
    ship.boosting = boosting;
    const curMax = boosting ? ship.boostMaxSpeed : ship.maxSpeed;
    const curAccel = boosting ? ship.accel * 1.9 : ship.accel;

    let thrustDir = 0;
    if (keys.up) thrustDir = 1;
    else if (keys.down) thrustDir = -0.6;

    if (thrustDir !== 0) {
      ship.vx += Math.cos(ship.heading) * curAccel * thrustDir * dt;
      ship.vy += Math.sin(ship.heading) * curAccel * thrustDir * dt;
      ship.engineStatus = boosting ? 'BOOST' : 'THRUST';
    } else {
      ship.engineStatus = 'IDLE';
    }

    // Drag / momentum
    ship.vx *= ship.drag;
    ship.vy *= ship.drag;
    const curSpeed = Math.hypot(ship.vx, ship.vy);
    if (curSpeed > curMax) {
      const s = curMax / curSpeed;
      ship.vx *= s; ship.vy *= s;
    }
    ship.speed = Math.hypot(ship.vx, ship.vy);

    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    ship.x = clamp(ship.x, -WORLD_RADIUS, WORLD_RADIUS);
    ship.y = clamp(ship.y, -WORLD_RADIUS, WORLD_RADIUS);

    // Resource dynamics
    if (boosting) ship.energy = clamp(ship.energy - 14 * dt, 0, 100);
    else ship.energy = clamp(ship.energy + 6 * dt, 0, 100);
    if (thrustDir !== 0) ship.fuel = clamp(ship.fuel - 0.6 * dt, 0, 100);

    // Thrust particles
    if (thrustDir > 0 && Math.random() < 0.8) {
      ship.thrustParticles.push({
        x: ship.x - Math.cos(ship.heading) * 20, y: ship.y - Math.sin(ship.heading) * 20,
        vx: -Math.cos(ship.heading) * rand(60, 140) + rand(-30, 30),
        vy: -Math.sin(ship.heading) * rand(60, 140) + rand(-30, 30),
        life: 1, size: rand(2, 4.5), boost: boosting,
      });
    }
    ship.thrustParticles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.6; });
    ship.thrustParticles = ship.thrustParticles.filter((p) => p.life > 0);

    handleProximity(t);
    updateDestinationHUD();
    updateShipHUD();
  }

  function render(t) {
    drawStarfield(t);

    // Sort world objects by draw order: far categories first
    const drawOrder = ['galaxy', 'nebula', 'star', 'planet', 'moon', 'station', 'anomaly'];
    const sorted = WORLD_OBJECTS.slice().sort((a, b) => drawOrder.indexOf(a.category) - drawOrder.indexOf(b.category));
    sorted.forEach((o) => drawWorldObject(o, t));

    drawThrustParticles();
    drawShip(t);
  }

  function drawWorldObject(o, t) {
    const sx = W / 2 + (o.worldX - ship.x);
    const sy = H / 2 + (o.worldY - ship.y);
    const margin = 260;
    if (sx < -margin || sx > W + margin || sy < -margin || sy > H + margin) return;

    const r = objectScreenRadius(o);
    const color = CUSTOM_HUES[o.id] || OBJECT_COLORS[o.category] || '#67e8f9';

    ctx.save();
    ctx.translate(sx, sy);

    if (o.category === 'star') {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.4);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.25, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r * 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, TAU); ctx.fill();
    } else if (o.category === 'galaxy') {
      ctx.rotate(t * 0.00004);
      for (let arm = 0; arm < 3; arm++) {
        ctx.save();
        ctx.rotate((TAU / 3) * arm);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, 'rgba(255,255,255,0.5)');
        g.addColorStop(0.4, `${color}55`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        for (let i = 0; i < 14; i++) {
          const a = i * 0.35;
          const rr = (i / 14) * r;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * rr, Math.sin(a) * rr * 0.5, r * 0.16, r * 0.06, a, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, TAU); ctx.fill();
    } else if (o.category === 'nebula') {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + t * 0.00002;
        const bx = Math.cos(a) * r * 0.3, by = Math.sin(a) * r * 0.3;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, r * 0.7);
        g.addColorStop(0, `${color}44`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(bx, by, r * 0.7, 0, TAU); ctx.fill();
      }
    } else if (o.category === 'planet') {
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      g.addColorStop(0, lighten(color)); g.addColorStop(0.6, color); g.addColorStop(1, '#03060d');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      // atmosphere glow
      ctx.strokeStyle = `${color}66`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, TAU); ctx.stroke();
      if (o.id === 'nox') {
        // electromagnetic arcs
        ctx.strokeStyle = 'rgba(167,139,250,0.7)'; ctx.lineWidth = 1.4;
        for (let i = 0; i < 3; i++) {
          const a = t * 0.003 + i * 2;
          ctx.beginPath();
          ctx.arc(0, 0, r + 10 + i * 6, a, a + 1.1);
          ctx.stroke();
        }
      }
    } else if (o.category === 'moon') {
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      g.addColorStop(0, '#f1f5f9'); g.addColorStop(1, color);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      [[-0.3, -0.2, 0.22], [0.25, 0.3, 0.16], [0.05, -0.35, 0.12]].forEach(([cx, cy, cr]) => {
        ctx.beginPath(); ctx.arc(cx * r, cy * r, cr * r, 0, TAU); ctx.fill();
      });
    } else if (o.category === 'station') {
      ctx.strokeStyle = color; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.stroke();
      ctx.rotate(t * 0.0006);
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate((TAU / 4) * i);
        ctx.strokeRect(-r * 0.06, -r, r * 0.12, r * 0.6);
        ctx.restore();
      }
      ctx.fillStyle = `${color}33`;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, TAU); ctx.fill();
    } else { // anomaly
      const pulse = 0.7 + 0.3 * Math.sin(t * 0.004);
      ctx.strokeStyle = color; ctx.lineWidth = 1.6;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * TAU;
        const rr = r * (0.7 + 0.3 * Math.sin(a * 3 + t * 0.002));
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Label
    if (r > 8) {
      ctx.font = '11px Rajdhani, sans-serif';
      ctx.fillStyle = o.discovered ? 'rgba(103,232,249,0.85)' : 'rgba(148,163,184,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText((o.discovered ? '' : '? ') + o.name, sx, sy + r + 16);
    }
  }

  function lighten(hex) {
    // quick lighten for gradient highlight
    try {
      const n = parseInt(hex.slice(1), 16);
      let r = (n >> 16) + 60, g = ((n >> 8) & 255) + 60, b = (n & 255) + 60;
      r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255);
      return `rgb(${r},${g},${b})`;
    } catch (e) { return '#ffffff'; }
  }

  function drawThrustParticles() {
    ship.thrustParticles.forEach((p) => {
      const sx = W / 2 + (p.x - ship.x);
      const sy = H / 2 + (p.y - ship.y);
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.boost ? '#a78bfa' : '#67e8f9';
      ctx.beginPath(); ctx.arc(sx, sy, p.size, 0, TAU); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawShip(t) {
    const sx = W / 2, sy = H / 2;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ship.heading + Math.PI / 2);

    // engine glow
    const glowSize = 14 + (ship.boosting ? 16 : ship.engineStatus === 'THRUST' ? 8 : 2);
    const g = ctx.createRadialGradient(0, 20, 0, 0, 20, glowSize);
    g.addColorStop(0, ship.boosting ? 'rgba(167,139,250,0.9)' : 'rgba(34,211,238,0.85)');
    g.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 20, glowSize, 0, TAU); ctx.fill();

    // hull
    ctx.fillStyle = '#0e1730';
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(12, 16);
    ctx.lineTo(0, 9);
    ctx.lineTo(-12, 16);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = 'rgba(103,232,249,0.9)';
    ctx.beginPath(); ctx.arc(0, -4, 3, 0, TAU); ctx.fill();

    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (gameRunning) {
      update(dt, now);
      render(now);
      drawRadar();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ============================== 7. RADAR ============================== */
  const radarCanvas = document.getElementById('radar-canvas');
  const radarCtx = radarCanvas.getContext('2d');
  const RADAR_RANGE = 3200;

  function drawRadar() {
    const cx = radarCanvas.width / 2, cy = radarCanvas.height / 2, R = cx - 6;
    radarCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);

    // rings
    radarCtx.strokeStyle = 'rgba(34,211,238,0.18)';
    for (let i = 1; i <= 3; i++) {
      radarCtx.beginPath(); radarCtx.arc(cx, cy, (R / 3) * i, 0, TAU); radarCtx.stroke();
    }

    WORLD_OBJECTS.forEach((o) => {
      const dx = o.worldX - ship.x, dy = o.worldY - ship.y;
      const d = Math.hypot(dx, dy);
      if (d > RADAR_RANGE) return;
      const rr = (d / RADAR_RANGE) * R;
      const a = Math.atan2(dy, dx);
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      radarCtx.fillStyle = OBJECT_COLORS[o.category] || '#67e8f9';
      radarCtx.beginPath();
      radarCtx.arc(px, py, o.category === 'star' ? 3.2 : 2.4, 0, TAU);
      radarCtx.fill();
    });

    // player marker
    radarCtx.save();
    radarCtx.translate(cx, cy);
    radarCtx.rotate(ship.heading + Math.PI / 2);
    radarCtx.fillStyle = '#fff';
    radarCtx.beginPath();
    radarCtx.moveTo(0, -6); radarCtx.lineTo(4, 5); radarCtx.lineTo(-4, 5); radarCtx.closePath();
    radarCtx.fill();
    radarCtx.restore();
  }

  /* ============================== 8. MISSION / DISCOVERY / NARRATIVE ============================== */
  const CHAPTER_OBJECTIVES = {
    1: [
      { id: 'locate', text: 'Locate Astra-9', done: false },
      { id: 'scan', text: 'Scan the surrounding region', done: false },
      { id: 'signal', text: 'Investigate the unidentified signal', done: false },
    ],
    2: [
      { id: 'enter-nox', text: 'Enter the Nox system', done: false },
      { id: 'find-evidence', text: 'Find evidence of the crew', done: false },
      { id: 'investigate-signal', text: 'Investigate the source of the signal', done: false },
    ],
    3: [
      { id: 'go-deeper', text: 'Travel deeper into Nox', done: false },
      { id: 'find-source', text: 'Discover the true source of the signal', done: false },
      { id: 'confront', text: 'Confront the unknown', done: false },
    ],
  };
  const CHAPTER_MISSION_NAME = {
    1: 'Locate Astra-9',
    2: 'Enter the Nox System',
    3: 'Confront the Unknown',
  };
  let objectives = CHAPTER_OBJECTIVES[1];
  let currentChapter = 1;
  let pendingChapter = 2;
  const discoveryLog = [];
  const storyFlags = {
    satellite: false, vespera: false, noxWarned: false, astra9: false,
    enteredNox: false, ch2Evidence: false, ch2Signal: false,
    chapter2Complete: false, nearUnknown: false, unknownScanned: false,
  };
  let chapterComplete = false;

  function renderObjectives() {
    const list = document.getElementById('objectives-list');
    list.innerHTML = '';
    objectives.forEach((ob) => {
      const li = document.createElement('li');
      li.className = ob.done ? 'done' : 'active';
      li.innerHTML = `<span class="marker">${ob.done ? '\u2713' : '\u25CF'}</span><span>${ob.text}</span>`;
      list.appendChild(li);
    });
  }
  renderObjectives();

  function completeObjective(id) {
    const ob = objectives.find((o) => o.id === id);
    if (ob && !ob.done) { ob.done = true; renderObjectives(); notify(`OBJECTIVE COMPLETE: ${ob.text}`, 'discovery'); }
  }

  function addDiscovery(title, text) {
    discoveryLog.push({ title, text });
    const list = document.getElementById('discovery-list');
    if (discoveryLog.length === 1) list.innerHTML = '';
    const li = document.createElement('li');
    li.innerHTML = `<strong>DISCOVERY ${String(discoveryLog.length).padStart(2, '0')}</strong><br>${title}`;
    list.appendChild(li);
    notify(`DISCOVERY LOGGED: ${title}`, 'discovery');
  }

  function handleProximity(t) {
    // Nox instability
    const noxObj = WORLD_OBJECTS.find((o) => o.id === 'nox');
    if (noxObj) {
      const d = dist(ship.x, ship.y, noxObj.worldX, noxObj.worldY);
      const overlay = document.getElementById('warning-overlay');
      const signalEl = document.getElementById('signal-status');
      const commEl = document.getElementById('comm-status');
      if (d < 2600) {
        signalEl.textContent = 'SIGNAL: DEGRADED'; signalEl.classList.add('degraded');
        commEl.textContent = 'COMMUNICATION SIGNAL DEGRADED';
        ship.shield = clamp(ship.shield - 4 * (1 / 60), 40, 100);
        if (d < 1600) overlay.classList.remove('hidden'); else overlay.classList.add('hidden');
        if (!storyFlags.noxWarned) {
          storyFlags.noxWarned = true;
          transmit('WARNING SYSTEM', 'UNKNOWN SIGNAL DETECTED');
          setTimeout(() => transmit('NAVIGATION', 'WARNING \u2014 NAVIGATION SYSTEM INSTABILITY'), 2400);
          addDiscovery('UNKNOWN SIGNAL', 'The radar begins malfunctioning as Nox looms closer.');
          completeObjective('signal');
        }
        if (currentChapter === 2 && !storyFlags.enteredNox) {
          storyFlags.enteredNox = true;
          completeObjective('enter-nox');
          addDiscovery('NOX SYSTEM', 'AURORA-X1 crosses into the Nox system. Sensors flicker with static.');
          checkChapter2Complete();
        }
      } else {
        overlay.classList.add('hidden');
        signalEl.textContent = 'SIGNAL: NOMINAL'; signalEl.classList.remove('degraded');
        commEl.textContent = 'EARTH LINK STABLE';
      }
    }

    // Astra-9 arrival
    const astra = WORLD_OBJECTS.find((o) => o.id === 'astra9');
    if (astra && !storyFlags.astra9) {
      const d = dist(ship.x, ship.y, astra.worldX, astra.worldY);
      if (d < astra.radius + 260) {
        completeObjective('locate');
      }
    }

    // Chapter 3: approaching the unknown
    if (currentChapter === 3 && !storyFlags.nearUnknown) {
      const unk = WORLD_OBJECTS.find((o) => o.id === 'the-unknown');
      if (unk) {
        const du = dist(ship.x, ship.y, unk.worldX, unk.worldY);
        if (du < unk.radius + 300) {
          storyFlags.nearUnknown = true;
          completeObjective('go-deeper');
        }
      }
    }

    // proximity prompt for nearest interactable object
    let nearest = null, nearestD = Infinity;
    WORLD_OBJECTS.forEach((o) => {
      const d = dist(ship.x, ship.y, o.worldX, o.worldY) - o.radius;
      if (d < nearestD) { nearestD = d; nearest = o; }
    });
    const prompt = document.getElementById('proximity-prompt');
    if (nearest && nearestD < 220) {
      prompt.classList.remove('hidden');
      document.getElementById('proximity-name').textContent = nearest.discovered ? nearest.name : '??? UNKNOWN OBJECT';
      window.__nearestObject = nearest;
    } else {
      prompt.classList.add('hidden');
      window.__nearestObject = null;
    }
  }

  function triggerScanNearest() {
    if (window.__nearestObject) {
      openObjectPanel(window.__nearestObject);
      setTimeout(() => performScan(window.__nearestObject), 250);
    } else {
      notify('NO OBJECT IN SCAN RANGE', 'warning');
    }
  }

  function performScan(o) {
    const readout = document.getElementById('scan-readout');
    readout.classList.remove('hidden');
    playBlip('scan');
    const lines = ['SCANNING...', 'ANALYZING SIGNAL...', 'READING SPECTRUM...'];
    let i = 0;
    readout.textContent = '';
    const iv = setInterval(() => {
      readout.textContent += (i > 0 ? '\n' : '') + lines[i];
      i++;
      if (i >= lines.length) {
        clearInterval(iv);
        finishScan(o, readout);
      }
    }, 420);
  }

  function finishScan(o, readout) {
    const wasDiscovered = o.discovered;
    o.discovered = true;
    readout.textContent += `\n> ${o.name} — IDENTIFICATION COMPLETE`;
    document.getElementById('object-name').textContent = o.name;
    document.getElementById('object-fact').textContent = o.fact;

    if (!wasDiscovered) {
      scanCount++;
      if (scanCount >= 3) completeObjective('scan');
      notify(`SCAN COMPLETE: ${o.name}`, 'discovery');
    }

    // Story hooks tied to specific unknown / fictional objects
    if (o.id === 'satellite' && !storyFlags.satellite) {
      storyFlags.satellite = true;
      readout.textContent += '\n\n"This signal is coming from Astra-9... but the station is 14 million kilometers away."';
      addDiscovery('UNKNOWN SATELLITE', 'The signal traces back to Astra-9, still 14 million kilometers distant.');
    }
    if (o.id === 'vespera' && !storyFlags.vespera) {
      storyFlags.vespera = true;
      readout.textContent += '\n\nANOMALOUS ENERGY SIGNATURE DETECTED.';
      addDiscovery('VESPERA ANOMALY', 'Unusual energy readings pulse from beneath the volcanic crust.');
    }
    if (o.id === 'astra9' && !storyFlags.astra9) {
      storyFlags.astra9 = true;
      readout.textContent += '\n\nSTATION APPEARS ABANDONED. NO LIFE SIGNS DETECTED.';
      addDiscovery('ASTRA-9', 'The station drifts silent and dark. No crew. No answers. Only static.');
      setTimeout(() => {
        transmit('PRIORITY TRANSMISSION', '"AURORA-X1... if you can hear this... DO NOT APPROACH NOX."');
        document.getElementById('comm-status').textContent = 'PRIORITY TRANSMISSION RECEIVED';
      }, 800);
      setTimeout(() => triggerChapterComplete(), 4200);
    }

    // Chapter 2 story hooks
    if (currentChapter === 2 && ['crew-wreckage', 'strange-structure', 'crew-log'].includes(o.id)) {
      if (!storyFlags.ch2Evidence) {
        storyFlags.ch2Evidence = true;
        completeObjective('find-evidence');
        addDiscovery('CREW EVIDENCE', 'Wreckage and data fragments confirm the Astra-9 crew encountered something out here.');
      }
      if (o.id === 'crew-log' && !storyFlags.ch2Signal) {
        storyFlags.ch2Signal = true;
        completeObjective('investigate-signal');
        readout.textContent += '\n\n"...it isn\'t empty out here. it\'s watching, and it\'s \u2014"';
        setTimeout(() => transmit('DISTORTED TRANSMISSION', '"...it knows you are here..."'), 1000);
      }
      checkChapter2Complete();
    }

    // Chapter 3 story hook — the unknown
    if (o.id === 'the-unknown' && !storyFlags.unknownScanned) {
      storyFlags.unknownScanned = true;
      completeObjective('find-source');
      readout.textContent += '\n\nUNABLE TO CLASSIFY. INSTRUMENT READINGS CONTRADICT THEMSELVES.';
      addDiscovery('THE UNKNOWN', 'Whatever waits at the heart of Nox defies every instrument aboard.');
      setTimeout(() => openChoicePanel(), 2600);
    }

    refreshDatabase();
  }

  function triggerChapterComplete() {
    if (chapterComplete) return;
    chapterComplete = true;
    gameRunning = false;
    document.getElementById('object-panel').classList.add('hidden');
    pendingChapter = 2;
    document.getElementById('chapter-label').textContent = 'CHAPTER 01 COMPLETE';
    document.getElementById('chapter-title').textContent = 'THE SIGNAL';
    document.getElementById('chapter-screen').classList.remove('hidden');
  }

  function checkChapter2Complete() {
    if (storyFlags.ch2Evidence && storyFlags.ch2Signal && storyFlags.enteredNox) {
      setTimeout(() => triggerChapter2Complete(), 3000);
    }
  }

  function triggerChapter2Complete() {
    if (storyFlags.chapter2Complete) return;
    storyFlags.chapter2Complete = true;
    gameRunning = false;
    document.getElementById('object-panel').classList.add('hidden');
    pendingChapter = 3;
    document.getElementById('chapter-label').textContent = 'CHAPTER 02 COMPLETE';
    document.getElementById('chapter-title').textContent = 'INTO NOX';
    document.getElementById('chapter-screen').classList.remove('hidden');
  }

  function startChapter(n) {
    currentChapter = n;
    objectives = CHAPTER_OBJECTIVES[n].map((o) => Object.assign({}, o));
    renderObjectives();
    document.getElementById('mission-name').textContent = CHAPTER_MISSION_NAME[n];
    document.getElementById('chapter-tag').textContent = 'CHAPTER ' + String(n).padStart(2, '0');
    gameRunning = true;
    if (n === 2) {
      spawnObjects(CH2_OBJECTS, CH2_POSITIONS);
      notify('ENTERING NOX SYSTEM \u2014 PROCEED WITH CAUTION', 'warning');
    } else if (n === 3) {
      spawnObjects(CH3_OBJECTS, CH3_POSITIONS);
      notify('PRESSING DEEPER INTO NOX', 'warning');
    }
  }

  document.getElementById('continue-btn').addEventListener('click', () => {
    document.getElementById('chapter-screen').classList.add('hidden');
    startChapter(pendingChapter);
  });

  /* ---- Final choice (Chapter 3 ending) ---- */
  function openChoicePanel() {
    document.getElementById('object-panel').classList.add('hidden');
    document.getElementById('choice-title').textContent = 'THE UNKNOWN';
    document.getElementById('choice-description').textContent =
      'AURORA-X1 hangs before something that shouldn\u2019t exist. Every system strains under its presence. A choice must be made.';
    document.getElementById('choice-panel').classList.remove('hidden');
  }

  const ENDINGS = {
    escape: {
      label: 'ENDING \u2014 ESCAPE',
      title: 'A QUIET RETREAT',
      text: 'AURORA-X1 pulls away from Nox, engines burning hard against the dark. Whatever waits there stays behind \u2014 unknown, unrecorded, unresolved. Earth receives only a final, shaking transmission: "Do not send anyone else." The system falls silent again, and some questions are left for another ship, another crew, another day.',
    },
    investigate: {
      label: 'ENDING \u2014 INVESTIGATE',
      title: 'INTO THE DEEP',
      text: 'AURORA-X1 holds position and opens every channel it has. The Unknown answers \u2014 not in words, but in a slow unfolding of light and static that reshapes everything the crew thought they understood about the galaxy. Contact is not lost. It simply changes. AURORA-X1 does not return to Earth. It does not need to.',
    },
    transmit: {
      label: 'ENDING \u2014 TRANSMIT',
      title: 'THE SIGNAL SENT HOME',
      text: 'Every scan, every reading, every trace of the Unknown streams back across the void to Earth. AURORA-X1 becomes a beacon, not an explorer \u2014 broadcasting proof of something vast and unclassified into humanity\u2019s hands. Earth falls silent for a long moment before responding: "We\u2019re coming. Hold your position." The discovery of a lifetime begins with someone else\u2019s arrival.',
    },
  };

  function triggerEnding(choiceKey) {
    gameRunning = false;
    const e = ENDINGS[choiceKey] || ENDINGS.escape;
    document.getElementById('ending-label').textContent = e.label;
    document.getElementById('ending-title').textContent = e.title;
    document.getElementById('ending-text').textContent = e.text;
    document.getElementById('ending-screen').classList.remove('hidden');
  }

  document.querySelectorAll('.choice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const choiceKey = btn.dataset.choice;
      completeObjective('confront');
      document.getElementById('choice-panel').classList.add('hidden');
      setTimeout(() => triggerEnding(choiceKey), 700);
    });
  });

  document.getElementById('restart-btn').addEventListener('click', () => {
    location.reload();
  });

  /* ============================== 9. OBJECT PANEL + DATABASE ============================== */
  const objectPanel = document.getElementById('object-panel');
  let activeObject = null;

  function openObjectPanel(o) {
    activeObject = o;
    document.getElementById('object-type').textContent = o.type.toUpperCase();
    document.getElementById('object-name').textContent = o.discovered ? o.name : '??? UNKNOWN OBJECT';
    document.getElementById('object-description').textContent = o.discovered ? o.desc : 'Object not yet identified. Run a scan to reveal detailed information.';
    const statsWrap = document.getElementById('object-stats');
    statsWrap.innerHTML = '';
    if (o.discovered) {
      Object.entries(o.stats).forEach(([k, v]) => {
        const div = document.createElement('div');
        div.className = 'object-stat';
        div.innerHTML = `<span>${k.toUpperCase()}</span><strong>${v}</strong>`;
        statsWrap.appendChild(div);
      });
    }
    document.getElementById('object-fact').textContent = o.discovered ? o.fact : '';
    document.getElementById('scan-readout').classList.add('hidden');
    document.getElementById('scan-readout').textContent = '';
    objectPanel.classList.remove('hidden');
    playBlip('ui');
  }

  document.getElementById('object-close-btn').addEventListener('click', () => objectPanel.classList.add('hidden'));
  document.getElementById('object-scan-btn').addEventListener('click', () => { if (activeObject) performScan(activeObject); });
  document.getElementById('object-travel-btn').addEventListener('click', () => {
    if (!activeObject) return;
    destination = activeObject;
    notify(`DESTINATION SET: ${activeObject.name}`, 'discovery');
    objectPanel.classList.add('hidden');
  });

  function updateDestinationHUD() {
    const destEl = document.getElementById('nav-destination');
    const distEl = document.getElementById('nav-distance');
    const arrowEl = document.getElementById('nav-arrow');
    const bottomName = document.getElementById('dest-name-val');
    const bottomDist = document.getElementById('dest-dist-val');
    if (!destination) {
      destEl.textContent = 'NONE SELECTED'; distEl.textContent = '\u2014';
      bottomName.textContent = '\u2014'; bottomDist.textContent = '\u2014';
      arrowEl.style.transform = 'rotate(0deg)';
      return;
    }
    const dx = destination.worldX - ship.x, dy = destination.worldY - ship.y;
    const d = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx) - ship.heading - Math.PI / 2;
    destEl.textContent = destination.name;
    distEl.textContent = formatDistance(d);
    bottomName.textContent = destination.name;
    bottomDist.textContent = formatDistance(d);
    arrowEl.style.transform = `rotate(${a}rad)`;
  }

  function updateShipHUD() {
    document.getElementById('hull-fill').style.width = ship.hull + '%';
    document.getElementById('hull-val').textContent = Math.round(ship.hull) + '%';
    document.getElementById('shield-fill').style.width = ship.shield + '%';
    document.getElementById('shield-val').textContent = Math.round(ship.shield) + '%';
    document.getElementById('fuel-fill').style.width = ship.fuel + '%';
    document.getElementById('fuel-val').textContent = Math.round(ship.fuel) + '%';
    document.getElementById('energy-fill').style.width = ship.energy + '%';
    document.getElementById('energy-val').textContent = Math.round(ship.energy) + '%';
    document.getElementById('engine-status').textContent = ship.engineStatus;
    document.getElementById('speed-val').textContent = String(Math.round(ship.speed)).padStart(3, '0');
    document.getElementById('nav-coords').textContent = `${Math.round(ship.x)}, ${Math.round(ship.y)}`;
  }

  // Galactic Database
  const DB_CATEGORIES = ['star', 'galaxy', 'nebula', 'planet', 'moon', 'anomaly', 'station'];
  const DB_LABELS = { star: 'STARS', galaxy: 'GALAXIES', nebula: 'NEBULAE', planet: 'PLANETS', moon: 'MOONS', anomaly: 'ANOMALIES', station: 'STATIONS' };
  let activeDbTab = 'star';

  function refreshDatabase() {
    const tabsWrap = document.getElementById('database-tabs');
    tabsWrap.innerHTML = '';
    DB_CATEGORIES.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'db-tab' + (cat === activeDbTab ? ' active' : '');
      btn.textContent = DB_LABELS[cat];
      btn.addEventListener('click', () => { activeDbTab = cat; refreshDatabase(); });
      tabsWrap.appendChild(btn);
    });
    const entriesWrap = document.getElementById('database-entries');
    entriesWrap.innerHTML = '';
    const items = WORLD_OBJECTS.filter((o) => o.category === activeDbTab);
    if (!items.length) {
      entriesWrap.innerHTML = '<p style="color:var(--muted); font-size:12px;">No entries in this category.</p>';
      return;
    }
    items.forEach((o) => {
      const div = document.createElement('div');
      div.className = 'db-entry' + (o.discovered ? ' discovered' : '');
      div.innerHTML = `<span>${o.discovered ? o.name : 'UNKNOWN OBJECT'}</span><span class="${o.discovered ? 'status-found' : 'status-unknown'}">${o.discovered ? '\u2713 DISCOVERED' : 'LOCKED'}</span>`;
      if (o.discovered) div.addEventListener('click', () => openObjectPanel(o));
      entriesWrap.appendChild(div);
    });
  }
  refreshDatabase();

  document.getElementById('db-toggle-btn').addEventListener('click', () => {
    refreshDatabase();
    document.getElementById('database-panel').classList.remove('hidden');
  });
  document.getElementById('db-close-btn').addEventListener('click', () => document.getElementById('database-panel').classList.add('hidden'));

  // Mobile: collapsible side panels
  document.querySelectorAll('.panel-collapse-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.target).classList.toggle('collapsed');
    });
  });
  if (window.innerWidth <= 640) {
    document.getElementById('mission-panel').classList.add('collapsed');
    document.getElementById('right-panel').classList.add('collapsed');
  }

  /* ============================== 10. NOTIFICATIONS / TRANSMISSIONS ============================== */
  function notify(text, type) {
    const stack = document.getElementById('notification-stack');
    const div = document.createElement('div');
    div.className = 'notification' + (type ? ' ' + type : '');
    div.textContent = text;
    stack.appendChild(div);
    setTimeout(() => div.remove(), 4200);
  }

  function transmit(label, text) {
    const banner = document.getElementById('transmission-banner');
    document.getElementById('transmission-label').textContent = label;
    document.getElementById('transmission-text').textContent = text;
    banner.classList.remove('hidden');
    playBlip('warn');
    setTimeout(() => banner.classList.add('hidden'), 4600);
  }

  /* ============================== 11. AUDIO (no autoplay) ============================== */
  let audioCtx = null, ambientGain = null, soundOn = false;

  function initAudio() {
    if (audioCtx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();
    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.0;
    ambientGain.connect(audioCtx.destination);

    const osc = audioCtx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 52;
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine'; osc2.frequency.value = 78;
    const lfo = audioCtx.createGain(); lfo.gain.value = 0.5;
    osc.connect(lfo); osc2.connect(lfo); lfo.connect(ambientGain);
    osc.start(); osc2.start();
  }

  function playBlip(kind) {
    if (!soundOn || !audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    const freqs = { ui: 620, scan: 340, warn: 200 };
    o.type = kind === 'warn' ? 'sawtooth' : 'sine';
    o.frequency.value = freqs[kind] || 440;
    g.gain.setValueAtTime(0.06, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
    o.start(); o.stop(audioCtx.currentTime + 0.36);
  }

  document.getElementById('sound-toggle-btn').addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn) {
      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      ambientGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 1.2);
    } else if (ambientGain) {
      ambientGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.4);
    }
    document.getElementById('sound-toggle-btn').textContent = soundOn ? '\uD83D\uDD0A SOUND: ON' : '\uD83D\uDD07 SOUND: OFF';
  });

  /* ============================== 12. BOOTSTRAP / INTRO ============================== */
  document.getElementById('begin-mission-btn').addEventListener('click', () => {
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('hud-root').classList.remove('hidden');
    gameRunning = true;
    notify('AURORA-X1 SYSTEMS ONLINE', 'discovery');
  });

})();
