export function getAppCanvasUrl(projectId: string) {
  const url = new URL(window.location.href);
  url.pathname = "/canvas";
  url.search = `?projectId=${encodeURIComponent(projectId)}`;
  url.hash = "";
  return url.toString();
}

export function openCanvasProject(projectId: string) {
  window.location.href = getAppCanvasUrl(projectId);
}
