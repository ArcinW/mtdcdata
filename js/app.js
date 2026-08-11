(function () {
  const data = window.reportData;

  const byId = (id) => document.getElementById(id);

  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const configureVrLinks = () => {
    byId("nav-vr-link").href = data.restaurant.vrUrl;
    byId("vr-link").href = data.restaurant.vrUrl;
    byId("vr-frame").src = data.restaurant.vrUrl;
  };

  const setupTopbarScroll = () => {
    const topbar = document.querySelector(".topbar");
    const update = () => {
      topbar.classList.toggle("topbar--scrolled", window.scrollY > 24);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
  };

  const setupMobileNav = () => {
    const topbar = document.querySelector(".topbar");
    const toggle = document.querySelector(".nav-toggle");
    const panel = document.querySelector(".nav-panel");
    if (!toggle || !panel) return;

    const setOpen = (isOpen) => {
      topbar.classList.toggle("topbar--open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "关闭导航菜单" : "打开导航菜单");
    };

    toggle.addEventListener("click", () => {
      setOpen(!topbar.classList.contains("topbar--open"));
    });

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });
  };

  const renderMetrics = () => {
    byId("vr-restaurant-name").textContent = data.restaurant.name;

    const metrics = byId("top-metrics");
    const heroMetrics = [
      ...data.topMetrics,
      { label: "特色服务", value: `${data.featureServices.length}项` },
      { label: "包间设施", value: `${data.roomFacilities.length}项` }
    ];

    heroMetrics.forEach((item) => {
      const card = create("article", "metric-card");
      card.append(create("span", "label", item.label));
      card.append(create("strong", "", item.value));
      metrics.append(card);
    });
  };

  const renderBasicInfo = () => {
    const target = byId("basic-info");
    const facts = create("div", "basic-facts");
    [
      { label: "餐厅名称", value: data.restaurant.name },
      { label: "采集面积", value: data.restaurant.collectionArea }
    ].forEach((item) => {
      const card = create("article", "basic-fact");
      card.append(create("span", "label", item.label));
      card.append(create("strong", "", item.value));
      facts.append(card);
    });
    target.append(facts);

    const layout = create("div", "comparison-list");
    data.basicInfo.forEach((category) => {
      const row = create("article", "comparison-row");
      row.append(create("h3", "", category.group));
      const columns = create("div", "comparison-columns");

      [
        { title: "已提供", status: "available" },
        { title: "暂未提供", status: "pending" }
      ].forEach((group) => {
        const cell = create("div", `comparison-cell comparison-cell--${group.status}`);
        cell.append(create("h4", "", group.title));
        const list = create("div", "facility-list");
        const items = category.items.filter((item) => item.status === group.status);

        if (items.length) {
          items.forEach((item) => {
            const chip = create("span", `facility-chip facility-chip--${item.status}`, item.name);
            if (item.note) chip.title = item.note;
            list.append(chip);
          });
        } else {
          list.append(create("span", "facility-empty", "暂无"));
        }

        cell.append(list);
        columns.append(cell);
      });

      row.append(columns);
      layout.append(row);
    });
    target.append(layout);
  };

  const renderRoomSummary = () => {
    const target = byId("room-summary");
    const paired = create("div", "summary-pair");
    data.roomDetail.summary.slice(0, 2).forEach((item) => {
      paired.append(renderSummaryItem(item));
    });
    target.append(paired);

    data.roomDetail.summary.slice(2).forEach((item) => {
      target.append(renderSummaryItem(item));
    });
  };

  const renderSummaryItem = (item) => {
    const row = create("div", "summary-item");
    row.append(create("span", "label", item.label));
    row.append(create("strong", "", item.value));
    return row;
  };

  const updateScrollFade = (element) => {
    const hasOverflow = element.scrollWidth > element.clientWidth + 1;
    const canScrollLeft = hasOverflow && element.scrollLeft > 1;
    const canScrollRight = hasOverflow && element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
    element.classList.toggle("scroll-fade--left", canScrollLeft);
    element.classList.toggle("scroll-fade--right", canScrollRight);
  };

  const refreshScrollFades = () => {
    document.querySelectorAll(".room-tabs, .room-tags--overlay").forEach((element) => {
      if (!element.dataset.scrollFadeBound) {
        element.addEventListener("scroll", () => updateScrollFade(element), { passive: true });
        element.dataset.scrollFadeBound = "true";
      }
      updateScrollFade(element);
    });
  };

  const renderRoomCards = () => {
    const target = byId("room-cards");
    const categories = ["全部", "2-4人", "4-6人", "6-8人", "8-10人"];
    const tabs = create("div", "room-tabs");
    const grid = create("div", "room-grid");

    const renderCategory = (category) => {
      grid.innerHTML = "";
      const rooms = category === "全部"
        ? data.roomDetail.rooms
        : data.roomDetail.rooms.filter((room) => room.people === category);
      rooms.forEach((room) => grid.append(renderRoomCard(room)));
      requestAnimationFrame(refreshScrollFades);
    };

    categories.forEach((category, index) => {
      const button = create("button", "room-tab", category);
      button.type = "button";
      button.setAttribute("aria-pressed", String(index === 0));
      button.addEventListener("click", () => {
        tabs.querySelectorAll(".room-tab").forEach((tab) => {
          tab.setAttribute("aria-pressed", String(tab === button));
        });
        renderCategory(category);
      });
      tabs.append(button);
    });

    target.append(tabs);
    target.append(grid);
    renderCategory(categories[0]);
  };

  const renderRoomCard = (room) => {
    const card = create("article", "room-card");
    const media = create("div", "room-card__media");
    const img = create("img");
    img.src = room.cover;
    img.alt = `${room.name}封面`;
    media.append(img);
    const meta = create("div", "room-card__meta");
    meta.append(create("span", "", room.people));
    meta.append(create("span", "", `约${room.area}`));
    media.append(meta);

    const tags = create("div", "room-tags room-tags--overlay");
    room.facilities.forEach((item) => tags.append(create("span", "", item)));
    media.append(tags);

    const body = create("div", "room-card__body");
    const cardMain = create("div", "room-card__main");
    cardMain.append(create("h3", "room-card__name", room.name));
    const link = create("a", "text-button", "查看VR");
    link.href = room.vrUrl;
    link.target = "_blank";
    link.rel = "noopener";
    cardMain.append(link);
    body.append(cardMain);

    card.append(media);
    card.append(body);
    return card;
  };

  const renderAssets = () => {
    const target = byId("asset-list");
    data.assets.forEach((asset, index) => {
      const card = create("article", "asset-card");
      if (asset.image) {
        const img = create("img", "asset-card__image");
        img.src = asset.image;
        img.alt = `${asset.title}预览`;
        card.append(img);
      }
      const body = create("div", "asset-card__body");
      body.append(create("span", "asset-card__index", String(index + 1).padStart(2, "0")));
      body.append(create("h3", "", asset.title));
      body.append(create("p", "", asset.description));
      body.append(create("small", "", asset.status));
      card.append(body);
      target.append(card);
    });
  };

  const renderStatements = () => {
    const target = byId("statement-list");
    data.statements.forEach((statement) => {
      const card = create("article", "statement-card");
      card.append(create("h3", "", statement.title));
      if (statement.description) card.append(create("p", "statement-card__desc", statement.description));
      statement.items.forEach((item) => {
        const block = create("div", "statement-item");
        if (item.image) {
          const img = create("img", "statement-item__image");
          img.src = item.image;
          img.alt = item.name;
          block.append(img);
        }
        block.append(create("strong", "", item.name));
        block.append(create("p", "", item.note));
        card.append(block);
      });
      target.append(card);
    });
  };

  configureVrLinks();
  setupTopbarScroll();
  setupMobileNav();
  renderMetrics();
  renderBasicInfo();
  renderRoomSummary();
  renderRoomCards();
  renderAssets();
  renderStatements();
  window.addEventListener("resize", refreshScrollFades, { passive: true });
})();
