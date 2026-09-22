/**
 * Career Copilot AI Chat & Real-Time Token Streaming Service
 * Connects to /api/v1/chat/message with SSE ReadableStream decoding.
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface ChatMessagePayload {
  message: string;
  session_id?: string;
  analysis_id?: string | null;
  stream?: boolean;
}

export interface ChatMessageResponse {
  session_id: string;
  response: string;
  suggested_followups: string[];
}

export class ChatService {
  private abortController: AbortController | null = null;

  /**
   * Streams chat tokens in real-time using native fetch and ReadableStream.
   */
  async streamMessage(
    payload: ChatMessagePayload,
    onToken: (token: string) => void,
    onComplete: (fullText: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      this.abortController = new AbortController();

      const customKey = localStorage.getItem('career_compass_custom_gemini_key');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
      };
      if (customKey && customKey.trim()) {
        headers['X-Gemini-API-Key'] = customKey.trim();
      }

      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          stream: true,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          let quotaMsg = 'AI chat model quota is temporarily exhausted. Please provide your own free Gemini API key to continue.';
          try {
            const errData = await response.json();
            if (errData?.detail?.message) {
              quotaMsg = errData.detail.message;
            }
          } catch {}
          window.dispatchEvent(
            new CustomEvent('open-api-key-modal', {
              detail: { message: quotaMsg },
            })
          );
        }
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is not readable for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (chunk.includes('[ERROR_LLM_QUOTA_EXHAUSTED]')) {
          const cleanErr = chunk.replace(/\[ERROR_LLM_QUOTA_EXHAUSTED\]:\s*/, '').trim() ||
            'Gemini API quota or rate limit reached. Please supply a new or refreshed API key to continue chatting.';
          window.dispatchEvent(
            new CustomEvent('open-api-key-modal', {
              detail: { message: cleanErr },
            })
          );
          onError(new Error(cleanErr));
          return;
        }
        accumulatedText += chunk;
        onToken(chunk);
      }

      onComplete(accumulatedText);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.info('Streaming was cancelled by the user.');
      } else {
        console.error('Chat streaming failed:', err);
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Aborts an ongoing streaming request.
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Non-streaming fallback sending a message and returning the complete response.
   */
  async sendMessage(payload: ChatMessagePayload): Promise<ChatMessageResponse> {
    const customKey = localStorage.getItem('career_compass_custom_gemini_key');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (customKey && customKey.trim()) {
      headers['X-Gemini-API-Key'] = customKey.trim();
    }

    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...payload,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        let quotaMsg = 'AI chat model quota is temporarily exhausted. Please provide your own free Gemini API key to continue.';
        try {
          const errData = await response.json();
          if (errData?.detail?.message) {
            quotaMsg = errData.detail.message;
          }
        } catch {}
        window.dispatchEvent(
          new CustomEvent('open-api-key-modal', {
            detail: { message: quotaMsg },
          })
        );
      }
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const chatService = new ChatService();

