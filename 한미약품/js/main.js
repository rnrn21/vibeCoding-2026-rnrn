(() => {
        const countdown = document.querySelector(".con8");
        const deadline = Date.parse(countdown.dataset.deadline);
        if (!Number.isFinite(deadline)) {
          throw new Error("지원 마감 날짜를 확인할 수 없습니다.");
        }

        const daysElement = countdown.querySelector("[data-countdown-days]");
        const hoursElement = countdown.querySelector("[data-countdown-hours]");
        const minutesElement = countdown.querySelector(
          "[data-countdown-minutes]",
        );
        const secondsElement = countdown.querySelector(
          "[data-countdown-seconds]",
        );

        const updateCountdown = () => {
          const remainingSeconds = Math.max(
            0,
            Math.floor((deadline - Date.now()) / 1000),
          );
          daysElement.textContent = String(
            Math.floor(remainingSeconds / 86400),
          ).padStart(2, "0");
          hoursElement.textContent = String(
            Math.floor((remainingSeconds % 86400) / 3600),
          ).padStart(2, "0");
          minutesElement.textContent = String(
            Math.floor((remainingSeconds % 3600) / 60),
          ).padStart(2, "0");
          secondsElement.textContent = String(remainingSeconds % 60).padStart(
            2,
            "0",
          );
        };

        updateCountdown();
        window.setInterval(updateCountdown, 1000);
      })();

      const hamburgerBtn = document.getElementById("hamburgerBtn");
      const mobileMenu = document.getElementById("mobileMenu");
      const mobileCloseBtn = document.getElementById("mobileCloseBtn");
      const mobileLinks = document.querySelectorAll(".mobile-link");
      const header = document.querySelector("header");
      const headerInner = document.querySelector(".header-inner");
      const revealSections = document.querySelectorAll(
        "main > section:not(.main_visual):not(.con8)",
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      let smoothScrollEnabled = !reduceMotion.matches;
      let smoothScrollTarget = window.scrollY;
      let smoothScrollFrame = 0;
      let smoothScrollLastFrame = 0;
      let previousScrollY = window.scrollY;
      let scrollUpdateScheduled = false;

      const stopSmoothScroll = () => {
        if (smoothScrollFrame) {
          window.cancelAnimationFrame(smoothScrollFrame);
        }
        smoothScrollFrame = 0;
        smoothScrollLastFrame = 0;
        smoothScrollTarget = window.scrollY;
      };

      const animatePageScroll = (time) => {
        smoothScrollFrame = 0;
        if (!smoothScrollEnabled) return;

        const currentScroll = window.scrollY;
        const difference = smoothScrollTarget - currentScroll;
        if (Math.abs(difference) < 1) {
          window.scrollTo(0, smoothScrollTarget);
          smoothScrollLastFrame = 0;
          return;
        }

        const elapsed = smoothScrollLastFrame
          ? Math.min((time - smoothScrollLastFrame) / 1000, 0.1)
          : 1 / 60;
        smoothScrollLastFrame = time;
        const progress = 1 - Math.exp(-14 * elapsed);
        window.scrollTo(0, currentScroll + difference * progress);
        smoothScrollFrame = window.requestAnimationFrame(animatePageScroll);
      };

      const startSmoothPageScroll = (target) => {
        smoothScrollTarget = Math.max(
          0,
          Math.min(target, document.documentElement.scrollHeight - window.innerHeight),
        );
        if (!smoothScrollFrame) {
          smoothScrollFrame = window.requestAnimationFrame(animatePageScroll);
        }
      };

      const hasScrollableAncestor = (event, deltaY) =>
        event.composedPath().some((node) => {
          if (!(node instanceof HTMLElement) || node === document.body) {
            return false;
          }
          const overflowY = window.getComputedStyle(node).overflowY;
          if (
            !["auto", "scroll", "overlay"].includes(overflowY) ||
            node.scrollHeight <= node.clientHeight
          ) {
            return false;
          }
          const maxScroll = node.scrollHeight - node.clientHeight;
          return deltaY < 0 ? node.scrollTop > 0 : node.scrollTop < maxScroll;
        });

      reduceMotion.addEventListener("change", (event) => {
        smoothScrollEnabled = !event.matches;
        if (!smoothScrollEnabled) {
          stopSmoothScroll();
        }
      });

      window.addEventListener(
        "scroll",
        () => {
          if (!smoothScrollFrame) {
            smoothScrollTarget = window.scrollY;
          }
        },
        { passive: true },
      );

      document.addEventListener(
        "wheel",
        (event) => {
          if (
            !smoothScrollEnabled ||
            event.ctrlKey ||
            event.deltaY === 0 ||
            event.deltaX !== 0 ||
            document.body.classList.contains("menu-open") ||
            hasScrollableAncestor(event, event.deltaY)
          ) {
            return;
          }

          const delta =
            event.deltaY *
            (event.deltaMode === WheelEvent.DOM_DELTA_LINE
              ? 16
              : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                ? window.innerHeight
                : 1);
          const nextTarget = Math.max(
            0,
            Math.min(
              smoothScrollTarget + delta,
              document.documentElement.scrollHeight - window.innerHeight,
            ),
          );
          if (nextTarget === smoothScrollTarget) return;

          event.preventDefault();
          startSmoothPageScroll(nextTarget);
        },
        { passive: false },
      );

      document.addEventListener("click", (event) => {
        if (
          !smoothScrollEnabled ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        const link = event.target.closest("a[href^='#']");
        if (!link || link.hash.length < 2) return;
        const target = document.getElementById(
          decodeURIComponent(link.hash.slice(1)),
        );
        if (!target) return;

        event.preventDefault();
        history.pushState(null, "", link.hash);
        const scrollMargin = Number.parseFloat(
          window.getComputedStyle(target).scrollMarginTop,
        ) || 0;
        startSmoothPageScroll(
          target.getBoundingClientRect().top + window.scrollY - scrollMargin,
        );
      });

      if (reduceMotion.matches) {
        revealSections.forEach((section) =>
          section.classList.add("is-visible"),
        );
      } else {
        revealSections.forEach((section) =>
          section.classList.add("scroll-reveal"),
        );
        const revealObserver = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            });
          },
          {
            rootMargin: "-45% 0px -45% 0px",
          },
        );
        revealSections.forEach((section) => revealObserver.observe(section));
      }

      const updateHeaderVisibility = () => {
        const currentScrollY = window.scrollY;
        const scrollDifference = currentScrollY - previousScrollY;

        const menuIsOpen = document.body.classList.contains("menu-open");
        if (currentScrollY <= 40 || menuIsOpen) {
          headerInner.classList.remove("is-hidden");
          header.classList.toggle("is-scrolled", currentScrollY > 40 || menuIsOpen);
        } else if (scrollDifference > 4) {
          headerInner.classList.add("is-hidden");
          header.classList.remove("is-scrolled");
        } else if (scrollDifference < -4) {
          headerInner.classList.remove("is-hidden");
          header.classList.add("is-scrolled");
        }

        previousScrollY = currentScrollY;
        scrollUpdateScheduled = false;
      };

      window.addEventListener(
        "scroll",
        () => {
          if (scrollUpdateScheduled) return;
          scrollUpdateScheduled = true;
          window.requestAnimationFrame(updateHeaderVisibility);
        },
        { passive: true },
      );

      hamburgerBtn.addEventListener("click", () => {
        headerInner.classList.remove("is-hidden");
        header.classList.add("is-scrolled");
        mobileMenu.classList.add("active");
        document.body.classList.add("menu-open");
      });

      mobileCloseBtn.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        document.body.classList.remove("menu-open");
      });

      mobileLinks.forEach((link) => {
        link.addEventListener("click", () => {
          mobileMenu.classList.remove("active");
          document.body.classList.remove("menu-open");
        });
      });

      /* ===== History section: 펼치기 / 접기 및 Intersection Observer 애니메이션 ===== */
      (() => {
        const section = document.getElementById("history-section");
        if (!section) return;

        const inner = section.querySelector(".history-container");
        const wrap = section.querySelector(".history-toggle-wrap");
        const toggle = section.querySelector(".history-toggle");
        const label = section.querySelector(".history-toggle-label");
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        );

        const updateHeights = () => {
          const full = inner.offsetHeight;
          section.style.setProperty("--history-full-h", full + "px");
        };

        const setExpanded = (expanded) => {
          section.classList.toggle("is-expanded", expanded);
          section.classList.toggle("is-collapsed", !expanded);
          toggle.setAttribute("aria-expanded", String(expanded));
          label.textContent = expanded ? "접기" : "펼치기";
        };

        updateHeights();
        setExpanded(false);
        wrap.hidden = false;

        toggle.addEventListener("click", () => {
          const willExpand = !section.classList.contains("is-expanded");
          updateHeights();
          setExpanded(willExpand);

          if (!willExpand) {
            section.scrollIntoView({
              behavior: reduceMotion.matches ? "auto" : "smooth",
              block: "start",
            });
          }
        });

        const historyItems = section.querySelectorAll(".history-item");
        const observerOptions = {
          root: null,
          rootMargin: "0px 0px -10% 0px",
          threshold: 0.1,
        };

        const observer = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const list = entry.target.closest(".history-list");
              if (list) {
                const items = Array.from(
                  list.querySelectorAll(".history-item"),
                );
                const index = items.indexOf(entry.target);
                entry.target.style.transitionDelay = `${index * 0.08}s`;
              }
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        }, observerOptions);

        historyItems.forEach((item) => observer.observe(item));

        if ("ResizeObserver" in window) {
          new ResizeObserver(updateHeights).observe(inner);
        } else {
          window.addEventListener("resize", updateHeights);
        }
        window.addEventListener("load", updateHeights);
      })();

      (() => {
        const tasksSection = document.getElementById("tasks");
        if (!tasksSection) return;

        const tabs = Array.from(tasksSection.querySelectorAll(".tasks-tab"));
        const categories = window.taskData.categories;
        if (
          categories.length !== tabs.length ||
          categories.some(
            (category, index) =>
              category.name !== tabs[index].textContent.trim(),
          )
        ) {
          throw new Error("직무 메뉴와 실제 공고 데이터가 일치하지 않습니다.");
        }

        const panel = tasksSection.querySelector("#tasks-panel");
        const modal = tasksSection.querySelector(".tasks-modal");
        const modalContent = tasksSection.querySelector(
          ".tasks-modal-content",
        );
        const closeModalButton = tasksSection.querySelector(
          ".tasks-modal-close",
        );

        const createElement = (tagName, className, text) => {
          const element = document.createElement(tagName);
          if (className) element.className = className;
          if (text) element.textContent = text;
          return element;
        };

        const renderModal = (categoryName, groupName, role) => {
          modalContent.replaceChildren();

          const heading = createElement("div", "tasks-modal-heading");
          const title = createElement("h2", "tasks-modal-title", role.title);
          title.id = "tasks-modal-title";
          heading.append(
            title,
            createElement("span", "tasks-modal-category", categoryName),
            createElement("span", "tasks-modal-unit", groupName),
          );
          modalContent.append(heading);
          modalContent.append(
            createElement(
              "p",
              "tasks-modal-career",
              role.career || "*신입/경력",
            ),
          );

          role.sections.forEach((sectionData) => {
            const section = createElement("section", "tasks-modal-section");
            const sectionTitle = createElement(
              "h3",
              "tasks-modal-section-title",
              sectionData.title,
            );
            const list = createElement("ul", "tasks-modal-list");
            sectionData.items.forEach((item) => {
              list.append(createElement("li", "", item));
            });
            section.append(sectionTitle, list);
            modalContent.append(section);
          });
        };

        const renderCategory = (categoryIndex) => {
          const category = categories[categoryIndex];
          panel.replaceChildren();
          panel.setAttribute("aria-labelledby", `tasks-tab-${categoryIndex}`);

          category.groups.forEach((group, groupIndex) => {
            const groupSection = createElement("section", "tasks-department");
            const toggle = createElement(
              "button",
              "tasks-department-toggle",
            );
            const toggleId = `tasks-department-toggle-${categoryIndex}-${groupIndex}`;
            const panelId = `tasks-department-panel-${categoryIndex}-${groupIndex}`;
            toggle.type = "button";
            toggle.id = toggleId;
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-controls", panelId);

            const groupName = createElement(
              "span",
              "tasks-department-name",
              group.name,
            );
            const count = createElement(
              "span",
              "tasks-count",
              String(group.roles.length),
            );
            toggle.append(groupName, count);

            const groupPanel = createElement(
              "div",
              "tasks-department-panel",
            );
            groupPanel.id = panelId;
            groupPanel.setAttribute("aria-labelledby", toggleId);
            groupPanel.hidden = true;

            const roleList = createElement("ul", "tasks-role-list");
            group.roles.forEach((role, roleIndex) => {
              const listItem = createElement("li");
              const roleButton = createElement(
                "button",
                "tasks-role-button",
              );
              roleButton.type = "button";
              roleButton.dataset.groupIndex = String(groupIndex);
              roleButton.dataset.roleIndex = String(roleIndex);
              roleButton.append(
                createElement("span", "", role.title),
                createElement("span", "tasks-role-arrow", "→"),
              );
              listItem.append(roleButton);
              roleList.append(listItem);
            });

            groupPanel.append(roleList);
            groupSection.append(toggle, groupPanel);
            panel.append(groupSection);
          });
        };

        const selectCategory = (categoryIndex, focusTab = false) => {
          tabs.forEach((tab, index) => {
            const selected = index === categoryIndex;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
            if (selected && focusTab) tab.focus();
          });
          renderCategory(categoryIndex);
        };

        tabs.forEach((tab) => {
          tab.addEventListener("click", () => {
            const categoryIndex = Number(tab.dataset.category);
            selectCategory(categoryIndex);
          });

          tab.addEventListener("keydown", (event) => {
            let nextIndex = null;
            if (event.key === "ArrowRight") {
              nextIndex = (Number(tab.dataset.category) + 1) % tabs.length;
            }
            if (event.key === "ArrowLeft") {
              nextIndex =
                (Number(tab.dataset.category) - 1 + tabs.length) % tabs.length;
            }
            if (event.key === "Home") nextIndex = 0;
            if (event.key === "End") nextIndex = tabs.length - 1;
            if (nextIndex !== null) {
              event.preventDefault();
              selectCategory(nextIndex, true);
              tabs[nextIndex].scrollIntoView({
                block: "nearest",
                inline: "nearest",
              });
            }
          });
        });

        panel.addEventListener("click", (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;

          const accordionToggle = target.closest(
            ".tasks-department-toggle",
          );
          if (accordionToggle) {
            const expanded =
              accordionToggle.getAttribute("aria-expanded") === "true";
            accordionToggle.setAttribute("aria-expanded", String(!expanded));
            const controlledPanel = tasksSection.querySelector(
              `#${accordionToggle.getAttribute("aria-controls")}`,
            );
            controlledPanel.hidden = expanded;
            return;
          }

          const roleButton = target.closest(".tasks-role-button");
          if (!roleButton) return;

          const categoryIndex = tabs.findIndex(
            (tab) => tab.getAttribute("aria-selected") === "true",
          );
          const group = categories[categoryIndex].groups[
            Number(roleButton.dataset.groupIndex)
          ];
          const role = group.roles[Number(roleButton.dataset.roleIndex)];
          renderModal(categories[categoryIndex].name, group.name, role);
          modal.showModal();
        });

        closeModalButton.addEventListener("click", () => modal.close());
        modal.addEventListener("click", (event) => {
          if (event.target === modal) modal.close();
        });

        renderCategory(0);
      })();

      (() => {
        const tabs = Array.from(
          document.querySelectorAll(".requirement-tab"),
        );
        const panels = Array.from(
          document.querySelectorAll(".requirement-panel"),
        );

        const selectTab = (selectedIndex, focus = false) => {
          tabs.forEach((tab, index) => {
            const selected = index === selectedIndex;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
            panels[index].hidden = !selected;
            if (selected && focus) tab.focus();
          });
        };

        tabs.forEach((tab, index) => {
          tab.addEventListener("click", () => selectTab(index));
          tab.addEventListener("keydown", (event) => {
            let nextIndex = null;
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              const direction = event.key === "ArrowRight" ? 1 : -1;
              nextIndex = (index + direction + tabs.length) % tabs.length;
            }
            if (event.key === "Home") nextIndex = 0;
            if (event.key === "End") nextIndex = tabs.length - 1;
            if (nextIndex !== null) {
              event.preventDefault();
              selectTab(nextIndex, true);
            }
          });
        });
      })();

      (async () => {
        const fairSchedule = [
          {
            dates: [
              "8월 31일 (월)",
              "9월 1일 (화)",
              "9월 2일 (수)",
              "9월 3일 (목)",
              "9월 4일 (금)",
            ],
            schools: [
              ["KAIST"],
              ["서울대학교", "서강대학교", "연세대학교"],
              ["UNIST", "한양대학교"],
              ["GIST"],
              ["고려대학교", "성균관대학교(자연)"],
            ],
          },
          {
            dates: [
              "9월 7일 (월)",
              "9월 8일 (화)",
              "9월 9일 (수)",
              "",
              "10월 7일 (수)",
            ],
            schools: [
              ["KIST", "동국대학교"],
              ["이화여자대학교", "중견기업박람회(대전)"],
              ["POSTECH"],
              [],
              ["서울교육센터"],
            ],
          },
        ];

        const regionNames = ["서울", "경기", "강원", "경상", "충청", "전라"];

        const expositionTabs = Array.from(
          document.querySelectorAll(".exposition-tab"),
        );
        const expositionPanels = expositionTabs.map((tab) =>
          document.getElementById(tab.getAttribute("aria-controls")),
        );
        const regionTabsContainer = document.getElementById(
          "exposition-region-tabs",
        );
        const fairScheduleElement = document.getElementById(
          "exposition-fair-schedule",
        );
        const campusScheduleElement = document.getElementById(
          "exposition-campus-schedule",
        );
        let schoolDetailId = 0;
        const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
        const weekdayIndices = {
          일: 0,
          월: 1,
          화: 2,
          수: 3,
          목: 4,
          금: 5,
          토: 6,
        };
        const getDateKey = (date) =>
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        let regions;

        try {
          const response = await fetch("./data/campus_recruiting_date.json");
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const campusDates = await response.json();
          if (!Array.isArray(campusDates)) {
            throw new Error("일정 데이터 형식이 배열이 아닙니다.");
          }

          const events = campusDates.map((entry, index) => {
            const requiredFields = ["지역", "날짜", "대학교", "장소", "시간"];
            if (
              !entry ||
              requiredFields.some(
                (field) =>
                  typeof entry[field] !== "string" ||
                  entry[field].trim() === "",
              )
            ) {
              throw new Error(`${index + 1}번째 일정의 필수 정보가 없습니다.`);
            }

            const dateMatch = entry["날짜"].match(
              /^(\d{1,2})월\s*(\d{1,2})일\s*\((.)\)$/,
            );
            if (!dateMatch || !(dateMatch[3] in weekdayIndices)) {
              throw new Error(`일정 날짜 형식이 올바르지 않습니다: ${entry["날짜"]}`);
            }

            const [, monthText, dayText, weekday] = dateMatch;
            const date = new Date(
              2026,
              Number(monthText) - 1,
              Number(dayText),
            );
            if (
              date.getMonth() !== Number(monthText) - 1 ||
              date.getDate() !== Number(dayText) ||
              date.getDay() !== weekdayIndices[weekday]
            ) {
              throw new Error(`일정 날짜가 올바르지 않습니다: ${entry["날짜"]}`);
            }
            if (!regionNames.includes(entry["지역"])) {
              throw new Error(`알 수 없는 일정 지역입니다: ${entry["지역"]}`);
            }

            return {
              region: entry["지역"],
              date,
              dateLabel: entry["날짜"],
              school: entry["대학교"],
              location: entry["장소"],
              time: entry["시간"],
            };
          });

          regions = regionNames.map((name) => {
            const regionEvents = events
              .filter((event) => event.region === name)
              .sort((left, right) => left.date - right.date);
            const weeks = new Map();

            regionEvents.forEach((event) => {
              const monday = new Date(event.date);
              monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
              const weekKey = getDateKey(monday);
              if (!weeks.has(weekKey)) {
                weeks.set(weekKey, { monday, events: [] });
              }
              weeks.get(weekKey).events.push(event);
            });

            const lastEvent = regionEvents.at(-1);
            const lastWeekMonday = lastEvent
              ? new Date(lastEvent.date)
              : null;
            if (lastWeekMonday) {
              lastWeekMonday.setDate(
                lastWeekMonday.getDate() -
                  ((lastWeekMonday.getDay() + 6) % 7),
              );
            }
            const lastWeekKey = lastWeekMonday
              ? getDateKey(lastWeekMonday)
              : null;

            const scheduleWeeks = Array.from(weeks.entries())
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([weekKey, week]) => {
                const endDate = new Date(week.monday);
                endDate.setDate(
                  endDate.getDate() +
                    (weekKey === lastWeekKey
                      ? (lastEvent.date.getDay() + 6) % 7
                      : 4),
                );
                const dates = [];
                const schools = [];

                for (
                  let date = new Date(week.monday);
                  date <= endDate;
                  date.setDate(date.getDate() + 1)
                ) {
                  const dateKey = getDateKey(date);
                  const dayEvents = week.events.filter(
                    (event) => getDateKey(event.date) === dateKey,
                  );
                  dates.push(
                    dayEvents[0]?.dateLabel ||
                      `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`,
                  );
                  schools.push(
                    dayEvents.map((event) => ({
                      name: event.school,
                      location: event.location,
                      time: event.time,
                    })),
                  );
                }

                return { dates, schools };
              });

            return { name, weeks: scheduleWeeks };
          });
        } catch (error) {
          console.error("캠퍼스 일정 데이터를 불러오지 못했습니다.", error);
          campusScheduleElement.textContent =
            "캠퍼스 일정 데이터를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.";
          return;
        }

        const createSchedule = (scheduleElement, weeks, labelledBy) => {
          scheduleElement.replaceChildren();
          if (labelledBy) {
            scheduleElement.setAttribute("role", "tabpanel");
            scheduleElement.setAttribute("aria-labelledby", labelledBy);
          }

          weeks.forEach((week) => {
            const weekElement = document.createElement("section");
            weekElement.className = "exposition-week";

            const datesElement = document.createElement("div");
            datesElement.className = "exposition-dates";
            datesElement.setAttribute("aria-label", "일정 날짜");
            const schoolsElement = document.createElement("div");
            schoolsElement.className = "exposition-schools";

            datesElement.style.setProperty(
              "--exposition-day-count",
              week.dates.length,
            );
            schoolsElement.style.setProperty(
              "--exposition-day-count",
              week.schools.length,
            );
            const { dates, schools } = week;

            dates.forEach((date) => {
              const dateElement = document.createElement("div");
              dateElement.className = "exposition-date";
              dateElement.textContent = date;
              datesElement.append(dateElement);
            });

            schools.forEach((schoolNames, index) => {
              const cell = document.createElement("div");
              cell.className = "exposition-school-cell";
              if (dates[index]) {
                cell.setAttribute("aria-label", `${dates[index]} 일정`);
              }
              schoolNames.forEach((schoolEntry) => {
                const schoolName =
                  typeof schoolEntry === "string" ? schoolEntry : schoolEntry.name;
                const school = document.createElement(
                  typeof schoolEntry === "string" ? "span" : "button",
                );
                school.textContent = schoolName;
                school.className = "exposition-school-button";
                cell.append(school);

                if (typeof schoolEntry === "string") return;

                const detailId = `exposition-school-detail-${schoolDetailId++}`;
                const detail = document.createElement("div");
                school.type = "button";
                school.setAttribute("aria-expanded", "false");
                school.setAttribute("aria-controls", detailId);
                detail.id = detailId;
                detail.className = "exposition-school-detail";
                detail.hidden = true;
                detail.setAttribute("aria-live", "polite");

                [
                  ["장소", schoolEntry.location],
                  ["시간", schoolEntry.time],
                ].forEach(([label, value]) => {
                  const item = document.createElement("div");
                  const itemLabel = document.createElement("span");
                  itemLabel.className = "exposition-school-detail-label";
                  itemLabel.textContent = label;
                  const itemValue = document.createElement("strong");
                  itemValue.textContent = value;
                  item.append(itemLabel, itemValue);
                  detail.append(item);
                });

                school.addEventListener("click", () => {
                  const isExpanded =
                    school.getAttribute("aria-expanded") === "true";
                  if (isExpanded) {
                    school.setAttribute("aria-expanded", "false");
                    detail.hidden = true;
                    return;
                  }

                  scheduleElement
                    .querySelectorAll(".exposition-school-button")
                    .forEach((button) => {
                      if (button === school) return;
                      button.setAttribute("aria-expanded", "false");
                      document.getElementById(
                        button.getAttribute("aria-controls"),
                      ).hidden = true;
                    });
                  school.setAttribute("aria-expanded", "true");
                  detail.hidden = false;
                });
                cell.append(detail);
              });
              schoolsElement.append(cell);
            });

            weekElement.append(datesElement, schoolsElement);
            scheduleElement.append(weekElement);
          });
        };

        const regionTabs = regions.map((region, index) => {
          const tab = document.createElement("button");
          tab.className = "exposition-region-tab";
          tab.id = `exposition-region-tab-${index}`;
          tab.type = "button";
          tab.setAttribute("role", "tab");
          tab.setAttribute("aria-controls", "exposition-campus-schedule");
          tab.setAttribute("aria-selected", String(index === 0));
          tab.tabIndex = index === 0 ? 0 : -1;
          tab.textContent = region.name;
          regionTabsContainer.append(tab);
          return tab;
        });

        const selectRegion = (regionIndex, focus = false) => {
          regionTabs.forEach((tab, index) => {
            const selected = index === regionIndex;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
            if (selected && focus) tab.focus();
          });
          createSchedule(
            campusScheduleElement,
            regions[regionIndex].weeks,
            regionTabs[regionIndex].id,
          );
        };

        const selectExpositionTab = (selectedIndex, focus = false) => {
          expositionTabs.forEach((tab, index) => {
            const selected = index === selectedIndex;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
            expositionPanels[index].hidden = !selected;
            if (selected && focus) tab.focus();
          });
          if (selectedIndex === 1) {
            const selectedRegionIndex = regionTabs.findIndex(
              (tab) => tab.getAttribute("aria-selected") === "true",
            );
            selectRegion(Math.max(selectedRegionIndex, 0));
          }
        };

        expositionTabs.forEach((tab, index) => {
          tab.addEventListener("click", () => selectExpositionTab(index));
          tab.addEventListener("keydown", (event) => {
            let nextIndex = null;
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              const direction = event.key === "ArrowRight" ? 1 : -1;
              nextIndex = (index + direction + expositionTabs.length) %
                expositionTabs.length;
            }
            if (event.key === "Home") nextIndex = 0;
            if (event.key === "End") nextIndex = expositionTabs.length - 1;
            if (nextIndex !== null) {
              event.preventDefault();
              selectExpositionTab(nextIndex, true);
            }
          });
        });

        regionTabs.forEach((tab, index) => {
          tab.addEventListener("click", () => selectRegion(index));
          tab.addEventListener("keydown", (event) => {
            let nextIndex = null;
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              const direction = event.key === "ArrowRight" ? 1 : -1;
              nextIndex = (index + direction + regionTabs.length) %
                regionTabs.length;
            }
            if (event.key === "Home") nextIndex = 0;
            if (event.key === "End") nextIndex = regionTabs.length - 1;
            if (nextIndex !== null) {
              event.preventDefault();
              selectRegion(nextIndex, true);
            }
          });
        });

        createSchedule(fairScheduleElement, fairSchedule);
        selectRegion(0);
      })();
