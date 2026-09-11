import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n";
import { Mic, ArrowLeft, Volume2 } from "lucide-react";
import VoiceOrb3D from "@/components/3d/VoiceOrb3D";

export default function Nupurr() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [voice, setVoice] = useState(null);
  const messagesRef = useRef([]);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    function pick() {
      const voices = window.speechSynthesis?.getVoices() || [];
      if (!voices.length) return;
      const langVoice = LANGUAGES[language]?.voice || "en-US";
      const langPrefix = langVoice.slice(0, 2).toLowerCase();
      const femaleNames = ["female", "samantha", "victoria", "karen", "tessa", "moira", "fiona", "zira", "aria female"];
      const maleNames = ["male", "david", "mark", "george", "daniel", "alex", "fred", "rishi", "jorge"];
      let v =
        voices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix) && femaleNames.some((n) => v.name.toLowerCase().includes(n))) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix) && !maleNames.some((n) => v.name.toLowerCase().includes(n))) ||
        voices.find((v) => femaleNames.some((n) => v.name.toLowerCase().includes(n)));
      if (v) setVoice(v);
    }
    pick();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = pick;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, [language]);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const list = await base44.entities.Conversation.filter({ user_id: user.id });
        let conv = list[0];
        if (!conv) {
          conv = await base44.entities.Conversation.create({ user_id: user.id, count: 1 });
        } else {
          conv = await base44.entities.Conversation.update(conv.id, { count: (conv.count || 0) + 1 });
        }
        setCount(conv.count);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = LANGUAGES[language]?.voice || "en-US";
    u.pitch = 1.05;
    u.rate = 0.95;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      send(input);
      return;
    }
    const rec = new SR();
    rec.lang = LANGUAGES[language]?.voice || "en-US";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      send(text);
    };
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
  }

  async function send(text) {
    if (!text || busy) return;
    setInput("");
    const userMsg = { role: "user", content: text };
    const newMsgs = [...messagesRef.current, userMsg];
    setMessages(newMsgs);
    setBusy(true);
    try {
      const langName = LANGUAGES[language]?.name || "English";
      const res = await base44.functions.invoke("NupurrChat", {
        messages: newMsgs,
        conversation_count: count,
        language: langName,
      });
      const data = res.data;
      const reply = data.reply || "...";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      speak(reply);

      if (data.set_reminder && data.reminder_title && data.reminder_time) {
        try {
          const user = await base44.auth.me();
          await base44.entities.Task.create({
            user_id: user.id,
            title: data.reminder_title,
            scheduled_time: data.reminder_time,
            is_recurring: false,
            completed: false,
          });
          const confirm = `✅ ${t("nupurr_reminder_set")}: ${data.reminder_title} — ${data.reminder_time}`;
          setMessages((m) => [...m, { role: "assistant", content: confirm }]);
          speak(confirm);
        } catch (e) {
          setMessages((m) => [...m, { role: "assistant", content: t("nupurr_reminder_failed") }]);
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I had trouble. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 flex flex-col h-[calc(100vh-11rem)]">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground mb-3 text-lg"
      >
        <ArrowLeft className="w-6 h-6" /> {t("common_back")}
      </button>
      <div className="flex items-center gap-3 mb-4">
        <VoiceOrb3D active={speaking || listening} className="w-16 h-16 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow">{t("nupurr_title")}</h1>
          <p className="text-base text-muted-foreground">{t("nupurr_subtitle")}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4">
        {messages.length === 0 && (
          <p className="text-lg text-muted-foreground text-center mt-10">{t("nupurr_placeholder")}</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-5 py-3 rounded-2xl text-lg ${
              m.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start glass-strong"
            }`}
          >
            {m.content}
          </div>
        ))}
        {speaking && (
          <div className="flex items-center gap-2 text-primary text-base">
            <Volume2 className="w-5 h-5 animate-pulse" /> {t("nupurr_speaking")}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder={t("nupurr_placeholder")}
          className="flex-1 glass rounded-2xl px-4 py-4 text-lg min-h-[56px]"
        />
        <button
          onClick={startListening}
          className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
            listening ? "bg-destructive text-white animate-pulse" : "bg-primary text-primary-foreground glow-blue"
          }`}
        >
          <Mic className="w-6 h-6" />
        </button>
        <button
          onClick={() => send(input)}
          disabled={busy}
          className="px-5 h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg glow-blue disabled:opacity-50"
        >
          {t("nupurr_send")}
        </button>
      </div>
      {listening && <p className="text-primary text-base mt-2 text-center">{t("nupurr_listening")}</p>}
    </div>
  );
}