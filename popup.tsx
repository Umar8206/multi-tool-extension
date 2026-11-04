import { useState, useEffect } from "react"
import { Moon, Sun, FormInput, Cpu, Wrench, Square, Palette, Database, Globe, Trash2, ExternalLink, Plus, User, LogOut } from "lucide-react"
import { signInWithPopup, signOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db, googleProvider } from "~src/firebase"

export default function IndexPopup() {
  const [activeTab, setActiveTab] = useState<"tools" | "storage" | "envs" | "profile">("tools")
  const [darkMode, setDarkMode] = useState(false)
  const [outlines, setOutlines] = useState(false)
  const [techStack, setTechStack] = useState<string[] | null>(null)
  const [scanning, setScanning] = useState(false)
  const [pickedColor, setPickedColor] = useState<string | null>(null)

  // Auth State
  const [userProfile, setUserProfile] = useState<{ email?: string; name?: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  // Storage State
  const [localStorageData, setLocalStorageData] = useState<{ [key: string]: string }>({})
  const [sessionStorageData, setSessionStorageData] = useState<{ [key: string]: string }>({})

  // Environments State (Persisted locally and synced with Firestore)
  const [environments, setEnvironments] = useState<Array<{ name: string; url: string }>>([])
  const [newEnvName, setNewEnvName] = useState("")
  const [newEnvUrl, setNewEnvUrl] = useState("")

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["omni_environments", "omni_user"], async (result) => {
        if (result && result.omni_environments && Array.isArray(result.omni_environments)) {
          setEnvironments(result.omni_environments)
        } else {
          const defaults = [{ name: "Localhost", url: "http://localhost:3000" }]
          setEnvironments(defaults)
          chrome.storage.local.set({ omni_environments: defaults })
        }
        if (result && result.omni_user) {
          setUserProfile(result.omni_user)
        }
      })
    } else {
      setEnvironments([{ name: "Localhost", url: "http://localhost:3000" }])
    }
  }, [])

  useEffect(() => {
    if (activeTab === "storage") {
      fetchStorage()
    }
  }, [activeTab])

  // Firebase Google Sign-In
  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      const profile = { email: user.email || "", name: user.displayName || "" }
      
      setUserProfile(profile)
      chrome.storage.local.set({ omni_user: profile })

      // Pull or sync environments with Firestore
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists() && userSnap.data().environments) {
        const cloudEnvs = userSnap.data().environments
        setEnvironments(cloudEnvs)
        chrome.storage.local.set({ omni_environments: cloudEnvs })
      } else {
        await setDoc(userRef, { email: user.email, environments }, { merge: true })
      }
      setAuthLoading(false)
    } catch (error: any) {
      setAuthLoading(false)
      alert("Sign-in failed: " + error.message)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setUserProfile(null)
      chrome.storage.local.remove(["omni_user"])
    } catch (error: any) {
      alert("Sign out failed: " + error.message)
    }
  }

  const syncToCloud = async (updatedEnvs: Array<{ name: string; url: string }>) => {
    if (auth.currentUser) {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid)
        await setDoc(userRef, { environments: updatedEnvs }, { merge: true })
      } catch (err) {
        console.error("Cloud sync failed", err)
      }
    }
  }

  const fetchStorage = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "GET_STORAGE" }, (response) => {
        if (response) {
          setLocalStorageData(response.localStorage || {})
          setSessionStorageData(response.sessionStorage || {})
        }
      })
    }
  }

  const clearStorage = async (type: "local" | "session") => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "CLEAR_STORAGE", storageType: type }, () => {
        fetchStorage()
      })
    }
  }

  const toggleDarkMode = async () => {
    const nextState = !darkMode
    setDarkMode(nextState)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_DARK_MODE", value: nextState })
    }
  }

  const toggleOutlines = async () => {
    const nextState = !outlines
    setOutlines(nextState)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_OUTLINES", value: nextState })
    }
  }

  const pickColor = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return

    chrome.tabs.sendMessage(tab.id, { action: "PICK_COLOR" }, (response) => {
      if (response && response.success && response.color) {
        setPickedColor(response.color)
      }
    })
  }

  const triggerFakeFiller = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "RUN_FAKE_FILLER" })
    }
  }

  const inspectTechStack = async () => {
    setScanning(true)
    setTechStack(null)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "DETECT_TECH_STACK" }, (response) => {
        setScanning(false)
        if (response && response.technologies) {
          setTechStack(response.technologies)
        } else {
          setTechStack(["No specific frameworks detected"])
        }
      })
    }
  }

  const switchToEnv = (url: string) => {
    chrome.tabs.update({ url })
  }

  const addEnvironment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEnvName.trim() || !newEnvUrl.trim()) return
    const updated = [...environments, { name: newEnvName.trim(), url: newEnvUrl.trim() }]
    setEnvironments(updated)
    chrome.storage.local.set({ omni_environments: updated })
    await syncToCloud(updated)
    setNewEnvName("")
    setNewEnvUrl("")
  }

  const removeEnvironment = async (index: number) => {
    const updated = environments.filter((_, i) => i !== index)
    setEnvironments(updated)
    chrome.storage.local.set({ omni_environments: updated })
    await syncToCloud(updated)
  }

  return (
    <div style={{ width: 320, padding: 16, fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Wrench size={20} color="#6366F1" />
          <h2 style={{ margin: 0, fontSize: 16 }}>OmniTool Hub</h2>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 8, marginBottom: 12 }}>
        <button onClick={() => setActiveTab("tools")} style={tabStyle(activeTab === "tools")}>Tools</button>
        <button onClick={() => setActiveTab("storage")} style={tabStyle(activeTab === "storage")}>Storage</button>
        <button onClick={() => setActiveTab("envs")} style={tabStyle(activeTab === "envs")}>Envs</button>
        <button onClick={() => setActiveTab("profile")} style={tabStyle(activeTab === "profile")}>Profile</button>
      </div>

      {/* TAB 1: TOOLS */}
      {activeTab === "tools" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={toggleDarkMode} style={btnStyle}>
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            {darkMode ? "Disable Dark Mode" : "Enable Dark Mode"}
          </button>

          <button onClick={triggerFakeFiller} style={btnStyle}>
            <FormInput size={15} />
            Fake Filler
          </button>

          <button onClick={toggleOutlines} style={{ ...btnStyle, background: outlines ? "#e0e7ff" : "#f8fafc" }}>
            <Square size={15} color="#4F46E5" />
            {outlines ? "Hide DOM Outlines" : "Show DOM Outlines"}
          </button>

          <button onClick={pickColor} style={btnStyle}>
            <Palette size={15} color="#EC4899" />
            {pickedColor ? `Picked: ${pickedColor}` : "Pick Screen Color"}
          </button>

          <button onClick={inspectTechStack} style={btnStyle}>
            <Cpu size={15} color="#0EA5E9" />
            {scanning ? "Scanning Tech Stack..." : "Detect Tech Stack"}
          </button>

          {techStack && (
            <div style={{ marginTop: 8, padding: 8, background: "#f1f5f9", borderRadius: "6px", fontSize: "11px" }}>
              <strong>Detected Technologies:</strong>
              <ul style={{ margin: "4px 0 0 14px", padding: 0 }}>
                {techStack.map((tech, idx) => (
                  <li key={idx}>{tech}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STORAGE MANAGER */}
      {activeTab === "storage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Local Storage ({Object.keys(localStorageData).length})</strong>
            <button onClick={() => clearStorage("local")} style={dangerBtnStyle}>
              <Trash2 size={12} /> Clear
            </button>
          </div>
          <div style={storageBoxStyle}>
            {Object.keys(localStorageData).length === 0 ? (
              <span style={{ color: "#94a3b8" }}>No local storage keys</span>
            ) : (
              Object.entries(localStorageData).map(([k, v], i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <code>{k}</code>: <span style={{ color: "#64748b" }}>{v.substring(0, 30)}...</span>
                </div>
              ))
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <strong>Session Storage ({Object.keys(sessionStorageData).length})</strong>
            <button onClick={() => clearStorage("session")} style={dangerBtnStyle}>
              <Trash2 size={12} /> Clear
            </button>
          </div>
          <div style={storageBoxStyle}>
            {Object.keys(sessionStorageData).length === 0 ? (
              <span style={{ color: "#94a3b8" }}>No session storage keys</span>
            ) : (
              Object.entries(sessionStorageData).map(([k, v], i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <code>{k}</code>: <span style={{ color: "#64748b" }}>{v.substring(0, 30)}...</span>
                </div>
              ))
            )}
          </div>
          <button onClick={fetchStorage} style={{ ...btnStyle, justifyContent: "center", marginTop: 4 }}>
            Refresh Storage
          </button>
        </div>
      )}

      {/* TAB 3: ENVIRONMENT SWITCHER */}
      {activeTab === "envs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "12px" }}>
          <strong>Your Applications & Envs</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 130, overflowY: "auto" }}>
            {environments.map((env, idx) => (
              <div key={idx} style={envCardStyle}>
                <div style={{ overflow: "hidden", paddingRight: 6 }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {env.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {env.url}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => switchToEnv(env.url)} style={jumpBtnStyle}>
                    <ExternalLink size={12} /> Go
                  </button>
                  <button onClick={() => removeEnvironment(idx)} style={deleteBtnStyle}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={addEnvironment} style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
            <strong style={{ fontSize: "11px" }}>Add New Application</strong>
            <input
              type="text"
              placeholder="App Name (e.g. My Dashboard)"
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="URL (https://app.example.com)"
              value={newEnvUrl}
              onChange={(e) => setNewEnvUrl(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" style={{ ...btnStyle, justifyContent: "center", background: "#4F46E5", color: "#fff" }}>
              <Plus size={14} /> Add Application
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: PROFILE & CLOUD SYNC */}
      {activeTab === "profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "12px", textAlign: "center", padding: "10px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
            <div style={{ background: "#e0e7ff", padding: 16, borderRadius: "50%", color: "#4f46e5" }}>
              <User size={28} />
            </div>
          </div>

          {userProfile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>{userProfile.name}</div>
                <div style={{ color: "#64748b", fontSize: "11px" }}>{userProfile.email}</div>
              </div>
              <div style={{ background: "#f0fdf4", color: "#166534", padding: 8, borderRadius: 6, fontSize: "11px", fontWeight: 500 }}>
                ✓ Synced with Firebase Cloud
              </div>
              <button onClick={handleSignOut} style={{ ...btnStyle, justifyContent: "center", background: "#fee2e2", color: "#991b1b", border: "none", marginTop: 8 }}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ color: "#64748b", fontSize: "11px" }}>
                Sign in with Google to sync your custom environments to Firestore automatically.
              </div>
              <button onClick={handleGoogleSignIn} disabled={authLoading} style={{ ...btnStyle, justifyContent: "center", background: "#4F46E5", color: "#fff", marginTop: 8 }}>
                {authLoading ? "Signing in..." : "Sign in with Google"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const tabStyle = (isActive: boolean) => ({
  flex: 1,
  padding: "6px 0",
  textAlign: "center" as const,
  borderRadius: 6,
  border: "none",
  background: isActive ? "#ffffff" : "transparent",
  color: isActive ? "#1e293b" : "#64748b",
  fontWeight: isActive ? 600 : 500,
  fontSize: "11px",
  cursor: "pointer",
  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
})

const btnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 500,
  color: "#1e293b",
  width: "100%",
  textAlign: "left" as const
}

const dangerBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: "#fee2e2",
  color: "#991b1b",
  border: "none",
  borderRadius: 4,
  padding: "2px 6px",
  fontSize: "10px",
  cursor: "pointer",
  fontWeight: 600
}

const storageBoxStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: 8,
  maxHeight: 90,
  overflowY: "auto" as const
}

const envCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: "6px 8px"
}

const jumpBtnStyle = {
  background: "#e0e7ff",
  color: "#4f46e5",
  border: "none",
  borderRadius: 6,
  padding: "4px 8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 3,
  fontWeight: 600,
  fontSize: "11px"
}

const deleteBtnStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "none",
  borderRadius: 6,
  padding: "4px 6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center"
}

const inputStyle = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  fontSize: "11px",
  outline: "none"
}