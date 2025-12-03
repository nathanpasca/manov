# app/services/translator.py
from openai import AsyncOpenAI
import re

class LLMTranslator:
    def __init__(self):
        # Pastikan LM Studio berjalan di port 1234
        self.client = AsyncOpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio")
        
        self.system_prompt = """
        You are a professional novel translator (CN to EN).
        Rules:
        1. Translate to English.
        2. MAINTAIN double newlines (\n\n) for paragraphs.
        3. Output in Markdown.
        4. No conversational filler. Just the translation.
        /no_think
        """

    def clean_text(self, text: str) -> str:
        """Membersihkan tag <think>...</think> jika model bandel"""
        # Hapus konten di dalam <think>...</think> (multiline)
        cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
        # Hapus whitespace berlebih di awal/akhir
        return cleaned.strip()

    async def translate(self, text: str) -> str:
        try:
            response = await self.client.chat.completions.create(
                model="model-identifier", 
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Translate:\n\n{text}"}
                ],
                temperature=0.6,
            )
            raw_result = response.choices[0].message.content
            final_result = self.clean_text(raw_result)
            return final_result

        except Exception as e:
            print(f"❌ Error LLM: {e}")
            return text # Kembalikan text asli jika gagal