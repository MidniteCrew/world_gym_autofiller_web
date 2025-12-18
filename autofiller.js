const STORAGE_KEY = "wg_formData_v1"; // store on user device

    const els = {
      email:      document.getElementById("email"),
      firstName:  document.getElementById("firstName"),
      lastName:   document.getElementById("lastName"),
      year:       document.getElementById("year"),
      street:     document.getElementById("street"),
      city:       document.getElementById("city"),
      state:      document.getElementById("state"),
      postal:     document.getElementById("postal"),
      phone:      document.getElementById("phone"),
      promo:      document.getElementById("promo"),
      guestType:  document.getElementById("guestType"),
      gender:     document.getElementById("gender"),
      status:     document.getElementById("status"),
      bookmarkletBox: document.getElementById("bookmarkletBox"),
    };

    function updatePromoVisibility() {
      const gt = els.guestType.value;
      if (gt === "GVM" || gt === "PD") {
        els.promo.parentElement.style.display = "";
        els.promo.required = true;
      } else {
        els.promo.required = false;
        els.promo.value = "";
        els.promo.parentElement.style.display = "";
      }
    }

    els.guestType.addEventListener("change", updatePromoVisibility);

    function getDataFromInputs() {
      return {
        email: els.email.value.trim(),
        firstName: els.firstName.value.trim(),
        lastName: els.lastName.value.trim(),
        year: els.year.value.trim(),
        street: els.street.value.trim(),
        city: els.city.value.trim(),
        state: els.state.value.trim(),
        postal: els.postal.value.trim(),
        phone: els.phone.value.trim(),
        promo: els.promo.value.trim(),
        guestType: els.guestType.value.trim(),
        gender: els.gender.value,
      };
    }

    function setInputsFromData(d) {
      els.email.value = d.email || "";
      els.firstName.value = d.firstName || "";
      els.lastName.value = d.lastName || "";
      els.year.value = d.year || "";
      els.street.value = d.street || "";
      els.city.value = d.city || "";
      els.state.value = d.state || "";
      els.postal.value = d.postal || "";
      els.phone.value = d.phone || "";
      els.promo.value = d.promo || "";
      els.guestType.value = d.guestType || "";
      els.gender.value = d.gender || "";
    }

    function save() {
      const data = getDataFromInputs();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      els.status.textContent = "Saved on this device.";
      refreshBookmarklet();
    }

    function load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        els.status.textContent = "No saved data found.";
        refreshBookmarklet();
        return;
      }
      setInputsFromData(JSON.parse(raw));
      els.status.textContent = "Loaded.";
      refreshBookmarklet();
    }

    function clearSaved() {
      localStorage.removeItem(STORAGE_KEY);
      els.status.textContent = "Cleared.";
      refreshBookmarklet();
    }

    // --- Autofill payload to run on ggpx page ---
    // Uses your selectors and agreement-click logic.
    function buildAutofillIIFE() {
      // We inject the user's saved data directly into the bookmarklet at tap-time:
      const data = getDataFromInputs();

      // Minimal escaping for JS string literals:
      const esc = (s) => (s ?? "").replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");

      return `
(() => {
  const formData = ${JSON.stringify(data)};
  const startedAt = Date.now();
  const MAX_WAIT_MS = 8000;

  function waitFor(selector, callback) {
    const el = document.querySelector(selector);
    if (el) return callback(el);

    const timeout = setTimeout(() => {
      const existsNow = !!document.querySelector(selector);
      if (!existsNow) {
        alert("Autofill could not find " + selector + ". The form page may have changed.");
      }
    }, MAX_WAIT_MS);

    const obs = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (!found) return;
      clearTimeout(timeout);
      obs.disconnect();
      callback(found);
    });

    obs.observe(document.body, { childList: true, subtree: true });
  }

  function clickAgreement(inputSelector) {
    const input = document.querySelector(inputSelector);
    if (!input) return false;
    if (input.disabled) return false;
    if (input.checked === true) return true;

    try {
      input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
      input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      input.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }));
      input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      input.click();
    } catch (_) {}

    if (input.checked === true) return true;

    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
    const nativeCheckedSetter = desc && typeof desc.set === 'function' ? desc.set : null;
    if (nativeCheckedSetter) nativeCheckedSetter.call(input, true);
    else input.checked = true;

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    const clickable = input.closest('label') || input.parentElement;
    if (clickable) {
      try { clickable.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch (_) {}
    }
    return input.checked === true;
  }

  function runAutofill() {
    waitFor('#Email', () => {
      const $ = s => document.querySelector(s);

      // Text fields
      if ($('#Email')) $('#Email').value = formData.email || '';
      if ($('#FirstName')) $('#FirstName').value = formData.firstName || '';
      if ($('#LastName')) $('#LastName').value = formData.lastName || '';
      if ($('#YearOfBirth')) $('#YearOfBirth').value = formData.year || '';
      if ($('#StreetAddress')) $('#StreetAddress').value = formData.street || '';
      if ($('#City')) $('#City').value = formData.city || '';
      if ($('#StateProv')) $('#StateProv').value = formData.state || '';
      if ($('#PostalCode')) $('#PostalCode').value = formData.postal || '';
      if ($('#PhoneMobile')) $('#PhoneMobile').value = formData.phone || '';
      if ($('#PromoCode')) $('#PromoCode').value = formData.promo || '';

      // Guest type
      const guestType = $('#GuestPassType');
      if (guestType && formData.guestType) {
        guestType.value = formData.guestType;
        guestType.dispatchEvent(new Event('input', { bubbles: true }));
        guestType.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Gender
      const male = $('#GenderM');
      const female = $('#GenderF');
      if (male) male.checked = false;
      if (female) female.checked = false;
      if (formData.gender === 'M' && male) male.checked = true;
      if (formData.gender === 'F' && female) female.checked = true;
      male?.dispatchEvent(new Event('change', { bubbles: true }));
      female?.dispatchEvent(new Event('change', { bubbles: true }));

      // Agreements
      const agreementSelectors = [
        '#GuestServicesAgreement1',
        '#GuestServicesAgreement2',
        '#GuestServicesAgreement3',
        '#Agreement'
      ];

      let attempts = 0;
      const maxAttempts = 12;
      const interval = setInterval(() => {
        attempts++;
        const results = agreementSelectors.map(sel => document.querySelector(sel) ? clickAgreement(sel) : false);
        const allChecked = results.every(Boolean);
        if (allChecked || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 250);
    });
  }

  runAutofill();
})();
      `.trim();
    }

    function toBookmarklet(js) {
      // Make it bookmark-friendly: remove newlines and extra spaces
      const min = js
        .replace(/\/\*[\s\S]*?\*\//g, "")   // strip block comments
        .replace(/\/\/.*$/gm, "")           // strip line comments
        .replace(/\s+/g, " ")               // collapse whitespace
        .trim();

      return "javascript:" + min;
    }

    function refreshBookmarklet() {
      const iife = buildAutofillIIFE();
      const bm = toBookmarklet(iife);
      els.bookmarkletBox.value = bm;
    }

    async function copyBookmarklet() {
      refreshBookmarklet();
      const text = els.bookmarkletBox.value || "";
      try {
        await navigator.clipboard.writeText(text);
        els.status.textContent = "Bookmarklet copied.";
      } catch {
        els.bookmarkletBox.focus();
        els.bookmarkletBox.select();
        document.execCommand("copy");
        els.status.textContent = "Bookmarklet selected — copy it manually.";
      }
    }

    document.getElementById("saveBtn").addEventListener("click", save);
    document.getElementById("loadBtn").addEventListener("click", load);
    document.getElementById("clearBtn").addEventListener("click", clearSaved);
    document.getElementById("copyBookmarkletBtn").addEventListener("click", copyBookmarklet);

    // Init
    load();