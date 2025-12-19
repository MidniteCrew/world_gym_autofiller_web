/**
 * World Gym - Guest Autofiller
 * 
 * @author: Gabriel Ungur
 */

const $ = (id) => document.getElementById(id);

// Cache inputs
const els = {
  email: $("email"),
  firstName: $("firstName"),
  lastName: $("lastName"),
  year: $("year"),
  street: $("street"),
  city: $("city"),
  state: $("state"),
  postal: $("postal"),
  phone: $("phone"),
  promo: $("promo"),
  guestType: $("guestType"),
  gender: $("gender"),
  status: $("status"),
  bookmarkletBox: $("bookmarkletBox"),
};

const btns = {
  save: $("saveBtn"), // generates bookmark with saved data
  copy: $("copyBookmarkletBtn"), // copy
};

/**
 * Status text
 */
function setStatus(msg) {
  if (!els.status) return;
  els.status.textContent = msg || "";
}

/**
 * format phone as xxx-xxx-xxxx
 */
function formatPhone(input) {
  const digits = (input || "").replace(/\D/g, "").slice(0, 10);
  if (digits.length < 10) return input;
  return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
}

/**
 * Update guest type (e.g. member of VIP)
 */
function updatePromoVisibility() {
  const needsCode = ["GVM", "PD"].includes(els.guestType?.value);
  if (!els.promo) return;

  els.promo.required = needsCode;
  if (!needsCode) els.promo.value = "";
}

els.guestType?.addEventListener("change", () => {
  updatePromoVisibility();
});

/**
 * read user input
 */
function readForm() {
  const v = (el) => (el?.value ?? "").trim();

  return {
    email: v(els.email),
    firstName: v(els.firstName),
    lastName: v(els.lastName),
    year: v(els.year),
    street: v(els.street),
    city: v(els.city),
    state: v(els.state),
    postal: v(els.postal),
    phone: formatPhone(v(els.phone)),
    promo: v(els.promo),
    guestType: v(els.guestType),
    gender: els.gender?.value ?? "",
  };
}

/**
 * build the JS payload
 */
function buildBookmarkletPayload(data) {
  return `
(() => {
  const data = ${JSON.stringify(data)};

  const waitFor = (selector, cb) => {
    if (document.querySelector(selector)) return cb();
    new MutationObserver((_, obs) => {
      if (!document.querySelector(selector)) return;
      obs.disconnect();
      cb();
    }).observe(document.body, { childList: true, subtree: true });
  };

  const set = (selector, val) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.value = val || "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const click = (selector) => document.querySelector(selector)?.click();

  waitFor("#Email", () => {
    set("#Email", data.email);
    set("#FirstName", data.firstName);
    set("#LastName", data.lastName);
    set("#YearOfBirth", data.year);
    set("#StreetAddress", data.street);
    set("#City", data.city);
    set("#StateProv", data.state);
    set("#PostalCode", data.postal);
    set("#PhoneMobile", data.phone);
    set("#PromoCode", data.promo);

    const gt = document.querySelector("#GuestPassType");
    if (gt && data.guestType) {
      gt.value = data.guestType;
      gt.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (data.gender === "M") click("#GenderM");
    if (data.gender === "F") click("#GenderF");

    [
      "#GuestServicesAgreement1",
      "#GuestServicesAgreement2",
      "#GuestServicesAgreement3",
      "#Agreement",
    ].forEach(click);
  });
})();
`.trim();
}

/**
 * turn JS into a URL (for bookmark)
 */
function toBookmarklet(js) {
  return (
    "javascript:" +
    js
      .replace(/\/\*[\s\S]*?\*\//g, "") // strip block comments
      .replace(/\/\/.*$/gm, "") // strip line comments
      .replace(/\s+/g, " ") // remove whitespace
      .trim()
  );
}

/**
 * Generate + show the bookmarklet snippet
 */
function refreshBookmarklet(loud = true) {
  if (!els.bookmarkletBox) return;

  updatePromoVisibility();
  const data = readForm();
  const payload = buildBookmarkletPayload(data);
  els.bookmarkletBox.value = toBookmarklet(payload);

  if (loud) setStatus("Bookmark URL updated. Copy it and paste it into your bookmark URL.");
}

/**
 * copy the bookmarklet to clipboard
 */
async function copyBookmarklet() {
  refreshBookmarklet(false);

  const text = els.bookmarkletBox?.value || "";
  if (!text) {
    setStatus("Couldn’t generate the bookmarklet. (Missing bookmarkletBox?)");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied. Now paste it into your bookmark URL.");
  } catch {
    els.bookmarkletBox.focus();
    els.bookmarkletBox.select();
    document.execCommand("copy");
    setStatus("Selected. Copy it manually, then paste into your bookmark URL.");
  }
}

// buttons
btns.copy?.addEventListener("click", copyBookmarklet);

// “save”: update the generated bookmarklet snippet.
btns.save?.addEventListener("click", () => refreshBookmarklet(true));

// init
refreshBookmarklet(false);
setStatus("Fill your info, then tap Save (or Copy bookmarklet).");