// ==================== 导航工具模块 ====================
// 【演示版本临时实现】
// 使用react-router进行SPA导航，无真实页面跳转
// =====================================================

/**
 * 生成画布页面的URL（用于react-router导航）
 * @param projectId 项目ID
 * @returns 路由路径
 */
export function getCanvasPath(projectId: string): string {
  return `/canvas/${encodeURIComponent(projectId)}`;
}

/**
 * 获取画布页面的完整URL（用于window.open等）
 * @param projectId 项目ID
 * @returns 完整URL字符串
 */
export function getAppCanvasUrl(projectId: string): string {
  const url = new URL(window.location.href);
  url.pathname = "/";
  url.search = "";
  url.hash = `#/canvas/${encodeURIComponent(projectId)}`;
  return url.toString();
}

/**
 * 【遗留函数】打开画布项目
 * 【注意】在SPA中应使用react-router的navigate代替
 * 保留此函数用于兼容tn目录的代码
 */
export function openCanvasProject(projectId: string) {
  window.location.href = getAppCanvasUrl(projectId);
}
