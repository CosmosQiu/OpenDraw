// ==================== 应用主入口（路由配置） ====================
// 【演示版本】
// 路由层级：登录页 → 项目列表 → 画布编辑
// 使用HashRouter避免部署时服务端配置问题
// ================================================================

import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { NotificationProvider } from "./components/NotificationProvider";
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
import CanvasPage from "./pages/CanvasPage";
import { loadAuthSession, saveAuthSession, LocalAuthSession } from "./auth/localAuth";

// ==================== 路由守卫组件 ====================

/**
 * 需要登录的路由守卫
 * 未登录时自动跳转到登录页
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LocalAuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = loadAuthSession();
    setSession(auth);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ==================== 登录页包装器 ====================

function LoginWrapper() {
  const navigate = useNavigate();

  const handleLogin = ({ email }: { email: string }) => {
    const session = saveAuthSession({ email });
    console.log("[Auth] 用户登录:", session.email);
    navigate("/projects");
  };

  return <LoginPage onLogin={handleLogin} />;
}

// ==================== 项目列表页包装器 ====================

function ProjectsWrapper() {
  const [session, setSession] = useState<LocalAuthSession | null>(null);

  useEffect(() => {
    const auth = loadAuthSession();
    setSession(auth);
  }, []);

  return <ProjectsPage user={session} />;
}

// ==================== 主应用组件 ====================

function App() {
  return (
    <NotificationProvider>
      <HashRouter>
        <Routes>
          {/* 根路径：根据登录状态自动跳转 */}
          <Route
            path="/"
            element={
              <RootRedirect />
            }
          />

          {/* 登录页 */}
          <Route
            path="/login"
            element={
              <LoginWrapper />
            }
          />

          {/* 项目列表页（需要登录） */}
          <Route
            path="/projects"
            element={
              <RequireAuth>
                <ProjectsWrapper />
              </RequireAuth>
            }
          />

          {/* 画布编辑页（需要登录） */}
          <Route
            path="/canvas/:projectId"
            element={
              <RequireAuth>
                <CanvasPage />
              </RequireAuth>
            }
          />

          {/* 404：跳转到根路径 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </NotificationProvider>
  );
}

/**
 * 根路径重定向组件
 * 根据登录状态自动跳转到登录页或项目列表
 */
function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-white">加载中...</div>
    </div>
  );
}

export default App;
