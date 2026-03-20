export function getRoomIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("projectId")?.trim();
  const roomId = params.get("room")?.trim();
  const hash = window.location.hash || "";
  const hashMatch = hash.match(/#\/canvas\/([^/?#]+)/);
  const hashProjectId = hashMatch?.[1] ? decodeURIComponent(hashMatch[1]).trim() : "";
  return hashProjectId || projectId || roomId || "default";
}

export function getProjectId(roomId?: string) {
  return `movie-claw:${roomId || getRoomIdFromUrl()}`;
}
