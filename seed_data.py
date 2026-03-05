import requests
import time
import json
import random
import logging
from datetime import datetime

# ── CONFIG ───────────────────────────────────────────────────
API_URL = "https://rl-training-platform-production.up.railway.app"
RESEARCHER_ID = 1
ANNOTATOR_ID = 2
DELAY_BETWEEN_TASKS = 15  # seconds — respects rate limits
MAX_WAIT_FOR_RESPONSES = 120  # seconds to wait for AI responses
LOG_FILE = "seed_progress.log"

# ── LOGGING ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s — %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)

# ── 500 DIVERSE PROMPTS ──────────────────────────────────────
PROMPTS = [
    # Science
    "What is the theory of relativity?",
    "How does photosynthesis work?",
    "What causes earthquakes?",
    "How do vaccines work?",
    "What is the Big Bang theory?",
    "How does DNA replication work?",
    "What is quantum entanglement?",
    "How do black holes form?",
    "What is the greenhouse effect?",
    "How does the human immune system work?",
    "What is CRISPR and how does it work?",
    "How do neurons transmit signals?",
    "What is dark matter?",
    "How does nuclear fusion work?",
    "What causes the seasons on Earth?",
    "How do antibiotics work?",
    "What is entropy in thermodynamics?",
    "How does the human digestive system work?",
    "What is the Doppler effect?",
    "How do solar panels generate electricity?",
    "What is the difference between fission and fusion?",
    "How does the kidney filter blood?",
    "What is Schrodinger's cat?",
    "How do hurricanes form?",
    "What is the theory of evolution?",
    "How does sonar work?",
    "What is a supernova?",
    "How does the human eye process light?",
    "What is the Higgs boson?",
    "How do tides work?",

    # Technology
    "What is machine learning?",
    "How does the internet work?",
    "What is blockchain technology?",
    "How does encryption work?",
    "What is cloud computing?",
    "How do neural networks learn?",
    "What is the difference between RAM and storage?",
    "How does GPS work?",
    "What is quantum computing?",
    "How does Wi-Fi work?",
    "What is an API?",
    "How does facial recognition work?",
    "What is the difference between AI and machine learning?",
    "How does a CPU process instructions?",
    "What is open source software?",
    "How does natural language processing work?",
    "What is edge computing?",
    "How do self-driving cars work?",
    "What is a neural network?",
    "How does 5G differ from 4G?",
    "What is DevOps?",
    "How does a database index work?",
    "What is the difference between supervised and unsupervised learning?",
    "How does a VPN work?",
    "What is containerization in software?",
    "How does reinforcement learning work?",
    "What is the difference between TCP and UDP?",
    "How does a compiler work?",
    "What is cybersecurity?",
    "How does two-factor authentication work?",

    # History
    "What caused World War I?",
    "How did the Roman Empire fall?",
    "What was the Renaissance?",
    "How did the Cold War start?",
    "What was the Industrial Revolution?",
    "How did ancient Egypt build the pyramids?",
    "What caused the Great Depression?",
    "How did the printing press change society?",
    "What was the French Revolution?",
    "How did the Space Race begin?",
    "What was the significance of the Magna Carta?",
    "How did World War II end?",
    "What was the impact of the Black Death?",
    "How did colonialism shape the modern world?",
    "What was the significance of the moon landing?",
    "How did ancient Greece influence western civilization?",
    "What caused the fall of the Berlin Wall?",
    "How did the Silk Road change trade?",
    "What was the significance of the Treaty of Versailles?",
    "How did the American Civil War change the United States?",

    # Philosophy & Ethics
    "What is the meaning of life?",
    "Do humans have free will?",
    "What is consciousness?",
    "Is morality objective or subjective?",
    "What is the trolley problem?",
    "What is existentialism?",
    "Is artificial intelligence conscious?",
    "What is the nature of reality?",
    "What is the difference between ethics and morality?",
    "What is Plato's theory of forms?",
    "What is utilitarianism?",
    "What is the ship of Theseus paradox?",
    "What is Kant's categorical imperative?",
    "Is time travel theoretically possible?",
    "What is the nature vs nurture debate?",
    "What is Stoicism?",
    "What is the simulation hypothesis?",
    "What is determinism?",
    "What is the difference between knowledge and belief?",
    "What is nihilism?",

    # Economics & Business
    "What causes inflation?",
    "How does the stock market work?",
    "What is supply and demand?",
    "How do central banks control the economy?",
    "What is GDP and why does it matter?",
    "How does cryptocurrency work?",
    "What is the difference between a stock and a bond?",
    "How does compound interest work?",
    "What is venture capital?",
    "How do trade tariffs affect the economy?",
    "What is quantitative easing?",
    "How does the Federal Reserve work?",
    "What is a recession?",
    "How does foreign exchange work?",
    "What is the gig economy?",
    "How do monopolies form?",
    "What is market capitalization?",
    "How does insurance work?",
    "What is the difference between a bull and bear market?",
    "How does globalization affect local economies?",

    # Health & Medicine
    "How does the human brain work?",
    "What causes cancer?",
    "How does sleep affect health?",
    "What is the difference between a virus and bacteria?",
    "How does stress affect the body?",
    "What is the placebo effect?",
    "How does exercise improve mental health?",
    "What causes Alzheimer's disease?",
    "How does the cardiovascular system work?",
    "What is the gut microbiome?",
    "How do antidepressants work?",
    "What is intermittent fasting?",
    "How does the endocrine system work?",
    "What causes autoimmune diseases?",
    "How does addiction work in the brain?",
    "What is epigenetics?",
    "How does the lymphatic system work?",
    "What causes depression?",
    "How do stem cells work?",
    "What is the difference between type 1 and type 2 diabetes?",

    # Environment
    "What is climate change?",
    "How do coral reefs form?",
    "What causes deforestation?",
    "How does ocean acidification work?",
    "What is biodiversity and why does it matter?",
    "How do ecosystems maintain balance?",
    "What is the water cycle?",
    "How do wildfires affect ecosystems?",
    "What is sustainable energy?",
    "How does plastic pollution affect marine life?",
    "What is the ozone layer?",
    "How do renewable energy sources work?",
    "What causes droughts?",
    "How do invasive species affect ecosystems?",
    "What is carbon capture technology?",

    # Mathematics
    "What is the Pythagorean theorem?",
    "How does calculus work?",
    "What is the Fibonacci sequence?",
    "How does probability theory work?",
    "What is the difference between permutations and combinations?",
    "How does game theory work?",
    "What is linear algebra?",
    "How does cryptography use mathematics?",
    "What is chaos theory?",
    "What is the Monty Hall problem?",
    "How does Bayesian reasoning work?",
    "What is the difference between correlation and causation?",
    "What is Gödel's incompleteness theorem?",
    "How does graph theory work?",
    "What is the traveling salesman problem?",

    # Space & Astronomy
    "How are stars formed?",
    "What is a neutron star?",
    "How does the solar system work?",
    "What is the Fermi paradox?",
    "How do telescopes work?",
    "What is a wormhole?",
    "How does gravity affect time?",
    "What is the cosmic microwave background?",
    "How do planets form?",
    "What is dark energy?",
    "How does a pulsar work?",
    "What is the Drake equation?",
    "How do comets form?",
    "What is the multiverse theory?",
    "How does space-time curvature work?",

    # Psychology
    "What is cognitive dissonance?",
    "How does memory work?",
    "What is the Dunning-Kruger effect?",
    "How do habits form in the brain?",
    "What is emotional intelligence?",
    "How does confirmation bias work?",
    "What is the bystander effect?",
    "How does classical conditioning work?",
    "What is the difference between introversion and extroversion?",
    "How does trauma affect the brain?",
    "What is Maslow's hierarchy of needs?",
    "How does decision fatigue work?",
    "What is the psychology of motivation?",
    "How does social media affect mental health?",
    "What is the impostor syndrome?",
]


# ── SYNTHETIC RATING LOGIC ───────────────────────────────────
def rate_response(response_text: str, response_time: float) -> tuple[int, str]:
    text = response_text.strip()
    word_count = len(text.split())

    # Error responses get score 1
    if any(x in text.lower() for x in ["error:", "unavailable", "quota reached", "timed out"]):
        return 1, "Model was unavailable or returned an error"

    # Score based on word count and response time
    if word_count < 20:
        return 1, "Response too short to be useful"
    elif word_count <= 80 and response_time < 2:
        return 5, "Concise, fast, and direct answer"
    elif word_count <= 150 and response_time < 3:
        return 5, "Well-structured and comprehensive response"
    elif word_count <= 200 and response_time < 5:
        return 4, "Good response with appropriate detail"
    elif word_count <= 300:
        return 3, "Adequate response but slightly verbose"
    elif word_count <= 400:
        return 2, "Response is too long and unfocused"
    else:
        return 1, "Response is excessively long"


# ── WAIT FOR RESPONSES ───────────────────────────────────────
def wait_for_responses(task_id: int, expected: int = 5) -> list:
    start = time.time()
    while time.time() - start < MAX_WAIT_FOR_RESPONSES:
        try:
            r = requests.get(f"{API_URL}/responses/task/{task_id}", timeout=10)
            responses = r.json()
            if len(responses) >= expected:
                return responses
        except Exception:
            pass
        time.sleep(3)
    # Return whatever we have even if not all responses arrived
    try:
        r = requests.get(f"{API_URL}/responses/task/{task_id}", timeout=10)
        return r.json()
    except Exception:
        return []


# ── MAIN SEEDING FUNCTION ────────────────────────────────────
def seed_tasks(total: int = 50):
    log.info(f"Starting seed run — targeting {total} tasks")
    log.info(f"API: {API_URL}")
    log.info(f"Delay between tasks: {DELAY_BETWEEN_TASKS}s")
    log.info("=" * 60)

    # Shuffle prompts so we get variety
    prompts = random.sample(PROMPTS, min(total, len(PROMPTS)))
    if total > len(PROMPTS):
        # If more tasks than prompts, repeat with shuffled extras
        extras = random.choices(PROMPTS, k=total - len(PROMPTS))
        prompts += extras

    completed = 0
    failed = 0
    total_ratings = 0

    for i, prompt in enumerate(prompts):
        log.info(f"\n[{i+1}/{total}] Creating task: {prompt[:60]}...")

        # Step 1 — Create task
        try:
            r = requests.post(
                f"{API_URL}/tasks/",
                json={"created_by": RESEARCHER_ID, "prompt": prompt},
                timeout=15
            )
            if r.status_code != 200:
                log.warning(f"Failed to create task: {r.status_code} {r.text[:100]}")
                failed += 1
                continue
            task = r.json()
            task_id = task["id"]
            log.info(f"Task #{task_id} created")
        except Exception as e:
            log.warning(f"Error creating task: {e}")
            failed += 1
            continue

        # Step 2 — Trigger AI responses via stream endpoint
        try:
            # Open stream and consume it fully
            with requests.get(
                f"{API_URL}/stream/task/{task_id}",
                stream=True,
                timeout=180
            ) as stream_response:
                for line in stream_response.iter_lines():
                    if line:
                        decoded = line.decode('utf-8')
                        if decoded.startswith('data:'):
                            data = json.loads(decoded[5:].strip())
                            if data.get('done'):
                                break
                            model = data.get('ai_model', 'unknown')
                            log.info(f"  ✓ {model} responded in {data.get('response_time', '?')}s")
        except Exception as e:
            log.warning(f"Stream error for task #{task_id}: {e}")
            log.info("Waiting for responses via polling...")
            time.sleep(10)

        # Step 3 — Fetch responses
        responses = wait_for_responses(task_id)
        if not responses:
            log.warning(f"No responses for task #{task_id} — skipping ratings")
            failed += 1
            continue

        log.info(f"Got {len(responses)} responses for task #{task_id}")

        # Step 4 — Rate each response
        rated = 0
        for response in responses:
            score, feedback = rate_response(
                response["response_text"],
                response.get("response_time", 5)
            )
            try:
                r = requests.post(
                    f"{API_URL}/ratings/",
                    json={
                        "response_id": response["id"],
                        "annotator_id": ANNOTATOR_ID,
                        "score": score,
                        "feedback": feedback
                    },
                    timeout=10
                )
                if r.status_code == 200:
                    rated += 1
                    total_ratings += 1
                    log.info(f"  ★ {modelName(response['ai_model'])} → {score}/5 — {feedback}")
                else:
                    log.warning(f"  Rating failed: {r.status_code}")
            except Exception as e:
                log.warning(f"  Rating error: {e}")

        completed += 1
        log.info(f"Task #{task_id} complete — {rated} ratings submitted")
        log.info(f"Progress: {completed} tasks done, {failed} failed, {total_ratings} total ratings")

        # Step 5 — Respect rate limits
        if i < total - 1:
            log.info(f"Waiting {DELAY_BETWEEN_TASKS}s before next task...")
            time.sleep(DELAY_BETWEEN_TASKS)

    log.info("\n" + "=" * 60)
    log.info(f"SEED COMPLETE")
    log.info(f"Tasks completed: {completed}")
    log.info(f"Tasks failed: {failed}")
    log.info(f"Total ratings submitted: {total_ratings}")
    log.info("=" * 60)


def modelName(ai_model: str) -> str:
    names = {
        'llama-3.3-70b (Groq)': 'LLaMA 3.3',
        'llama-3.1-8b (Groq)': 'LLaMA 3.1',
        'GPT-OSS 120B (Groq)': 'GPT-OSS 120B',
        'GPT-OSS 20B (Groq)': 'GPT-OSS 20B',
        'gemini (gemini-2.0-flash)': 'Gemini',
        'gemini': 'Gemini',
    }
    return names.get(ai_model, ai_model)


if __name__ == "__main__":
    import sys
    total = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    seed_tasks(total)
