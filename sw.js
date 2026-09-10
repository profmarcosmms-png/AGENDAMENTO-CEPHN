// Service Worker — Agendamento de Espaços (Colégio Helena Nasser)
// Guarda o "casco" do app em cache para abrir rápido e permitir a
// instalação na tela inicial. Os dados de agendamento em si sempre
// vêm da rede (Apps Script/Planilha) — nunca ficam presos em cache.

const CACHE_NAME = "agendamento-cephn-v1";
const ARQUIVOS_APP = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_APP))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  const url = new URL(evento.request.url);

  // Nunca cachear chamadas ao backend (Apps Script) — sempre buscar
  // a versão mais nova dos agendamentos na rede.
  if (url.hostname.includes("script.google.com")) {
    evento.respondWith(fetch(evento.request));
    return;
  }

  // Para os arquivos do próprio app: tenta a rede primeiro (pra sempre
  // pegar a versão mais nova quando há internet) e cai pro cache se
  // estiver offline.
  evento.respondWith(
    fetch(evento.request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(evento.request, copia));
        return resposta;
      })
      .catch(() => caches.match(evento.request))
  );
});
