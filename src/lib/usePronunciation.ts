import { useRef, useCallback } from "react";

// 防抖间隔：800ms 内的连续点击视为一次，只发音一次
const DEBOUNCE_MS = 800;

// 按目标语言映射 Web Speech API 的 BCP-47 语言码
function getSpeechLang(selectedLanguage: string): string {
  switch (selectedLanguage) {
    case "Japanese": return "ja-JP";
    case "Spanish": return "es-ES";
    case "French": return "fr-FR";
    case "Portuguese": return "pt-PT";
    default: return "en-US";
  }
}

interface SpeakOptions {
  audioUrl?: string | null;
  rate?: number;
}

/**
 * 发音 hook：统一封装 HTML5 Audio + Web Speech 兜底逻辑，
 * 并通过时间戳防抖避免快速连续点击导致的重复发音。
 */
export function usePronunciation(selectedLanguage: string) {
  const lastSpokenRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });

  const speakFallback = useCallback((text: string, rate: number) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLang(selectedLanguage);
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }, [selectedLanguage]);

  /**
   * 触发发音。同一文本在 DEBOUNCE_MS 内的多次调用会被忽略。
   */
  const play = useCallback((text: string, options: SpeakOptions = {}) => {
    const now = Date.now();
    const last = lastSpokenRef.current;
    if (last.text === text && now - last.at < DEBOUNCE_MS) {
      // 视为同一次点击，忽略
      return;
    }
    lastSpokenRef.current = { text, at: now };

    const { audioUrl, rate = 0.9 } = options;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.warn("HTML5 Audio failed, falling back to Web Speech Synthesis:", err);
        speakFallback(text, rate);
      });
    } else {
      speakFallback(text, rate);
    }
  }, [speakFallback]);

  return { play };
}
