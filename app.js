(function () {
  "use strict";

  var tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if (tg) {
    tg.ready();
    tg.expand();
    try { tg.setHeaderColor("#f3efe9"); tg.setBackgroundColor("#f3efe9"); } catch (e) {}
  }

  var state = {
    occasion: "",
    mode: "",
    selectedLook: ""
  };

  var occasionLabels = {
    practice: "Практика / урок",
    milonga: "Милонга",
    marathon: "Марафон / поездка",
    performance: "Подготовка к выступлению"
  };

  var modeLabels = {
    whole: "цельный образ",
    mix: "вариативная капсула",
    both: "разные форматы"
  };

  var looks = [
    {
      id: "lilian",
      name: "Лилиан",
      kind: "Платье",
      image: "assets/images/lilian-navy-pose.jpg",
      video: "https://t.me/rmdress/6356",
      description: "Спущенное плечо, длинный рукав «Фонарик», телесная вставка и юбка пти-годе. Цельный силуэт, который раскрывается в движении.",
      scores: { practice: 3, milonga: 5, marathon: 3, performance: 4 },
      modes: { whole: 4, mix: 0, both: 2 },
      reasons: {
        practice: ["цельный образ без необходимости собирать комплект", "юбка пти-годе даёт выразительную линию движения"],
        milonga: ["цельный образ для вечера", "пти-годе раскрывается именно в движении"],
        marathon: ["одна вещь решает образ целиком", "удобно, если не хочется каждый раз собирать сочетание"],
        performance: ["полноценная форма платья помогает работать с пластикой", "точное сходство с вашим сценическим платьем нужно обсудить с LILIAN"]
      }
    },
    {
      id: "cape",
      name: "С кейп-рукавом",
      kind: "Платье",
      image: "assets/images/cape-motion.jpg",
      video: "https://t.me/rmdress/6310",
      description: "Лодочка, глубокий V-вырез на спине, кейп-рукав и юбка «ласточкин хвост». Более открытый и драматичный цельный образ.",
      scores: { practice: 2, milonga: 5, marathon: 2, performance: 5 },
      modes: { whole: 4, mix: 0, both: 2 },
      reasons: {
        practice: ["кейс для тех, кому важен выразительный рукав", "открытая спина делает образ менее нейтральным для обычной тренировки"],
        milonga: ["кейп-рукав заметно работает в движении", "глубокий V-вырез даёт более открытый характер образа"],
        marathon: ["может стать выразительным вечерним выходом внутри поездки", "для капсулы из нескольких дней менее вариативно, чем раздельные вещи"],
        performance: ["рукав и линия спины заметно меняют пластику образа", "для тренировочной связи со сценическим платьем нужен человеческий подбор"]
      }
    },
    {
      id: "set",
      name: "Топ + «Ласточкин хвост»",
      kind: "Комплект",
      image: "assets/images/fig-wine-front.jpg",
      video: "https://t.me/rmdress/6363",
      description: "Две самостоятельные вещи: топ с рукавом «Фонарик» и юбка «ласточкин хвост». Верх и низ можно выбирать и заказывать отдельно.",
      scores: { practice: 5, milonga: 4, marathon: 6, performance: 3 },
      modes: { whole: 0, mix: 5, both: 3 },
      reasons: {
        practice: ["верх и низ можно менять независимо", "размер для каждой вещи выбирается отдельно"],
        milonga: ["готовый образ остаётся разборным", "можно позже докупить новую часть к уже имеющейся"],
        marathon: ["самый вариативный вариант из текущей подборки", "две самостоятельные вещи дают больше сочетаний в поездке"],
        performance: ["может быть частью тренировочной капсулы", "если нужно повторить логику конкретного сценического костюма, сначала покажите его команде LILIAN"]
      }
    }
  ];

  var screens = Array.prototype.slice.call(document.querySelectorAll("[data-screen]"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".progress__dot"));
  var resultList = document.querySelector("#result-list");
  var resultTitle = document.querySelector("#result-title");
  var resultContext = document.querySelector("#result-context");
  var contactButton = document.querySelector("#contact-button");

  function screenStep(name) {
    if (name === "intro") return 0;
    if (name === "occasion" || name === "mode") return 1;
    return 2;
  }

  function showScreen(name) {
    screens.forEach(function (screen) {
      screen.classList.toggle("is-active", screen.getAttribute("data-screen") === name);
    });
    dots.forEach(function (dot, index) {
      dot.classList.toggle("is-active", index <= screenStep(name));
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (tg && tg.HapticFeedback) {
      try { tg.HapticFeedback.selectionChanged(); } catch (e) {}
    }
  }

  function scoreLook(look) {
    var occasionScore = look.scores[state.occasion] || 0;
    var modeScore = look.modes[state.mode] || 0;
    return occasionScore + modeScore;
  }

  function recommendations() {
    return looks.slice().sort(function (a, b) {
      return scoreLook(b) - scoreLook(a);
    });
  }

  function contextText() {
    if (state.occasion === "practice") {
      return "Для регулярной работы одежда должна помогать двигаться и не становиться отдельной задачей.";
    }
    if (state.occasion === "milonga") {
      return "Для милонги мы показываем разную степень цельности и выразительности — окончательная мера остаётся за тобой.";
    }
    if (state.occasion === "marathon") {
      return "В поездке особенно ценна вариативность: меньше вещей, больше реально работающих сочетаний.";
    }
    return "Для подготовки к выступлению миниапп не угадывает сценический образ. Он даёт отправные точки, а точную тренировочную форму лучше связать с вашим платьем вместе с LILIAN.";
  }

  function cardTemplate(look, index) {
    var selected = state.selectedLook === look.id;
    var reasons = look.reasons[state.occasion] || [];
    var rank = index === 0 ? "Первый вариант" : "Ещё вариант";
    return [
      '<article class="look-card' + (index === 0 ? " is-primary" : "") + '">',
      '  <div class="look-card__media">',
      '    <img src="' + look.image + '" alt="' + look.name + '">',
      '    <span class="look-card__rank">' + rank + '</span>',
      '  </div>',
      '  <div class="look-card__body">',
      '    <div class="look-card__kicker">' + look.kind + '</div>',
      '    <div class="look-card__title">' + look.name + '</div>',
      '    <p class="look-card__desc">' + look.description + '</p>',
      '    <ul class="look-card__reasons">',
      reasons.map(function (reason) { return "<li>" + reason + "</li>"; }).join(""),
      '    </ul>',
      '    <p class="look-card__desc"><a href="' + look.video + '" target="_blank" rel="noopener">Посмотреть видео модели в канале ↗</a></p>',
      '    <button class="look-card__select' + (selected ? " is-selected" : "") + '" type="button" data-select-look="' + look.id + '">',
      selected ? "Выбрано для разговора" : "Выбрать для разговора",
      '    </button>',
      '  </div>',
      '</article>'
    ].join("\n");
  }

  function renderResults() {
    var ranked = recommendations();
    if (!state.selectedLook || !ranked.some(function (look) { return look.id === state.selectedLook; })) {
      state.selectedLook = ranked[0].id;
    }
    resultTitle.textContent = "Три варианта";
    resultContext.textContent = occasionLabels[state.occasion] + ". " + contextText() + " Формат выбора: " + modeLabels[state.mode] + ".";
    resultList.innerHTML = ranked.map(cardTemplate).join("");
  }

  function selectedLook() {
    return looks.find(function (look) { return look.id === state.selectedLook; }) || recommendations()[0];
  }

  function buildMessage() {
    var look = selectedLook();
    var size = document.querySelector("#brief-size").value;
    var height = document.querySelector("#brief-height").value.trim();
    var note = document.querySelector("#brief-note").value.trim();
    var lines = [
      "Здравствуйте! Я собрала вариант в миниаппе LILIAN.",
      "",
      "Ситуация: " + occasionLabels[state.occasion] + ".",
      "Выбрала: " + look.kind + " — " + look.name + ".",
      "Формат: " + modeLabels[state.mode] + "."
    ];
    if (size) lines.push("Размер: " + size + ".");
    if (height) lines.push("Рост: " + height + " см.");
    if (note) lines.push("Хочу уточнить: " + note);
    lines.push("", "Помогите, пожалуйста, проверить посадку, актуальные варианты, цену и срок.");
    return lines.join("\n");
  }

  function openContact() {
    var message = buildMessage();
    var url = "https://t.me/rubiamorenadress?text=" + encodeURIComponent(message);

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(message).catch(function () {});
    }

    if (tg && typeof tg.openTelegramLink === "function") {
      tg.openTelegramLink(url);
    } else {
      window.open(url, "_blank", "noopener");
    }
  }

  document.addEventListener("click", function (event) {
    var go = event.target.closest("[data-go]");
    if (go) {
      showScreen(go.getAttribute("data-go"));
      return;
    }

    var occasion = event.target.closest("[data-occasion]");
    if (occasion) {
      state.occasion = occasion.getAttribute("data-occasion");
      showScreen("mode");
      return;
    }

    var mode = event.target.closest("[data-mode]");
    if (mode) {
      state.mode = mode.getAttribute("data-mode");
      state.selectedLook = "";
      renderResults();
      showScreen("results");
      return;
    }

    var select = event.target.closest("[data-select-look]");
    if (select) {
      state.selectedLook = select.getAttribute("data-select-look");
      renderResults();
      return;
    }

    if (event.target.closest("[data-restart]")) {
      state = { occasion: "", mode: "", selectedLook: "" };
      showScreen("occasion");
    }
  });

  contactButton.addEventListener("click", openContact);

  var demo = new URLSearchParams(window.location.search);
  var demoOccasion = demo.get("occasion");
  var demoMode = demo.get("mode");
  if (demo.get("inspect") === "1") {
    document.body.setAttribute("data-viewport", window.innerWidth + ":" + document.documentElement.scrollWidth);
  }
  if (occasionLabels[demoOccasion] && modeLabels[demoMode]) {
    state.occasion = demoOccasion;
    state.mode = demoMode;
    renderResults();
    showScreen("results");
  } else {
    showScreen("intro");
  }
})();