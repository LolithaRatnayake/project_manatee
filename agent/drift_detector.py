import os
import sys
import google.generativeai as genai

from config import Config
from agent.file_operation import FileUtil
from prompts import SYSTEM_INSTRUCTION


def initialize_agent():
    """Configures the Google Generative AI client using central config."""
    genai.configure(api_key=Config.GEMINI_API_KEY)
    
    model = genai.GenerativeModel(
        model_name=Config.MODEL_NAME,
        system_instruction=SYSTEM_INSTRUCTION,
        generation_config={"temperature": Config.TEMPERATURE} 
    )
    return model

def analyze_system_drift(system_name: str):
    """Runs the drift detection on a specific system."""
    base_path = os.path.join(os.path.dirname(__file__), "..", "systems", system_name)
    
    print(f"[*] Scanning system: {system_name}")

    system_scan = FileUtil(base_path)
    
    adrs_content = system_scan.read_adrs()
    compose_content = system_scan.read_docker_compose()
    
    if "No ADRs" in adrs_content and "No docker-compose" in compose_content:
        print(f"[!] Target system '{system_name}' is missing both ADRs and docker-compose.yml.")
        return

    prompt = f"""
    Please analyze the following system for architecture drift.
    
    === ARCHITECTURE DECISION RECORDS (ADRs) ===
    {adrs_content}
    
    === DOCKER COMPOSE IMPLEMENTATION ===
    {compose_content}
    """
    
    print("[*] Engaging Google GenAI Agent for drift analysis...\n")
    model = initialize_agent()
    response = model.generate_content(prompt)
    
    print("=== ARCHITECTURE DRIFT REPORT ===")
    print(response.text)
    system_scan.record_drifts(response.text)

if __name__ == "__main__":
    # Allow passing the system name as a command line argument
    target_system = sys.argv[1] if len(sys.argv) > 1 else "ticketing_system"
    try:
        analyze_system_drift(target_system)
    except Exception as e:
        print(f"[Error] Execution failed: {e}")
