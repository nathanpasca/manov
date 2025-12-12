# app/services/translator.py
from openai import AsyncOpenAI
import re

class LLMTranslator:
    def __init__(self):
        # Pastikan LM Studio berjalan di port 1234
        self.client = AsyncOpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio")
        
        self.prompt_translate = """
        You are an expert translator of Chinese Web Novels into English.
        Your task is to translate the provided text LINE-BY-LINE.

        STRICT RULES:
        1. **NO Summarizing**: Translate every single sentence. Do not combine or skip paragraphs.
        2. **NO Retelling**: Do not change the perspective or tense unless necessary for grammar.
        3. **Fidelity**: Adhere strictly to the original meaning. Do not add your own "creative writing" or filler.
        4. **Format**: Maintain the specific line breaks of the source text.
        5. **Terms**: Adapt terminology to the specific genre of the text (e.g. Modern, Historical, or Fantasy).
        
        Example Input:
        "师父，徒儿知道做个孤魂野鬼不好受。"
        
        Example Output:
        "Master, your disciple knows that being a wandering ghost is not easy to bear."

        Translate the following text accurately:
        /no_think
        """

        self.prompt_polish = """
        You are an expert English Editor.
        Your task is to polish the following English text (which was translated from Chinese).

        STRICT RULES:
        1. **Grammar**: Fix all grammatical errors, typos, and awkward phrasing.
        2. **Flow**: Make the text read naturally in English, improving sentence structure.
        3. **Fidelity**: Do NOT add new content or remove existing meaning. Only polish the expression.
        4. **Consistency**: Ensure terminology remains consistent (e.g. capitalized terms).
        5. **Format**: PRESERVE the original paragraph structure (double newlines).

        Polish the following text:
        /no_think
        """

    def clean_text(self, text: str) -> str:
        """Membersihkan tag <think>...</think> jika model bandel"""
        # Hapus konten di dalam <think>...</think> (multiline)
        cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
        # Hapus whitespace berlebih di awal/akhir
        return cleaned.strip()

    async def _request_llm(self, text: str, system_prompt: str, user_prefix: str) -> str:
        try:
            response = await self.client.chat.completions.create(
                model="model-identifier", 
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{user_prefix}\n\n{text}"}
                ],
                temperature=0.3,
            )
            raw_result = response.choices[0].message.content
            return self.clean_text(raw_result)
        except Exception as e:
            print(f"❌ Error LLM: {e}")
            return None

    async def translate(self, text: str) -> str:
        # PASS 1: Raw Translation
        print(f"      🔹 Pass 1: Literal Translation...")
        raw_en = await self._request_llm(text, self.prompt_translate, "Translate the following text line-by-line:")
        if not raw_en: return text
        
        # PASS 2: Grammar & Flow Polish
        print(f"      🔹 Pass 2: Polishing & Grammar...")
        polished_en = await self._request_llm(raw_en, self.prompt_polish, "Correct the grammar and improve the flow of this translation:")
        if not polished_en: return raw_en
        
        return polished_en