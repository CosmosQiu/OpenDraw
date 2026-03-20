import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import TopBar from "@/components/TopBar"
import AuthBanner from "@/components/AuthBanner"
import LoginScreen from "@/components/LoginScreen"
import ProjectsSection from "@/components/ProjectsSection"
import { NotificationProvider } from "@/components/NotificationProvider"
import LoginModal from "@/components/modals/LoginModal"
import { clearAuthSession, loadAuthSession, saveAuthSession } from "@/lib/localAuth"

export default function App() {
  const [session, setSession] = useState(() => loadAuthSession())
  const [activeNav, setActiveNav] = useState("projects")
  const [loginOpen, setLoginOpen] = useState(false)
  const isLoggedIn = !!session

  const handleLogin = ({ email }: { email: string }) => {
    const nextSession = saveAuthSession({ email })
    setSession(nextSession)
    setLoginOpen(false)
  }

  const handleLogout = () => {
    clearAuthSession()
    setSession(null)
  }

  return (
    <NotificationProvider>
      {!isLoggedIn ? (
        <>
          <LoginScreen onLogin={handleLogin} />
          <LoginModal
            open={loginOpen}
            onClose={() => setLoginOpen(false)}
            onLogin={handleLogin}
          />
        </>
      ) : (
      <div className="flex h-screen overflow-hidden bg-bg font-sans">
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          isLoggedIn={isLoggedIn}
          user={session}
          onLoginClick={() => setLoginOpen(true)}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar
            isLoggedIn={isLoggedIn}
            user={session}
            onLoginClick={() => setLoginOpen(true)}
            onLogout={handleLogout}
          />

          <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
            {!isLoggedIn && (
              <AuthBanner onLogin={() => setLoginOpen(true)} />
            )}

            <ProjectsSection
              isLoggedIn={isLoggedIn}
              user={session}
              onLoginRequired={() => setLoginOpen(true)}
            />
          </main>
        </div>
      </div>
      )}
    </NotificationProvider>
  )
}
