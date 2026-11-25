(() => {
  const C = CONFIG, N = C.negocio, T = C.tema;
  const $ = (s, r = document) => r.querySelector(s);
  const e = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wa = msg => `https://wa.me/${N.whatsapp}?text=${encodeURIComponent(msg || N.whatsappMensaje)}`;
  const tel = `tel:${N.telefono.replace(/[^\d+]/g, "")}`;
  const stars = n => `<span class="stars" aria-label="${n} de 5">${"★".repeat(Math.round(n))}${"☆".repeat(5 - Math.round(n))}</span>`;

  // ---------- Tema ----------
  const r = document.documentElement.style;
  r.setProperty("--c", T.colorPrincipal); r.setProperty("--bg", T.fondo);
  r.setProperty("--sf", T.fondoAlterno); r.setProperty("--tx", T.texto);
  r.setProperty("--r", T.radio); r.setProperty("--ft", `"${T.fuenteTitulos}"`); r.setProperty("--fb", `"${T.fuenteTexto}"`);
  // ---------- SEO ----------
  document.title = N.seoTitle || `${N.nombre} | ${N.sector}${C.ubicacion ? " en " + C.ubicacion.direccion.split(",").pop().trim().replace(/^\d+\s*/, "") : ""}`;
  const description = $('meta[name=description]');
  if (description) description.content = N.seoDescription || `${N.eslogan}. ${C.hero?.subtitulo || ""}`.slice(0, 158);
  const ld = {
    "@context": "https://schema.org", "@type": "LocalBusiness", name: N.nombre, description: N.eslogan,
    telephone: N.telefono, address: {
      "@type": "PostalAddress", streetAddress: C.ubicacion?.direccion,
      addressLocality: "Utiel", addressRegion: "Valencia", postalCode: "46300", addressCountry: "ES"
    },
    openingHoursSpecification: C.ubicacion.horario.flatMap(schedule => schedule.periodos.flatMap(period => schedule.dias.map(day => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]}`,
      opens: period.inicio,
      closes: period.fin
    }))))
  };
  if (N.web) ld.url = N.web;
  if (N.email) ld.email = N.email;
  const reviewCount = Number(C.resenas?.total);
  if (C.resenas && Number.isFinite(reviewCount) && reviewCount > 0) {
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: C.resenas.puntuacion, reviewCount };
  }
  document.head.insertAdjacentHTML("beforeend", `<script type="application/ld+json">${JSON.stringify(ld)}</script>`);

  // ---------- Secciones ----------
  const H = C.hero, G = C.galeria, S = C.nosotros, R = C.resenas, U = C.ubicacion, F = C.faq, X = C.ctaFinal;
  const nav = [["inicio", "Inicio"], S && ["nosotros", "Quién es Ana"], G && [G.id, "Tratamientos"], C.carta && ["precios", "Precios"], U && ["contacto", "Contacto"]].filter(Boolean);
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const monthNames = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
  const weekdayNames = ["L", "M", "X", "J", "V", "S", "D"];
  const scheduleText = U.horario.map(({ etiqueta, periodos }) => `${etiqueta}: ${periodos.map(({ inicio, fin }) => `${inicio} a ${fin}`).join(" y ")}`).join("; ");
  const appointmentTimesFor = date => {
    if (!date) return [];
    const [year, month, day] = date.split("-").map(Number);
    const weekday = new Date(year, month - 1, day).getDay();
    const schedule = U.horario.find(({ dias }) => dias.includes(weekday));
    if (!schedule) return [];
    return schedule.periodos.flatMap(({ inicio, fin }) => {
      const [startHour, startMinute] = inicio.split(":").map(Number);
      const [endHour, endMinute] = fin.split(":").map(Number);
      const slots = [];
      for (let minutes = startHour * 60 + startMinute; minutes < endHour * 60 + endMinute; minutes += 30) {
        slots.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
      }
      return slots;
    });
  };
  const formatDate = date => {
    const [year, month, day] = date.split("-").map(Number);
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(year, month - 1, day));
  };
  let visibleMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const calendarMarkup = selectedDate => {
    const year = visibleMonth.getFullYear(), month = visibleMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: offset }, () => '<span class="calendar-empty" aria-hidden="true"></span>');
    for (let day = 1; day <= count; day++) {
      const date = [year, String(month + 1).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
      const current = date === today, selected = date === selectedDate;
      const weekday = new Date(year, month, day).getDay();
      const unavailable = !U.horario.some(schedule => schedule.dias.includes(weekday));
      days.push(`<button class="calendar-day${current ? " is-today" : ""}${selected ? " is-selected" : ""}" type="button" data-calendar-date="${date}" aria-label="${day} de ${monthNames.format(new Date(year, month, 1))}" aria-pressed="${selected}"${date < today || unavailable ? " disabled" : ""}>${day}</button>`);
    }
    return `<div class="calendar-heading"><button type="button" class="calendar-nav" data-calendar-month="-1" aria-label="Mes anterior"${year === now.getFullYear() && month === now.getMonth() ? " disabled" : ""}>‹</button><h4 aria-live="polite">${e(monthNames.format(visibleMonth))}</h4><button type="button" class="calendar-nav" data-calendar-month="1" aria-label="Mes siguiente">›</button></div>
      <div class="calendar-weekdays" aria-hidden="true">${weekdayNames.map(day => `<span>${day}</span>`).join("")}</div><div class="calendar-days" aria-label="Días del mes">${days.join("")}</div>`;
  };

  const header = `<header class="hd"><div class="w"><a class="logo" href="#inicio" aria-label="${e(N.nombre)} Estética y Bienestar"><img src="media/logo-ana-marquez.jpeg" alt="${e(N.nombre)} · Beauty, Skin, Body, Care"></a>
    <nav>${nav.map(([id, t]) => `<a href="#${id}">${t}</a>`).join("")}${Object.entries(N.redes || {}).filter(([, u]) => u).map(([k, u]) => `<a class="header-social" href="${e(u)}" target="_blank" rel="noopener" aria-label="${k === "instagram" ? "Instagram" : "Facebook"} de ${e(N.nombre)}">${k === "instagram" ? "IG" : "FB"}</a>`).join("")}<a class="btn s" href="#contacto">Pedir cita</a></nav></div></header>`;
  const promo = C.promo?.active ? `<aside class="promo"><div class="w"><span>${e(C.promo.text)}</span><a href="${wa(C.promo.whatsappMensaje || C.promo.text)}" target="_blank" rel="noopener">Consultar promoción <span aria-hidden="true">↗</span></a></div></aside>` : "";

  const hero = H && `<section class="hero" id="inicio"><div class="w"><div class="hero-copy">
    <h1>${e(H.titular)}</h1><p class="lead">${e(H.subtitulo)}</p>
    ${S ? `<div class="hero-owner" id="nosotros"><span class="eyebrow">Conoce a Ana Márquez</span><h2>${e(S.titulo)}</h2>
      <p>${e(S.texto || S.propietario?.texto || "")}</p>
      ${S.datos ? `<div class="facts">${S.datos.map(d => `<span>${e(d)}</span>`).join("")}</div>` : ""}
      ${S.fraseEstrella ? `<blockquote class="ana-quote"><p>“${e(S.fraseEstrella)}”</p><cite>— Ana Márquez</cite></blockquote>` : ""}</div>` : ""}
    <div class="acts"><a class="btn" href="#${G ? e(G.id) : "nosotros"}">${e(H.botonPrincipal)}</a>
    ${G ? `<a class="btn o" href="#contacto">${e(H.botonSecundario)}</a>` : ""}</div>
    ${H.puntos ? `<ul class="pts">${H.puntos.map(p => `<li>${e(p)}</li>`).join("")}</ul>` : ""}</div>
    <figure class="hero-portrait"><img src="media/ana-marquez-retrato.jpeg" alt="Ana Márquez, propietaria de Ana Márquez Estética &amp; Bienestar, en su centro de Utiel" fetchpriority="high"></figure>
    </div></section>`;

  const galeria = G && `<section class="alt" id="${e(G.id)}"><div class="w"><h2>${e(G.titulo)}</h2><p class="sub">${e(G.subtitulo)}</p>
    <div class="trk" id="trk">${G.items.map(i => `<details class="card card-text treatment-dropdown"><summary class="treatment-summary"><h3>${e(i.nombre)}</h3><span class="pr">${e(i.precio)}</span></summary>
      <div class="treatment-dropdown-content"><p class="mut">${e(i.descripcion)}</p>
      ${i.combinaCon ? `<p class="cmb">${e(G.textoCombina)} <b>${e(i.combinaCon)}</b></p>` : ""}
      <a class="btn o s" href="${wa("Hola, me interesa: " + i.nombre)}" target="_blank" rel="noopener">${e(G.botonItem)}</a></div></details>`).join("")}</div>
    </div></section>`;

  const carta = C.carta && `<section class="price-section" id="precios"><div class="w"><span class="eyebrow">Carta de tratamientos</span><h2>Precios &amp; experiencias</h2>
    <p class="sub">Elige tu momento de cuidado. Si tienes dudas sobre qué tratamiento elegir, estaremos encantadas de orientarte.</p><p class="vat-note">Todos los precios indicados incluyen IVA.</p>
    <div class="price-grid">${C.carta.map((category, index) => `<details class="price-card price-card-${index + 1}"><summary class="price-card-heading"><span class="price-number">0${index + 1}</span><div><h3>${e(category.titulo)}</h3><p>${e(category.descripcion)}</p></div></summary><div class="price-card-content">
      ${category.grupos ? category.grupos.map(group => `<div class="price-group"><h4>${e(group.titulo)}</h4>${group.nota ? `<p class="price-note">${e(group.nota)}</p>` : ""}<table><tbody>${group.servicios.map(([name, price]) => `<tr><td>${e(name)}</td><td>${e(price)}</td></tr>`).join("")}</tbody></table></div>`).join("") : `<table><tbody>${category.servicios.map(([name, price]) => `<tr><td>${e(name)}</td><td>${e(price)}</td></tr>`).join("")}</tbody></table>`}
      ${category.promocion ? `<p class="price-promo">${e(category.promocion)}</p>` : ""}</div></details>`).join("")}</div></div></section>`;

  const resenas = R && `<section class="alt" id="resenas"><div class="w"><h2>${e(R.titulo)}</h2>
    <div class="score"><b>${R.puntuacion}</b>${stars(R.puntuacion)}<span class="mut">${R.total}</span>
    <a class="btn o s" href="${e(R.enlaceGoogle)}" target="_blank" rel="noopener">Déjanos tu reseña</a></div>
    <div class="rv">${R.lista.map(v => `<blockquote>${stars(v.estrellas)}<p>${e(v.texto)}</p><b>${e(v.nombre)}</b> <span class="mut">· ${e(v.fecha)}</span></blockquote>`).join("")}</div></div></section>`;

  const faq = F && `<section class="alt"><div class="w"><h2>Preguntas frecuentes</h2><div style="margin-top:20px">${F.map(f => `<details><summary>${e(f.p)}</summary><p>${e(f.r)}</p></details>`).join("")}</div></div></section>`;

  const redes = Object.entries(N.redes || {}).filter(([, u]) => u).map(([k, u]) => `<a class="social-link" href="${e(u)}" target="_blank" rel="noopener" aria-label="Síguenos en ${e(k)}"><span>${k === "instagram" ? "Instagram" : "Facebook"} · @anamarquezesteticautiel</span></a>`).join("");
  const assistantWidget = `<button class="assistant-launcher" id="assistant-open" type="button" aria-haspopup="dialog" aria-controls="assistant-dialog">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 5.5h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-2.5L12 20l-1.5-2.5H8a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z"/><path d="M9 10h.01M15 10h.01M9 13.5c1.7 1.5 4.3 1.5 6 0"/></svg>
    <span>¿Dudas? Pregunta aquí</span></button>
    <dialog class="site-dialog assistant-dialog" id="assistant-dialog" aria-labelledby="assistant-title">
      <form method="dialog" class="dialog-head"><h2 id="assistant-title">Asistente de Ana</h2><button class="dialog-close" value="cancel" aria-label="Cerrar">×</button></form>
      <div class="dialog-body"><p>Puedo ayudarte con información sobre los tratamientos, precios, horario y ubicación.</p>
        <form class="assistant-form" id="assistant-question-form"><label for="assistant-question">¿Qué te gustaría saber?</label><textarea id="assistant-question" name="pregunta" maxlength="1000" required placeholder="Por ejemplo: ¿qué tratamiento facial me recomendáis?"></textarea><button class="btn" type="submit">Enviar consulta</button></form>
        <p class="assistant-status" id="assistant-status" role="status" aria-live="polite"></p>
        <a class="assistant-whatsapp" id="assistant-whatsapp" href="${wa()}" target="_blank" rel="noopener noreferrer">Prefiero hablar por WhatsApp ↗</a>
      </div>
    </dialog>`;
  const reserva = `<section class="booking-section" id="contacto"><div class="w booking-wrap"><div class="booking-copy"><span class="eyebrow">Elige tu cita</span><h2>${e(X.titulo)}</h2><p>${e(X.texto)}</p><p class="booking-address">${e(U.direccion)}</p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(U.mapaQuery)}" target="_blank" rel="noopener noreferrer">Cómo llegar <span aria-hidden="true">↗</span></a></div>
    <form class="booking-form" id="booking-form"><h3>Solicitar una cita</h3><label for="booking-name">Nombre completo</label><input id="booking-name" name="nombre" autocomplete="name" required>
      <label for="booking-phone">Teléfono</label><input id="booking-phone" name="telefono" type="tel" autocomplete="tel" inputmode="tel" required>
      <label for="booking-treatment">Tratamiento</label><select id="booking-treatment" name="tratamiento" required><option value="">Elige un tratamiento</option>${C.carta.map(item => `<option>${e(item.titulo)}</option>`).join("")}<option>Quiero que me orientéis</option></select>
      <span class="calendar-label">Selecciona el día de tu cita</span><input class="visually-hidden-control" id="booking-date" name="fecha" type="hidden">
      <div class="booking-calendar" id="booking-calendar" tabindex="-1">${calendarMarkup("")}</div>
      <p class="calendar-selection" id="calendar-selection" aria-live="polite">Selecciona un día en el calendario.</p>
      <div class="booking-field"><label for="booking-time">Hora preferida</label><select id="booking-time" name="hora" required><option value="">Selecciona primero un día</option></select><small>Horario: ${e(scheduleText)}</small></div>
      <label class="consent-option"><input name="privacidad" type="checkbox" required><span>He leído y acepto la <a href="#politica-privacidad" data-legal-dialog="politica-privacidad">Política de Privacidad</a>.</span></label>
      <label class="consent-option"><input name="promociones" type="checkbox"><span>Acepto recibir promociones comerciales por WhatsApp. (Opcional)</span></label>
      <button class="btn" type="submit">Enviar solicitud por WhatsApp</button><p class="form-note">La cita y la hora quedan pendientes de confirmación del centro. Al continuar, se abrirá WhatsApp con los datos de esta solicitud para que puedas enviarlos.</p></form></div></section>`;
  const footer = `<footer><div class="w footer-grid"><div class="footer-brand"><a class="logo" href="#inicio" aria-label="${e(N.nombre)}"><img src="media/logo-ana-marquez.jpeg" alt="${e(N.nombre)} · Beauty, Skin, Body, Care"></a><p>El equilibrio entre la belleza natural y el bienestar mediterráneo.</p></div>
    <div class="footer-contact"><h2>Visítanos</h2><address>${e(U.direccion)}</address><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(U.mapaQuery)}" target="_blank" rel="noopener">Cómo llegar <span aria-hidden="true">↗</span></a></div>
    <div class="footer-contact"><h2>Hablemos</h2><a href="${tel}">${e(N.telefono)}</a>${N.telefonoAlt ? `<a href="tel:${N.telefonoAlt.replace(/[^\d+]/g, "")}">${e(N.telefonoAlt)}</a>` : ""}
      <a href="${wa()}" target="_blank" rel="noopener">Escribir por WhatsApp <span aria-hidden="true">↗</span></a><p class="footer-hours">Horario: ${e(scheduleText)}.</p>${redes}</div>
    <div class="footer-map" id="map-container"><div class="map-placeholder"><p>Estamos en Utiel</p><button class="btn o s" type="button" id="load-map">Cargar mapa de Google</button></div><iframe title="Mapa de ${e(C.ubicacionLocal)} para llegar a ${e(N.nombre)}" loading="lazy" data-src="https://maps.google.com/maps?output=embed&q=${encodeURIComponent(U.mapaQuery)}&t=&z=16" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${e(N.nombre)}</span><nav class="legal-links" aria-label="Información legal"><a href="#aviso-legal" data-legal-dialog="aviso-legal">Aviso Legal</a><a href="#politica-privacidad" data-legal-dialog="politica-privacidad">Política de Privacidad</a><a href="#politica-cookies" data-legal-dialog="politica-cookies">Política de Cookies</a><button type="button" id="open-cookie-settings">Configurar cookies</button><a class="vat-footer" href="#price-details" data-legal-dialog="price-details">Precios con IVA incluido</a></nav></div></div></footer>
    <div class="fl">${Object.entries(N.redes || {}).filter(([, u]) => u).map(([k, u]) => `<a class="so" href="${e(u)}" target="_blank" rel="noopener" aria-label="${k}">${{ instagram: "IG", facebook: "FB", tiktok: "TT" }[k] || k.slice(0, 2).toUpperCase()}</a>`).join("")}<a class="wf" href="${wa()}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">WhatsApp</a></div>
    <div class="mb"><a class="btn o" href="${tel}">Llamar</a><a class="btn" href="${wa()}" target="_blank" rel="noopener">WhatsApp</a></div>
    <section class="cookie-banner" id="cookie-banner" aria-label="Preferencias de cookies" aria-live="polite" hidden><div><h2>Tu privacidad importa</h2><p>Usamos almacenamiento local para recordar esta elección. Google Maps solo se carga si lo autorizas; puedes consultar nuestra <a href="#politica-cookies" data-legal-dialog="politica-cookies">Política de Cookies</a>.</p><p class="cookie-error" id="cookie-error" role="alert" hidden>No se pudo guardar tu elección. Revisa la configuración de almacenamiento del navegador e inténtalo de nuevo.</p></div><div class="cookie-actions"><button class="btn o s" type="button" data-cookie-action="necessary">Solo necesarias</button><button class="btn o s" type="button" data-cookie-action="configure">Configurar</button><button class="btn s" type="button" data-cookie-action="all">Aceptar todas</button></div></section>
    <dialog class="site-dialog cookie-dialog" id="cookie-settings-dialog" aria-labelledby="cookie-settings-title"><form method="dialog" class="dialog-head"><h2 id="cookie-settings-title">Configurar cookies</h2><button class="dialog-close" value="cancel" aria-label="Cerrar">×</button></form><div class="dialog-body"><p>Este sitio no usa cookies de analítica o publicidad. Guardamos tu elección en el almacenamiento local del navegador. Puedes autorizar opcionalmente la carga del mapa de Google; ese servicio externo puede tratar datos de navegación.</p><label class="consent-option"><input type="checkbox" checked disabled><span>Almacenamiento de preferencias necesarias (siempre activo).</span></label><label class="consent-option"><input id="cookie-maps" type="checkbox"><span>Contenido externo: mapa de Google.</span></label><p class="dialog-note">Puedes cambiar esta elección cuando quieras desde «Configurar cookies» en el pie de página.</p></div><div class="dialog-actions"><button class="btn o" type="button" data-cookie-action="necessary">Solo necesarias</button><button class="btn o" type="button" data-cookie-action="all">Aceptar todas</button><button class="btn" type="button" id="save-cookie-settings">Guardar elección</button></div></dialog>
    <dialog class="site-dialog legal-dialog" id="aviso-legal" aria-labelledby="legal-notice-title"><form method="dialog" class="dialog-head"><h2 id="legal-notice-title">Aviso Legal</h2><button class="dialog-close" value="cancel" aria-label="Cerrar">×</button></form><div class="dialog-body"><h3>Titular del sitio web</h3><p><strong>Nombre comercial:</strong> Ana Márquez Estética &amp; Bienestar.</p><p><strong>Titular indicado:</strong> Ana Márquez.</p><p><strong>Actividad:</strong> Servicios de estética en Utiel.</p><p><strong>Domicilio profesional:</strong> ${e(U.direccion)}.</p><p><strong>Teléfono de contacto:</strong> <a href="${tel}">${e(N.telefono)}</a>${N.telefonoAlt ? ` / <a href="tel:${N.telefonoAlt.replace(/[^\d+]/g, "")}">${e(N.telefonoAlt)}</a>` : ""}.</p><p><strong>NIF del titular:</strong> pendiente de facilitar.</p><p><strong>Correo electrónico de contacto:</strong> pendiente de facilitar.</p><h3>Condiciones de uso</h3><p>El acceso y uso de este sitio implica utilizar sus contenidos conforme a la legislación vigente. La información de servicios y tarifas es informativa y la solicitud de cita está sujeta a confirmación expresa del centro.</p><p class="dialog-note">El domicilio profesional y el teléfono indicados han sido confirmados. La denominación legal completa del titular (por ahora figura «Ana Márquez»), su NIF y el correo electrónico oficial siguen pendientes de verificación y deben completarse antes de publicar el aviso legal definitivo.</p></div></dialog>
    <dialog class="site-dialog legal-dialog" id="politica-privacidad" aria-labelledby="privacy-title"><form method="dialog" class="dialog-head"><h2 id="privacy-title">Política de Privacidad</h2><button class="dialog-close" value="cancel" aria-label="Cerrar">×</button></form><div class="dialog-body"><h3>Responsable</h3><p><strong>Responsable:</strong> Ana Márquez · Ana Márquez Estética &amp; Bienestar.</p><p><strong>Dirección:</strong> ${e(U.direccion)}.</p><p><strong>Teléfono:</strong> <a href="${tel}">${e(N.telefono)}</a>. El correo electrónico del responsable está pendiente de facilitar.</p><h3>Datos y finalidades</h3><p>Los datos que cumplimentes (nombre, teléfono, tratamiento, fecha y hora preferidas) se utilizan para atender tu solicitud y contactar contigo para confirmar la cita. Al pulsar el botón, el sitio prepara un mensaje de WhatsApp dirigido al centro; no lo envía hasta que tú lo confirmes en WhatsApp. La solicitud se tramita a través de WhatsApp/Meta, cuyos servicios y condiciones se aplican al enviar el mensaje.</p><p>La casilla opcional de promociones permite solicitar comunicaciones comerciales por WhatsApp. No marcarla no impide solicitar una cita. La solicitud y el consentimiento comercial se incluirán en el mensaje solo cuando tú lo envíes.</p><h3>Base jurídica, conservación y destinatarios</h3><p>La atención de una solicitud de cita se basa en las medidas precontractuales solicitadas por la persona interesada. Las promociones se basan únicamente en el consentimiento opcional y revocable. Este sitio no transmite los datos a un servidor propio ni mantiene una base de datos de solicitudes. Ana Márquez debe conservar los mensajes solo durante el tiempo necesario para atender la cita y cumplir sus obligaciones legales, y suprimirlos cuando ya no sean necesarios.</p><h3>Tus derechos</h3><p>Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad y retirar tu consentimiento escribiendo al teléfono <a href="${wa("Hola, quiero ejercer mis derechos de protección de datos.")}" target="_blank" rel="noopener">${e(N.telefono)} por WhatsApp</a> o dirigiéndote a la dirección del centro. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD). Para facilitar el ejercicio de tus derechos, se recomienda facilitar una dirección de correo electrónico de contacto del responsable.</p><p class="dialog-note">El responsable debe verificar estos datos, concretar sus plazos y procedimientos de conservación y facilitar un canal de contacto electrónico antes de publicar.</p></div></dialog>
    <dialog class="site-dialog legal-dialog" id="politica-cookies" aria-labelledby="cookies-title"><form method="dialog" class="dialog-head"><h2 id="cookies-title">Política de Cookies</h2><button class="dialog-close" value="cancel" aria-label="Cerrar">×</button></form><div class="dialog-body"><h3>Almacenamiento utilizado</h3><p>El sitio no utiliza cookies de analítica, publicidad ni seguimiento. Guarda en el almacenamiento local del navegador la elección de cookies mediante la clave <code>ana-marquez-cookie-consent-v1</code>; este dato técnico permite recordar las preferencias y no se usa para identificarte.</p><h3>Servicios de terceros</h3><p>El mapa de Google Maps permanece desactivado hasta que autorizas expresamente el contenido externo. Al cargarlo, Google puede recibir datos técnicos, como tu dirección IP, y aplicar sus propias tecnologías y políticas de privacidad.</p><p>Los enlaces a WhatsApp, Instagram y Facebook solo llevan a dichos servicios cuando decides abrirlos. Los vídeos y los recursos visuales del sitio se sirven desde este mismo sitio web.</p><h3>Cómo cambiar tu elección</h3><p>Puedes retirar o modificar el permiso para el mapa en cualquier momento desde «Configurar cookies» en el pie de página, o borrar los datos del sitio en la configuración del navegador. Si rechazas el contenido externo, el mapa no se carga y sigue disponible el enlace para abrir Google Maps.</p></div></dialog>
    <dialog class="site-dialog legal-dialog" id="price-details" aria-labelledby="price-details-title"><form method="dialog" class="dialog-head"><h2 id="price-details-title">Información sobre precios</h2><button class="dialog-close" value="cancel" aria-label="Cerrar">×</button></form><div class="dialog-body"><p>Los importes se muestran en euros con IVA incluido. La cita y la tarifa final del tratamiento seleccionado deben confirmarse con el centro.</p></div></dialog>`;

  const oliveOrnaments = `<div class="olive-motions" aria-hidden="true">
    <svg class="olive-sprig olive-sprig-one" viewBox="0 0 120 180" focusable="false"><path class="olive-stem" d="M12 169C39 132 55 95 92 14"/><path class="olive-leaf" d="M43 125C22 123 15 114 12 99c18 1 29 9 31 26Zm12-28c-1-20 7-31 21-38 4 18-3 31-20 40Zm11-31C46 60 41 49 43 34c17 6 25 18 24 33Zm9-25c0-15 7-24 19-30 3 14-3 25-18 32Z"/><circle class="olive-fruit" cx="30" cy="145" r="5"/><circle class="olive-fruit" cx="54" cy="106" r="4"/><circle class="olive-fruit" cx="73" cy="67" r="5"/></svg>
    <svg class="olive-sprig olive-sprig-two" viewBox="0 0 120 180" focusable="false"><path class="olive-stem" d="M12 169C39 132 55 95 92 14"/><path class="olive-leaf" d="M43 125C22 123 15 114 12 99c18 1 29 9 31 26Zm12-28c-1-20 7-31 21-38 4 18-3 31-20 40Zm11-31C46 60 41 49 43 34c17 6 25 18 24 33Zm9-25c0-15 7-24 19-30 3 14-3 25-18 32Z"/><circle class="olive-fruit" cx="30" cy="145" r="5"/><circle class="olive-fruit" cx="54" cy="106" r="4"/><circle class="olive-fruit" cx="73" cy="67" r="5"/></svg>
    </div>`;
  $("#app").innerHTML = oliveOrnaments + header + promo + `<main>${[hero, galeria, carta, resenas, faq, reserva].filter(Boolean).join("")}</main>` + footer + assistantWidget;
  const cookieKey = "ana-marquez-cookie-consent-v1";
  const cookieBanner = $("#cookie-banner");
  const cookieError = $("#cookie-error");
  const cookieDialog = $("#cookie-settings-dialog");
  const mapContainer = $("#map-container");
  const mapFrame = $("iframe", mapContainer);
  const cookieMapsCheckbox = $("#cookie-maps", cookieDialog);
  const assistantDialog = $("#assistant-dialog");
  $("#assistant-open").addEventListener("click", () => assistantDialog.showModal());
  $("#assistant-question-form").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const question = String(new FormData(form).get("pregunta") || "").trim();
    const button = $("button[type=submit]", form);
    const status = $("#assistant-status");
    const whatsappLink = $("#assistant-whatsapp");
    if (!question) {
      status.textContent = "Escribe tu consulta para poder ayudarte.";
      return;
    }
    whatsappLink.href = wa(`Hola, tengo una consulta sobre Ana Márquez Estética: ${question}`);

    if (!N.asistenteWebhook) {
      status.textContent = "La respuesta automática aún no está conectada. Puedes continuar por WhatsApp.";
      window.open(whatsappLink.href, "_blank", "noopener,noreferrer");
      return;
    }

    button.disabled = true;
    button.textContent = "Consultando…";
    status.textContent = "Estoy consultando la información del centro…";
    try {
      const response = await fetch(N.asistenteWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      if (!response.ok) throw new Error(`El webhook respondió con HTTP ${response.status}`);
      const data = await response.json();
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("La respuesta del webhook no contiene el campo reply");
      status.textContent = data.reply.trim();
    } catch (error) {
      console.error("No se pudo obtener una respuesta automática del asistente.", error);
      status.textContent = "No se pudo obtener una respuesta automática ahora. Puedes continuar por WhatsApp.";
    } finally {
      button.disabled = false;
      button.textContent = "Enviar consulta";
    }
  });
  let cookieConsent = null;
  try {
    const storedConsent = localStorage.getItem(cookieKey);
    if (storedConsent) {
      const parsedConsent = JSON.parse(storedConsent);
      if (parsedConsent?.necessary === true && typeof parsedConsent.maps === "boolean") {
        cookieConsent = { necessary: true, maps: parsedConsent.maps };
      }
    }
  } catch {
    cookieError.hidden = false;
  }
  const applyMapPreference = enabled => {
    if (enabled) {
      mapFrame.src = mapFrame.dataset.src;
      mapContainer.classList.add("map-loaded");
    } else {
      mapFrame.removeAttribute("src");
      mapContainer.classList.remove("map-loaded");
    }
  };
  const storeCookiePreference = maps => {
    const updated = { necessary: true, maps, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(cookieKey, JSON.stringify(updated));
    } catch {
      cookieError.hidden = false;
      return false;
    }
    cookieConsent = updated;
    cookieError.hidden = true;
    cookieBanner.hidden = true;
    applyMapPreference(maps);
    return true;
  };
  cookieBanner.hidden = cookieConsent !== null;
  cookieMapsCheckbox.checked = cookieConsent?.maps === true;
  if (cookieConsent) applyMapPreference(cookieConsent.maps);
  $("#load-map").addEventListener("click", () => {
    cookieMapsCheckbox.checked = cookieConsent?.maps === true;
    cookieDialog.showModal();
  });
  $("#open-cookie-settings").addEventListener("click", () => {
    cookieMapsCheckbox.checked = cookieConsent?.maps === true;
    cookieDialog.showModal();
  });
  document.addEventListener("click", event => {
    const cookieAction = event.target.closest("[data-cookie-action]");
    if (cookieAction) {
      event.preventDefault();
      const action = cookieAction.dataset.cookieAction;
      if (action === "configure") {
        cookieMapsCheckbox.checked = cookieConsent?.maps === true;
        cookieDialog.showModal();
      } else if (storeCookiePreference(action === "all")) {
        if (cookieDialog.open) cookieDialog.close();
      }
      return;
    }
    const legalLink = event.target.closest("[data-legal-dialog]");
    if (legalLink) {
      event.preventDefault();
      document.getElementById(legalLink.dataset.legalDialog).showModal();
      return;
    }
    if (event.target.matches("dialog.site-dialog")) event.target.close();
  });
  $("#save-cookie-settings").addEventListener("click", () => {
    if (storeCookiePreference(cookieMapsCheckbox.checked)) cookieDialog.close();
  });
  const bookingForm = $("#booking-form");
  const appointmentDate = $("#booking-date", bookingForm);
  const calendar = $("#booking-calendar", bookingForm);
  const calendarSelection = $("#calendar-selection", bookingForm);
  const appointmentTime = $("#booking-time", bookingForm);
  const updateAppointmentTimes = date => {
    const times = appointmentTimesFor(date);
    appointmentTime.innerHTML = `<option value="">${date ? "Elige una hora" : "Selecciona primero un día"}</option>${times.map(time => `<option value="${time}">${time}</option>`).join("")}`;
  };
  const renderCalendar = () => {
    calendar.innerHTML = calendarMarkup(appointmentDate.value);
    updateAppointmentTimes(appointmentDate.value);
    calendarSelection.textContent = appointmentDate.value
      ? `Día elegido: ${formatDate(appointmentDate.value)}.`
      : "Selecciona un día en el calendario.";
  };
  calendar.addEventListener("click", event => {
    const dayButton = event.target.closest("[data-calendar-date]");
    if (dayButton) {
      appointmentDate.value = dayButton.dataset.calendarDate;
      renderCalendar();
      calendar.querySelector(`[data-calendar-date="${appointmentDate.value}"]`).focus({ preventScroll: true });
      return;
    }
    const monthButton = event.target.closest("[data-calendar-month]");
    if (monthButton) {
      visibleMonth.setMonth(visibleMonth.getMonth() + Number(monthButton.dataset.calendarMonth));
      renderCalendar();
    }
  });
  bookingForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!appointmentDate.value || appointmentDate.value < today) {
      calendarSelection.textContent = "Selecciona un día válido en el calendario para continuar.";
      calendar.focus();
      return;
    }
    const form = new FormData(event.currentTarget);
    const fecha = formatDate(form.get("fecha"));
    const message = `Hola, soy ${form.get("nombre")} y quiero solicitar una cita en Ana Márquez Estética.\nTeléfono: ${form.get("telefono")}.\nTratamiento: ${form.get("tratamiento")}.\nFecha preferida: ${fecha}.\nHora preferida: ${form.get("hora")}.\nHe leído y acepto la Política de Privacidad: sí.\nAcepto recibir promociones comerciales: ${form.get("promociones") ? "sí" : "no"}.\n¿Podéis confirmarme la disponibilidad?`;
    window.open(wa(message), "_blank", "noopener,noreferrer");
  });

})();
