import type { PlasmoCSConfig } from "plasmo"
// Declare EyeDropper API for TypeScript
declare global {
  interface Window {
    EyeDropper?: {
      new (): {
        open(): Promise<{ sRGBHex: string }>
      }
    }
  }
}
export const config: PlasmoCSConfig = {
//   matches: ["https://*/*"],
  matches: ["<all_urls>"]
}

const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Casey"]
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis"]
const domains = ["gmail.com", "yahoo.com", "example.com", "test.org"]

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. SOFT DARK MODE
  if (request.action === "TOGGLE_DARK_MODE") {
    let styleEl = document.getElementById("omniflow-soft-dark")
    if (request.value) {
      if (!styleEl) {
        styleEl = document.createElement("style")
        styleEl.id = "omniflow-soft-dark"
        styleEl.innerHTML = `
          html {
            filter: invert(88%) hue-rotate(180deg) brightness(95%) contrast(90%) !important;
            background-color: #121212 !important;
          }
          img, video, canvas, svg, [style*="background-image"] {
            filter: invert(100%) hue-rotate(180deg) !important;
          }
        `
        document.head.appendChild(styleEl)
      }
    } else {
      if (styleEl) styleEl.remove()
    }
  }

  // 2. UNIVERSAL SMART FAKE FILLER
  if (request.action === "RUN_FAKE_FILLER") {
    console.log("OmniTool: Running Universal Fake Filler...")

  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"))

    const visibleInputs = inputs.filter((input) => {
      const type = (input.type || "").toLowerCase()
      const style = window.getComputedStyle(input)
      
      // CRITICAL: Explicitly skip submit, button, reset, checkbox, radio, image inputs
      const excludedTypes = ["submit", "button", "reset", "checkbox", "radio", "image", "hidden"]
      if (excludedTypes.includes(type)) {
        return false
      }

      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        (input.offsetWidth > 0 || input.offsetHeight > 0 || input.getClientRects().length > 0)
      )
    })

    // Separate regular text inputs from custom combobox/dropdown inputs
    const standardInputs: HTMLInputElement[] = []
    const comboboxInputs: HTMLInputElement[] = []

    visibleInputs.forEach((input) => {
      const isCombobox =
        input.getAttribute("role") === "combobox" ||
        input.getAttribute("aria-autocomplete") === "list" ||
        parentIsDropdown(input)

      if (isCombobox) {
        comboboxInputs.push(input)
      } else {
        standardInputs.push(input)
      }
    })

    // Step A: Fill all standard text, email, date, phone inputs
    standardInputs.forEach((input) => {
      const type = (input.type || "").toLowerCase()
      const name = (input.name || "").toLowerCase()
      const id = (input.id || "").toLowerCase()
      const placeholder = (input.placeholder || "").toLowerCase()

      // Handle File Uploads
      if (type === "file") {
        const dummyBlob = new Blob(["Sample document content"], { type: "text/plain" })
        const mockFile = new File([dummyBlob], "sample-document.txt", { type: "text/plain" })
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(mockFile)
        input.files = dataTransfer.files
        input.dispatchEvent(new Event("change", { bubbles: true }))
        return
      }

      const randFirst = firstNames[Math.floor(Math.random() * firstNames.length)]
      const randLast = lastNames[Math.floor(Math.random() * lastNames.length)]
      let val = `${randFirst} ${randLast}`

      if (type === "email" || name.includes("email") || placeholder.includes("email") || id.includes("email")) {
        val = `${randFirst.toLowerCase()}.${randLast.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`
      } else if (type === "tel" || name.includes("phone") || placeholder.includes("phone") || id.includes("phone")) {
        val = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`
      } else if (name.includes("first") || placeholder.includes("first") || id.includes("first")) {
        val = randFirst
      } else if (name.includes("last") || placeholder.includes("last") || id.includes("last")) {
        val = randLast
      } else if (type === "date" || name.includes("birth") || placeholder.includes("yyyy") || placeholder.includes("date")) {
        val = "1998-05-20"
      } else if (type === "number") {
        val = Math.floor(Math.random() * 90 + 10).toString()
      }

      // Bypass React state tracking
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, val)
      } else {
        input.value = val
      }

      input.dispatchEvent(new Event("input", { bubbles: true }))
      input.dispatchEvent(new Event("change", { bubbles: true }))
    })

    // Step B: Native <select> elements
    const selects = Array.from(document.querySelectorAll<HTMLSelectElement>("select"))
    selects.forEach((select) => {
      const options = select.options
      if (options.length > 1) {
        const startIndex = options[0].value === "" && options.length > 2 ? 1 : 0
        const randomIndex = Math.floor(startIndex + Math.random() * (options.length - startIndex))
        select.selectedIndex = randomIndex
        select.dispatchEvent(new Event("change", { bubbles: true }))
      }
    })

    // Step C: Handle Custom React Dropdowns sequentially with retry logic
    handleCustomComboboxes(comboboxInputs)
  }
 // 3. DEEP TECH STACK INSPECTOR (Wappalyzer Style)
  if (request.action === "DETECT_TECH_STACK") {
    const categories: { [key: string]: string[] } = {
      "JavaScript Frameworks": [],
      "UI Frameworks": [],
      "JavaScript Libraries": [],
      "PaaS / Hosting": [],
      "Font / Icons": []
    }

    // --- JavaScript Frameworks ---
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || document.querySelector("[data-reactroot], [data-react-helmet]") || Array.from(document.querySelectorAll("*")).some(el => Object.keys(el).some(k => k.startsWith("__reactFiber$")))) {
      categories["JavaScript Frameworks"].push("React")
    }
    if ((window as any).__router || document.querySelector('[data-router-wrapper], a[href*="routes"]') || window.location.pathname) {
      // Check for common router signatures
      categories["JavaScript Frameworks"].push("React Router")
    }
    if ((window as any).__NEXT_DATA__ || document.querySelector("#__next")) {
      categories["JavaScript Frameworks"].push("Next.js")
    }
    if ((window as any).__vue__ || document.querySelector("[data-v-app]")) {
      categories["JavaScript Frameworks"].push("Vue.js")
    }

    // --- UI Frameworks & Styling ---
    if (document.querySelector('[class*="radix-"], [data-radix-collection-item], [data-state]') || document.querySelector('[class*="lucide"]')) {
      categories["UI Frameworks"].push("Radix UI")
    }
    if (document.querySelector('[class*="space-y-"], [class*="flex flex-"], [class*="bg-slate-"], [class*="border-input"]') || document.querySelector('style[data-tailwindcss]')) {
      categories["UI Frameworks"].push("Tailwind CSS")
    }
    // shadcn/ui typically combines Tailwind, Radix, and specific cn() utility class patterns
    if (document.querySelector('[class*="inline-flex items-center justify-center rounded-md text-sm font-medium"]') && categories["UI Frameworks"].includes("Tailwind CSS")) {
      categories["UI Frameworks"].push("shadcn/ui")
    }

    // --- JavaScript Libraries ---
    if (document.querySelector('[style*="framer"], motion-div, [class*="framer"]') || (window as any).Motion) {
      categories["JavaScript Libraries"].push("Framer Motion")
    }

    // --- Icons & Fonts ---
    if (document.querySelector('svg.lucide, [class*="lucide-"]')) {
      categories["Font / Icons"].push("Lucide")
    }

    // --- PaaS / Hosting ---
    // Vercel headers or deployment markers
    if (window.location.hostname.includes("vercel.app") || document.querySelector('script[src*="/_next/"]')) {
      categories["PaaS / Hosting"].push("Vercel")
    }

    // Flatten into categorized list or structured array for popup
    const formattedTechs: string[] = []
    Object.entries(categories).forEach(([category, items]) => {
      const uniqueItems = Array.from(new Set(items))
      if (uniqueItems.length > 0) {
        formattedTechs.push(`📂 ${category}: ${uniqueItems.join(", ")}`)
      }
    })

    if (formattedTechs.length === 0) {
      formattedTechs.push("Standard HTML / CSS / JS")
    }

    sendResponse({ technologies: formattedTechs })
    return true
  }
  // 4. DOM UTILITIES: TOGGLE ELEMENT OUTLINES
  if (request.action === "TOGGLE_OUTLINES") {
    let outlineStyle = document.getElementById("omniflow-dom-outlines")
    if (request.value) {
      if (!outlineStyle) {
        outlineStyle = document.createElement("style")
        outlineStyle.id = "omniflow-dom-outlines"
        outlineStyle.innerHTML = `
          * {
            outline: 1px solid rgba(99, 102, 241, 0.4) !important;
          }
        `
        document.head.appendChild(outlineStyle)
      }
    } else {
      if (outlineStyle) outlineStyle.remove()
    }
  }

  // 5. DOM UTILITIES: COLOR PICKER (EyeDropper API)
  if (request.action === "PICK_COLOR") {
    if (!window.EyeDropper) {
      sendResponse({ success: false, error: "EyeDropper API not supported in this browser." })
      return true
    }

    const eyeDropper = new window.EyeDropper()
    eyeDropper
      .open()
      .then((result) => {
        // Copy color hex to clipboard via content script context
        navigator.clipboard.writeText(result.sRGBHex)
        sendResponse({ success: true, color: result.sRGBHex })
      })
      .catch((e) => {
        sendResponse({ success: false, error: "Color pick cancelled" })
      })

    return true
  }
  // 6. STORAGE MANAGER: GET LOCAL/SESSION STORAGE
  if (request.action === "GET_STORAGE") {
    const localData: { [key: string]: string } = {}
    const sessionData: { [key: string]: string } = {}

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) localData[key] = localStorage.getItem(key) || ""
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) sessionData[key] = sessionStorage.getItem(key) || ""
    }

    sendResponse({ localStorage: localData, sessionStorage: sessionData })
    return true
  }

  // 7. STORAGE MANAGER: CLEAR STORAGE
  if (request.action === "CLEAR_STORAGE") {
    if (request.storageType === "local") localStorage.clear()
    if (request.storageType === "session") sessionStorage.clear()
    sendResponse({ success: true })
    return true
  }
})

// Helper to handle custom dropdowns one by one
async function handleCustomComboboxes(inputs: HTMLInputElement[]) {
  for (const input of inputs) {
    // Dispatch full mouse click sequence to trick UI components into opening
    input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    input.click()

    // Wait up to 300ms for options menu to render in DOM
    await new Promise((resolve) => setTimeout(resolve, 250))

    // Search for option elements rendered anywhere in body/portals
    const optionSelectors = [
      '[role="option"]',
      'li[class*="option"]',
      'div[class*="option"]',
      'div[class*="menu"] [role="button"]',
      '.select__option'
    ]

    const allOptions = Array.from(
      document.querySelectorAll<HTMLElement>(optionSelectors.join(","))
    )

    // Filter out options that are disabled, empty, or hidden
    const validOptions = allOptions.filter((opt) => {
      const style = window.getComputedStyle(opt)
      const text = opt.innerText ? opt.innerText.trim() : ""
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        text !== "" &&
        !text.toLowerCase().includes("no option") &&
        !opt.hasAttribute("disabled")
      )
    })

    if (validOptions.length > 0) {
      const randomOption = validOptions[Math.floor(Math.random() * validOptions.length)]
      randomOption.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
      randomOption.click()
    } else {
      // If no option opened, close the menu by pressing Escape or clicking body
      document.body.click()
    }

    await new Promise((resolve) => setTimeout(resolve, 150))
  }
}

function parentIsDropdown(element: HTMLElement): boolean {
  let parent = element.parentElement
  let depth = 0
  while (parent && depth < 3) {
    const className = typeof parent.className === "string" ? parent.className.toLowerCase() : ""
    if (className.includes("select") || className.includes("dropdown") || className.includes("control")) {
      return true
    }
    parent = parent.parentElement
    depth++
  }
  return false
}

const PlasmoOverlay = () => {
  return null
}

export default PlasmoOverlay