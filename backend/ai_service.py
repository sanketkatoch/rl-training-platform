import os
import time
from groq import Groq
from google import genai
from concurrent.futures import ThreadPoolExecutor, as_completed

SYSTEM_PROMPT = "You are a helpful assistant. Answer clearly and concisely in 3-4 sentences maximum. No bullet points, no headers, just a direct answer."

def groq_call(model_name: str, display_name: str, prompt: str) -> dict:
    start = time.time()
    try:
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            model=model_name,
            max_tokens=300
        )
        elapsed = round(time.time() - start, 2)
        return {
            "ai_model": display_name,
            "response_text": chat_completion.choices[0].message.content,
            "response_time": elapsed,
            "error": False
        }
    except Exception as e:
        elapsed = round(time.time() - start, 2)
        return {
            "ai_model": display_name,
            "response_text": f"Model unavailable — {str(e)[:80]}",
            "response_time": elapsed,
            "error": True
        }


def get_llama33_response(prompt: str) -> dict:
    return groq_call("llama-3.3-70b-versatile", "llama-3.3-70b (Groq)", prompt)


def get_llama31_response(prompt: str) -> dict:
    return groq_call("llama-3.1-8b-instant", "llama-3.1-8b (Groq)", prompt)


def get_gpt_oss_120b_response(prompt: str) -> dict:
    return groq_call("openai/gpt-oss-120b", "GPT-OSS 120B (Groq)", prompt)


def get_gpt_oss_20b_response(prompt: str) -> dict:
    return groq_call("openai/gpt-oss-20b", "GPT-OSS 20B (Groq)", prompt)


def get_gemini_response(prompt: str) -> dict:
    start = time.time()
    models_to_try = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash-latest",
    ]
    for model_name in models_to_try:
        try:
            client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
            response = client.models.generate_content(
                model=model_name,
                contents=f"{SYSTEM_PROMPT}\n\nUser question: {prompt}"
            )
            elapsed = round(time.time() - start, 2)
            return {
                "ai_model": f"gemini ({model_name})",
                "response_text": response.text,
                "response_time": elapsed,
                "error": False
            }
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                time.sleep(2)
                continue
            elif "404" in error_str or "NOT_FOUND" in error_str:
                continue
            else:
                elapsed = round(time.time() - start, 2)
                return {
                    "ai_model": "gemini",
                    "response_text": f"Model unavailable — {error_str[:80]}",
                    "response_time": elapsed,
                    "error": True
                }
    elapsed = round(time.time() - start, 2)
    return {
        "ai_model": "gemini",
        "response_text": "Gemini quota reached. Resets tomorrow. Other models are still available.",
        "response_time": elapsed,
        "error": True
    }


def get_all_ai_responses(prompt: str) -> list:
    functions = [
        get_llama33_response,
        get_llama31_response,
        get_gpt_oss_120b_response,
        get_gpt_oss_20b_response,
        get_gemini_response
    ]

    results = []

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fn, prompt): fn for fn in functions}
        for future in as_completed(futures):
            results.append(future.result())

    # Successful responses sorted by speed, errors at bottom
    successful = sorted([r for r in results if not r["error"]], key=lambda x: x["response_time"])
    failed = [r for r in results if r["error"]]

    return successful + failed
