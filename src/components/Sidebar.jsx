import useStore from "@/store/useStore";
import { useRef, useState, useEffect } from "react";

import { shallow } from "zustand/shallow";


const selector = (state) => ({
  needToRenderJson: state.needToRenderJson,
  setNeedToRenderJson: state.setNeedToRenderJson,
});
function Sidebar() {
  const { needToRenderJson, setNeedToRenderJson } = useStore(selector, shallow);
  const textareaEl = useRef(null);
  const [error, setError] = useState(null);
  const jsonString = JSON.stringify(needToRenderJson, null, 2);

  // Theme (dark / light)
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Load persisted theme or use system preference
    const persisted = typeof window !== 'undefined' && localStorage.getItem('theme');
    if (persisted) {
      setTheme(persisted);
      document.documentElement.setAttribute('data-theme', persisted);
    } else if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {
      // ignore
    }
  };

  const validateJson = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed === 'object' && parsed !== null) {
        return { isValid: true, parsed };
      }
      return { isValid: false, error: 'Input must be a valid JSON object' };
    } catch (err) {
      return { isValid: false, error: err.message };
    }
  };
  
  const handleClick = () => {
    const jsonVal = textareaEl.current.value;
    const result = validateJson(jsonVal);
    
    if (result.isValid) {
      setError(null);
      setNeedToRenderJson(result.parsed);
    } else {
      console.log("Invalid JSON:", result.error);
      setError(result.error);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar__title-cont">
        <h1 className="sidebar__title-cont__title">JSON Visualizer</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'transparent',
              color: 'inherit',
              border: '1px solid rgba(0,0,0,0.08)'
            }}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          <button
            className="sidebar__title-cont__render-btn"
            onClick={handleClick}
          >
            Run
          </button>
        </div>
      </div>
      <textarea
        className="sidebar__text-cont"
        name=""
        id=""
        cols="30"
        rows="10"
        defaultValue={jsonString}
        ref={textareaEl}
      ></textarea>
      {error && (
        <div className="sidebar__error">
          {error}
        </div>
      )}
    </div>
  );
}

export default Sidebar;
