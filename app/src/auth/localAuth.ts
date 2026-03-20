// ==================== 本地认证模块 ====================
// 【演示版本临时实现】
// 使用localStorage存储用户会话，无后端验证
// 后续接入正式后端时需替换为JWT/Session机制
// =====================================================

export interface LocalAuthSession {
  userId: string;
  displayName: string;
  email: string;
  avatarText: string;
  loggedInAt: string;
}

const AUTH_STORAGE_KEY = "movie-claw-auth-session";

/**
 * 从localStorage加载认证会话
 * 【演示版本】无真实身份验证，仅解析存储的JSON
 * @returns 会话对象或null（未登录）
 */
export function loadAuthSession(): LocalAuthSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalAuthSession;
    if (!parsed?.userId || !parsed.displayName) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 保存认证会话到localStorage
 * 【演示版本】自动生成userId，无密码验证
 * @param input 登录信息（邮箱、可选显示名）
 * @returns 完整的会话对象
 */
export function saveAuthSession(input: {
  displayName?: string;
  email: string;
}): LocalAuthSession {
  const email = input.email.trim().toLowerCase();
  const nameFromEmail = email.split("@")[0] || "创作者";
  const displayName = input.displayName?.trim() || nameFromEmail;
  const session: LocalAuthSession = {
    userId: `user-${email}`,
    displayName,
    email,
    avatarText: displayName.slice(0, 1).toUpperCase(),
    loggedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

/**
 * 清除认证会话（登出）
 */
export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * 获取存储键名（供调试使用）
 */
export function getAuthStorageKey() {
  return AUTH_STORAGE_KEY;
}
