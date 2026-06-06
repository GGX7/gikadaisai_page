document.addEventListener('DOMContentLoaded', () => {

    /* ===============================================================
       Data Loading & Binding
    =============================================================== */
    const loadSiteData = async () => {
        try {
            const response = await fetch('js/site_data.json');
            if (!response.ok) throw new Error('Failed to load site data');
            const data = await response.json();

            // 1. Text Binding
            document.querySelectorAll('[data-bind-text]').forEach(el => {
                const key = el.getAttribute('data-bind-text');
                const value = getNestedValue(data, key);
                if (value) el.textContent = value;
            });

            // 2. Image Binding
            document.querySelectorAll('[data-bind-src]').forEach(el => {
                const key = el.getAttribute('data-bind-src');
                const value = getNestedValue(data, key);
                if (value) el.src = value;
            });

            // 3. Link Binding
            document.querySelectorAll('[data-bind-href]').forEach(el => {
                const key = el.getAttribute('data-bind-href');
                const value = getNestedValue(data, key);
                if (value) el.href = value;
            });

            // 4. HTML Binding (Caution: Ensure JSON source is trusted)
            document.querySelectorAll('[data-bind-html]').forEach(el => {
                const key = el.getAttribute('data-bind-html');
                const value = getNestedValue(data, key);
                if (value) el.innerHTML = value;
            });

            // 5. Special Renderers
            if (data.sponsors) renderSponsors(data.sponsors);
            if (data.config && data.config.countdown_target) startFestivalCountdown(data.config.countdown_target, data.config.countdown_end_html);

        } catch (error) {
            console.error('Error loading site data:', error);
        }
    };

    const getNestedValue = (obj, path) => {
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : null;
        }, obj);
    };

    const renderSponsors = (sponsors) => {
        const container = document.querySelector('.sponsor-grid');
        if (!container) return;

        container.innerHTML = sponsors.map(sponsor => `
            <a href="${sponsor.url}" target="_blank" rel="noopener noreferrer" class="sponsor-tile">
                <img src="${sponsor.image}" alt="${sponsor.name}">
                <span class="sponsor-name">${sponsor.name}</span>
            </a>
        `).join('');
    };

    // Festival Countdown Logic (Moved inside data loading for dynamic date)
    const startFestivalCountdown = (targetDateStr, endHtml) => {
        const daysEl = document.getElementById("days");
        if (!daysEl) return;

        const festivalCountDownDate = new Date(targetDateStr).getTime();

        // Opening time display
        const openingTimeEl = document.getElementById("opening-time");
        if (openingTimeEl) {
            const d = new Date(festivalCountDownDate);
            openingTimeEl.innerText = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }

        const countdownFunction = setInterval(function () {
            const now = new Date().getTime();
            const distance = festivalCountDownDate - now;

            if (distance < 0) {
                clearInterval(countdownFunction);
                const countdownCard = document.querySelector('.countdown-card');
                if (countdownCard && endHtml) {
                    countdownCard.innerHTML = endHtml;
                }
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const hoursEl = document.getElementById("hours");
            const minutesEl = document.getElementById("minutes");
            const secondsEl = document.getElementById("seconds");

            if (daysEl) daysEl.innerText = days.toString().padStart(2, '0');
            if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, '0');
            if (minutesEl) minutesEl.innerText = minutes.toString().padStart(2, '0');
            if (secondsEl) secondsEl.innerText = seconds.toString().padStart(2, '0');
        }, 1000);
    };

    loadSiteData();

    /* ===============================================================
       Utility Functions
    =============================================================== */
    // Simple throttle function (replacement for debounce in resize)
    const throttle = (func, limit) => {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    /* ===============================================================
       Responsive & Menu Handling
    =============================================================== */
    const body = document.body;
    const menubar = document.getElementById('menubar');
    const menubarHdr = document.getElementById('menubar_hdr');
    const BREAKPOINT = 900;

    const handleScreenSize = () => {
        const width = window.innerWidth;
        if (width < BREAKPOINT) {
            body.classList.remove('large-screen');
            body.classList.add('small-screen');
        } else {
            body.classList.remove('small-screen');
            body.classList.add('large-screen');
            // Reset mobile menu state when switching to desktop
            if (menubar) menubar.classList.remove('is-open');
            if (menubarHdr) menubarHdr.classList.remove('ham');
            body.classList.remove('no-scroll');
        }
    };

    // Initial check and event listener
    handleScreenSize();
    window.addEventListener('resize', throttle(handleScreenSize, 100));

    // Hamburger Menu Click
    if (menubarHdr && menubar) {
        menubarHdr.addEventListener('click', () => {
            menubarHdr.classList.toggle('ham');
            menubar.classList.toggle('is-open');
            body.classList.toggle('no-scroll');
        });
    }

    // Mobile Dropdown Toggle
    const mobileDropdownLinks = document.querySelectorAll('.small-screen .ddmenu_parent > a');
    // Delegation isn't strictly necessary but helpful if we dynamically added items. 
    // Here direct binding is fine since we switch classes on body.
    // However, the class .small-screen is on body, so we check that condition inside or delegate.

    // Better approach: Delegate click on document for mobile menu links
    document.addEventListener('click', (e) => {
        if (!body.classList.contains('small-screen')) return;

        const target = e.target.closest('.ddmenu_parent > a');
        if (target && target.getAttribute('href') === '#') {
            e.preventDefault();
            target.classList.toggle('is-active');
            // Logic for finding the submenu wrapper
            const submenu = target.nextElementSibling;
            if (submenu) {
                // Toggle display using a class or style
                if (submenu.style.display === 'block') {
                    submenu.style.display = 'none';
                } else {
                    submenu.style.display = 'block';
                }
            }
        }
    });

    /* ===============================================================
       Smooth Scroll
    =============================================================== */
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    // Computed style might return string "70px", parseFloat it
    const headerMarginTop = header ? parseFloat(getComputedStyle(header).marginTop) || 0 : 0;
    const totalHeaderOffset = headerHeight + headerMarginTop;

    const topButton = document.querySelector('.pagetop');

    const smoothScroll = (targetSel) => {
        if (targetSel === '#') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const targetEl = document.querySelector(targetSel);
        if (targetEl) {
            const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: targetPosition - totalHeaderOffset,
                behavior: 'smooth'
            });
        }
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            smoothScroll(href);
        });
    });

    // Back to top button visibility
    if (topButton) {
        topButton.style.display = 'none'; // Initial state
        window.addEventListener('scroll', () => {
            if (window.scrollY >= 300) {
                if (topButton.style.display !== 'block') {
                    topButton.style.display = 'block';
                    topButton.classList.add('pagetop-show'); // optional animation class
                    // simple fade in can be done via CSS transitions on opacity
                }
            } else {
                if (topButton.style.display !== 'none') {
                    topButton.style.display = 'none';
                    topButton.classList.remove('pagetop-show');
                }
            }
        });
    }

    // Handle initial hash based scroll
    if (window.location.hash) {
        // slight delay to ensure layout is settled
        setTimeout(() => smoothScroll(window.location.hash), 100);
    }

    /* ===============================================================
       Accordion (Generic Open/Close)
    =============================================================== */
    const accordions = document.querySelectorAll('.openclose-parts');
    accordions.forEach(acc => {
        // Hide content initially
        const content = acc.nextElementSibling;
        if (content) content.style.display = 'none';

        acc.addEventListener('click', function () {
            // Close others (optional, based on original behavior)
            accordions.forEach(otherAcc => {
                if (otherAcc !== this) {
                    const otherContent = otherAcc.nextElementSibling;
                    if (otherContent) otherContent.style.display = 'none';
                }
            });

            // Toggle current
            if (content.style.display === 'none') {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        });
    });

    /* ===============================================================
       Fade In Text (Intersection Observer)
    =============================================================== */
    const fadeInElements = document.querySelectorAll('.fade-in-text');
    if (fadeInElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    if (!el.dataset.animated) {
                        const text = el.textContent.trim();
                        el.textContent = '';
                        // Create spans
                        [...text].forEach((char, i) => {
                            const span = document.createElement('span');
                            span.textContent = char;
                            span.classList.add('char');
                            span.style.animationDelay = `${i * 0.2}s`;
                            el.appendChild(span);
                        });
                        el.style.visibility = 'visible';
                        el.dataset.animated = 'true';
                    }
                }
            });
        }, { threshold: 0.1 });

        fadeInElements.forEach(el => observer.observe(el));
    }

    /* ===============================================================
       Thumbnail Switcher
    =============================================================== */
    // Setup initial state
    document.querySelectorAll('.thumbnail-view-parts').forEach(view => {
        // Find corresponding thumbnail parts (assumed to be next sibling)
        const partsWrapper = view.nextElementSibling;
        if (partsWrapper && partsWrapper.classList.contains('thumbnail-parts')) {
            const firstImg = partsWrapper.querySelector('img');
            if (firstImg) {
                const mainImg = document.createElement('img');
                mainImg.src = firstImg.src;
                view.appendChild(mainImg);
            }
        }
    });

    // Click handler
    document.querySelectorAll('.thumbnail-parts img').forEach(thumb => {
        thumb.addEventListener('click', function () {
            const src = this.src;
            // Find parent wrapper then previous sibling for the view
            const wrapper = this.closest('.thumbnail-parts');
            const view = wrapper.previousElementSibling;
            if (view && view.classList.contains('thumbnail-view-parts')) {
                const currentImg = view.querySelector('img');
                // Simple opacity transition
                if (currentImg) {
                    currentImg.style.opacity = 0;
                    setTimeout(() => {
                        currentImg.src = src;
                        currentImg.style.opacity = 1;
                    }, 400); // match css transition time
                }
            }
        });
    });

    /* ===============================================================
       Slideshow
    =============================================================== */
    const slides = document.querySelectorAll('#mainimg .slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        slides[0].style.opacity = 1;
        slides[0].classList.add('active');

        setInterval(() => {
            const nextSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].style.opacity = 0;
            slides[currentSlide].classList.remove('active');

            slides[nextSlide].style.opacity = 1;
            slides[nextSlide].classList.add('active');

            currentSlide = nextSlide;
        }, 4000);
    }

    /* ===============================================================
       Festival Countdown (Handled in loadSiteData)
    =============================================================== */
    // Old logic removed


    /* ===============================================================
       Bus Schedule Countdown
    =============================================================== */
    const countdownDisplayEl = document.getElementById('bus-countdown-display');
    if (countdownDisplayEl) {
        const nextBusTimeEl = document.getElementById('next-bus-time');
        const busScheduleNoteEl = document.getElementById('bus-schedule-note');
        const nextBusInfoEl = document.querySelector('p.next-bus-info');

        const fetchTimetable = async () => {
            try {
                const response = await fetch('js/timetable.json');
                if (!response.ok) throw new Error('時刻表ファイルが読み込めませんでした。');
                return await response.json();
            } catch (error) {
                console.error(error);
                if (countdownDisplayEl) countdownDisplayEl.innerHTML = "<p>時刻表データを取得できませんでした。</p>";
                return null;
            }
        };

        fetchTimetable().then(timetable => {
            if (!timetable) return;

            const updateBusCountdown = () => {
                const now = new Date();
                const day = now.getDay();
                const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

                let schedule;
                if (day === 6) { // Saturday
                    schedule = timetable.saturday;
                    if (busScheduleNoteEl) {
                        busScheduleNoteEl.textContent = "";
                        busScheduleNoteEl.style.display = "none";
                    }
                } else if (day === 0) { // Sunday
                    schedule = timetable.sunday;
                    if (busScheduleNoteEl) {
                        busScheduleNoteEl.textContent = "";
                        busScheduleNoteEl.style.display = "none";
                    }
                } else { // Weekday
                    schedule = timetable.weekday;
                    if (busScheduleNoteEl) {
                        busScheduleNoteEl.textContent = "※表示は平日ダイヤです。技科大祭当日の土日ダイヤとは異なります。";
                        busScheduleNoteEl.style.display = "block";
                    }
                }

                if (!schedule) return;

                let nextBus = schedule.find(time => time > currentTime);
                let nextBusDate = new Date();

                if (!nextBus) {
                    const tomorrow = new Date();
                    tomorrow.setDate(now.getDate() + 1);
                    const tomorrowDay = tomorrow.getDay();

                    let tomorrowSchedule;
                    if (tomorrowDay === 6) { tomorrowSchedule = timetable.saturday; }
                    else if (tomorrowDay === 0) { tomorrowSchedule = timetable.sunday; }
                    else { tomorrowSchedule = timetable.weekday; }

                    if (tomorrowSchedule && tomorrowSchedule.length > 0) {
                        nextBus = tomorrowSchedule[0];
                        nextBusDate = tomorrow;
                    }
                }

                if (!nextBus) {
                    countdownDisplayEl.innerHTML = "<p>次のバス情報が見つかりません。</p>";
                    if (nextBusTimeEl) nextBusTimeEl.textContent = "--:--";
                    return;
                }

                const [hours, minutes] = nextBus.split(':');
                nextBusDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                const distance = nextBusDate.getTime() - now.getTime();

                if (distance > 3600000) { // More than 1 hour
                    countdownDisplayEl.innerHTML = `<p style="font-size: 1.1rem; font-weight: 500;">次のバスは <strong>${nextBus}</strong> 発です</p>`;
                    if (nextBusInfoEl) nextBusInfoEl.style.display = 'none';
                } else {
                    if (nextBusInfoEl) nextBusInfoEl.style.display = 'block';

                    // Re-render HTML structure if it was overwritten
                    if (!document.getElementById('bus-minutes')) {
                        countdownDisplayEl.innerHTML = `
                            <p>次のバスまであと</p>
                            <div class="time-container">
                                <span id="bus-minutes">--</span><small>分</small>
                                <span id="bus-seconds">--</span><small>秒</small>
                            </div>
                        `;
                    }

                    const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const secs = Math.floor((distance % (1000 * 60)) / 1000);

                    const busMinutesEl = document.getElementById('bus-minutes');
                    const busSecondsEl = document.getElementById('bus-seconds');

                    if (busMinutesEl) busMinutesEl.textContent = mins.toString().padStart(2, '0');
                    if (busSecondsEl) busSecondsEl.textContent = secs.toString().padStart(2, '0');
                    if (nextBusTimeEl) nextBusTimeEl.textContent = nextBus + " 発";
                }
            };

            setInterval(updateBusCountdown, 1000);
            updateBusCountdown();
        });
    }

});
