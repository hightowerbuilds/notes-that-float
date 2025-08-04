import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '../../components/Navbar/Navbar'
import { useState, useRef, useCallback, useEffect } from 'react'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import './gemini-chat.css'

// Initialize the Google AI SDK
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

// Configure the model
const model = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
})

export const Route = createFileRoute('/gemini-chat/')({
  component: GeminiChatPage,
})

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function GeminiChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const chat = model.startChat({
        history: messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
      })

      const result = await chat.sendMessage(userMessage.content)
      const response = await result.response
      const text = response.text()

      const assistantMessage: Message = {
        role: 'assistant',
        content: text,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err: any) {
      console.error('Error in chat:', err)
      setError(err.message || 'An error occurred while chatting with Gemini')
    } finally {
      setIsLoading(false)
    }
  }, [input, messages, isLoading])

  const handleClear = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  return (
    <div className="page-container">
      <Navbar />
      <main className="main-content">
        <div className="gemini-chat-content">
          <header>
            <h1 className="page-title">🤖 Gemini Chat</h1>
            <p className="page-description">Chat with Google's Gemini AI model</p>
          </header>

          <div className="chat-container" ref={chatContainerRef}>
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💭</div>
                <h3>Start a conversation</h3>
                <p>Ask Gemini anything and get AI-powered responses</p>
              </div>
            ) : (
              <div className="messages">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`message ${message.role}`}
                  >
                    <div className="message-content">
                      {message.content}
                    </div>
                    <div className="message-timestamp">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message assistant">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="input-form">
              <div className="input-container">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="send-button"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
              {messages.length > 0 && (
                <button 
                  type="button" 
                  onClick={handleClear}
                  className="clear-button"
                >
                  Clear Chat
                </button>
              )}
            </form>
          </div>

          <footer>
            <p>Powered by Google Gemini AI</p>
          </footer>
        </div>
      </main>
    </div>
  )
} 