"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function VanderChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Halo! Saya **Vander**, asisten helpdesk ERP KPI Inusa Clinic. Ada yang bisa saya bantu seputar penggunaan sistem? 😊",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: text }])
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })

      const data = await res.json()

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Maaf, terjadi kesalahan. Silakan coba lagi." },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Maaf, layanan sedang sibuk. Silakan coba lagi nanti." },
      ])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Tombol chat bubble */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#731D36] to-[#8B2A45] hover:from-[#8B2A45] hover:to-[#731D36] flex items-center justify-center shadow-xl shadow-[#731D36]/40 transition-all duration-300 hover:scale-105 active:scale-95"
        title="Chat dengan Vander"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#C9A96E] animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-180px)] rounded-2xl overflow-hidden shadow-2xl border border-[#C9A96E]/20 flex flex-col bg-[#1A1A2E]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#731D36] to-[#8B2A45] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center overflow-hidden p-1.5">
              <Image
                src="/logo-inusa.png"
                alt="Vander"
                width={20}
                height={20}
                className="brightness-0 invert w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white">Vander</h3>
              <p className="text-[10px] text-white/60">Asisten ERP KPI Inusa</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#1A1A2E]/95">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-[#731D36] to-[#8B2A45] text-white rounded-br-md"
                      : "bg-[#232340] text-gray-200 border border-white/5 rounded-bl-md"
                  }`}
                >
                  <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#232340] text-gray-400 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm border border-white/5 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengetik...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5 bg-[#1A1A2E]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya cara pakai ERP..."
                className="flex-1 bg-[#232340] text-white text-sm rounded-xl px-4 py-2.5 border border-white/5 focus:outline-none focus:border-[#C9A96E]/40 placeholder:text-gray-500 transition-colors"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#731D36] to-[#8B2A45] hover:from-[#8B2A45] hover:to-[#731D36] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-[9px] text-gray-600 mt-1.5 text-center">
              Hanya menjawab pertanyaan seputar penggunaan ERP KPI
            </p>
          </div>
        </div>
      )}
    </>
  )
}
