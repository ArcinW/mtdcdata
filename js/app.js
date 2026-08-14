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
    const logo = document.querySelector(".brand__logo");
    const logoLight = "https://vr-image-4.realsee-cdn.cn/release/web/normal.d8c9cf23.png";
    const logoDark = "https://vr-image-4.realsee-cdn.cn/release/web/normal-black.1929bebe.png";
    const update = () => {
      const isScrolled = window.scrollY > 24;
      topbar.classList.toggle("topbar--scrolled", isScrolled);
      if (logo) logo.src = isScrolled ? logoDark : logoLight;
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
    const metrics = byId("top-metrics");
    const heroMetrics = [
      ...data.topMetrics,
      { label: "环境设施", value: data.environmentFacilityCount || `${data.featureServices.length}项` },
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

    const visualOverview = create("div", "basic-visual-overview");
    const visualDisplayRules = {
      "环境": {
        hidden: ["庭院景观", "城市景观", "高空景观", "周边卖货区"],
        tagsByItem: {
          "露台/户外座位": ["庭院景观", "城市景观", "高空景观"]
        }
      },
      "设施": {
        hidden: ["无障碍设施"],
        tagsByItem: {}
      }
    };
    data.basicInfo
      .filter((category) => ["环境", "设施"].includes(category.group))
      .forEach((category) => {
        const section = create("section", "basic-visual-section");
        section.append(create("h3", "", category.group));
        const grid = create("div", "basic-visual-grid");
        const displayRule = visualDisplayRules[category.group] || { hidden: [], tagsByItem: {} };
        category.items
          .filter((item) => item.status === "available" && !displayRule.hidden.includes(item.name))
          .forEach((item) => {
            grid.append(renderFacilityChip(item, category.group, displayRule.tagsByItem[item.name] || []));
          });
        section.append(grid);
        visualOverview.append(section);
      });
    target.append(visualOverview);

    const compactList = create("section", "basic-check-list");
    compactList.append(create("h3", "basic-check-list__title", "信息明细"));
    data.basicInfo.forEach((category) => {
      const group = create("section", "basic-check-group");
      group.append(create("h3", "basic-check-group__title", category.group));
      const columns = create("div", "basic-check-columns");
      [
        { status: "available", icon: "✓" },
        { status: "pending", icon: "×" }
      ].forEach((column) => {
        const cell = create("div", `basic-check-column basic-check-column--${column.status}`);
        const tags = create("div", "basic-check-tags");
        category.items
          .filter((item) => item.status === column.status)
          .forEach((item) => {
            const tag = create("span", `basic-check-tag basic-check-tag--${item.status}`);
            tag.append(create("span", "basic-check-tag__icon", column.icon));
            tag.append(create("span", "", item.name));
            tags.append(tag);
          });
        cell.append(tags);
        columns.append(cell);
      });
      group.append(columns);
      compactList.append(group);
    });
    target.append(compactList);
  };

  const renderFacilityChip = (item, categoryName, overlayTags = []) => {
    const isVisualChip = item.status === "available" && ["环境", "设施"].includes(categoryName);
    const chip = create(isVisualChip ? "article" : "span", `facility-chip facility-chip--${item.status}${isVisualChip ? " facility-chip--visual" : ""}`);
    if (item.note) chip.title = item.note;

    if (isVisualChip) {
      chip.append(create("span", "facility-chip__thumb"));
      if (overlayTags.length) {
        const tags = create("div", "facility-chip__tags");
        overlayTags.forEach((tag) => tags.append(create("span", "", tag)));
        chip.append(tags);
      }
      const content = create("span", "facility-chip__content");
      content.append(create("span", "facility-chip__text", item.name));
      const link = create("a", "facility-chip__link", "查看VR");
      link.href = data.restaurant.vrUrl;
      link.target = "_blank";
      link.rel = "noopener";
      content.append(link);
      chip.append(content);
      return chip;
    }

    chip.textContent = item.name;
    return chip;
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
    const renderAssetImage = (asset, image, index) => {
      const media = create("figure", "more-data-item");
      const img = create("img", "more-data-item__image");
      img.src = image;
      img.alt = `${asset.title}${index + 1}`;
      media.append(img);
      return media;
    };

    const renderAssetPager = (asset, images, desktopPageSize, mobilePageSize) => {
      const pager = create("div", "more-data-pager");
      const track = create("div", "more-data-page-track");
      const controls = create("div", "more-data-pager__controls");
      const prev = create("button", "more-data-pager__button more-data-pager__button--prev");
      const next = create("button", "more-data-pager__button more-data-pager__button--next");
      const status = create("span", "more-data-pager__status");
      const desktopQuery = window.matchMedia("(min-width: 720px)");
      let pageCount = 0;
      let currentPageIndex = 0;

      prev.type = "button";
      next.type = "button";
      prev.setAttribute("aria-label", "查看上一页环境照片");
      next.setAttribute("aria-label", "查看下一页环境照片");

      const updateControls = () => {
        const pages = Array.from(track.children);
        const trackLeft = track.getBoundingClientRect().left;
        const nearestPage = pages.reduce((nearest, pageElement, index) => {
          const distance = Math.abs(pageElement.getBoundingClientRect().left - trackLeft);
          return distance < nearest.distance ? { index, distance } : nearest;
        }, { index: currentPageIndex, distance: Number.POSITIVE_INFINITY });
        currentPageIndex = nearestPage.index;
        const currentPage = Math.min(currentPageIndex + 1, pageCount);
        status.textContent = `${currentPage} / ${pageCount}`;
        prev.disabled = currentPage <= 1;
        next.disabled = currentPage >= pageCount;
      };

      const renderPages = () => {
        const pageSize = desktopQuery.matches ? desktopPageSize : mobilePageSize;
        pageCount = Math.ceil(images.length / pageSize);
        currentPageIndex = Math.min(currentPageIndex, pageCount - 1);
        track.innerHTML = "";
        for (let index = 0; index < images.length; index += pageSize) {
          const pageIndex = index / pageSize;
          const page = create("div", "more-data-page");
          page.setAttribute("aria-label", `${asset.title}第${pageIndex + 1}页`);
          images.slice(index, index + pageSize).forEach((image, imageIndex) => {
            page.append(renderAssetImage(asset, image, index + imageIndex));
          });
          track.append(page);
        }
        requestAnimationFrame(() => {
          const pageElement = track.children[currentPageIndex];
          if (pageElement) track.scrollLeft = pageElement.offsetLeft - track.offsetLeft;
          updateControls();
        });
      };

      const showPage = (direction) => {
        currentPageIndex = Math.min(Math.max(currentPageIndex + direction, 0), pageCount - 1);
        const pageElement = track.children[currentPageIndex];
        if (pageElement) {
          track.scrollTo({ left: pageElement.offsetLeft - track.offsetLeft, behavior: "smooth" });
        }
        updateControls();
      };

      prev.addEventListener("click", () => showPage(-1));
      next.addEventListener("click", () => showPage(1));
      track.addEventListener("scroll", updateControls, { passive: true });
      if (desktopQuery.addEventListener) {
        desktopQuery.addEventListener("change", renderPages);
      } else {
        desktopQuery.addListener(renderPages);
      }

      controls.append(prev, status, next);
      pager.append(track, controls);
      renderPages();
      return pager;
    };

    data.assets.forEach((asset) => {
      const card = create("article", `more-data-block more-data-block--${asset.type || "default"}`);
      const body = create("div", "more-data-block__header");
      const titleBlock = create("div", "more-data-block__title");
      titleBlock.append(create("h3", "", asset.title));
      if (asset.description) titleBlock.append(create("p", "", asset.description));
      body.append(titleBlock);
      if (asset.status) {
        const statusParts = asset.status.match(/^(\d+)(.*)$/);
        const count = create("span", "more-data-block__count");
        count.append(create("strong", "", statusParts ? statusParts[1] : asset.status));
        if (statusParts?.[2]) count.append(create("span", "", statusParts[2]));
        body.append(count);
      }
      card.append(body);

      const gallery = create("div", `more-data-gallery more-data-gallery--${asset.type || "default"}`);
      const images = asset.images || (asset.image ? [asset.image] : []);
      if (asset.type === "environment") {
        card.append(renderAssetPager(asset, images, 8, 2));
        target.append(card);
        return;
      }
      if (asset.type === "poster") {
        card.append(renderAssetPager(asset, images, 4, 1));
        target.append(card);
        return;
      }
      images.forEach((image, index) => {
        gallery.append(renderAssetImage(asset, image, index));
      });
      card.append(gallery);
      target.append(card);
    });
  };

  const renderStatements = () => {
    const target = byId("statement-list");
    const renderStatementItem = (item) => {
      const block = create(item.image ? "figure" : "div", `statement-item${item.image ? " statement-item--image" : ""}`);
      if (item.image) {
        const img = create("img", "statement-item__image");
        img.src = item.image;
        img.alt = item.name;
        block.append(img);
      }
      const caption = create(item.image ? "figcaption" : "div", "statement-item__caption");
      caption.append(create("strong", "", item.name));
      if (item.note) caption.append(create("p", "", item.note));
      block.append(caption);
      return block;
    };

    data.statements.forEach((statement, index) => {
      const statementType = statement.type || (index === 0 ? "source" : "usage");
      const card = create("article", `statement-card statement-card--${statementType}`);
      const isPrimaryUsage = statementType === "usage" && data.statements.length === 1;
      const sectionDescription = byId("statement-description");
      if (isPrimaryUsage && sectionDescription) {
        sectionDescription.textContent = statement.description || "";
      } else {
        const header = create("div", "statement-card__header");
        header.append(create("h3", "", statement.title));
        if (statement.description) header.append(create("p", "statement-card__desc", statement.description));
        card.append(header);
      }

      const content = create("div", "statement-card__content");
      statement.items?.forEach((item) => content.append(renderStatementItem(item)));
      statement.groups?.forEach((group) => {
        const groupBlock = create("section", "statement-group");
        const groupHeader = create("div", "statement-group__header");
        groupHeader.append(create("h4", "", group.title));
        groupBlock.append(groupHeader);
        const groupGrid = create("div", "statement-group__grid");
        group.items.forEach((item) => groupGrid.append(renderStatementItem(item)));
        groupBlock.append(groupGrid);
        content.append(groupBlock);
      });
      card.append(content);
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
