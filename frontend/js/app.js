document.addEventListener('DOMContentLoaded', async () => {
  const app = new ResearchApp();
  await app.init();
  window.researchApp = app;
});
